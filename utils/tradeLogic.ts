import { RawTradeData, ProcessedTrade, TradeSummary } from "../types";

const EPSILON = 1e-8;

const normalizeText = (value: unknown): string => String(value ?? "").trim();

const parseNumber = (value: unknown): number => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  let text = normalizeText(value).replace(/^"|"$/g, "");
  if (!text) return 0;

  text = text.replace(/\s+/g, "");

  // Handle both "1,234.56" and "1234,56" numeric formats safely.
  if (text.includes(",") && text.includes(".")) {
    text = text.replace(/,/g, "");
  } else if (text.includes(",")) {
    text = text.replace(",", ".");
  }

  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseTradeDate = (value: string): Date => {
  const raw = normalizeText(value).replace("T", " ");
  const match = raw.match(
    /^(\d{4})-(\d{2})-(\d{2})[ ](\d{2}):(\d{2}):(\d{2})$/
  );

  if (match) {
    const [, y, m, d, h, min, s] = match;
    return new Date(
      Number(y),
      Number(m) - 1,
      Number(d),
      Number(h),
      Number(min),
      Number(s)
    );
  }

  const fallback = new Date(raw);
  return Number.isNaN(fallback.getTime()) ? new Date(0) : fallback;
};

const parseCSVLine = (line: string): string[] => {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += ch;
  }

  values.push(current);
  return values.map((v) => v.trim());
};

const parseFeeAsset = (row: RawTradeData): number => {
  return parseNumber(row["Maker Fee"]) + parseNumber(row["Taker Fee"]);
};

const getOrderKey = (row: RawTradeData): string => normalizeText(row["Order Number"]);

export const deduplicateTrades = (
  rows: RawTradeData[]
): { data: RawTradeData[]; duplicatesRemoved: number } => {
  const unique: RawTradeData[] = [];
  const seen = new Set<string>();
  let duplicatesRemoved = 0;

  for (const row of rows) {
    const key = getOrderKey(row);

    if (!key) {
      unique.push(row);
      continue;
    }

    if (seen.has(key)) {
      duplicatesRemoved++;
      continue;
    }

    seen.add(key);
    unique.push(row);
  }

  return { data: unique, duplicatesRemoved };
};

export const parseCSV = (text: string, filename?: string): RawTradeData[] => {
  const lines = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((line) => line.trim() !== "");

  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map((h) =>
    normalizeText(h).replace(/^\uFEFF/, "").replace(/^"|"$/g, "")
  );

  const data: RawTradeData[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]).map((v) => v.replace(/^"|"$/g, ""));

    // Skip repeated header rows.
    if (normalizeText(values[0]) === "Order Number") continue;

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? "";
    });

    const normalizedRow: RawTradeData = row as unknown as RawTradeData;

    if (filename) {
      normalizedRow.sourceFile = filename;
    }

    data.push(normalizedRow);
  }

  return data;
};

const isNumericToken = (value: string): boolean =>
  /^-?\d+(?:[.,]\d+)?$/.test(normalizeText(value));

const isDateToken = (value: string): boolean =>
  /^\d{2}-\d{2}-\d{2}$/.test(value) || /^\d{4}-\d{2}-\d{2}$/.test(value);

const isTimeToken = (value: string): boolean => /^\d{2}:\d{2}:\d{2}$/.test(value);

const normalizePdfDate = (dateToken: string, timeToken: string): string => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateToken)) {
    return `${dateToken} ${timeToken}`;
  }

  const [yy, mm, dd] = dateToken.split("-");
  const year = 2000 + Number(yy);
  return `${year.toString().padStart(4, "0")}-${mm}-${dd} ${timeToken}`;
};

const normalizeShortDateTime = (value: string): string => {
  const text = normalizeText(value);
  const shortMatch = text.match(/^(\d{2})-(\d{2})-(\d{2})\s+(\d{2}:\d{2}:\d{2})$/);
  if (shortMatch) {
    const [, yy, mm, dd, time] = shortMatch;
    const year = 2000 + Number(yy);
    return `${year.toString().padStart(4, "0")}-${mm}-${dd} ${time}`;
  }
  return text;
};

const parsePdfStatus = (
  tokens: string[]
): { status: string; remainingTokens: string[] } | null => {
  if (tokens.length === 0) return null;

  const twoWordStatuses = [
    ["system", "cancelled"],
    ["system", "canceled"],
    ["in", "progress"],
    ["partially", "completed"],
  ];

  for (const pattern of twoWordStatuses) {
    if (tokens.length < pattern.length) continue;
    const tail = tokens.slice(-pattern.length).map((t) => t.toLowerCase());
    const matched = pattern.every((word, idx) => tail[idx] === word);
    if (matched) {
      return {
        status: tokens.slice(-pattern.length).join(" "),
        remainingTokens: tokens.slice(0, -pattern.length),
      };
    }
  }

  const oneWord = tokens[tokens.length - 1];
  const normalized = oneWord.toLowerCase();
  const allowed = new Set([
    "completed",
    "cancelled",
    "canceled",
    "expired",
    "processing",
    "paid",
    "failed",
    "refunded",
  ]);

  if (!allowed.has(normalized)) {
    return null;
  }

  return {
    status: oneWord,
    remainingTokens: tokens.slice(0, -1),
  };
};

const findPdfFeeIndex = (tokens: string[]): number => {
  let lastNumericIndex = -1;

  // Prefer fractional token near end (e.g. 0.05) as fee.
  for (let i = tokens.length - 1; i >= 0; i--) {
    if (!isNumericToken(tokens[i])) continue;
    lastNumericIndex = i;
    const numericValue = parseNumber(tokens[i]);
    const hasDecimal = tokens[i].includes(".") || tokens[i].includes(",");
    if (hasDecimal && numericValue <= 10) return i;
  }

  for (let i = tokens.length - 1; i >= 0; i--) {
    if (!isNumericToken(tokens[i])) continue;
    const numericValue = parseNumber(tokens[i]);
    if (numericValue <= 1) return i;
  }

  return lastNumericIndex;
};

const parsePdfOrderLine = (line: string, filename?: string): RawTradeData | null => {
  const compact = normalizeText(line).replace(/\s+/g, " ");
  const prefixMatch = compact.match(
    /^(\d{14,})\s+(Buy|Sell)\s+([A-Z0-9]{2,12})\s+([A-Z]{2,10})\s+([0-9][0-9.,]*)\s+([0-9][0-9.,]*)\s+([0-9][0-9.,]*)\s+(.+)$/i
  );

  if (!prefixMatch) {
    return null;
  }

  const [, orderNo, orderType, assetType, fiatType, totalPrice, price, quantity, tailRaw] =
    prefixMatch;
  const tailTokens = normalizeText(tailRaw).split(/\s+/).filter(Boolean);

  if (tailTokens.length < 4) {
    return null;
  }

  const timeToken = tailTokens[tailTokens.length - 1];
  const dateToken = tailTokens[tailTokens.length - 2];

  if (!isDateToken(dateToken) || !isTimeToken(timeToken)) {
    return null;
  }

  const createdTime = normalizePdfDate(dateToken, timeToken);
  const beforeDateTokens = tailTokens.slice(0, -2);
  const parsedStatus = parsePdfStatus(beforeDateTokens);
  if (!parsedStatus) {
    return null;
  }

  const feeIndex = findPdfFeeIndex(parsedStatus.remainingTokens);
  if (feeIndex === -1) {
    return null;
  }

  const exchangeRateTokens = parsedStatus.remainingTokens.slice(0, feeIndex);
  const feeToken = parsedStatus.remainingTokens[feeIndex];
  const counterpartyTokens = parsedStatus.remainingTokens.slice(feeIndex + 1);

  const row: RawTradeData = {
    "Order Number": orderNo,
    "Order Type": orderType,
    "Asset Type": assetType.toUpperCase(),
    "Fiat Type": fiatType.toUpperCase(),
    "Total Price": totalPrice,
    "Price": price,
    "Quantity": quantity,
    "Exchange rate": exchangeRateTokens.join(" "),
    "Maker Fee": "",
    "Taker Fee": feeToken || "0",
    "Counterparty": counterpartyTokens.join(" ").trim(),
    "Status": parsedStatus.status,
    "Created Time": createdTime,
    sourceFile: filename,
  };

  return row;
};

const extractLinesFromPdfPage = (items: any[]): string[] => {
  const textItems = items
    .filter(
      (item) =>
        typeof item?.str === "string" &&
        item.str.trim() &&
        Array.isArray(item.transform)
    )
    .map((item) => ({
      str: String(item.str).trim(),
      x: Number(item.transform[4] ?? 0),
      y: Number(item.transform[5] ?? 0),
    }))
    .sort((a, b) => {
      if (Math.abs(b.y - a.y) > 0.001) return b.y - a.y;
      return a.x - b.x;
    });

  const rows: { y: number; items: { str: string; x: number }[] }[] = [];
  const yTolerance = 2;

  for (const item of textItems) {
    let row = rows.find((candidate) => Math.abs(candidate.y - item.y) <= yTolerance);
    if (!row) {
      row = { y: item.y, items: [] };
      rows.push(row);
    }
    row.items.push({ str: item.str, x: item.x });
  }

  rows.sort((a, b) => b.y - a.y);

  return rows
    .map((row) =>
      row.items
        .sort((a, b) => a.x - b.x)
        .map((item) => item.str)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter(Boolean);
};

export const parsePDF = async (file: File): Promise<RawTradeData[]> => {
  let workerConfigured = false;

  try {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    try {
      const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
      (pdfjs as any).GlobalWorkerOptions.workerSrc = workerUrl;
      workerConfigured = true;
    } catch (workerError) {
      console.warn("PDF worker setup failed, using fallback parser", workerError);
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const loadingTask = (pdfjs as any).getDocument({
      data: bytes,
      disableWorker: !workerConfigured,
    });

    const pdf = await loadingTask.promise;
    const allRows: RawTradeData[] = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const lines = extractLinesFromPdfPage((textContent as any).items || []);
      for (const line of lines) {
        const parsed = parsePdfOrderLine(line, file.name);
        if (parsed) {
          allRows.push(parsed);
        }
      }
    }

    return allRows;
  } catch (error) {
    console.error(`Failed to parse PDF file: ${file.name}`, error);
    return [];
  }
};

const normalizeSheetHeader = (value: unknown): string =>
  normalizeText(value).toLowerCase().replace(/\s+/g, " ");

const getSheetValue = (row: Record<string, string>, keys: string[]): string => {
  for (const key of keys) {
    const normalizedKey = normalizeSheetHeader(key);
    if (normalizedKey in row) {
      return normalizeText(row[normalizedKey]);
    }
  }
  return "";
};

export const parseXLSX = async (file: File): Promise<RawTradeData[]> => {
  try {
    const XLSX = await import("xlsx");
    const bytes = await file.arrayBuffer();
    const workbook = XLSX.read(bytes, { type: "array", raw: false });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) return [];

    const sheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      raw: false,
      defval: "",
      blankrows: false,
    }) as unknown[][];

    const headerRowIndex = rows.findIndex((row) =>
      row.some((cell) => normalizeSheetHeader(cell) === "order number")
    );

    if (headerRowIndex === -1) {
      return [];
    }

    const headers = rows[headerRowIndex].map((cell) => normalizeSheetHeader(cell));
    const parsedRows: RawTradeData[] = [];

    for (let i = headerRowIndex + 1; i < rows.length; i++) {
      const rowValues = rows[i];
      if (!rowValues || rowValues.length === 0) continue;

      const rowMap: Record<string, string> = {};
      headers.forEach((header, idx) => {
        if (!header) return;
        rowMap[header] = normalizeText(rowValues[idx]);
      });

      const orderNumber = getSheetValue(rowMap, ["Order Number"]);
      const orderType = getSheetValue(rowMap, ["Order Type"]);
      const assetType = getSheetValue(rowMap, ["Asset Type", "Asset"]);
      const fiatType = getSheetValue(rowMap, ["Fiat Type"]);
      const totalPrice = getSheetValue(rowMap, ["Total Price"]);
      const price = getSheetValue(rowMap, ["Price"]);
      const quantity = getSheetValue(rowMap, ["Quantity"]);
      const exchangeRate = getSheetValue(rowMap, ["Exchange rate", "Exchange Rate"]);
      const makerFee = getSheetValue(rowMap, ["Maker Fee"]);
      const takerFee = getSheetValue(rowMap, ["Taker Fee"]);
      const counterparty = getSheetValue(rowMap, ["Counterparty", "Couterparty"]);
      const status = getSheetValue(rowMap, ["Status"]);
      const createdTimeRaw = getSheetValue(rowMap, ["Created Time"]);
      const createdTime = normalizeShortDateTime(createdTimeRaw);

      if (!orderNumber || !orderType || !assetType || !fiatType || !price || !quantity) {
        continue;
      }

      parsedRows.push({
        "Order Number": orderNumber,
        "Order Type": orderType,
        "Asset Type": assetType.toUpperCase(),
        "Fiat Type": fiatType.toUpperCase(),
        "Total Price": totalPrice,
        "Price": price,
        "Quantity": quantity,
        "Exchange rate": exchangeRate,
        "Maker Fee": makerFee,
        "Taker Fee": takerFee,
        "Counterparty": counterparty,
        "Status": status || "Completed",
        "Created Time": createdTime,
        sourceFile: file.name,
      });
    }

    return parsedRows;
  } catch (error) {
    console.error(`Failed to parse XLSX file: ${file.name}`, error);
    return [];
  }
};

export const parseTradeFile = async (file: File): Promise<RawTradeData[]> => {
  const lower = file.name.toLowerCase();

  if (lower.endsWith(".pdf")) {
    return parsePDF(file);
  }

  if (
    lower.endsWith(".xlsx") ||
    lower.endsWith(".xls") ||
    lower.endsWith(".xlsm") ||
    lower.endsWith(".xlsb")
  ) {
    return parseXLSX(file);
  }

  const text = await file.text();
  return parseCSV(text, file.name);
};

type InventoryBatch = {
  qty: number;
  unitCost: number; // Fiat per asset unit.
  date: Date;
};

const consumeInventory = (
  inventory: InventoryBatch[],
  qtyToConsume: number,
  consumeDate: Date
): { matchedQty: number; matchedCost: number; weightedHoldSeconds: number } => {
  let remaining = qtyToConsume;
  let matchedQty = 0;
  let matchedCost = 0;
  let weightedHoldSeconds = 0;

  while (remaining > EPSILON && inventory.length > 0) {
    const batch = inventory[0];
    const usedQty = Math.min(batch.qty, remaining);
    const holdSeconds = Math.max(
      0,
      (consumeDate.getTime() - batch.date.getTime()) / 1000
    );

    matchedQty += usedQty;
    matchedCost += usedQty * batch.unitCost;
    weightedHoldSeconds += holdSeconds * usedQty;

    batch.qty -= usedQty;
    remaining -= usedQty;

    if (batch.qty <= EPSILON) {
      inventory.shift();
    } else {
      inventory[0] = batch;
    }
  }

  return { matchedQty, matchedCost, weightedHoldSeconds };
};

export const calculateTradeLogic = (
  data: RawTradeData[],
  asset: string,
  fiat: string,
  marketPriceStr: string,
  fromDate?: string,
  toDate?: string
): { trades: ProcessedTrade[]; summary: TradeSummary } => {
  const targetAsset = normalizeText(asset).toUpperCase();
  const targetFiat = normalizeText(fiat).toUpperCase();

  const filtered = data.filter((row) => {
    const status = normalizeText(row.Status).toLowerCase();
    const rowAsset = normalizeText(row["Asset Type"]).toUpperCase();
    const rowFiat = normalizeText(row["Fiat Type"]).toUpperCase();
    return status === "completed" && rowAsset === targetAsset && rowFiat === targetFiat;
  });

  const sortedForCalc = [...filtered].sort(
    (a, b) =>
      parseTradeDate(a["Created Time"]).getTime() -
      parseTradeDate(b["Created Time"]).getTime()
  );

  const inventory: InventoryBatch[] = [];
  const tradeDetails: ProcessedTrade[] = [];

  for (const row of sortedForCalc) {
    const price = parseNumber(row.Price);
    const qty = parseNumber(row.Quantity);
    const orderType = normalizeText(row["Order Type"]).toLowerCase();
    const orderNo = normalizeText(row["Order Number"]);
    const counterparty =
      normalizeText(row["Couterparty"]) || normalizeText(row["Counterparty"]);
    const total = parseNumber(row["Total Price"]) || price * qty;
    const feeAsset = parseFeeAsset(row);
    const feeFiat = feeAsset * price;
    const tradeDate = parseTradeDate(row["Created Time"]);

    if (qty <= EPSILON || price <= EPSILON) {
      continue;
    }

    if (orderType === "buy") {
      const totalCost = total + feeFiat;
      const unitCost = qty > EPSILON ? totalCost / qty : price;
      inventory.push({ qty, unitCost, date: tradeDate });

      tradeDetails.push({
        id: 0,
        time: row["Created Time"],
        order: `Buy ${qty.toFixed(4)} ${targetAsset}`,
        price: price.toFixed(2),
        profit: "—",
        orderNo,
        counterparty,
        type: "buy",
        manual: !!row.manual,
        originalDate: tradeDate,
        qty,
        fee: feeFiat,
        total,
        sourceFile: row.sourceFile,
      });
      continue;
    }

    if (orderType === "sell") {
      const { matchedQty, matchedCost, weightedHoldSeconds } = consumeInventory(
        inventory,
        qty,
        tradeDate
      );

      const missingCostQty = Math.max(0, qty - matchedQty);
      const hasCostBasisGap = missingCostQty > EPSILON;
      const avgHoldTimeForTrade =
        matchedQty > EPSILON ? weightedHoldSeconds / matchedQty : 0;

      let profit = "—";
      if (!hasCostBasisGap) {
        const netRevenue = total - feeFiat;
        const netProfit = netRevenue - matchedCost;
        profit = netProfit.toFixed(2);
      }

      tradeDetails.push({
        id: 0,
        time: row["Created Time"],
        order: `Sell ${qty.toFixed(4)} ${targetAsset}`,
        price: price.toFixed(2),
        profit,
        orderNo,
        counterparty,
        type: "sell",
        manual: !!row.manual,
        originalDate: tradeDate,
        holdTimeSeconds: avgHoldTimeForTrade,
        qty,
        fee: feeFiat,
        hasCostBasisGap,
        missingCostQty: hasCostBasisGap ? Number(missingCostQty.toFixed(6)) : undefined,
        total,
        sourceFile: row.sourceFile,
      });
    }
  }

  let displayedTrades = tradeDetails;

  if (fromDate) {
    const [y, m, d] = fromDate.split("-").map(Number);
    const from = new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
    displayedTrades = displayedTrades.filter((t) => t.originalDate >= from);
  }

  if (toDate) {
    const [y, m, d] = toDate.split("-").map(Number);
    const to = new Date(y, (m || 1) - 1, d || 1, 23, 59, 59, 999);
    displayedTrades = displayedTrades.filter((t) => t.originalDate <= to);
  }

  let totalProfit = 0;
  let totalFees = 0;
  let totalBuys = 0;
  let totalSells = 0;
  let buyCount = 0;
  let sellCount = 0;
  let profitableSellCount = 0;
  let validSellCount = 0;
  let sellWithoutCostCount = 0;
  let unmatchedSellQty = 0;

  for (const trade of displayedTrades) {
    totalFees += trade.fee;

    if (trade.type === "buy") {
      buyCount++;
      totalBuys += trade.total + trade.fee;
      continue;
    }

    sellCount++;
    totalSells += trade.total;

    if (trade.hasCostBasisGap) {
      sellWithoutCostCount++;
      unmatchedSellQty += trade.missingCostQty || 0;
      continue;
    }

    const parsedProfit = parseNumber(trade.profit);
    totalProfit += parsedProfit;
    validSellCount++;
    if (parsedProfit > 0) profitableSellCount++;
  }

  let lastSellPriceVal = 0;
  for (let i = sortedForCalc.length - 1; i >= 0; i--) {
    if (normalizeText(sortedForCalc[i]["Order Type"]).toLowerCase() === "sell") {
      lastSellPriceVal = parseNumber(sortedForCalc[i].Price);
      break;
    }
  }

  const remainingQty = inventory.reduce((sum, item) => sum + item.qty, 0);
  const remainingCost = inventory.reduce((sum, item) => sum + item.unitCost * item.qty, 0);

  const customMarketPrice = parseNumber(marketPriceStr);
  const effectiveMarketPrice =
    customMarketPrice > 0 ? customMarketPrice : lastSellPriceVal > 0 ? lastSellPriceVal : 0;

  const marketValue = remainingQty * effectiveMarketPrice;
  const unrealized = marketValue - remainingCost;

  const winRate =
    validSellCount > 0 ? ((profitableSellCount / validSellCount) * 100).toFixed(2) : "—";
  const avgSellProfit = validSellCount > 0 ? (totalProfit / validSellCount).toFixed(2) : "—";

  const finalTrades = displayedTrades
    .map((trade, idx) => ({ ...trade, id: idx + 1 }))
    .sort((a, b) => b.originalDate.getTime() - a.originalDate.getTime());

  return {
    trades: finalTrades,
    summary: {
      totalProfit: totalProfit.toFixed(2),
      totalBuys: totalBuys.toFixed(2),
      totalSells: totalSells.toFixed(2),
      totalFees: totalFees.toFixed(2),
      netProfit: totalProfit.toFixed(2),
      buyCount,
      sellCount,
      remainingQty: remainingQty.toFixed(6),
      remainingCost: remainingCost.toFixed(2),
      marketValue: marketValue.toFixed(2),
      unrealizedProfit: unrealized.toFixed(2),
      lastSellPrice: lastSellPriceVal > 0 ? lastSellPriceVal.toFixed(2) : undefined,
      winRate,
      avgSellProfit,
      sellWithoutCostCount,
      unmatchedSellQty: unmatchedSellQty.toFixed(6),
    },
  };
};
