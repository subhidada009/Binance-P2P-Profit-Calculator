
import React, { useState } from 'react';
import { InputCard } from './InputCard';
import { Translation } from '../types';
import { RefreshCcw, ChevronDown, ChevronUp, Settings2, Trash2 } from 'lucide-react';

interface TradeFormProps {
  buyPrice: string;
  setBuyPrice: (val: string) => void;
  sellPrice: string;
  setSellPrice: (val: string) => void;
  amount: string;
  setAmount: (val: string) => void;
  feePercentage: string;
  setFeePercentage: (val: string) => void;
  currencySymbol: string;
  spread: number;
  onReset: () => void;
  t: Translation['calculator'];
}

export const TradeForm: React.FC<TradeFormProps> = ({
  buyPrice,
  setBuyPrice,
  sellPrice,
  setSellPrice,
  amount,
  setAmount,
  feePercentage,
  setFeePercentage,
  currencySymbol,
  spread,
  onReset,
  t
}) => {
  // CHANGED: Default state to false (collapsed)
  const [isOpen, setIsOpen] = useState(false);

  return (
    // CHANGED: Removed rounded-2xl and border classes from main container for "borderless" look when collapsed
    <div className={`bg-card shadow-lg overflow-hidden transition-all duration-300 ${isOpen ? 'rounded-2xl border border-card-border' : 'rounded-lg'}`}>
      {/* Header / Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-6 bg-card hover:bg-card-border/50 transition-colors focus:outline-none ${!isOpen && 'rounded-lg'}`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isOpen ? 'bg-primary text-text-inverted' : 'bg-card-border text-text-muted'}`}>
            <Settings2 size={20} />
          </div>
          <div className="text-right">
            <h2 className="text-lg font-bold text-text-main">{t.title}</h2>
            {!isOpen && (
              <p className="text-xs text-text-muted mt-1">
                 {t.spread}: <span dir="ltr">{spread.toFixed(4)}</span>
              </p>
            )}
          </div>
        </div>
        {isOpen ? <ChevronUp className="text-text-muted" /> : <ChevronDown className="text-text-muted" />}
      </button>

      {/* Collapsible Content */}
      <div 
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-6 pt-0 border-t border-card-border/50">
          <div className="flex justify-end mb-4">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onReset();
              }}
              className="text-xs flex items-center gap-1 text-red-400 hover:text-red-300 transition-colors px-3 py-1 rounded-full border border-red-900/30 bg-red-900/10 hover:bg-red-900/20"
              title={t.reset}
            >
              <Trash2 size={14} />
              <span>{t.reset}</span>
            </button>
          </div>
          
          <div className="space-y-4">
            <InputCard
              label={t.buyPrice}
              value={buyPrice}
              onChange={setBuyPrice}
              type="number"
              suffix={currencySymbol}
            />
            <InputCard
              label={t.sellPrice}
              value={sellPrice}
              onChange={setSellPrice}
              type="number"
              suffix={currencySymbol}
            />
            <InputCard
              label={t.amount}
              value={amount}
              onChange={setAmount}
              type="number"
              placeholder="USDT / BTC"
              suffix="Asset"
            />
            <InputCard
              label={t.fee}
              value={feePercentage}
              onChange={setFeePercentage}
              type="number"
              suffix="%"
              step={0.01}
            />
          </div>

          <div className="mt-6 pt-6 border-t border-card-border">
            <div className="flex justify-between text-sm text-text-muted mb-1">
              <span>{t.spread}:</span>
              <span className={spread >= 0 ? "text-green-400 font-mono" : "text-red-400 font-mono"}>
                {spread.toFixed(4)} {currencySymbol}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};