

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
  const cards = [
    { label: t.totalProfit, value: summary.totalProfit, icon: <TrendingUp size={20} className="text-green-400" />, color: "border-green-500/30 bg-green-900/10", suffix: fiat },
    { label: t.remainingQty, value: summary.remainingQty, icon: <Wallet size={20} className="text-blue-400" />, color: "border-blue-500/30 bg-blue-900/10", suffix: asset },
    { label: t.marketValue, value: summary.marketValue, icon: <DollarSign size={20} className="text-yellow-400" />, color: "border-yellow-500/30 bg-yellow-900/10", suffix: fiat },
    { label: t.unrealized, value: summary.unrealizedProfit, icon: <Activity size={20} className="text-purple-400" />, color: "border-purple-500/30 bg-purple-900/10", suffix: fiat },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
  );
};