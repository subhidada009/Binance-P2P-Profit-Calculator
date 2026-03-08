import { RawTradeData } from '../types';

type BinanceTradeType = 'BUY' | 'SELL';

type BinanceTradeHistoryItem = {
  orderNumber: string;
  tradeType: BinanceTradeType;
  asset: string;
  fiat: string;
  amount: string;
  totalPrice: string;
  unitPrice: string;
  orderStatus: string;
  createTime: number;
  commission?: string;
  counterPartNickName?: string;
  advertisementRole?: 'MAKER' | 'TAKER';
};

type BinanceTradeHistoryResponse = {
  code?: string;
  message?: string;
  msg?: string;
  success?: boolean;
  total?: number;
  data?: BinanceTradeHistoryItem[];
  error?: string;
};

export type BinanceApiImportOptions = {
  apiKey: string;
  apiSecret: string;
  startDate: string;
  endDate: string;
  proxyUrl?: string;
  onProgress?: (message: string) => void;
};

export type BinanceApiImportResult = {
  rows: RawTradeData[];
  requests: number;
  windows: number;
};

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_ROWS_PER_PAGE = 100;
const DEFAULT_PUBLIC_PROXY_BASE =
  'https://binance-c2c-proxy.subhi-p2p-proxy.workers.dev';

const isLocalRuntime = (): boolean => {
  if (typeof window === 'undefined') return true;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1';
};

const formatInputDate = (value: Date): string => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatTradeTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const resolveProxyEndpoint = (proxyUrl?: string): string => {
  const trimmed = (proxyUrl || '').trim();

  if (!trimmed) {
    return isLocalRuntime()
      ? '/api/binance/c2c-history'
      : `${DEFAULT_PUBLIC_PROXY_BASE}/api/binance/c2c-history`;
  }

  if (trimmed.endsWith('/api/binance/c2c-history')) {
    return trimmed;
  }

  return `${trimmed.replace(/\/+$/, '')}/api/binance/c2c-history`;
};

const getDateRange = (startDate: string, endDate: string) => {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T23:59:59.999`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error('Please provide a valid start and end date.');
  }

  if (start.getTime() > end.getTime()) {
    throw new Error('Start date must be before end date.');
  }

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setHours(0, 0, 0, 0);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  if (start < sixMonthsAgo) {
    throw new Error(
      `Binance C2C API only returns the last 6 months. Earliest allowed date is ${formatInputDate(sixMonthsAgo)}.`
    );
  }

  return {
    startMs: start.getTime(),
    endMs: Math.min(end.getTime(), Date.now()),
  };
};

const splitIntoWindows = (startMs: number, endMs: number) => {
  const windows: Array<{ startTimestamp: number; endTimestamp: number }> = [];
  let cursor = startMs;

  while (cursor <= endMs) {
    const windowEnd = Math.min(cursor + THIRTY_DAYS_MS - 1, endMs);
    windows.push({
      startTimestamp: cursor,
      endTimestamp: windowEnd,
    });
    cursor = windowEnd + 1;
  }

  return windows;
};

const mapBinanceTrade = (
  trade: BinanceTradeHistoryItem,
  sourceFile: string
): RawTradeData => {
  const commission = trade.commission || '0';
  const isMaker = trade.advertisementRole === 'MAKER';

  return {
    'Order Number': trade.orderNumber,
    'Order Type': trade.tradeType,
    'Asset Type': trade.asset.toUpperCase(),
    'Fiat Type': trade.fiat.toUpperCase(),
    'Total Price': trade.totalPrice,
    'Price': trade.unitPrice,
    'Quantity': trade.amount,
    'Exchange rate': '',
    'Counterparty': trade.counterPartNickName || 'Binance API',
    'Created Time': formatTradeTimestamp(trade.createTime),
    'Status': trade.orderStatus,
    'Maker Fee': isMaker ? commission : '0',
    'Taker Fee': isMaker ? '0' : commission,
    sourceFile,
  };
};

const requestWindowPage = async (
  endpoint: string,
  apiKey: string,
  apiSecret: string,
  params: Record<string, string | number>
): Promise<BinanceTradeHistoryResponse> => {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      apiKey,
      apiSecret,
      params,
    }),
  });

  const rawText = await response.text();
  let payload: BinanceTradeHistoryResponse;

  if (response.status === 405) {
    throw new Error(
      'Proxy endpoint rejected POST (405). Make sure your proxy route accepts POST on /api/binance/c2c-history.'
    );
  }

  try {
    payload = JSON.parse(rawText) as BinanceTradeHistoryResponse;
  } catch {
    throw new Error('Proxy endpoint not found or returned a non-JSON response.');
  }

  if (!response.ok) {
    const errorMessage = payload.msg || payload.message || payload.error || 'Binance API request failed.';
    throw new Error(errorMessage);
  }

  if (payload.success === false || (payload.code && payload.code !== '000000')) {
    const errorMessage = payload.msg || payload.message || payload.error || 'Binance API returned an unsuccessful response.';
    throw new Error(errorMessage);
  }

  return payload;
};

export const importBinanceC2CTrades = async ({
  apiKey,
  apiSecret,
  startDate,
  endDate,
  proxyUrl,
  onProgress,
}: BinanceApiImportOptions): Promise<BinanceApiImportResult> => {
  const endpoint = resolveProxyEndpoint(proxyUrl);
  const { startMs, endMs } = getDateRange(startDate, endDate);
  const windows = splitIntoWindows(startMs, endMs);
  const sourceFile = `Binance API ${startDate} to ${endDate}`;
  const allRows: RawTradeData[] = [];
  let requests = 0;

  for (const tradeType of ['BUY', 'SELL'] as BinanceTradeType[]) {
    for (const [windowIndex, window] of windows.entries()) {
      let page = 1;

      while (true) {
        onProgress?.(
          `Syncing ${tradeType} window ${windowIndex + 1}/${windows.length}, page ${page}...`
        );

        const payload = await requestWindowPage(endpoint, apiKey, apiSecret, {
          tradeType,
          startTimestamp: window.startTimestamp,
          endTimestamp: window.endTimestamp,
          page,
          rows: MAX_ROWS_PER_PAGE,
          recvWindow: 10_000,
        });

        requests += 1;
        const pageRows = payload.data || [];
        const completedRows = pageRows.filter((trade) => trade.orderStatus === 'COMPLETED');
        allRows.push(...completedRows.map((trade) => mapBinanceTrade(trade, sourceFile)));

        const fetchedCount = page * MAX_ROWS_PER_PAGE;
        const total = payload.total || 0;
        if (pageRows.length < MAX_ROWS_PER_PAGE || (total > 0 && fetchedCount >= total)) {
          break;
        }

        page += 1;
      }
    }
  }

  if (allRows.length === 0) {
    throw new Error('No completed C2C records were returned for the selected range.');
  }

  return {
    rows: allRows,
    requests,
    windows: windows.length,
  };
};
