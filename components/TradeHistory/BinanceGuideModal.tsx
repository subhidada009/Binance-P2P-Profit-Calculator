
import React from 'react';
import { Translation } from '../../types';
import { X, FileSpreadsheet, ExternalLink, Download } from 'lucide-react';

interface BinanceGuideModalProps {
  onClose: () => void;
  t: Translation['csvGuide'];
}

export const BinanceGuideModal: React.FC<BinanceGuideModalProps> = ({ onClose, t }) => {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-card w-full max-w-lg rounded-2xl border border-card-border shadow-2xl relative overflow-hidden">
        
        {/* Header */}
        <div className="bg-background/50 p-4 border-b border-card-border flex justify-between items-center">
            <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
                <FileSpreadsheet className="text-primary" size={20} />
                {t.title}
            </h3>
            <button onClick={onClose} className="text-text-muted hover:text-text-main transition-colors">
                <X size={20} />
            </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
            
            <div className="flex gap-4">
                <div className="bg-primary/10 text-primary font-bold w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">1</div>
                <div>
                    <p className="text-text-main text-sm">{t.step1}</p>
                </div>
            </div>

            <div className="flex gap-4">
                <div className="bg-primary/10 text-primary font-bold w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">2</div>
                <div>
                    <p className="text-text-main text-sm">{t.step2}</p>
                </div>
            </div>

            <div className="flex gap-4">
                <div className="bg-primary/10 text-primary font-bold w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">3</div>
                <div>
                    <p className="text-text-main text-sm">{t.step3}</p>
                    <div className="mt-2 text-xs text-text-muted bg-background/50 p-2 rounded border border-card-border">
                         ⚠️ Important: Standard export (3 months) might miss older trades. Use "Custom" range.
                    </div>
                </div>
            </div>

            <div className="flex gap-4">
                <div className="bg-primary/10 text-primary font-bold w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">4</div>
                <div>
                    <p className="text-text-main text-sm flex items-center gap-2">
                        {t.step4} <Download size={14} className="text-gray-400" />
                    </p>
                </div>
            </div>

            <div className="bg-blue-900/10 border border-blue-900/30 p-3 rounded-lg mt-4">
                <p className="text-xs text-blue-300">{t.note}</p>
            </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-background/30 flex justify-end">
            <button 
                onClick={onClose}
                className="bg-primary hover:bg-primary-hover text-text-inverted font-bold px-6 py-2 rounded-lg transition-colors"
            >
                {t.gotIt}
            </button>
        </div>
      </div>
    </div>
  );
};
