import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Filter, Download, CloudUpload, FileText, X, Coins, Banknote, Info, Calendar } from 'lucide-react';
import { Translation, BINANCE_P2P_CRYPTOS, FIAT_CURRENCIES } from '../../types';
import { BinanceGuideModal } from './BinanceGuideModal';

interface TradeFiltersProps {
  onFilesAdded: (files: File[]) => void;
  uploadedFiles: string[];
  onRemoveFile: (fileName: string) => void;
  onClear: () => void;
  onManualAdd: () => void;
  onExport: () => void;
  asset: string;
  setAsset: (val: string) => void;
  fiat: string;
  setFiat: (val: string) => void;
  marketPrice: string;
  setMarketPrice: (val: string) => void;
  fromDate?: string;
  setFromDate?: (val: string) => void;
  toDate?: string;
  setToDate?: (val: string) => void;
  availableAssets: string[];
  availableFiats: string[];
  t: Translation['history'];
  guideT: Translation['csvGuide'];
}

export const TradeFilters: React.FC<TradeFiltersProps> = ({
  onFilesAdded,
  uploadedFiles,
  onRemoveFile,
  onClear,
  onManualAdd,
  onExport,
  asset,
  setAsset,
  fiat,
  setFiat,
  marketPrice,
  setMarketPrice,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  availableAssets,
  availableFiats,
  t,
  guideT
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current += 1;
      if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current -= 1;
      if (dragCounter.current <= 0) {
        setIsDragging(false);
        dragCounter.current = 0;
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounter.current = 0;
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        onFilesAdded(Array.from(e.dataTransfer.files));
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, [onFilesAdded]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesAdded(Array.from(e.target.files));
      // Reset input so same file can be selected again if needed
      e.target.value = '';
    }
  };

  return (
    <>
      <div className="bg-[#1E2329] p-4 rounded-xl border border-gray-800 mb-6 space-y-4 relative">
        
        {/* Hidden File Input */}
        <input 
          type="file" 
          ref={fileInputRef}
          accept=".csv,.txt" 
          multiple 
          className="hidden" 
          onChange={handleFileInput} 
        />

        {/* Global Drag Overlay */}
        {isDragging && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center animate-fadeIn cursor-copy">
             <div className="bg-card border-2 border-dashed border-primary p-10 rounded-2xl flex flex-col items-center gap-4 max-w-lg w-full mx-4 shadow-2xl transform scale-100 transition-transform">
                <CloudUpload size={64} className="text-primary animate-bounce" />
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-white mb-2">{t.dragDrop}</h3>
                  <p className="text-text-muted">{t.supports}</p>
                </div>
             </div>
          </div>
        )}

        {/* Uploaded Files Grid */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            <h5 className="text-text-muted text-xs font-bold uppercase tracking-wider px-1">{t.activeFiles}</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {uploadedFiles.map((file, idx) => (
                <div key={idx} className="bg-card border border-card-border p-3 rounded-lg flex items-center justify-between group hover:border-primary/50 transition-colors">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="bg-primary/10 p-2 rounded text-primary">
                      <FileText size={16} />
                    </div>
                    <span className="text-sm text-text-main truncate font-medium" title={file}>{file}</span>
                  </div>
                  <button 
                    onClick={() => onRemoveFile(file)}
                    className="text-text-muted hover:text-red-400 hover:bg-red-900/20 p-1.5 rounded-md transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available Markets & Assets Filters */}
        {(availableAssets.length > 0 || availableFiats.length > 0) && (
           <div className="space-y-4 pt-4 border-t border-gray-800">
              {/* Fiat / Markets Filter */}
              {availableFiats.length > 0 && (
                <div>
                  <h5 className="text-text-muted text-xs font-bold uppercase tracking-wider px-1 mb-2 flex items-center gap-2">
                    <Banknote size={14} />
                    {t.markets}
                  </h5>
                  <div className="flex items-center gap-1 bg-black/20 p-1 rounded-lg w-fit overflow-x-auto">
                    {availableFiats.map(f => (
                      <button
                        key={f}
                        onClick={() => setFiat(f)}
                        className={`px-6 py-2 rounded-md text-sm font-bold transition-all whitespace-nowrap ${
                          fiat === f 
                            ? 'bg-primary/20 text-primary border border-primary/50 shadow-sm' 
                            : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Crypto Assets Filter */}
              {availableAssets.length > 0 && (
                <div>
                  <h5 className="text-text-muted text-xs font-bold uppercase tracking-wider px-1 mb-2 flex items-center gap-2">
                    <Coins size={14} />
                    {t.assets}
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {availableAssets.map(curr => (
                      <button
                        key={curr}
                        onClick={() => setAsset(curr)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-2 ${
                          asset === curr 
                            ? 'bg-primary text-text-inverted border-primary shadow-sm' 
                            : 'bg-card border-card-border text-text-muted hover:border-primary/50 hover:text-text-main hover:bg-card-border/50'
                        }`}
                      >
                        {curr}
                      </button>
                    ))}
                  </div>
                </div>
              )}
           </div>
        )}

        <div className="h-px bg-gray-800 my-4" />

        {/* Actions & Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          
          {/* Buttons Group */}
          <div className="flex items-center gap-2 flex-wrap">
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()} 
              className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-text-inverted px-4 py-2 rounded-lg transition-colors text-sm font-bold shadow-lg shadow-primary/20"
            >
              <CloudUpload size={16} />
              <span>{t.upload}</span>
            </button>

             {/* Info / Guide Button */}
             <button
              type="button"
              onClick={() => setShowGuide(true)}
              className="p-2 rounded-lg bg-card-border hover:bg-gray-600 text-text-muted hover:text-text-main transition-colors"
              title={t.howToCsv}
            >
                <Info size={18} />
            </button>

            <button type="button" onClick={onManualAdd} className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-bold">
              <Plus size={16} />
              <span>{t.manual}</span>
            </button>
            
            <button type="button" onClick={onExport} className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-bold">
              <Download size={16} />
              <span>{t.export}</span>
            </button>

            <button type="button" onClick={onClear} className="flex items-center gap-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 px-4 py-2 rounded-lg border border-red-900/50 transition-colors text-sm font-bold">
              <Trash2 size={16} />
              <span>{t.clear}</span>
            </button>
          </div>

          {/* Settings Group */}
          <div className="flex items-center gap-3 flex-wrap bg-gray-900/50 p-2 rounded-lg border border-gray-700">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-binance-yellow" />
              <span className="text-xs text-gray-400 font-bold">Manual Filter:</span>
            </div>
            
            <select value={asset} onChange={(e) => setAsset(e.target.value)} className="bg-gray-800 text-white text-sm rounded px-2 py-1 border border-gray-700 outline-none focus:border-binance-yellow">
              {BINANCE_P2P_CRYPTOS.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select value={fiat} onChange={(e) => setFiat(e.target.value)} className="bg-gray-800 text-white text-sm rounded px-2 py-1 border border-gray-700 outline-none focus:border-binance-yellow">
              {FIAT_CURRENCIES.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>

            <input 
              type="number" 
              value={marketPrice} 
              onChange={(e) => setMarketPrice(e.target.value)} 
              placeholder="Market Price"
              className="bg-gray-800 text-white text-sm rounded px-3 py-1 border border-gray-700 w-24 outline-none focus:border-binance-yellow"
            />

            {/* Date Filters */}
            <div className="flex items-center gap-1 border-l border-gray-700 pl-3 ml-1">
              <div className="relative">
                <input 
                  type="date" 
                  value={fromDate || ''}
                  onChange={(e) => setFromDate && setFromDate(e.target.value)}
                  className="bg-gray-800 text-white text-sm rounded px-2 py-1 border border-gray-700 outline-none focus:border-binance-yellow w-32"
                  placeholder="From Date"
                />
              </div>
              <span className="text-gray-500">-</span>
              <div className="relative">
                <input 
                  type="date" 
                  value={toDate || ''}
                  onChange={(e) => setToDate && setToDate(e.target.value)}
                  className="bg-gray-800 text-white text-sm rounded px-2 py-1 border border-gray-700 outline-none focus:border-binance-yellow w-32"
                  placeholder="To Date"
                />
              </div>
            </div>

          </div>
        </div>
      </div>

      {showGuide && <BinanceGuideModal onClose={() => setShowGuide(false)} t={guideT} />}
    </>
  );
};