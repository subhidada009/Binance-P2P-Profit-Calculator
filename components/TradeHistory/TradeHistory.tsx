import React, { useState, useMemo, useCallback } from 'react';
import { RawTradeData, ProcessedTrade, TradeSummary, Translation } from '../../types';
import { TradeStats } from './TradeStats';
import { TradeFilters } from './TradeFilters';
import { TradeTable } from './TradeTable';
import { X } from 'lucide-react';
import { parseTradeFile } from '../../utils/tradeLogic';
import { BinanceApiImportModal } from './BinanceApiImportModal';
import { importBinanceC2CTrades, BinanceApiImportOptions } from '../../services/binanceC2CService';

interface TradeHistoryProps {
  rawData: RawTradeData[];
  setRawData: React.Dispatch<React.SetStateAction<RawTradeData[]>>;
  trades: ProcessedTrade[];
  summary: TradeSummary;
  asset: string;
  setAsset: (val: string) => void;
  fiat: string;
  setFiat: (val: string) => void;
  marketPrice: string;
  setMarketPrice: (val: string) => void;
  fromDate: string;
  setFromDate: (val: string) => void;
  toDate: string;
  setToDate: (val: string) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearData: () => void;
  onExportData: () => void;
  t: Translation['history'];
  guideT: Translation['csvGuide']; // Added prompt
}

export const TradeHistory: React.FC<TradeHistoryProps> = ({
  rawData,
  setRawData,
  trades,
  summary,
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
  onFileUpload, // Deprecated in favor of handleProcessFiles, kept for type safety if needed elsewhere
  onClearData,
  onExportData,
  t,
  guideT
}) => {
  const [showManualModal, setShowManualModal] = useState(false);
  const [showBinanceApiModal, setShowBinanceApiModal] = useState(false);
  const [notice, setNotice] = useState<{
    tone: 'success' | 'error';
    message: string;
  } | null>(null);
  const [apiImportState, setApiImportState] = useState<{
    loading: boolean;
    progressText: string;
  }>({
    loading: false,
    progressText: '',
  });
  const isArabic = typeof document !== 'undefined' && document.documentElement.lang === 'ar';

  const getCompletedRowCount = useCallback((rows: RawTradeData[]) => {
    return rows.reduce((count, row) => {
      return String(row.Status || '').trim().toLowerCase() === 'completed' ? count + 1 : count;
    }, 0);
  }, []);

  // Manual Form State
  const [mType, setMType] = useState('Buy');
  const [mPrice, setMPrice] = useState('');
  const [mQty, setMQty] = useState('');
  const [mCounterparty, setMCounterparty] = useState('');

  // Derived list of uploaded files from the raw data
  const uploadedFiles = useMemo(() => {
    const files = new Set<string>();
    rawData.forEach(r => {
      if (r.sourceFile) files.add(r.sourceFile);
    });
    return Array.from(files);
  }, [rawData]);

  // Derived list of unique assets from raw data for filtering
  const availableAssets = useMemo(() => {
    const assets = new Set<string>();
    rawData.forEach(r => {
      if (r['Asset Type']) assets.add(r['Asset Type'].toUpperCase());
    });
    return Array.from(assets).sort();
  }, [rawData]);

   // Derived list of unique FIAT currencies from raw data for filtering
   const availableFiats = useMemo(() => {
    const fiats = new Set<string>();
    rawData.forEach(r => {
      if (r['Fiat Type']) fiats.add(r['Fiat Type'].toUpperCase());
    });
    return Array.from(fiats).sort();
  }, [rawData]);

  const handleDelete = (orderNo: string) => {
    if (window.confirm("Are you sure you want to delete this trade?")) {
      setRawData(prev => prev.filter(r => r["Order Number"] !== orderNo));
    }
  };

  const handleProcessFiles = useCallback(async (files: File[]) => {
    try {
      const parsedByFile = await Promise.all(files.map((file) => parseTradeFile(file)));
      const parsedRows = parsedByFile.flat();
      const importedRows = parsedRows.length;
      const importedCompletedRows = getCompletedRowCount(parsedRows);
      const nextRawData = [...rawData, ...parsedRows];
      const totalCompletedRows = getCompletedRowCount(nextRawData);
      const totalFiles = new Set(nextRawData.map((row) => row.sourceFile).filter(Boolean)).size;

      setRawData((prev) => [...prev, ...parsedRows]);
      setNotice({
        tone: 'success',
        message: isArabic
          ? `??? ????? ${importedRows} ??? (${importedCompletedRows} ?????) ?? ${files.length} ???. ?????? ???????? ???? ${nextRawData.length} ??? (${totalCompletedRows} ?????) ?? ${totalFiles} ???.`
          : `Added ${importedRows} rows (${importedCompletedRows} completed) from ${files.length} file(s). Active dataset: ${nextRawData.length} rows (${totalCompletedRows} completed) across ${totalFiles} file(s).`,
      });
    } catch (error) {
      console.error("Failed to process files", error);
      setNotice({
        tone: 'error',
        message: isArabic
          ? '??? ?? ????? ??????? ????????.'
          : 'Failed to process the selected files.',
      });
    }
  }, [getCompletedRowCount, isArabic, rawData, setRawData]);

  const handleBinanceApiImport = useCallback(async (options: BinanceApiImportOptions) => {
    setApiImportState({
      loading: true,
      progressText: isArabic ? '???? ??????? ?? Binance...' : 'Connecting to Binance...',
    });
    setNotice(null);

    try {
      const result = await importBinanceC2CTrades({
        ...options,
        onProgress: (message) => {
          setApiImportState({
            loading: true,
            progressText: message,
          });
        },
      });

      const nextRawData = [...rawData, ...result.rows];
      const totalCompletedRows = getCompletedRowCount(nextRawData);
      const totalFiles = new Set(nextRawData.map((row) => row.sourceFile).filter(Boolean)).size;

      setRawData((prev) => [...prev, ...result.rows]);
      setNotice({
        tone: 'success',
        message: isArabic
          ? `??? ????? ${result.rows.length} ??? ????? ?? Binance API ??? ${result.requests} ???. ?????? ???????? ???? ${nextRawData.length} ??? (${totalCompletedRows} ?????) ?? ${totalFiles} ????.`
          : `Added ${result.rows.length} completed rows from Binance API across ${result.requests} request(s). Active dataset: ${nextRawData.length} rows (${totalCompletedRows} completed) across ${totalFiles} source(s).`,
      });
      setShowBinanceApiModal(false);
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : 'Unknown Binance API error';
      const normalizedMessage = rawMessage.includes('Unexpected token')
        ? isArabic
          ? '?? ??? ?????? ??? Proxy endpoint. ??? ?????? ?? ???? ?????? ??? GitHub Pages ???? Backend ?? Worker.'
          : 'Proxy endpoint not found. This feature does not work directly on GitHub Pages without a backend or worker.'
        : rawMessage;

      setNotice({
        tone: 'error',
        message: normalizedMessage,
      });
    } finally {
      setApiImportState({
        loading: false,
        progressText: '',
      });
    }
  }, [getCompletedRowCount, isArabic, rawData, setRawData]);

  const handleRemoveFile = (fileName: string) => {
    if (window.confirm(`Delete all trades from file: ${fileName}?`)) {
      setRawData(prev => prev.filter(r => r.sourceFile !== fileName));
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTrade: RawTradeData = {
      "Status": "Completed",
      "Order Type": mType,
      "Price": mPrice,
      "Quantity": mQty,
      "Asset Type": asset,
      "Fiat Type": fiat,
      "Order Number": `MANUAL-${Date.now()}`,
      "Counterparty": mCounterparty || 'Manual',
      "Created Time": new Date().toISOString().slice(0, 19).replace('T', ' '),
      "Maker Fee": "0",
      "Taker Fee": "0",
      manual: true
    };
    setRawData(prev => [...prev, newTrade]);
    setNotice(null);
    setShowManualModal(false);
    // Reset form
    setMPrice('');
    setMQty('');
    setMCounterparty('');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Updated to pass props correctly */}
      <TradeStats summary={summary} fiat={fiat} asset={asset} t={t.stats} />
      
      <TradeFilters 
        onFilesAdded={handleProcessFiles}
        onBinanceApiImport={() => setShowBinanceApiModal(true)}
        uploadedFiles={uploadedFiles}
        onRemoveFile={handleRemoveFile}
        onClear={onClearData}
        onManualAdd={() => setShowManualModal(true)}
        onExport={onExportData}
        asset={asset} setAsset={setAsset}
        fiat={fiat} setFiat={setFiat}
        marketPrice={marketPrice} setMarketPrice={setMarketPrice}
        fromDate={fromDate} setFromDate={setFromDate}
        toDate={toDate} setToDate={setToDate}
        availableAssets={availableAssets}
        availableFiats={availableFiats}
        t={t}
        guideT={guideT}
      />

      {notice && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            notice.tone === 'success'
              ? 'border-emerald-700/40 bg-emerald-900/20 text-emerald-300'
              : 'border-red-700/40 bg-red-900/20 text-red-200'
          }`}
        >
          {notice.message}
        </div>
      )}

      {(summary.sellWithoutCostCount || 0) > 0 && (
        <div className="bg-amber-900/20 border border-amber-700/40 rounded-lg px-4 py-3 text-sm text-amber-200">
          {summary.sellWithoutCostCount} sell order(s) could not be fully matched to earlier buy records.
          Only the matched quantity was included in profit.
          {(summary.unmatchedSellQty && parseFloat(summary.unmatchedSellQty) > 0) && (
            <span className="ml-2 text-amber-300">
              Unmatched sell quantity: {summary.unmatchedSellQty} {asset}
            </span>
          )}
        </div>
      )}

      <TradeTable trades={trades} onDelete={handleDelete} t={t} />

      {/* Manual Entry Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-md rounded-2xl border border-card-border shadow-2xl overflow-hidden animate-fadeIn">
            <div className="flex justify-between items-center p-4 border-b border-card-border bg-background/50">
              <h3 className="text-lg font-bold text-text-main">{t.manual}</h3>
              <button onClick={() => setShowManualModal(false)} className="text-text-muted hover:text-text-main">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleManualSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-text-muted mb-1">Type</label>
                <select 
                  value={mType} 
                  onChange={(e) => setMType(e.target.value)}
                  className="w-full bg-background border border-card-border rounded p-2 text-text-main"
                >
                  <option value="Buy">Buy</option>
                  <option value="Sell">Sell</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-text-muted mb-1">Price ({fiat})</label>
                <input 
                  type="number" step="0.01" required
                  value={mPrice} onChange={(e) => setMPrice(e.target.value)}
                  className="w-full bg-background border border-card-border rounded p-2 text-text-main"
                />
              </div>
              <div>
                <label className="block text-sm text-text-muted mb-1">Quantity ({asset})</label>
                <input 
                  type="number" step="0.000001" required
                  value={mQty} onChange={(e) => setMQty(e.target.value)}
                  className="w-full bg-background border border-card-border rounded p-2 text-text-main"
                />
              </div>
              <div>
                <label className="block text-sm text-text-muted mb-1">Counterparty (Optional)</label>
                <input 
                  type="text"
                  value={mCounterparty} onChange={(e) => setMCounterparty(e.target.value)}
                  className="w-full bg-background border border-card-border rounded p-2 text-text-main"
                />
              </div>
              <button type="submit" className="w-full bg-primary hover:bg-primary-hover text-text-inverted font-bold py-3 rounded-lg transition-colors mt-2">
                Save Trade
              </button>
            </form>
          </div>
        </div>
      )}

      <BinanceApiImportModal
        isOpen={showBinanceApiModal}
        loading={apiImportState.loading}
        progressText={apiImportState.progressText}
        onClose={() => {
          if (!apiImportState.loading) {
            setShowBinanceApiModal(false);
          }
        }}
        onImport={handleBinanceApiImport}
      />
    </div>
  );
};
