

import React, { useState, useMemo } from 'react';
import { ProcessedTrade, RawTradeData, Translation, TradeSummary } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Clock, TrendingUp, Users, Award, Timer, PieChart as PieChartIcon, Activity, DollarSign, ShoppingCart, Wallet } from 'lucide-react';
import { GoalTracker } from './GoalTracker';

interface TradeAnalysisProps {
  trades: ProcessedTrade[];
  originalData: RawTradeData[];
  summary: TradeSummary;
  t: Translation['analysis'];
  asset: string;
  fiat: string;
}

type TimeFilter = 'all' | 'today' | 'week' | 'month' | 'year';

export const TradeAnalysis: React.FC<TradeAnalysisProps> = ({ trades, originalData, summary, t, asset, fiat }) => {
  const [period, setPeriod] = useState<TimeFilter>('all');

  // --- Calculate Current Month Profit for Goal Tracker (Independent of Filter) ---
  const currentMonthProfit = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return trades.reduce((acc, t) => {
        if (t.type === 'sell' && t.originalDate.getMonth() === currentMonth && t.originalDate.getFullYear() === currentYear) {
            return acc + (parseFloat(t.profit) || 0);
        }
        return acc;
    }, 0);
  }, [trades]);

  // --- Filter Data based on Period ---
  const filteredTrades = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

    return trades.filter(t => {
      const tDate = t.originalDate;
      if (period === 'today') return tDate >= todayStart;
      if (period === 'week') return tDate >= weekAgo;
      if (period === 'month') return tDate >= monthAgo;
      if (period === 'year') return tDate >= yearAgo;
      return true;
    });
  }, [trades, period]);

  // --- Period Specific Summary Calculations ---
  const periodSummary = useMemo(() => {
    let totalProfit = 0;
    let totalBuyCost = 0;
    let totalSellRevenue = 0;
    let totalFees = 0;
    let buyCount = 0;
    let sellCount = 0;

    filteredTrades.forEach(t => {
      totalFees += t.fee || 0;

      if (t.type === 'buy') {
        buyCount++;
        totalBuyCost += t.total || 0;
      } else if (t.type === 'sell') {
        sellCount++;
        totalSellRevenue += t.total || 0;
        const p = parseFloat(t.profit);
        if (!isNaN(p)) {
            totalProfit += p;
        }
      }
    });

    return {
        totalProfit: totalProfit.toFixed(2),
        totalBuys: totalBuyCost.toFixed(2),
        totalSells: totalSellRevenue.toFixed(2),
        totalFees: totalFees.toFixed(2),
        netProfit: totalProfit.toFixed(2),
        buyCount,
        sellCount
    };
  }, [filteredTrades]);


  // --- Chart Data Prep ---
  const { chartData, pieData, totalProfitInPeriod } = useMemo(() => {
    const daily: Record<string, number> = {};
    
    filteredTrades.forEach(t => {
      if (t.type === 'sell') {
        const p = parseFloat(t.profit) || 0;
        const dateKey = t.time.split(' ')[0];
        daily[dateKey] = (daily[dateKey] || 0) + p;
      }
    });

    const cData = Object.keys(daily).sort().map(d => ({ date: d, profit: parseFloat(daily[d].toFixed(2)) }));
    const pData = [
      { name: 'Buy', value: periodSummary.buyCount, color: '#3b82f6' },
      { name: 'Sell', value: periodSummary.sellCount, color: '#ef4444' },
    ];

    return { chartData: cData, pieData: pData, totalProfitInPeriod: periodSummary.totalProfit };
  }, [filteredTrades, periodSummary]);

  // --- Advanced Stats ---
  const stats = useMemo(() => {
    let maxBuy = 0;
    let maxSell = 0;
    let totalHoldTime = 0;
    let sellTradesWithHoldTime = 0;
    const counterpartyCount: Record<string, number> = {};

    filteredTrades.forEach(t => {
      const price = parseFloat(t.price);
      if (t.type === 'buy') {
        if (price > maxBuy) maxBuy = price;
      } else {
        if (price > maxSell) maxSell = price;
        if (t.holdTimeSeconds) {
          totalHoldTime += t.holdTimeSeconds;
          sellTradesWithHoldTime++;
        }
      }

      if (t.counterparty && t.counterparty !== 'Manual') {
        counterpartyCount[t.counterparty] = (counterpartyCount[t.counterparty] || 0) + 1;
      }
    });

    const topCounterparty = Object.entries(counterpartyCount).sort((a, b) => b[1] - a[1])[0];
    
    let avgHoldText = "—";
    if (sellTradesWithHoldTime > 0) {
      const avgSeconds = totalHoldTime / sellTradesWithHoldTime;
      const avgDays = avgSeconds / (24 * 3600);
      avgHoldText = avgDays < 1 
        ? `${(avgSeconds / 3600).toFixed(1)} Hr` 
        : `${avgDays.toFixed(1)} Days`;
    }

    return {
      maxBuy,
      maxSell,
      topCp: topCounterparty ? `${topCounterparty[0]} (${topCounterparty[1]})` : "—",
      avgHold: avgHoldText
    };
  }, [filteredTrades]);

  // --- Peak Times Logic ---
  const peakTimes = useMemo(() => {
    const buyHours: Record<number, number> = {};
    const sellHours: Record<number, number> = {};

    filteredTrades.forEach(t => {
      const hour = t.originalDate.getHours();
      if (t.type === 'buy') buyHours[hour] = (buyHours[hour] || 0) + 1;
      else sellHours[hour] = (sellHours[hour] || 0) + 1;
    });

    const getTop3 = (record: Record<number, number>) => {
        return Object.entries(record)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([h, count]) => `${h}:00 (${count})`)
            .join(' | ');
    };

    return {
        buy: getTop3(buyHours) || "N/A",
        sell: getTop3(sellHours) || "N/A"
    };
  }, [filteredTrades]);

  const timeFilters = ['all', 'year', 'month', 'week', 'today'] as const;

  // --- Detailed Summary Data ---
  // Asset = Crypto (e.g. USDT), Fiat = Local Currency (e.g. TRY, SAR)
  const detailCards = [
    { label: t.detailedSummary.totalProfit, value: `${periodSummary.totalProfit} ${fiat}`, color: 'text-green-400' },
    { label: t.detailedSummary.totalBuys, value: `${periodSummary.totalBuys} ${fiat}`, color: 'text-blue-400' },
    { label: t.detailedSummary.totalSells, value: `${periodSummary.totalSells} ${fiat}`, color: 'text-red-400' },
    { label: t.detailedSummary.totalFees, value: `${periodSummary.totalFees} ${asset}`, color: 'text-orange-400' }, // Fees often in Asset in P2P
    { label: t.detailedSummary.netProfit, value: `${periodSummary.netProfit} ${fiat}`, color: 'text-green-500' },
    { label: t.detailedSummary.buyCount, value: periodSummary.buyCount, color: 'text-text-main' },
    { label: t.detailedSummary.sellCount, value: periodSummary.sellCount, color: 'text-text-main' },
    // Global Inventory Stats
    { label: t.detailedSummary.remainingQty, value: `${summary.remainingQty} ${asset}`, color: 'text-blue-300' },
    { label: t.detailedSummary.remainingCost, value: `${summary.remainingCost} ${fiat}`, color: 'text-gray-300' },
    { label: t.detailedSummary.marketValue, value: `${summary.marketValue} ${fiat}`, color: 'text-yellow-400' },
    { label: t.detailedSummary.unrealized, value: `${summary.unrealizedProfit} ${fiat}`, color: 'text-purple-400', isUnrealized: true },
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      
      {/* 1. Header & Time Filters */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-card p-6 rounded-2xl border border-card-border shadow-lg">
        <div>
            <h2 className="text-2xl font-bold text-text-main mb-2 flex items-center gap-2">
                <TrendingUp className="text-primary" />
                {t.title}
            </h2>
            <p className="text-text-muted text-sm">{t.totalProfit}: <span className={`font-mono font-bold text-lg ${parseFloat(totalProfitInPeriod) >= 0 ? 'text-green-400' : 'text-red-400'}`}>{totalProfitInPeriod} {fiat}</span></p>
        </div>
        
        <div className="flex bg-background p-1 rounded-lg mt-4 md:mt-0 border border-card-border">
            {timeFilters.map((p) => (
                <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        period === p 
                        ? 'bg-primary text-text-inverted shadow' 
                        : 'text-text-muted hover:text-text-main'
                    }`}
                >
                    {t.periods[p]}
                </button>
            ))}
        </div>
      </div>

      {/* 2. Goal Tracker & Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
            <GoalTracker 
                currentProfit={currentMonthProfit} 
                currencySymbol={fiat} 
                t={t.goalTracker} 
            />
        </div>
        <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
             {/* Quick Stats Summary based on period */}
             <div className="bg-card p-4 rounded-xl border border-card-border flex flex-col justify-center items-center text-center">
                <span className="text-text-muted text-xs uppercase font-bold mb-1">{t.detailedSummary.netProfit}</span>
                <span className="text-xl font-bold text-green-400 font-mono">{periodSummary.netProfit}</span>
             </div>
             <div className="bg-card p-4 rounded-xl border border-card-border flex flex-col justify-center items-center text-center">
                <span className="text-text-muted text-xs uppercase font-bold mb-1">{t.detailedSummary.totalFees}</span>
                <span className="text-xl font-bold text-orange-400 font-mono">{periodSummary.totalFees}</span>
             </div>
             <div className="bg-card p-4 rounded-xl border border-card-border flex flex-col justify-center items-center text-center">
                <span className="text-text-muted text-xs uppercase font-bold mb-1">{t.detailedSummary.buyCount}</span>
                <span className="text-xl font-bold text-blue-400 font-mono">{periodSummary.buyCount}</span>
             </div>
             <div className="bg-card p-4 rounded-xl border border-card-border flex flex-col justify-center items-center text-center">
                <span className="text-text-muted text-xs uppercase font-bold mb-1">{t.detailedSummary.sellCount}</span>
                <span className="text-xl font-bold text-red-400 font-mono">{periodSummary.sellCount}</span>
             </div>
        </div>
      </div>

      {/* 3. Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card p-6 rounded-2xl border border-card-border shadow-lg h-96">
            <h3 className="text-text-main font-bold mb-6 flex items-center gap-2">
                <TrendingUp size={18} className="text-green-400"/>
                {t.charts.dailyProfit}
            </h3>
            <ResponsiveContainer width="100%" height="85%">
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-card-border)" vertical={false} />
                    <XAxis dataKey="date" stroke="var(--color-text-muted)" tick={{ fontSize: 10 }} />
                    <YAxis stroke="var(--color-text-muted)" tick={{ fontSize: 10 }} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: 'var(--color-background)', borderColor: 'var(--color-card-border)', color: 'var(--color-text-main)' }} 
                        formatter={(value: number) => [`${value} ${fiat}`, t.totalProfit]}
                    />
                    <Bar dataKey="profit" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>

        <div className="bg-card p-6 rounded-2xl border border-card-border shadow-lg h-96">
            <h3 className="text-text-main font-bold mb-6 flex items-center gap-2">
                <PieChartIcon size={18} className="text-blue-400"/>
                {t.charts.buyVsSell}
            </h3>
            <ResponsiveContainer width="100%" height="85%">
                <PieChart>
                    <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'var(--color-background)', borderColor: 'var(--color-card-border)', color: 'var(--color-text-main)' }} />
                    <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Detailed Performance Summary Grid */}
      <h3 className="text-xl font-bold text-text-main mt-8 mb-4 px-2 border-r-4 border-primary mr-2">
        {t.title.includes("تحليل") ? "ملخص الأداء التفصيلي" : "Detailed Performance Summary"}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {detailCards.map((card, idx) => (
            <div key={idx} className="bg-card p-4 rounded-xl border border-card-border flex flex-col justify-between hover:border-primary/30 transition-colors">
                <span className="text-text-muted text-sm font-medium mb-2">{card.label}</span>
                <span className={`text-xl font-mono font-bold ${card.color} truncate`} title={String(card.value)}>
                    {card.value}
                </span>
                {card.isUnrealized && summary.lastSellPrice && (
                    <div className="mt-1 text-[10px] text-text-muted bg-background/20 rounded px-2 py-1 inline-block w-fit">
                        {t.detailedSummary.basedOnLast} {summary.lastSellPrice}
                    </div>
                )}
            </div>
        ))}
      </div>

      {/* 5. Advanced Stats Grid */}
      <h3 className="text-xl font-bold text-text-main mt-8 mb-4 px-2 border-r-4 border-primary mr-2">
         {t.title.includes("تحليل") ? "إحصائيات متقدمة" : "Advanced Stats"}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card p-5 rounded-xl border border-card-border">
            <div className="text-text-muted text-sm mb-1 flex items-center gap-2"><Award size={16}/> {t.stats.maxBuy}</div>
            <div className="text-2xl font-mono font-bold text-text-main">{stats.maxBuy.toFixed(2)} <span className="text-xs text-gray-500">{fiat}</span></div>
        </div>
        <div className="bg-card p-5 rounded-xl border border-card-border">
            <div className="text-text-muted text-sm mb-1 flex items-center gap-2"><Award size={16}/> {t.stats.maxSell}</div>
            <div className="text-2xl font-mono font-bold text-text-main">{stats.maxSell.toFixed(2)} <span className="text-xs text-gray-500">{fiat}</span></div>
        </div>
        <div className="bg-card p-5 rounded-xl border border-card-border">
            <div className="text-text-muted text-sm mb-1 flex items-center gap-2"><Users size={16}/> {t.stats.topCp}</div>
            <div className="text-xl font-bold text-primary truncate">{stats.topCp}</div>
        </div>
        <div className="bg-card p-5 rounded-xl border border-card-border">
            <div className="text-text-muted text-sm mb-1 flex items-center gap-2"><Timer size={16}/> {t.stats.avgHold}</div>
            <div className="text-2xl font-bold text-text-main">{stats.avgHold}</div>
        </div>
      </div>

      {/* 6. Peak Times */}
      <h3 className="text-xl font-bold text-text-main mt-8 mb-4 px-2 border-r-4 border-primary mr-2">
        {t.title.includes("تحليل") ? "أوقات الذروة (بالساعة)" : "Peak Times (Hourly)"}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-green-900/20 to-card p-6 rounded-2xl border border-green-900/30">
            <h4 className="text-green-400 font-bold mb-3 flex items-center gap-2"><Clock size={18}/> {t.peak.buy}</h4>
            <div className="text-lg font-mono text-text-main">{peakTimes.buy}</div>
        </div>
        <div className="bg-gradient-to-br from-red-900/20 to-card p-6 rounded-2xl border border-red-900/30">
            <h4 className="text-red-400 font-bold mb-3 flex items-center gap-2"><Clock size={18}/> {t.peak.sell}</h4>
            <div className="text-lg font-mono text-text-main">{peakTimes.sell}</div>
        </div>
      </div>
    </div>
  );
};
