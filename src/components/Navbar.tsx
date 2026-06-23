import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Diamond, LogOut, User, Activity } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function Navbar() {
  const location = useLocation();
  const { user, userData, signInWithGoogle, logout } = useAuth();
  const [onlineCount, setOnlineCount] = useState<number>(1);

  useEffect(() => {
    const sessionId = Math.random().toString(36).substring(2, 15);
    const presenceRef = doc(db, "presence", sessionId);
    
    const updatePresence = () => {
      setDoc(presenceRef, { lastActive: Date.now() }, { merge: true }).catch(() => {});
    };
    updatePresence();
    const intervalId = setInterval(updatePresence, 30000);

    let cleanupQuery: () => void = () => {};

    const setupPresence = () => {
      cleanupQuery();
      const q = query(collection(db, "presence"), where("lastActive", ">", Date.now() - 120000));
      cleanupQuery = onSnapshot(q, (snapshot) => {
        setOnlineCount(snapshot.size > 0 ? snapshot.size : 1);
      }, () => {});
    };

    setupPresence();
    const queryRefreshId = setInterval(setupPresence, 60000);

    return () => {
      clearInterval(intervalId);
      clearInterval(queryRefreshId);
      cleanupQuery();
    };
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] h-20 px-4 md:px-12 flex items-center justify-between bg-[#020617]/80 backdrop-blur-xl border-b border-emerald-500/20 shadow-[0_4px_30px_rgba(16,185,129,0.1)] transition-all">
      <Link to="/" className="flex items-center gap-3 group">
        <div className="w-10 h-10 rounded-sm bg-emerald-500/10 border border-emerald-500 flex items-center justify-center text-emerald-400 font-bold text-xl shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-transform group-hover:scale-105 font-mono">
          BH
        </div>
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold tracking-tighter text-white leading-none uppercase font-mono">Buy<span className="text-emerald-500">Hacket</span></h1>
        </div>
      </Link>

      <div className="hidden lg:flex items-center space-x-8 h-full">
        {[
          { name: 'Discover', path: '/' },
          { name: 'Wishlist', path: '/wishlist' },
          { name: 'Radar', path: '/radar' },
          { name: 'Admin', path: '/admin' },
        ].map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className={`text-xs font-bold uppercase tracking-widest transition-all hover:text-emerald-400 hover:shadow-[0_0_10px_rgba(16,185,129,0.5)] ${
              location.pathname === item.path ? 'text-emerald-500' : 'text-slate-400'
            }`}
          >
            {item.name}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        <div className="hidden md:flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-sm border border-emerald-500/30">
          <Activity size={14} className="text-emerald-500" />
          <span>{onlineCount} Nodes Active</span>
        </div>

        {user ? (
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Credits</div>
              <div className="text-xs text-yellow-400 font-bold bg-yellow-500/10 px-2 py-0.5 rounded-sm border border-yellow-500/30 font-mono">
                {userData?.coins || 0} ⚡
              </div>
            </div>
            {!userData?.isPremium && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="hidden md:flex h-9 px-4 bg-emerald-500/10 text-emerald-400 border border-emerald-500/50 text-[10px] uppercase tracking-widest font-bold rounded-sm items-center gap-2 hover:bg-emerald-500 hover:text-black hover:shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all"
                onClick={() => window.dispatchEvent(new CustomEvent('open-premium-modal'))}
              >
                <Diamond size={14} /> Upgrade
              </motion.button>
            )}
            {userData?.isPremium && (
              <div className="hidden md:flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-sm border border-emerald-500/50 uppercase tracking-widest">
                <Diamond size={14} /> Root Access
              </div>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={logout}
              title={`Logout ${user.displayName}`}
              className="w-10 h-10 rounded-full p-0 group overflow-hidden bg-gray-100 relative shadow-sm cursor-pointer border border-gray-200"
            >
              <img src={user.photoURL || undefined} alt="avatar" className={`w-full h-full object-cover transition-all ${userData?.isPremium ? '' : 'grayscale'} group-hover:grayscale-0 absolute inset-0`} />
              <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <LogOut size={16} className="text-emerald-400" />
              </div>
            </motion.button>
          </div>
        ) : (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={signInWithGoogle}
            className="h-10 px-5 bg-emerald-500/10 border border-emerald-500/50 rounded-sm flex items-center gap-2 transition-all hover:bg-emerald-500 hover:text-black shadow-[0_0_10px_rgba(16,185,129,0.2)] text-emerald-400 font-bold text-xs uppercase tracking-widest"
          >
            <User size={16} />
            <span>Init Auth</span>
          </motion.button>
        )}
      </div>
    </nav>
  );
}
