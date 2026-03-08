import React, { useEffect, useState } from 'react';
import { Calendar, Info, Loader2, X } from 'lucide-react';
import { BinanceApiImportOptions } from '../../services/binanceC2CService';

interface BinanceApiImportModalProps {
  isOpen: boolean;
  loading: boolean;
  progressText?: string;
  onClose: () => void;
  onImport: (options: BinanceApiImportOptions) => Promise<void>;
}

const PROXY_STORAGE_KEY = 'p2p_binance_proxy_url';

const formatDateInput = (value: Date): string => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const BinanceApiImportModal: React.FC<BinanceApiImportModalProps> = ({
  isOpen,
  loading,
  progressText,
  onClose,
  onImport,
}) => {
  const isArabic = typeof document !== 'undefined' && document.documentElement.lang === 'ar';
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [proxyUrl, setProxyUrl] = useState(() => localStorage.getItem(PROXY_STORAGE_KEY) || '');
  const [startDate, setStartDate] = useState(formatDateInput(thirtyDaysAgo));
  const [endDate, setEndDate] = useState(formatDateInput(today));

  useEffect(() => {
    localStorage.setItem(PROXY_STORAGE_KEY, proxyUrl.trim());
  }, [proxyUrl]);

  useEffect(() => {
    if (!isOpen) {
      setApiKey('');
      setApiSecret('');
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onImport({
      apiKey: apiKey.trim(),
      apiSecret: apiSecret.trim(),
      startDate,
      endDate,
      proxyUrl: proxyUrl.trim(),
    });
  };

  const title = isArabic ? 'مزامنة سجل Binance API' : 'Binance API Sync';
  const apiKeyLabel = isArabic ? 'API Key' : 'API Key';
  const apiSecretLabel = isArabic ? 'Secret Key (HMAC)' : 'Secret Key (HMAC)';
  const proxyLabel = isArabic ? 'رابط البروكسي (اختياري - متقدم)' : 'Proxy URL (advanced optional)';
  const startDateLabel = isArabic ? 'من تاريخ' : 'Start date';
  const endDateLabel = isArabic ? 'إلى تاريخ' : 'End date';
  const cancelLabel = isArabic ? 'إغلاق' : 'Close';
  const submitLabel = loading
    ? isArabic
      ? 'جاري السحب...'
      : 'Syncing...'
    : isArabic
      ? 'استيراد من Binance'
      : 'Import from Binance';

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-card-border bg-card shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-card-border bg-background/60 px-5 py-4">
          <div>
            <h3 className="text-lg font-bold text-text-main">{title}</h3>
            <p className="mt-1 text-sm text-text-muted">
              {isArabic
                ? 'يدعم آخر 6 أشهر فقط. التطبيق يقسم الطلبات تلقائياً إلى نوافذ 30 يوم حسب توثيق Binance.'
                : 'Supports the last 6 months only. The app automatically splits requests into 30-day windows.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-2 text-text-muted transition-colors hover:bg-card-border/60 hover:text-text-main disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-text-main">{apiKeyLabel}</span>
              <input
                type="password"
                autoComplete="off"
                required
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-text-main outline-none transition-colors focus:border-primary"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-text-main">{apiSecretLabel}</span>
              <input
                type="password"
                autoComplete="off"
                required
                value={apiSecret}
                onChange={(event) => setApiSecret(event.target.value)}
                className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-text-main outline-none transition-colors focus:border-primary"
              />
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-text-main">{proxyLabel}</span>
            <input
              type="url"
              inputMode="url"
              value={proxyUrl}
              onChange={(event) => setProxyUrl(event.target.value)}
              placeholder="https://your-worker.example.com"
              className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-text-main outline-none transition-colors focus:border-primary"
            />
            <p className="text-xs text-text-muted">
              {isArabic
                ? 'اتركه فارغاً ليتم استخدام البروكسي الافتراضي تلقائياً. غيّره فقط إذا عندك Worker خاص.'
                : 'Leave blank to use the default proxy automatically. Set it only if you want a custom worker.'}
            </p>
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="flex items-center gap-2 text-sm font-medium text-text-main">
                <Calendar size={14} />
                {startDateLabel}
              </span>
              <input
                type="date"
                required
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-text-main outline-none transition-colors focus:border-primary"
              />
            </label>

            <label className="space-y-2">
              <span className="flex items-center gap-2 text-sm font-medium text-text-main">
                <Calendar size={14} />
                {endDateLabel}
              </span>
              <input
                type="date"
                required
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-text-main outline-none transition-colors focus:border-primary"
              />
            </label>
          </div>

          <div className="rounded-xl border border-amber-700/40 bg-amber-900/20 p-4 text-sm text-amber-100">
            <div className="flex items-start gap-3">
              <Info size={18} className="mt-0.5 shrink-0 text-amber-300" />
              <div className="space-y-2">
                <p>
                  {isArabic
                    ? 'Binance تتطلب طلبات USER_DATA موقعة، كما أن CORS يمنع تنفيذها مباشرة من المتصفح على الموقع الحي.'
                    : 'Binance requires signed USER_DATA requests, and CORS blocks these calls directly from a live static browser app.'}
                </p>
                <p>
                  {isArabic
                    ? 'فعّل صلاحية القراءة فقط، واستخدم هذا النموذج مع التشغيل المحلي أو مع Proxy تملكه أنت. المفاتيح لا يتم حفظها داخل التطبيق.'
                    : 'Use a read-only key, and run this via local dev or your own proxy. The app does not store the key or secret.'}
                </p>
              </div>
            </div>
          </div>

          {loading && (
            <div className="rounded-xl border border-sky-700/40 bg-sky-900/20 px-4 py-3 text-sm text-sky-200">
              <div className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                <span>{progressText || submitLabel}</span>
              </div>
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-card-border px-4 py-2 text-sm font-semibold text-text-main transition-colors hover:bg-background disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-text-inverted transition-colors hover:bg-primary-hover disabled:opacity-60"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              <span>{submitLabel}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
