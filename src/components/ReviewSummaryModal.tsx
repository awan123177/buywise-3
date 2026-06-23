import React from 'react';
import { motion } from 'motion/react';
import { X, CheckCircle2, AlertTriangle, Lightbulb } from 'lucide-react';

interface ReviewSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: any;
  productTitle: string;
}

export default function ReviewSummaryModal({ isOpen, onClose, summary, productTitle }: ReviewSummaryModalProps) {
  if (!isOpen || !summary) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#111] border border-white/10 rounded-xl max-w-lg w-full overflow-hidden shadow-2xl relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white"
        >
          <X size={20} />
        </button>

        <div className="p-6 border-b border-white/5">
          <h2 className="text-xl font-black uppercase tracking-widest text-[#f5f5f5] mb-1">
            AI Review Summary
          </h2>
          <p className="text-[10px] text-white/50 tracking-[0.2em] uppercase truncate pr-8">
            {productTitle}
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <h3 className="text-xs font-black tracking-widest uppercase text-green-500 flex items-center gap-2">
              <CheckCircle2 size={14} /> Strengths (Pros)
            </h3>
            <ul className="space-y-2">
              {summary.pros?.map((pro: string, idx: number) => (
                <li key={idx} className="text-sm text-white/80 bg-white/5 p-2 rounded border border-white/5 flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span> {pro}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-black tracking-widest uppercase text-red-500 flex items-center gap-2">
              <AlertTriangle size={14} /> Weaknesses (Cons)
            </h3>
            <ul className="space-y-2">
              {summary.cons?.map((con: string, idx: number) => (
                <li key={idx} className="text-sm text-white/80 bg-white/5 p-2 rounded border border-white/5 flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span> {con}
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 bg-[#FF3B30]/10 border border-[#FF3B30]/20 rounded-lg">
            <h3 className="text-[10px] font-black tracking-widest uppercase text-[#FF3B30] mb-2 flex items-center gap-2">
              <Lightbulb size={12} /> AI Final Verdict
            </h3>
            <p className="text-sm text-white leading-relaxed">
              {summary.verdict}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
