import React from 'react';
import { TradeSummary, Translation } from '../../types';
import { Wallet, TrendingUp, DollarSign, Activity } from 'lucide-react';

interface TradeStatsProps {
  summary: TradeSummary;
  fiat: string;
  asset: string;
  t: Translation['history']['stats'];
}

export const TradeStats: React.FC<TradeStatsProps> = ({ summary, fiat, asset, t }) => {
  const missingCostOrders = summary.sellWithoutCostCount || 0;
  const winRateValue = summary.winRate && summary.winRate !== '—' ? `${summary.winRate}%` : 'N/A';
  const avgSellProfitValue = summary.avgSellProfit && summary.avgSellProfit !== '—'
    ? `${summary.avgSellProfit} ${fiat}`
    : `N/A ${fiat}`;

  const cards = [
    { label: t.totalProfit, value: summary.totalProfit, icon: <TrendingUp size={20} className="text-green-400" />, color: 'border-green-500/30 bg-green-900/10', suffix: fiat },
    { label: t.remainingQty, value: summary.remainingQty, icon: <Wallet size={20} className="text-blue-400" />, color: 'border-blue-500/30 bg-blue-900/10', suffix: asset },
    { label: t.marketValue, value: summary.marketValue, icon: <DollarSign size={20} className="text-yellow-400" />, color: 'border-yellow-500/30 bg-yellow-900/10', suffix: fiat },
    { label: t.unrealized, value: summary.unrealizedProfit, icon: <Activity size={20} className="text-purple-400" />, color: 'border-purple-500/30 bg-purple-900/10', suffix: fiat },
  ];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {cards.map((card, idx) => (
          <div key={idx} className={`p-4 rounded-xl border ${card.color} backdrop-blur-sm transition-transform hover:-translate-y-1 relative`}>
            <div className="flex justify-between items-start mb-2">
              <span className="text-gray-400 text-sm font-medium">{card.label}</span>
              {card.icon}
            </div>
            <div className="text-2xl font-bold text-white font-mono truncate">
              {card.value} <span className="text-xs text-gray-500 ml-1">{card.suffix}</span>
            </div>
            {card.label === t.unrealized && summary.lastSellPrice && (
              <div className="mt-2 text-[10px] text-gray-400 bg-black/20 rounded px-2 py-1 inline-block">
                {t.basedOnLast} {summary.lastSellPrice} {fiat}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <div className="bg-card border border-card-border rounded-lg px-4 py-3">
          <div className="text-xs uppercase tracking-wider text-text-muted mb-1">Win Rate</div>
          <div className="font-mono text-lg text-emerald-400 font-bold">{winRateValue}</div>
        </div>
        <div className="bg-card border border-card-border rounded-lg px-4 py-3">
          <div className="text-xs uppercase tracking-wider text-text-muted mb-1">Avg Sell Profit</div>
          <div className="font-mono text-lg text-blue-400 font-bold">{avgSellProfitValue}</div>
        </div>
        <div className={`border rounded-lg px-4 py-3 ${missingCostOrders > 0 ? 'bg-amber-900/20 border-amber-700/40' : 'bg-card border-card-border'}`}>
          <div className="text-xs uppercase tracking-wider text-text-muted mb-1">Missing Cost Sells</div>
          <div className={`font-mono text-lg font-bold ${missingCostOrders > 0 ? 'text-amber-300' : 'text-text-main'}`}>
            {missingCostOrders}
          </div>
        </div>
      </div>
    </>
  );
};
