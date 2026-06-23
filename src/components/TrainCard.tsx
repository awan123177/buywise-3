import React from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { Train, Clock, ArrowRight, Ticket } from 'lucide-react';

interface TrainCardProps {
  trainData: any;
}

export default function TrainCard({ trainData }: TrainCardProps) {
  // 3D Tilt Effect state
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });
  
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, scale: 1.02 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className="group relative bg-slate-900/50 border border-emerald-500/20 p-6 rounded-sm overflow-hidden hover:border-emerald-500/50 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all font-mono"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-sm flex items-center justify-center border border-emerald-500/30">
            <Train className="text-emerald-400" size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">{trainData.train_name}</h3>
            <p className="text-[10px] text-white/50 tracking-widest uppercase">#{trainData.train_number}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-black text-emerald-400 tracking-tighter">₹{trainData.price}</p>
          <p className="text-[10px] text-white/50 tracking-widest uppercase">{trainData.class}</p>
        </div>
      </div>

      <div className="flex items-center justify-between bg-slate-800/50 p-4 rounded-sm border border-slate-700 mb-6">
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

      <button className="w-full py-3 bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-500/30 hover:text-black text-emerald-400 text-[10px] font-bold tracking-[0.2em] uppercase rounded-sm transition-all flex items-center justify-center gap-2">
        <Ticket size={14} /> Book Train
      </button>
    </motion.div>
  );
}
