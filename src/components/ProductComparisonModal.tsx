import React from 'react';
import { motion } from 'motion/react';
import { X, Trophy, Minus } from 'lucide-react';

interface ProductComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  comparison: any;
  productA: any;
  productB: any;
}

export default function ProductComparisonModal({ isOpen, onClose, comparison, productA, productB }: ProductComparisonModalProps) {
  if (!isOpen || !comparison || !productA || !productB) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#111] border border-white/10 rounded-xl max-w-4xl w-full overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white z-10"
        >
          <X size={20} />
        </button>

        <div className="p-6 border-b border-white/5 flex-shrink-0">
          <h2 className="text-2xl font-black uppercase tracking-widest text-[#f5f5f5] mb-2 flex items-center gap-3">
            <Trophy className="text-yellow-500" /> AI Head-to-Head
          </h2>
          <div className="flex gap-4 items-center">
            <div className="flex-1 p-3 bg-white/5 rounded border border-white/5">
              <p className="text-xs text-white/50 tracking-widest uppercase">Product A</p>
              <p className="text-sm font-bold truncate">{productA.title}</p>
              <p className="text-[#FF3B30] font-mono text-xs mt-1">{productA.price}</p>
            </div>
            <div className="font-black text-white/30 text-xl tracking-widest">VS</div>
            <div className="flex-1 p-3 bg-white/5 rounded border border-white/5">
              <p className="text-xs text-white/50 tracking-widest uppercase">Product B</p>
              <p className="text-sm font-bold truncate">{productB.title}</p>
              <p className="text-[#FF3B30] font-mono text-xs mt-1">{productB.price}</p>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-grow space-y-6">
          
          <div className="p-4 bg-[#FF3B30]/10 border border-[#FF3B30]/20 rounded-lg text-center">
            <h3 className="text-[10px] font-black tracking-widest uppercase text-white/50 mb-1">AI Recommendation</h3>
            <p className="text-lg font-black tracking-tight text-white mb-2 uppercase">
              Winner: <span className={comparison.winner === 'A' ? 'text-green-500' : comparison.winner === 'B' ? 'text-blue-500' : 'text-yellow-500'}>
                {comparison.winner === 'A' ? 'Product A' : comparison.winner === 'B' ? 'Product B' : 'TIE'}
              </span>
            </p>
            <p className="text-sm text-white/80">{comparison.reason}</p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-black tracking-widest uppercase text-white/50">Detailed Breakdown</h3>
            
            <div className="border border-white/10 rounded-lg overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-white/5 text-white/50 text-[10px] uppercase tracking-widest">
                    <th className="p-4 border-b border-r border-white/5 w-1/4">Aspect</th>
                    <th className="p-4 border-b border-r border-white/5 w-3/8 text-green-500">Product A</th>
                    <th className="p-4 border-b border-white/5 w-3/8 text-blue-500">Product B</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.comparisonPoints?.map((point: any, idx: number) => (
                    <tr key={idx} className="border-b border-white/5 last:border-b-0">
                      <td className="p-4 font-bold border-r border-white/5 text-white/70">{point.aspect}</td>
                      <td className="p-4 border-r border-white/5 text-white/90">{point.a}</td>
                      <td className="p-4 text-white/90">{point.b}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
        </div>
      </motion.div>
    </div>
  );
}
