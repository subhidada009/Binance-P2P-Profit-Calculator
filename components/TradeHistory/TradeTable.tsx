import React, { useState, useMemo, useEffect } from 'react';
import { ProcessedTrade, Translation } from '../../types';
import { Trash, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface TradeTableProps {
  trades: ProcessedTrade[];
  onDelete: (orderNo: string) => void;
  t: Translation['history'];
}

type SortKey = 'time' | 'order' | 'price' | 'profit' | 'counterparty';
type SortDirection = 'asc' | 'desc' | null;

export const TradeTable: React.FC<TradeTableProps> = ({ trades, onDelete, t }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const itemsPerPage = 10;

  // Reset pagination when trades change significantly (e.g. clear all)
  useEffect(() => {
    const maxPage = Math.ceil(trades.length / itemsPerPage);
    if (currentPage > maxPage && maxPage > 0) {
        setCurrentPage(maxPage);
    } else if (trades.length === 0) {
        setCurrentPage(1);
    }
  }, [trades.length, itemsPerPage]);

  // Handle sorting logic
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null); // Reset
        setSortKey(null);
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page on sort
  };

  // Sort trades based on current configuration
  const sortedTrades = useMemo(() => {
    if (!sortKey || !sortDirection) return trades;

    return [...trades].sort((a, b) => {
      let result = 0;

      switch (sortKey) {
        case 'time':
          result = a.originalDate.getTime() - b.originalDate.getTime();
          break;
        case 'price':
          result = parseFloat(a.price) - parseFloat(b.price);
          break;
        case 'profit':
          // Handle "—" cases for profit
          const profitA = a.profit === '—' ? -Infinity : parseFloat(a.profit);
          const profitB = b.profit === '—' ? -Infinity : parseFloat(b.profit);
          result = profitA - profitB;
          break;
        case 'order':
          // Sort by type (Buy/Sell) first
          result = a.type.localeCompare(b.type);
          break;
        case 'counterparty':
          result = (a.counterparty || '').localeCompare(b.counterparty || '');
          break;
      }

      return sortDirection === 'asc' ? result : -result;
    });
  }, [trades, sortKey, sortDirection]);

  // Pagination logic
  const totalPages = Math.ceil(sortedTrades.length / itemsPerPage);
  const start = (currentPage - 1) * itemsPerPage;
  const currentTrades = sortedTrades.slice(start, start + itemsPerPage);

  const handlePrev = () => setCurrentPage(p => Math.max(1, p - 1));
  const handleNext = () => setCurrentPage(p => Math.min(totalPages, p + 1));

  // Helper for Header Cell
  const HeaderCell = ({ label, sortKeyName }: { label: string, sortKeyName: SortKey }) => (
    <th 
      className="p-4 font-medium whitespace-nowrap cursor-pointer hover:bg-gray-700/50 transition-colors select-none group"
      onClick={() => handleSort(sortKeyName)}
    >
      <div className="flex items-center gap-2">
        {label}
        <span className="inline-flex flex-col justify-center h-4 w-4">
          {sortKey === sortKeyName ? (
            sortDirection === 'asc' ? <ArrowUp size={14} className="text-binance-yellow" /> : <ArrowDown size={14} className="text-binance-yellow" />
          ) : (
            <ArrowUpDown size={14} className="text-gray-600 group-hover:text-gray-400" />
          )}
        </span>
      </div>
    </th>
  );

  return (
    <div className="bg-[#1E2329] rounded-xl border border-gray-800 overflow-hidden shadow-lg">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-right">
          <thead className="bg-gray-800 text-gray-400">
            <tr>
              <th className="p-4 font-medium whitespace-nowrap w-16">{t.tableHeaders.id}</th>
              <HeaderCell label={t.tableHeaders.date} sortKeyName="time" />
              <HeaderCell label={t.tableHeaders.type} sortKeyName="order" />
              <HeaderCell label={t.tableHeaders.price} sortKeyName="price" />
              <HeaderCell label={t.tableHeaders.profit} sortKeyName="profit" />
              <HeaderCell label={t.tableHeaders.counterparty} sortKeyName="counterparty" />
              <th className="p-4 font-medium whitespace-nowrap w-16">{t.tableHeaders.action}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {currentTrades.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">لا توجد سجلات تداول</td>
              </tr>
            ) : (
              currentTrades.map((trade) => {
                const profitVal = parseFloat(trade.profit);
                const isProfit = !isNaN(profitVal) && profitVal >= 0;
                
                return (
                  <tr key={trade.id + trade.orderNo} className="hover:bg-gray-800/50 transition-colors">
                    <td className="p-4 text-gray-500">{trade.id}</td>
                    <td className="p-4 text-gray-300 font-mono text-xs whitespace-nowrap" dir="ltr">{trade.time}</td>
                    <td className={`p-4 font-bold whitespace-nowrap ${trade.type === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                      {trade.order}
                      {trade.manual && <span className="mr-2 text-[10px] bg-gray-700 px-1 rounded text-gray-300">يدوي</span>}
                    </td>
                    <td className="p-4 font-mono">{trade.price}</td>
                    <td className={`p-4 font-mono font-bold ${trade.profit === '—' ? 'text-gray-500' : isProfit ? 'text-green-500' : 'text-red-500'}`}>
                      {trade.profit}
                    </td>
                    <td className="p-4 text-gray-300 truncate max-w-[150px]">{trade.counterparty || 'N/A'}</td>
                    <td className="p-4">
                      <button 
                        onClick={() => onDelete(trade.orderNo)}
                        className="text-gray-500 hover:text-red-400 transition-colors"
                      >
                        <Trash size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 border-t border-gray-800 bg-gray-900/30">
          <button 
            onClick={handlePrev} 
            disabled={currentPage === 1}
            className="p-2 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-400 hover:text-white"
          >
            <ChevronRight size={20} />
          </button>
          <span className="text-gray-400 text-sm">صفحة {currentPage} من {totalPages}</span>
          <button 
            onClick={handleNext} 
            disabled={currentPage === totalPages}
            className="p-2 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-400 hover:text-white"
          >
            <ChevronLeft size={20} />
          </button>
        </div>
      )}
    </div>
  );
};