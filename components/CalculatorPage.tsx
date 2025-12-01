import React from 'react';
import { TradeForm } from './TradeForm';
import { CalculatorSummary } from './CalculatorSummary';
import { ResultsSummary } from './ResultsSummary';
import { ProfitCharts } from './ProfitCharts';
import { GeminiAdvisor } from './GeminiAdvisor';
import { TradeSummary, TradeInputs, TradeResult, Translation } from '../types';

interface CalculatorPageProps {
  buyPrice: string; setBuyPrice: (v: string) => void;
  sellPrice: string; setSellPrice: (v: string) => void;
  amount: string; setAmount: (v: string) => void;
  feePercentage: string; setFeePercentage: (v: string) => void;
  currencySymbol: string;
  spread: number;
  onReset: () => void;
  t: Translation['calculator'];
  summaryT: Translation['calculatorSummary'];
  summary: TradeSummary;
  asset: string;
  fiat: string;
  results: TradeResult;
  inputs: TradeInputs;
}

export const CalculatorPage: React.FC<CalculatorPageProps> = ({
  buyPrice, setBuyPrice,
  sellPrice, setSellPrice,
  amount, setAmount,
  feePercentage, setFeePercentage,
  currencySymbol,
  spread,
  onReset,
  t,
  summaryT,
  summary,
  asset,
  fiat,
  results,
  inputs
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn">
      {/* Left Column: Inputs */}
      <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-36">
        <TradeForm 
          buyPrice={buyPrice} setBuyPrice={setBuyPrice}
          sellPrice={sellPrice} setSellPrice={setSellPrice}
          amount={amount} setAmount={setAmount}
          feePercentage={feePercentage} setFeePercentage={setFeePercentage}
          currencySymbol={currencySymbol}
          spread={spread}
          onReset={onReset}
          t={t}
        />
        
        <div className="bg-blue-900/10 rounded-xl p-4 border border-blue-900/30">
          <h4 className="text-blue-400 font-bold mb-2 text-sm">{t.adviceTitle}</h4>
          <p className="text-blue-200/70 text-xs leading-relaxed">
            {t.adviceText}
          </p>
        </div>
      </div>

      {/* Right Column: Results & Analytics */}
      <div className="lg:col-span-8 space-y-6">
        <CalculatorSummary 
          summary={summary} 
          asset={asset} 
          fiat={fiat} 
          t={summaryT} 
        />
        
        <ResultsSummary results={results} inputs={inputs} t={t} />
        <ProfitCharts results={results} inputs={inputs} title={t.chartTitle} />
        <GeminiAdvisor inputs={inputs} results={results} />
      </div>
    </div>
  );
};