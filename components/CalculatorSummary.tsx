

import React from 'react';
import { TradeSummary, Translation } from '../types';
import { TrendingUp, Wallet, DollarSign, Activity } from 'lucide-react';

interface CalculatorSummaryProps {
  summary: TradeSummary;
  fiat: string;
  asset: string;
  t: Translation['calculatorSummary'];
}

export const CalculatorSummary: React.FC<CalculatorSummaryProps> = ({ summary, fiat, asset, t }) => {
  const cards = [
    { label: t.totalProfit, value: summary.totalProfit, icon: <TrendingUp size={20} className="text-green-400" />, color: "border-green-500/20 bg-green-900/5", suffix: fiat },
    { label: t.remainingQty, value: summary.remainingQty, icon: <Wallet size={20} className="text-blue-400" />, color: "border-blue-500/20 bg-blue-900/5", suffix: asset },
    { label: t.marketValue, value: summary.marketValue, icon: <DollarSign size={20} className="text-yellow-400" />, color: "border-yellow-500/20 bg-yellow-900/5", suffix: fiat },
    { label: t.unrealized, value: summary.unrealizedProfit, icon: <Activity size={20} className="text-purple-400" />, color: "border-purple-500/20 bg-purple-900/5", suffix: fiat },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, idx) => (
        <div key={idx} className={`p-4 rounded-xl border ${card.color} backdrop-blur-sm relative`}>
          <div className="flex justify-between items-start mb-2">
            <span className="text-text-muted text-xs font-bold uppercase tracking-wider">{card.label}</span>
            {card.icon}
          </div>
          <div className="text-2xl font-bold text-text-main font-mono truncate">
            {card.value} <span className="text-xs text-text-muted ml-1">{card.suffix}</span>
          </div>
          {card.label === t.unrealized && summary.lastSellPrice && (
            <div className="mt-2 text-[10px] text-text-muted bg-background/20 rounded px-2 py-1 inline-block">
               {t.basedOnLast} {summary.lastSellPrice} {fiat}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};