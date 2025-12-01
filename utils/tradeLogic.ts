import { RawTradeData, ProcessedTrade, TradeSummary } from "../types";

export const parseCSV = (text: string, filename?: string): RawTradeData[] => {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  
  // Clean headers (remove BOM if exists, remove quotes)
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').replace(/^\uFEFF/, ''));
  const data: RawTradeData[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    // Basic CSV splitting (assuming no commas inside fields for this specific format)
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    
    // Skip header repetitions if any
    if (values[0] === 'Order Number') continue;

    const row: any = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || '';
    });

    if (filename) {
      row.sourceFile = filename;
    }

    data.push(row as RawTradeData);
  }
  return data;
};

export const calculateTradeLogic = (
  data: RawTradeData[],
  asset: string,
  fiat: string,
  marketPriceStr: string,
  fromDate?: string,
  toDate?: string
): { trades: ProcessedTrade[]; summary: TradeSummary } => {
  
  // 1. Filter by Asset/Fiat and Status
  let filtered = data.filter(r => 
    (r.Status || '').toLowerCase() === 'completed' &&
    (r['Asset Type'] || '') === asset && 
    (r['Fiat Type'] || '') === fiat
  );

  // 2. Sort chronologically for calculation (Oldest first)
  const sortedForCalc = [...filtered].sort((a, b) => new Date(a['Created Time']).getTime() - new Date(b['Created Time']).getTime());

  // 3. FIFO Logic (Runs on ALL history to ensure accurate cost basis)
  const tradeDetails: ProcessedTrade[] = [];
  const inventory: { price: number; qty: number; date: Date }[] = [];
  
  // Global stats (full history for portfolio value)
  let buyCountGlobal = 0;
  let sellCountGlobal = 0;

  for (const row of sortedForCalc) {
    const price = parseFloat(String(row.Price)) || 0;
    const qty = parseFloat(String(row.Quantity)) || 0;
    const orderType = (row['Order Type'] || '').toLowerCase();
    const orderNo = row['Order Number'] || '';
    // Handle the typo in Binance CSVs "Couterparty"
    const counterparty = row['Couterparty'] || row['Counterparty'] || '';
    const total = parseFloat(String(row['Total Price'])) || (price * qty);
    
    let fee = 0;
    if (row['Maker Fee']) fee += parseFloat(String(row['Maker Fee'])) || 0;
    if (row['Taker Fee']) fee += parseFloat(String(row['Taker Fee'])) || 0;

    const tradeDate = new Date(row['Created Time']);

    if (orderType === 'buy') {
      buyCountGlobal++;
      inventory.push({ price, qty, date: tradeDate });
      
      tradeDetails.push({
        id: 0, // Assigned later
        time: row['Created Time'],
        order: `Buy ${qty.toFixed(4)} ${asset}`,
        price: price.toFixed(2),
        profit: "—",
        orderNo,
        counterparty,
        type: 'buy',
        manual: !!row.manual,
        originalDate: tradeDate,
        qty,
        fee,
        total,
        sourceFile: row.sourceFile
      });
    } else if (orderType === 'sell') {
      sellCountGlobal++;
      let qtyToSell = qty;
      let sellProfit = 0;
      let totalHoldSeconds = 0;
      
      // Calculate profit based on inventory (FIFO)
      while (qtyToSell > 0 && inventory.length > 0) {
        const batch = inventory[0];
        const batchHoldTime = (tradeDate.getTime() - batch.date.getTime()) / 1000;
        
        // Tolerance for floating point errors
        if (batch.qty <= qtyToSell + 0.00000001) {
          sellProfit += (price - batch.price) * batch.qty;
          totalHoldSeconds += batchHoldTime * batch.qty; // Weighted by quantity
          qtyToSell -= batch.qty;
          inventory.shift();
        } else {
          sellProfit += (price - batch.price) * qtyToSell;
          totalHoldSeconds += batchHoldTime * qtyToSell;
          inventory[0].qty -= qtyToSell;
          qtyToSell = 0;
        }
      }

      // Calculate weighted average hold time for this specific sell order
      const avgHoldTimeForTrade = qty > 0 ? totalHoldSeconds / qty : 0;

      const netProfit = sellProfit - fee;

      tradeDetails.push({
        id: 0,
        time: row['Created Time'],
        order: `Sell ${qty.toFixed(4)} ${asset}`,
        price: price.toFixed(2),
        profit: netProfit.toFixed(2),
        orderNo,
        counterparty,
        type: 'sell',
        manual: !!row.manual,
        originalDate: tradeDate,
        holdTimeSeconds: avgHoldTimeForTrade,
        qty,
        fee,
        total,
        sourceFile: row.sourceFile
      });
    }
  }

  // 4. APPLY DATE FILTER (For Display & Summary Stats)
  // We filter the calculated trades list, not the raw input, so FIFO PnL remains correct.
  let displayedTrades = tradeDetails;
  
  if (fromDate) {
    const from = new Date(fromDate);
    displayedTrades = displayedTrades.filter(t => t.originalDate >= from);
  }
  
  if (toDate) {
    const to = new Date(toDate + 'T23:59:59'); // Include end of day
    displayedTrades = displayedTrades.filter(t => t.originalDate <= to);
  }

  // 5. Recalculate Summaries based on Filtered Trades
  let totalProfit = 0;
  let totalFees = 0;
  let buyCount = 0;
  let sellCount = 0;

  for (const t of displayedTrades) {
    totalFees += t.fee;
    if (t.type === 'buy') {
      buyCount++;
    } else {
      sellCount++;
      const p = parseFloat(t.profit);
      if (!isNaN(p)) {
        totalProfit += p;
      }
    }
  }

  // 6. Portfolio Status (Always Global / Current)
  // Remaining Qty and Market Value reflect current holding regardless of date filter
  // UNLESS the user implies they want a snapshot, but standard P2P tools usually show current inventory vs filtered PnL.
  // To avoid confusion, we'll keep Inventory Global.
  
  // Find last sell price (Global or Filtered? Usually Global for current market value estimation)
  let lastSellPriceVal = 0;
  // Use sortedForCalc (Global) to find absolute last sell
  for (let i = sortedForCalc.length - 1; i >= 0; i--) {
    if ((sortedForCalc[i]['Order Type'] || '').toLowerCase() === 'sell') {
      lastSellPriceVal = parseFloat(String(sortedForCalc[i].Price)) || 0;
      break;
    }
  }

  const remainingQty = inventory.reduce((sum, item) => sum + item.qty, 0);
  const totalBuysValueRemaining = inventory.reduce((sum, item) => sum + (item.price * item.qty), 0);
  
  // Use last sell price if available, otherwise manual market price
  const effectiveMarketPrice = lastSellPriceVal > 0 ? lastSellPriceVal : (parseFloat(marketPriceStr) || 0);

  const marketValue = remainingQty * effectiveMarketPrice;
  const unrealized = marketValue - totalBuysValueRemaining;

  // Re-index displayed trades
  const finalTrades = displayedTrades.map((t, idx) => ({ ...t, id: idx + 1 }));

  // Sort displayed trades descending (newest first) for the UI
  finalTrades.sort((a, b) => b.originalDate.getTime() - a.originalDate.getTime());

  return {
    trades: finalTrades,
    summary: {
      totalProfit: totalProfit.toFixed(2), // Filtered
      totalBuys: "—",
      totalSells: "—",
      totalFees: totalFees.toFixed(2), // Filtered
      netProfit: totalProfit.toFixed(2), // Filtered
      buyCount, // Filtered
      sellCount, // Filtered
      remainingQty: remainingQty.toFixed(6), // Global (Current Status)
      remainingCost: totalBuysValueRemaining.toFixed(2), // Global
      marketValue: marketValue.toFixed(2), // Global
      unrealizedProfit: unrealized.toFixed(2), // Global
      lastSellPrice: lastSellPriceVal > 0 ? lastSellPriceVal.toFixed(2) : undefined
    }
  };
};