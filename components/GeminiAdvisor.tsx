import React, { useState } from 'react';
import { analyzeTradeScenario } from '../services/geminiService';
import { TradeInputs, TradeResult } from '../types';
import { Bot, Sparkles, Loader2 } from 'lucide-react';

interface GeminiAdvisorProps {
  inputs: TradeInputs;
  results: TradeResult;
}

export const GeminiAdvisor: React.FC<GeminiAdvisorProps> = ({ inputs, results }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (inputs.amount <= 0 || inputs.buyPrice <= 0) return;
    
    setLoading(true);
    const text = await analyzeTradeScenario(inputs, results);
    setAnalysis(text);
    setLoading(false);
  };

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-binance-yellow/20 shadow-xl mt-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-binance-yellow to-transparent opacity-50"></div>
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-binance-yellow/10 p-2 rounded-lg">
            <Bot className="text-binance-yellow" size={24} />
          </div>
          <h3 className="text-xl font-bold text-white">المستشار الذكي (Gemini AI)</h3>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="flex items-center gap-2 bg-binance-yellow hover:bg-yellow-400 text-binance-black px-4 py-2 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              جاري التحليل...
            </>
          ) : (
            <>
              <Sparkles size={18} />
              حلل الصفقة
            </>
          )}
        </button>
      </div>

      {analysis && (
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 animate-fadeIn">
          <p className="text-gray-200 leading-relaxed whitespace-pre-line text-sm md:text-base">
            {analysis}
          </p>
        </div>
      )}

      {!analysis && !loading && (
        <p className="text-gray-500 text-sm mt-2">
          اضغط على "حلل الصفقة" للحصول على رأي الذكاء الاصطناعي حول المخاطر والأرباح المتوقعة لهذه العملية.
        </p>
      )}
    </div>
  );
};