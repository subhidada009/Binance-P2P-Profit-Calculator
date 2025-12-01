

export interface TradeInputs {
  buyPrice: number;
  sellPrice: number;
  amount: number;
  feePercentage: number;
  currencySymbol: string;
}

export interface TradeResult {
  totalCost: number;
  totalRevenue: number;
  totalFees: number;
  netProfit: number;
  marginPercentage: number;
}

// Comprehensive Lists
export const BINANCE_P2P_CRYPTOS = [
  "USDT", "BUSD", "BTC", "ETH", "BNB", "USDC", "XRP", "ADA", "DOGE", "MATIC", "SOL", "DOT", "LTC", "AVAX", "SHIB", "TRX", "DAI", "UNI", "ATOM", "LINK", "XLM", "ETC", "BCH", "FIL", "HBAR", "NEAR", "ICP", "VET", "FTM", "EGLD", "GRT", "THETA", "AXS", "SAND", "MANA", "APE", "CHZ", "CRV", "FLOW", "XTZ", "KSM", "WAVES", "ZIL", "GMT", "1INCH", "LDO", "OP", "STG", "RDNT", "T", "JASMY", "HOOK", "PHB", "ACE", "ARKM", "OM", "ID", "WLD", "PEPE", "FLOKI", "ASTR", "GAS", "TWT", "AGIX", "APT", "QNT", "ICX", "ALGO", "SFP", "AR", "ROSE", "INJ", "STX", "HNT", "KAVA", "SUI", "TIA", "BNT", "FXS", "PENDLE", "WOO", "GALA", "RNDR", "NEO", "XEC", "LRC", "ENS", "BEL", "CKB", "DODO", "DUSK", "CVC", "OGN", "NMR", "RLC", "CTSI", "RAD", "BAL", "LIT", "IOST", "SKL", "ALICE", "ONE", "DENT", "IMX", "CELR", "COTI", "CHR", "ANKR", "IOTX", "RSR", "OCEAN", "DGB", "SNT", "BAND", "C98", "KNC", "LPT", "ZRX", "BICO", "GLM", "API3", "TRB", "BADGER", "FET", "NKN", "FUN", "STORJ", "BAT", "ARPA", "DASH", "ZEN", "XVG", "SC", "RVN", "KDA", "SYS", "CFX", "ONT", "WAXP", "KMD", "QTUM", "LSK", "ICN", "VTC", "BCD", "BTS", "XMR", "XEM", "ARDR", "REP", "STEEM", "STRAT", "GAME", "NXS", "EMC2", "VIA", "POT", "BURST", "BLK", "RADS", "XCP", "NMC", "FCT", "BTCD", "DOGE", "DGB", "VRC", "CURE", "XMG", "XWC", "NOTE", "NAUT", "HKG", "UNITY", "SWIFT", "SBD", "BTA", "CLAM", "XVC", "PINK", "MONA", "BCN", "RDD", "GRC", "NXT", "PPC"
];

export const FIAT_CURRENCIES = [
  "USD", "EUR", "GBP", "AED", "SAR", "QAR", "KWD", "OMR", "JOD", "EGP", "MAD", "TRY", "UAH", "RUB", "IDR", "INR", "NGN", "ZAR", "PHP", "THB", "CNY", "JPY", "KRW", "PKR", "BRL", "AUD", "CAD"
];

// --- New Types for Trade History ---

export interface RawTradeData {
  "Order Number": string;
  "Order Type": string;
  "Asset Type": string;
  "Fiat Type": string;
  "Price": string | number;
  "Quantity": string | number;
  "Counterparty"?: string;
  "Couterparty"?: string; // Handle typo in some CSVs
  "Created Time": string;
  "Status": string;
  "Maker Fee"?: string | number;
  "Taker Fee"?: string | number;
  manual?: boolean;
  sourceFile?: string;
}

export interface ProcessedTrade {
  id: number;
  time: string;
  order: string;
  price: string;
  profit: string;
  orderNo: string;
  counterparty: string;
  type: 'buy' | 'sell';
  manual: boolean;
  originalDate: Date;
  holdTimeSeconds?: number;
  qty: number;
  fee: number;
  total: number;
  sourceFile?: string;
}

export interface TradeSummary {
  totalProfit: string;
  totalBuys: string;
  totalSells: string;
  totalFees: string;
  netProfit: string;
  buyCount: number;
  sellCount: number;
  remainingQty: string;
  remainingCost: string;
  marketValue: string;
  unrealizedProfit: string;
  lastSellPrice?: string;
}

// --- Theme and Language Types ---

export type AppLanguage = 'ar' | 'en' | 'fr' | 'es' | 'de' | 'ru' | 'tr' | 'zh';

export type AppTheme = 'binance' | 'darkBlue' | 'midnight' | 'forest' | 'purple' | 'sunset' | 'slate' | 'neonCyber' | 'neonMatrix' | 'neonFuture';

export interface Translation {
  nav: {
    calculator: string;
    history: string;
    analysis: string;
    settings: string;
  };
  calculator: {
    title: string;
    adviceTitle: string;
    adviceText: string;
    buyPrice: string;
    sellPrice: string;
    amount: string;
    fee: string;
    spread: string;
    reset: string;
    analyze: string;
    analyzing: string;
    aiAdvisor: string;
    netProfit: string;
    margin: string;
    totalRevenue: string;
    totalFees: string;
    chartTitle: string;
  };
  calculatorSummary: {
    totalProfit: string;
    remainingQty: string;
    marketValue: string;
    unrealized: string;
    basedOnLast: string;
  };
  history: {
    title: string;
    upload: string;
    dragDrop: string;
    supports: string;
    activeFiles: string;
    manual: string;
    export: string;
    clear: string;
    assets: string;
    markets: string;
    howToCsv: string;
    tableHeaders: {
      id: string;
      date: string;
      type: string;
      price: string;
      profit: string;
      counterparty: string;
      action: string;
    };
    stats: {
      totalProfit: string;
      remainingQty: string;
      marketValue: string;
      unrealized: string;
      basedOnLast: string;
    };
  };
  analysis: {
    title: string;
    totalProfit: string;
    periods: {
      all: string;
      today: string;
      week: string;
      month: string;
      year: string;
    };
    charts: {
      dailyProfit: string;
      buyVsSell: string;
    };
    stats: {
      maxBuy: string;
      maxSell: string;
      topCp: string;
      avgHold: string;
    };
    peak: {
      buy: string;
      sell: string;
    };
    detailedSummary: {
      totalProfit: string;
      totalBuys: string;
      totalSells: string;
      totalFees: string;
      netProfit: string;
      buyCount: string;
      sellCount: string;
      remainingQty: string;
      remainingCost: string;
      marketValue: string;
      unrealized: string;
      basedOnLast: string;
    };
    goalTracker: {
      title: string;
      setGoal: string;
      editGoal: string;
      currentProgress: string;
      remaining: string;
      congratulations: string;
      keepGoing: string;
    };
  };
  settings: {
    title: string;
    subtitle: string;
    dataManagement: string;
    backup: string;
    backupDesc: string;
    dangerZone: string;
    clearAll: string;
    clearAllDesc: string;
    appearance: string;
    language: string;
    languageDesc: string;
    theme: string;
    themeDesc: string;
    export: string;
  };
  tour: {
    welcomeTitle: string;
    welcomeDesc: string;
    calcTitle: string;
    calcDesc: string;
    historyTitle: string;
    historyDesc: string;
    analysisTitle: string;
    analysisDesc: string;
    settingsTitle: string;
    settingsDesc: string;
    next: string;
    prev: string;
    finish: string;
    skip: string;
  };
  csvGuide: {
    title: string;
    step1: string;
    step2: string;
    step3: string;
    step4: string;
    note: string;
    gotIt: string;
  };
}