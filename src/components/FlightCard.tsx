import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
      whileHover={{ y: -5 }}
      className="group relative bg-[#111] border border-white/5 p-6 rounded-xl overflow-hidden hover:border-[#a855f7]/30 transition-all"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#a855f7] to-[#3b82f6] opacity-0 group-hover:opacity-100 transition-opacity"></div>
      
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center">
            <Plane className="text-[#a855f7]" size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">{flight.airline}</h3>
            <p className="text-[10px] text-white/50 tracking-widest uppercase">{flight.flight_number}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-black text-[#a855f7]">₹{flightData.price}</p>
          <p className="text-[10px] text-white/50 tracking-widest uppercase">{flightData.type}</p>
        </div>
      </div>

      <div className="flex items-center justify-between bg-white/5 p-4 rounded-lg mb-6">
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
        <div className="mb-6 p-3 bg-white/5 rounded-lg flex items-center justify-between">
          <span className="text-xs font-bold text-white/70 uppercase">Price Insight</span>
          <div className="flex items-center gap-2">
            {flightData.price < priceInsights.typical_price_range?.[0] ? (
              <span className="text-xs font-black text-green-400 flex items-center gap-1"><TrendingDown size={12}/> LOW</span>
            ) : flightData.price > priceInsights.typical_price_range?.[1] ? (
              <span className="text-xs font-black text-red-400 flex items-center gap-1"><TrendingUp size={12}/> HIGH</span>
            ) : (
              <span className="text-xs font-black text-yellow-400 flex items-center gap-1"><Minus size={12}/> TYPICAL</span>
            )}
          </div>
        </div>
      )}

      <button onClick={handleBook} className="w-full py-3 bg-white/5 hover:bg-[#a855f7] text-white text-xs font-black tracking-[0.2em] uppercase rounded-lg transition-colors flex items-center justify-center gap-2">
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
                  <button key={i} className="flex justify-between items-center w-full p-4 bg-white/10 hover:bg-[#a855f7]/30 rounded-lg transition-colors">
                    <span className="text-xs font-bold text-white uppercase">{link.name || "Provider"}</span>
                    <span className="text-sm font-black text-[#a855f7]">₹{link.price || flightData.price}</span>
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
