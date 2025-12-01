import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from 'recharts';
import { TradeResult, TradeInputs } from '../types';

interface ProfitChartsProps {
  results: TradeResult;
  inputs: TradeInputs;
  title?: string;
}

export const ProfitCharts: React.FC<ProfitChartsProps> = ({ results, inputs, title }) => {
  const data = [
    {
      name: 'التكلفة',
      value: results.totalCost,
      color: '#474D57' // Gray
    },
    {
      name: 'العائد',
      value: results.totalRevenue,
      color: '#3b82f6' // Blue
    },
    {
      name: 'الرسوم',
      value: results.totalFees,
      color: '#ef4444' // Red
    },
    {
      name: 'الربح',
      value: results.netProfit,
      color: results.netProfit >= 0 ? '#10b981' : '#ef4444' // Green or Red
    }
  ];

  return (
    <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl h-96 w-full">
      <h3 className="text-lg font-bold text-white mb-6 border-b border-gray-700 pb-2">{title || 'تحليل بياني للصفقة'}</h3>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
          <XAxis 
            dataKey="name" 
            stroke="#9ca3af" 
            tick={{ fill: '#9ca3af', fontSize: 12 }} 
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="#9ca3af" 
            tick={{ fill: '#9ca3af', fontSize: 12 }} 
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value.toLocaleString()}`}
          />
          <Tooltip
            cursor={{ fill: '#1f2937' }}
            contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px', color: '#fff' }}
            formatter={(value: number) => [`${value.toFixed(2)} ${inputs.currencySymbol}`, 'القيمة']}
          />
          <ReferenceLine y={0} stroke="#666" />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};