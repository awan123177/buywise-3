import React from 'react';
import { motion } from 'motion/react';
import { Train, Clock, ArrowRight, Ticket } from 'lucide-react';

interface TrainCardProps {
  trainData: any;
}

export default function TrainCard({ trainData }: TrainCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="group relative bg-[#111] border border-white/5 p-6 rounded-xl overflow-hidden hover:border-[#10b981]/30 transition-all"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#10b981] to-[#3b82f6] opacity-0 group-hover:opacity-100 transition-opacity"></div>
      
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center">
            <Train className="text-[#10b981]" size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">{trainData.train_name}</h3>
            <p className="text-[10px] text-white/50 tracking-widest uppercase">#{trainData.train_number}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-black text-[#10b981]">₹{trainData.price}</p>
          <p className="text-[10px] text-white/50 tracking-widest uppercase">{trainData.class}</p>
        </div>
      </div>

      <div className="flex items-center justify-between bg-white/5 p-4 rounded-lg mb-6">
        <div className="text-center">
          <p className="text-2xl font-black text-white">{trainData.origin}</p>
          <p className="text-[10px] text-white/50 uppercase">{trainData.departure_time}</p>
        </div>
        
        <div className="flex-grow flex flex-col items-center justify-center px-4">
          <div className="w-full flex items-center justify-center gap-2 text-white/30 mb-1">
            <div className="h-px bg-white/20 flex-grow"></div>
            <ArrowRight size={12} />
            <div className="h-px bg-white/20 flex-grow"></div>
          </div>
          <p className="text-[10px] text-white/50 tracking-widest uppercase flex items-center gap-1">
            <Clock size={10} /> {trainData.duration}
          </p>
        </div>

        <div className="text-center">
          <p className="text-2xl font-black text-white">{trainData.destination}</p>
          <p className="text-[10px] text-white/50 uppercase">{trainData.arrival_time}</p>
        </div>
      </div>

      <button className="w-full py-3 bg-white/5 hover:bg-[#10b981] text-white text-xs font-black tracking-[0.2em] uppercase rounded-lg transition-colors flex items-center justify-center gap-2">
        <Ticket size={14} /> Book Train
      </button>
    </motion.div>
  );
}
