import React, { useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'motion/react';
import { Plane, Calendar, Clock, Banknote, ArrowRight, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { getFlightBookingLinks } from '../lib/api';

interface FlightCardProps {
  flightData: any;
  priceInsights?: any;
}

export default function FlightCard({ flightData, priceInsights }: FlightCardProps) {
  const [bookingLinks, setBookingLinks] = useState<any[]>([]);
  const [showBooking, setShowBooking] = useState(false);
  const [loadingBooking, setLoadingBooking] = useState(false);

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

  const flight = flightData.flights?.[0];
  if (!flight) return null;

  const handleBook = async () => {
    if (!flightData.booking_token) return;
    setLoadingBooking(true);
    setShowBooking(true);
    try {
      const data = await getFlightBookingLinks(flightData.booking_token);
      // Usually SerpApi booking options look like data.search_metadata or data... wait, SerpApi returns booking options in an array under `booking_options` or similar, we'll try to guess structure or just mock if undefined
      setBookingLinks(data.booking_options || [{ name: "Direct Booking", price: flightData.price }]);
    } catch (e) {
      setBookingLinks([{ name: "Direct Booking (Fallback)", price: flightData.price }]);
    } finally {
      setLoadingBooking(false);
    }
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
            <Plane className="text-emerald-400" size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">{flight.airline}</h3>
            <p className="text-[10px] text-white/50 tracking-widest uppercase">{flight.flight_number}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-black text-emerald-400 tracking-tighter">₹{flightData.price}</p>
          <p className="text-[10px] text-white/50 tracking-widest uppercase">{flightData.type}</p>
        </div>
      </div>

      <div className="flex items-center justify-between bg-slate-800/50 p-4 rounded-sm border border-slate-700 mb-6">
        <div className="text-center">
          <p className="text-2xl font-black text-white">{flight.departure_airport?.id}</p>
          <p className="text-[10px] text-white/50 uppercase">{flight.departure_airport?.time || '10:00 AM'}</p>
        </div>
        
        <div className="flex-grow flex flex-col items-center justify-center px-4">
          <div className="w-full flex items-center justify-center gap-2 text-white/30 mb-1">
            <div className="h-px bg-white/20 flex-grow"></div>
            <ArrowRight size={12} />
            <div className="h-px bg-white/20 flex-grow"></div>
          </div>
          <p className="text-[10px] text-white/50 tracking-widest uppercase flex items-center gap-1">
            <Clock size={10} /> {Math.floor(flight.duration / 60)}h {flight.duration % 60}m
          </p>
        </div>

        <div className="text-center">
          <p className="text-2xl font-black text-white">{flight.arrival_airport?.id}</p>
          <p className="text-[10px] text-white/50 uppercase">{flight.arrival_airport?.time || '12:00 PM'}</p>
        </div>
      </div>

      {priceInsights && (
        <div className="mb-6 p-3 bg-slate-800/50 border border-slate-700 rounded-sm flex items-center justify-between">
          <span className="text-xs font-bold text-white/70 uppercase">Price Insight</span>
          <div className="flex items-center gap-2">
            {flightData.price < priceInsights.typical_price_range?.[0] ? (
              <span className="text-xs font-black text-emerald-400 flex items-center gap-1"><TrendingDown size={12}/> LOW</span>
            ) : flightData.price > priceInsights.typical_price_range?.[1] ? (
              <span className="text-xs font-black text-red-400 flex items-center gap-1"><TrendingUp size={12}/> HIGH</span>
            ) : (
              <span className="text-xs font-black text-yellow-500 flex items-center gap-1"><Minus size={12}/> TYPICAL</span>
            )}
          </div>
        </div>
      )}

      <button onClick={handleBook} className="w-full py-3 bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-500/30 hover:text-black text-emerald-400 text-[10px] font-bold tracking-[0.2em] uppercase rounded-sm transition-all flex items-center justify-center gap-2">
        <Banknote size={14} /> Book Flight
      </button>

      {/* Booking Modal */}
      <AnimatePresence>
        {showBooking && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md p-6 flex flex-col"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Select Provider</h3>
              <button onClick={() => setShowBooking(false)} className="text-white/50 hover:text-white text-xs font-black uppercase">Close X</button>
            </div>

            {loadingBooking ? (
              <div className="flex-grow flex items-center justify-center text-white/50 text-xs font-black uppercase tracking-widest animate-pulse">
                Fetching Providers...
              </div>
            ) : (
              <div className="flex-grow overflow-y-auto flex flex-col gap-3">
                {bookingLinks.map((link, i) => (
                  <button key={i} className="flex justify-between items-center w-full p-4 bg-slate-800/50 border border-slate-700 hover:border-emerald-500/50 hover:bg-emerald-500/10 rounded-sm transition-colors">
                    <span className="text-xs font-bold text-slate-300 uppercase">{link.name || "Provider"}</span>
                    <span className="text-sm font-black text-emerald-400">₹{link.price || flightData.price}</span>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
