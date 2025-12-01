import React, { useState, useMemo, useEffect, useRef } from 'react';
import { TradeHistory } from './components/TradeHistory/TradeHistory';
import { TradeAnalysis } from './components/TradeAnalysis/TradeAnalysis';
import { SettingsPage } from './components/SettingsPage';
import { CalculatorPage } from './components/CalculatorPage';
import { CryptoTicker } from './components/CryptoTicker';
import { OnboardingTour } from './components/OnboardingTour';
import { Sidebar } from './components/Sidebar';
import { TradeInputs, TradeResult, RawTradeData, AppLanguage, AppTheme, FIAT_CURRENCIES } from './types';
import { Calculator, History, LayoutDashboard, PieChart, Settings, Globe, Palette, Menu } from 'lucide-react';
import { parseCSV, calculateTradeLogic } from './utils/tradeLogic';
import { translations } from './utils/translations';

const App: React.FC = () => {
  // Navigation State (Replaced Router)
  const [currentView, setCurrentView] = useState('calculator');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // --- App Preferences ---
  const [lang, setLang] = useState<AppLanguage>(() => (localStorage.getItem('p2p_lang') as AppLanguage) || 'en');
  const [theme, setTheme] = useState<AppTheme>(() => (localStorage.getItem('p2p_theme') as AppTheme) || 'binance');

  // Dropdown States
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setIsThemeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Persist Preferences
  useEffect(() => {
    localStorage.setItem('p2p_lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('p2p_theme', theme);
    
    // Apply Theme CSS Variables
    const root = document.documentElement;
    const themes: Record<AppTheme, any> = {
      binance: {
        '--color-primary': '#F0B90B',
        '--color-primary-hover': '#D0A009',
        '--color-background': '#111827',
        '--color-card': '#1E2329',
        '--color-card-border': '#374151',
        '--color-text-main': '#FFFFFF',
        '--color-text-muted': '#9CA3AF',
        '--color-text-inverted': '#000000'
      },
      darkBlue: {
        '--color-primary': '#3B82F6',
        '--color-primary-hover': '#2563EB',
        '--color-background': '#0F172A',
        '--color-card': '#1E293B',
        '--color-card-border': '#334155',
        '--color-text-main': '#F8FAFC',
        '--color-text-muted': '#94A3B8',
        '--color-text-inverted': '#FFFFFF'
      },
      midnight: {
        '--color-primary': '#8B5CF6',
        '--color-primary-hover': '#7C3AED',
        '--color-background': '#09090B',
        '--color-card': '#18181B',
        '--color-card-border': '#27272A',
        '--color-text-main': '#FAFAFA',
        '--color-text-muted': '#A1A1AA',
        '--color-text-inverted': '#FFFFFF'
      },
      forest: {
        '--color-primary': '#10B981',
        '--color-primary-hover': '#059669',
        '--color-background': '#022C22',
        '--color-card': '#064E3B',
        '--color-card-border': '#065F46',
        '--color-text-main': '#ECFDF5',
        '--color-text-muted': '#6EE7B7',
        '--color-text-inverted': '#FFFFFF'
      },
      purple: {
        '--color-primary': '#D946EF',
        '--color-primary-hover': '#C026D3',
        '--color-background': '#2E1065',
        '--color-card': '#4C1D95',
        '--color-card-border': '#5B21B6',
        '--color-text-main': '#FAE8FF',
        '--color-text-muted': '#E879F9',
        '--color-text-inverted': '#FFFFFF'
      },
      sunset: {
        '--color-primary': '#F97316',
        '--color-primary-hover': '#EA580C',
        '--color-background': '#431407',
        '--color-card': '#7C2D12',
        '--color-card-border': '#9A3412',
        '--color-text-main': '#FFEDD5',
        '--color-text-muted': '#FDBA74',
        '--color-text-inverted': '#FFFFFF'
      },
      slate: {
        '--color-primary': '#94A3B8',
        '--color-primary-hover': '#64748B',
        '--color-background': '#0F172A',
        '--color-card': '#334155',
        '--color-card-border': '#475569',
        '--color-text-main': '#F1F5F9',
        '--color-text-muted': '#CBD5E1',
        '--color-text-inverted': '#0F172A'
      },
      neonCyber: {
        '--color-primary': '#00f2ea',
        '--color-primary-hover': '#00c2bb',
        '--color-background': '#0b0014',
        '--color-card': '#1f0b2e',
        '--color-card-border': '#ff00ff',
        '--color-text-main': '#ffffff',
        '--color-text-muted': '#d4b3e3',
        '--color-text-inverted': '#000000'
      },
      neonMatrix: {
        '--color-primary': '#00ff41',
        '--color-primary-hover': '#00cc33',
        '--color-background': '#000000',
        '--color-card': '#0d0d0d',
        '--color-card-border': '#003b00',
        '--color-text-main': '#e0fce0',
        '--color-text-muted': '#4d8a4d',
        '--color-text-inverted': '#000000'
      },
      neonFuture: {
        '--color-primary': '#ff0055',
        '--color-primary-hover': '#cc0044',
        '--color-background': '#050511',
        '--color-card': '#0f1229',
        '--color-card-border': '#3b82f6',
        '--color-text-main': '#ffffff',
        '--color-text-muted': '#8da4ef',
        '--color-text-inverted': '#ffffff'
      }
    };

    const selectedTheme = themes[theme];
    Object.entries(selectedTheme).forEach(([key, value]) => {
      root.style.setProperty(key, value as string);
    });

  }, [theme]);

  const t = translations[lang];

  // --- Calculator State ---
  const [buyPrice, setBuyPrice] = useState<string>('3.75');
  const [sellPrice, setSellPrice] = useState<string>('3.85');
  const [amount, setAmount] = useState<string>('1000');
  const [feePercentage, setFeePercentage] = useState<string>('0.1');
  const [currencySymbol, setCurrencySymbol] = useState<string>('USD');

  // --- Trade History State ---
  const [rawData, setRawData] = useState<RawTradeData[]>([]);
  
  // Initialize with localStorage values if available
  const [asset, setAsset] = useState(() => localStorage.getItem('p2p_asset') || 'USDT');
  const [fiat, setFiat] = useState(() => localStorage.getItem('p2p_fiat') || 'TRY');
  const [marketPrice, setMarketPrice] = useState(() => localStorage.getItem('p2p_market_price') || '');
  
  // Date Filters
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  // Load Trade Data
  useEffect(() => {
    const saved = localStorage.getItem('p2p_trade_data');
    if (saved) {
      try {
        setRawData(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading data", e);
      }
    }
  }, []);

  // Save Trade Data
  useEffect(() => {
    if (rawData.length > 0) {
      localStorage.setItem('p2p_trade_data', JSON.stringify(rawData));
    } else {
      localStorage.setItem('p2p_trade_data', JSON.stringify([]));
    }
  }, [rawData]);

  // Save Filter Preferences
  useEffect(() => {
    localStorage.setItem('p2p_asset', asset);
  }, [asset]);

  useEffect(() => {
    localStorage.setItem('p2p_fiat', fiat);
  }, [fiat]);

  useEffect(() => {
    localStorage.setItem('p2p_market_price', marketPrice);
  }, [marketPrice]);

  // --- Calculator Logic ---
  const inputs: TradeInputs = useMemo(() => ({
    buyPrice: parseFloat(buyPrice) || 0,
    sellPrice: parseFloat(sellPrice) || 0,
    amount: parseFloat(amount) || 0,
    feePercentage: parseFloat(feePercentage) || 0,
    currencySymbol
  }), [buyPrice, sellPrice, amount, feePercentage, currencySymbol]);

  const results: TradeResult = useMemo(() => {
    const totalCost = inputs.buyPrice * inputs.amount;
    const totalRevenue = inputs.sellPrice * inputs.amount;
    
    // Fee calculation logic
    const feeDecimal = inputs.feePercentage / 100;
    const totalFees = (totalCost * feeDecimal) + (totalRevenue * feeDecimal);
    
    const netProfit = totalRevenue - totalCost - totalFees;
    const marginPercentage = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;

    return {
      totalCost,
      totalRevenue,
      totalFees,
      netProfit,
      marginPercentage
    };
  }, [inputs]);

  const handleReset = () => {
    if (window.confirm("Are you sure you want to clear calculator inputs?")) {
      setBuyPrice('');
      setSellPrice('');
      setAmount('');
      setFeePercentage('0.1');
    }
  };

  // --- Data Management (Global) ---
  const handleClearAllData = () => {
    if (window.confirm("⚠️ WARNING: Are you sure you want to delete ALL trade records? This cannot be undone.")) {
      setRawData([]);
      localStorage.removeItem('p2p_trade_data');
    }
  };

  const handleExportData = () => {
    if (rawData.length === 0) {
      alert("No data to export.");
      return;
    }
    const csvContent = "data:text/csv;charset=utf-8," 
      + rawData.map(e => Object.values(e).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "p2p_trades_backup.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Trade Processing Logic (Shared) ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputElement = e.target;
    const files = inputElement.files;
    
    if (!files || files.length === 0) return;

    const currentFiles = Array.from(files);
    inputElement.value = '';

    let allData: RawTradeData[] = [...rawData];
    let processed = 0;

    currentFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        const parsed = parseCSV(text);
        allData = [...allData, ...parsed];
        processed++;
        if (processed === currentFiles.length) {
          setRawData(allData);
        }
      };
      reader.readAsText(file);
    });
  };

  // Calculate Trades for History and Analysis
  const { trades, summary } = useMemo(() => {
    return calculateTradeLogic(rawData, asset, fiat, marketPrice, fromDate, toDate);
  }, [rawData, asset, fiat, marketPrice, fromDate, toDate]);

  const spread = inputs.sellPrice - inputs.buyPrice;

  const langOptions: { id: AppLanguage; label: string; flag: string }[] = [
    { id: 'ar', label: 'العربية', flag: '🇸🇦' },
    { id: 'en', label: 'English', flag: '🇺🇸' },
    { id: 'fr', label: 'Français', flag: '🇫🇷' },
    { id: 'es', label: 'Español', flag: '🇪🇸' },
    { id: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { id: 'ru', label: 'Русский', flag: '🇷🇺' },
    { id: 'tr', label: 'Türkçe', flag: '🇹🇷' },
    { id: 'zh', label: '中文', flag: '🇨🇳' },
  ];

  const themeOptions: { id: AppTheme; color: string }[] = [
    { id: 'binance', color: '#F0B90B' },
    { id: 'darkBlue', color: '#3B82F6' },
    { id: 'midnight', color: '#8B5CF6' },
    { id: 'forest', color: '#10B981' },
    { id: 'purple', color: '#D946EF' },
    { id: 'sunset', color: '#F97316' },
    { id: 'slate', color: '#94A3B8' },
    { id: 'neonCyber', color: '#00f2ea' },
    { id: 'neonMatrix', color: '#00ff41' },
    { id: 'neonFuture', color: '#ff0055' }
  ];

  // Helper helpers for navigation styles
  const getNavClass = (view: string) => `flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
    currentView === view 
      ? 'bg-primary text-text-inverted shadow-sm' 
      : 'text-text-muted hover:text-text-main'
  }`;

  const getMobileNavClass = (view: string) => `p-2 rounded-lg ${currentView === view ? 'text-primary bg-primary/10' : 'text-text-muted'}`;

  return (
    <div className="min-h-screen bg-background text-text-main font-sans selection:bg-primary selection:text-text-inverted pb-20">
      
      {/* Sidebar Navigation */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        t={t.nav} 
        lang={lang} 
        currentView={currentView}
        onNavigate={setCurrentView}
      />

      {/* Onboarding Tour */}
      <OnboardingTour t={t.tour} />

      {/* Navbar */}
      <nav className="border-b border-card-border bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-lg text-text-muted hover:bg-card-border/50 hover:text-text-main transition-colors"
            >
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-2">
              <div className="text-primary">
                <Calculator size={32} />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-text-main hidden sm:block">
                P2P <span className="text-primary">Pro</span> Calc
              </h1>
            </div>
          </div>

          {/* Tab Navigation (Desktop) */}
          <div className="hidden md:flex bg-background p-1 rounded-lg border border-card-border">
            <button
              onClick={() => setCurrentView('calculator')}
              id="nav-calculator"
              className={getNavClass('calculator')}
            >
              <LayoutDashboard size={16} />
              <span>{t.nav.calculator}</span>
            </button>
            <button
              onClick={() => setCurrentView('history')}
              id="nav-history"
              className={getNavClass('history')}
            >
              <History size={16} />
              <span>{t.nav.history}</span>
            </button>
            <button
              onClick={() => setCurrentView('analysis')}
              id="nav-analysis"
              className={getNavClass('analysis')}
            >
              <PieChart size={16} />
              <span>{t.nav.analysis}</span>
            </button>
            <button
              onClick={() => setCurrentView('settings')}
              id="nav-settings"
              className={getNavClass('settings')}
            >
              <Settings size={16} />
              <span>{t.nav.settings}</span>
            </button>
          </div>

          {/* Right Side Controls */}
          <div className="flex items-center gap-3">
             
             {/* Currency Selector */}
             <select 
              value={currencySymbol}
              onChange={(e) => setCurrencySymbol(e.target.value)}
              className="bg-card text-sm font-bold border border-card-border rounded-md px-3 py-1 outline-none focus:border-primary cursor-pointer hidden sm:block text-text-main"
             >
                {FIAT_CURRENCIES.map((curr) => (
                  <option key={curr} value={curr}>{curr}</option>
                ))}
             </select>

             {/* Language Circular Button */}
             <div className="relative" ref={langMenuRef}>
               <button 
                 onClick={() => setIsLangOpen(!isLangOpen)}
                 className="w-10 h-10 rounded-full bg-background border border-card-border flex items-center justify-center text-text-muted hover:text-primary hover:border-primary transition-all"
               >
                 <Globe size={20} />
               </button>
               {isLangOpen && (
                 <div className="absolute top-12 right-0 w-48 bg-card border border-card-border rounded-xl shadow-xl p-2 z-50 grid grid-cols-1 gap-1 max-h-60 overflow-y-auto">
                   {langOptions.map((l) => (
                     <button
                       key={l.id}
                       onClick={() => { setLang(l.id); setIsLangOpen(false); }}
                       className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${lang === l.id ? 'bg-primary/20 text-primary' : 'text-text-main hover:bg-background'}`}
                     >
                       <span>{l.flag}</span>
                       <span>{l.label}</span>
                     </button>
                   ))}
                 </div>
               )}
             </div>

             {/* Theme Circular Button */}
             <div className="relative" ref={themeMenuRef}>
               <button 
                 onClick={() => setIsThemeOpen(!isThemeOpen)}
                 className="w-10 h-10 rounded-full bg-background border border-card-border flex items-center justify-center text-text-muted hover:text-primary hover:border-primary transition-all"
               >
                 <Palette size={20} />
               </button>
               {isThemeOpen && (
                 <div className="absolute top-12 right-0 w-64 bg-card border border-card-border rounded-xl shadow-xl p-3 z-50">
                   <div className="grid grid-cols-5 gap-2">
                     {themeOptions.map((t) => (
                       <button
                         key={t.id}
                         onClick={() => { setTheme(t.id); setIsThemeOpen(false); }}
                         className={`w-10 h-10 rounded-full border-2 transition-all hover:scale-110 ${theme === t.id ? 'border-white ring-2 ring-primary' : 'border-transparent'}`}
                         style={{ backgroundColor: t.color }}
                         title={t.id}
                       />
                     ))}
                   </div>
                 </div>
               )}
             </div>

          </div>
        </div>
        
        {/* Mobile Tabs */}
        <div className="md:hidden flex justify-around p-2 border-t border-card-border overflow-x-auto">
            <button onClick={() => setCurrentView('calculator')} className={getMobileNavClass('calculator')}><LayoutDashboard size={20} /></button>
            <button onClick={() => setCurrentView('history')} className={getMobileNavClass('history')}><History size={20} /></button>
            <button onClick={() => setCurrentView('analysis')} className={getMobileNavClass('analysis')}><PieChart size={20} /></button>
            <button onClick={() => setCurrentView('settings')} className={getMobileNavClass('settings')}><Settings size={20} /></button>
        </div>
      </nav>

      {/* Crypto Ticker */}
      <CryptoTicker />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'calculator' && (
          <CalculatorPage 
            buyPrice={buyPrice} setBuyPrice={setBuyPrice}
            sellPrice={sellPrice} setSellPrice={setSellPrice}
            amount={amount} setAmount={setAmount}
            feePercentage={feePercentage} setFeePercentage={setFeePercentage}
            currencySymbol={currencySymbol}
            spread={spread}
            onReset={handleReset}
            t={t.calculator}
            summaryT={t.calculatorSummary}
            summary={summary}
            asset={asset}
            fiat={fiat}
            results={results}
            inputs={inputs}
          />
        )}
        
        {currentView === 'history' && (
          <TradeHistory 
            rawData={rawData}
            setRawData={setRawData}
            trades={trades}
            summary={summary}
            asset={asset} setAsset={setAsset}
            fiat={fiat} setFiat={setFiat}
            marketPrice={marketPrice} setMarketPrice={setMarketPrice}
            fromDate={fromDate} setFromDate={setFromDate}
            toDate={toDate} setToDate={setToDate}
            onFileUpload={handleFileUpload}
            onClearData={handleClearAllData}
            onExportData={handleExportData}
            t={t.history}
            guideT={t.csvGuide}
          />
        )}

        {currentView === 'analysis' && (
          <TradeAnalysis 
            trades={trades} 
            originalData={rawData} 
            summary={summary} 
            t={t.analysis}
            asset={asset}
            fiat={fiat}
          />
        )}

        {currentView === 'settings' && (
          <SettingsPage 
            onClearData={handleClearAllData} 
            onExportData={handleExportData}
            currentTheme={theme}
            setTheme={setTheme}
            currentLang={lang}
            setLang={setLang}
            t={t.settings}
          />
        )}
      </main>
    </div>
  );
};

export default App;