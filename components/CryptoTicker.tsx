
import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface PriceData {
  symbol: string;
  price: string;
  change: number; // Mock change for visual effect since public ticker endpoint is simpler
}

const SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 'ADAUSDT', 'DOGEUSDT'];

export const CryptoTicker: React.FC = () => {
  const [prices, setPrices] = useState<PriceData[]>([]);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        // Fetching from Binance public API
        const response = await fetch('https://api.binance.com/api/v3/ticker/price');
        const data = await response.json();
        
        const filtered = data
          .filter((item: any) => SYMBOLS.includes(item.symbol))
          .map((item: any) => ({
            symbol: item.symbol.replace('USDT', ''),
            price: parseFloat(item.price).toFixed(2),
            change: Math.random() * 2 - 1 // Random change for demo visual (Green/Red)
          }));
          
        setPrices(filtered);
      } catch (error) {
        console.error("Failed to fetch prices", error);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  if (prices.length === 0) return null;

  return (
    <div className="w-full bg-[#0b0e11] border-b border-gray-800 overflow-hidden py-2">
      <div className="flex animate-marquee whitespace-nowrap gap-8 items-center">
        {/* Duplicate the list to ensure smooth infinite scroll */}
        {[...prices, ...prices, ...prices].map((coin, idx) => (
          <div key={`${coin.symbol}-${idx}`} className="flex items-center gap-2 text-xs font-mono">
            <span className="font-bold text-gray-300">{coin.symbol}</span>
            <span className="text-white">${coin.price}</span>
            <span className={`flex items-center ${coin.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {coin.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              <span className="ml-1">{Math.abs(coin.change).toFixed(2)}%</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
