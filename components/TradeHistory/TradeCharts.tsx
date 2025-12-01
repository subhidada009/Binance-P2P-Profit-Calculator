import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { ProcessedTrade } from '../../types';

interface TradeChartsProps {
  trades: ProcessedTrade[];
}

export const TradeCharts: React.FC<TradeChartsProps> = ({ trades }) => {
  // Prepare Daily Profit Data
  const dailyProfits: { [key: string]: number } = {};
  let buyCount = 0;
  let sellCount = 0;

  trades.forEach(t => {
    if (t.type === 'sell') {
      sellCount++;
      const date = t.time.split(' ')[0];
      const profit = parseFloat(t.profit) || 0;
      dailyProfits[date] = (dailyProfits[date] || 0) + profit;
    } else {
      buyCount++;
    }
  });

  const chartData = Object.keys(dailyProfits)
    .sort()
    .map(date => ({
      date,
      profit: parseFloat(dailyProfits[date].toFixed(2))
    }));

  const pieData = [
    { name: 'شراء', value: buyCount, color: '#3b82f6' },
    { name: 'بيع', value: sellCount, color: '#ef4444' },
  ];

  if (trades.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Daily Profit Chart */}
      <div className="bg-[#1E2329] p-6 rounded-xl border border-gray-800 shadow-lg h-80">
        <h3 className="text-white font-bold mb-4 border-b border-gray-700 pb-2">الربح اليومي</h3>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
            <XAxis dataKey="date" stroke="#9ca3af" tick={{ fontSize: 10 }} />
            <YAxis stroke="#9ca3af" tick={{ fontSize: 10 }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#fff' }}
            />
            <Bar dataKey="profit" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Buy vs Sell Chart */}
      <div className="bg-[#1E2329] p-6 rounded-xl border border-gray-800 shadow-lg h-80">
        <h3 className="text-white font-bold mb-4 border-b border-gray-700 pb-2">صفقات الشراء مقابل البيع</h3>
        <ResponsiveContainer width="100%" height="90%">
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
            <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#fff' }} />
            <Legend verticalAlign="bottom" height={36}/>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};