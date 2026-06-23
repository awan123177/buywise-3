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
    <nav className="fixed top-0 left-0 right-0 z-[100] h-20 px-4 md:px-12 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm transition-all">
      <Link to="/" className="flex items-center gap-3 group">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/30 transition-transform group-hover:scale-105">
          B
        </div>
        <div className="flex flex-col">
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 leading-none">Buy<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">Wise</span></h1>
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
            className={`text-sm font-semibold transition-all hover:text-indigo-600 ${
              location.pathname === item.path ? 'text-indigo-600' : 'text-gray-500'
            }`}
          >
            {item.name}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
          <Activity size={14} className="text-green-500" />
          <span>{onlineCount} Online</span>
        </div>

        {user ? (
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Coins</div>
              <div className="text-xs text-yellow-600 font-bold bg-yellow-50 px-2 py-0.5 rounded-md border border-yellow-200">
                {userData?.coins || 0} 🪙
              </div>
            </div>
            {!userData?.isPremium && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="hidden md:flex h-9 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold rounded-xl items-center gap-2 shadow-md shadow-indigo-500/20"
                onClick={() => window.dispatchEvent(new CustomEvent('open-premium-modal'))}
              >
                <Diamond size={14} /> Upgrade
              </motion.button>
            )}
            {userData?.isPremium && (
              <div className="hidden md:flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100">
                <Diamond size={14} /> PRO
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
                <LogOut size={16} className="text-white" />
              </div>
            </motion.button>
          </div>
        ) : (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={signInWithGoogle}
            className="h-10 px-5 bg-white border border-gray-200 rounded-xl flex items-center gap-2 transition-all hover:bg-gray-50 hover:border-gray-300 shadow-sm text-gray-700 font-semibold text-sm"
          >
            <User size={16} />
            <span>Sign In</span>
          </motion.button>
        )}
      </div>
    </nav>
  );
}
