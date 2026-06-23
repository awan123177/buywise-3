import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingDown, TrendingUp } from 'lucide-react';

interface PriceHistoryChartProps {
  currentPrice: number;
}

export default function PriceHistoryChart({ currentPrice }: PriceHistoryChartProps) {
  // Generate mock historical data based on current price for visual demonstration
  const data = useMemo(() => {
    const dataPoints = [];
    let price = currentPrice * 1.2; // Start 20% higher 6 months ago
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    
    for (let i = 0; i < 6; i++) {
      if (i === 5) {
        price = currentPrice; // Current month
      } else {
        // Random fluctuation between -5% and +5%
        price = price * (1 + (Math.random() * 0.1 - 0.05));
      }
      
      dataPoints.push({
        name: months[i],
        price: Math.round(price)
      });
    }
    
    return dataPoints;
  }, [currentPrice]);

  const startPrice = data[0].price;
  const isDown = currentPrice < startPrice;
  const diffPercent = Math.abs(((currentPrice - startPrice) / startPrice) * 100).toFixed(1);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-[10px] uppercase tracking-widest text-white/50 font-black mb-1">6-Month Trend</h4>
          <div className="flex items-center gap-2">
            <span className={`flex items-center gap-1 text-xs font-black ${isDown ? 'text-green-500' : 'text-[#FF3B30]'}`}>
              {isDown ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
              {diffPercent}%
            </span>
          </div>
        </div>
      </div>
      
      <div className="h-32 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isDown ? '#22c55e' : '#FF3B30'} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={isDown ? '#22c55e' : '#FF3B30'} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Tooltip 
              contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
              itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
              labelStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
              formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Price']}
            />
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke={isDown ? '#22c55e' : '#FF3B30'} 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorPrice)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
