import React from 'react';
import { TradeResult, TradeInputs, Translation } from '../types';
import { ArrowUpRight, ArrowDownRight, DollarSign, PieChart, TrendingUp } from 'lucide-react';

interface ResultsSummaryProps {
  results: TradeResult;
  inputs: TradeInputs;
  t: Translation['calculator'];
}

export const ResultsSummary: React.FC<ResultsSummaryProps> = ({ results, inputs, t }) => {
  const isProfitable = results.netProfit >= 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Net Profit Card */}
      <div className={`p-6 rounded-2xl border ${isProfitable ? 'bg-green-900/20 border-green-800' : 'bg-red-900/20 border-red-800'} transition-all`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-text-muted text-sm font-medium">{t.netProfit}</span>
          {isProfitable ? <ArrowUpRight className="text-green-500" size={20} /> : <ArrowDownRight className="text-red-500" size={20} />}
        </div>
        <div className={`text-3xl font-bold font-mono ${isProfitable ? 'text-green-400' : 'text-red-400'}`}>
          {results.netProfit.toFixed(2)}
          <span className="text-sm ml-1 text-text-muted">{inputs.currencySymbol}</span>
        </div>
      </div>

      {/* Margin Card */}
      <div className="bg-card/50 p-6 rounded-2xl border border-card-border hover:border-primary/50 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <span className="text-text-muted text-sm font-medium">{t.margin}</span>
          <TrendingUp className="text-primary" size={20} />
        </div>
        <div className="text-3xl font-bold text-text-main font-mono">
          {results.marginPercentage.toFixed(2)}%
        </div>
      </div>

      {/* Total Revenue */}
      <div className="bg-card/50 p-6 rounded-2xl border border-card-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-text-muted text-sm font-medium">{t.totalRevenue}</span>
          <DollarSign className="text-blue-400" size={20} />
        </div>
        <div className="text-2xl font-bold text-text-main font-mono">
          {results.totalRevenue.toFixed(2)}
          <span className="text-xs ml-1 text-text-muted">{inputs.currencySymbol}</span>
        </div>
      </div>

       {/* Total Fees */}
       <div className="bg-card/50 p-6 rounded-2xl border border-card-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-text-muted text-sm font-medium">{t.totalFees}</span>
          <PieChart className="text-orange-400" size={20} />
        </div>
        <div className="text-2xl font-bold text-text-main font-mono">
          {results.totalFees.toFixed(2)}
          <span className="text-xs ml-1 text-text-muted">{inputs.currencySymbol}</span>
        </div>
      </div>
    </div>
  );
};