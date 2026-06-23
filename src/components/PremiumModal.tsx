import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Diamond, Check, QrCode, CreditCard, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import toast from 'react-hot-toast';

// Simple UPI QR URL Generator
const UPI_ID = "7760449306@nyes"; // User provided UPI ID
const generateUPILink = (amount: number, name: string) => 
  `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR`;
const generateQRUrl = (data: string) => 
  `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}&margin=10`;

export default function PremiumModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'info' | 'payment' | 'success'>('info');
  const [plan, setPlan] = useState<'monthly' | 'lifetime'>('monthly');
  const { user } = useAuth();

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-premium-modal', handleOpen);
    return () => window.removeEventListener('open-premium-modal', handleOpen);
  }, []);

  if (!isOpen) return null;

  const amount = plan === 'monthly' ? 20 : 600;
  const upiLink = generateUPILink(amount, 'BuyWise Premium');
  const qrUrl = generateQRUrl(upiLink);

  const handleSimulatePayment = async () => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { isPremium: true, premiumPlan: plan }, { merge: true });
      setStep('success');
      setTimeout(() => {
        setIsOpen(false);
        setStep('info');
        toast.success("Welcome to BuyWise Premium!");
      }, 3000);
    } catch (e) {
      toast.error("Payment sync failed");
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-slate-900 border border-emerald-500/30 rounded-xl overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.2)] relative"
      >
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50"></div>
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-emerald-500 rounded-full mix-blend-screen filter blur-[100px] opacity-10 pointer-events-none"></div>

        <button 
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 text-slate-500 hover:text-emerald-400 transition-colors z-10 text-[10px] font-bold uppercase tracking-widest border border-slate-700 hover:border-emerald-500/50 px-2 py-1 rounded-sm"
        >
          Close
        </button>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {step === 'info' && (
              <motion.div key="info" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 rounded-sm bg-emerald-500/10 border border-emerald-500/50 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                    <Diamond size={32} className="text-emerald-400" />
                  </div>
                </div>
                
                <h2 className="text-2xl font-bold text-center text-white uppercase tracking-tighter mb-2 font-mono">
                  Root <span className="text-emerald-500">Access</span>
                </h2>
                <p className="text-center text-slate-400 text-[10px] tracking-[0.2em] uppercase mb-8 font-bold">
                  Bypass limits. Exploit the market.
                </p>

                <div className="space-y-4 mb-8">
                  {[
                    "Live Node Tracking (Price Alerts)",
                    "Unlimited AI Exploit Engine",
                    "Archived Analytics (1 Year History)",
                    "Priority Channel Support"
                  ].map((perk, i) => (
                    <div key={i} className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-sm border border-emerald-500/10">
                      <div className="w-6 h-6 rounded-sm bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                        <Check size={14} className="text-emerald-400" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{perk}</span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <button onClick={() => setPlan('monthly')} className={`p-4 rounded-sm border flex flex-col items-center justify-center gap-1 transition-all ${plan === 'monthly' ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'border-slate-700 hover:border-slate-500 bg-slate-800/50'}`}>
                    <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${plan === 'monthly' ? 'text-emerald-400' : 'text-slate-500'}`}>Monthly Node</span>
                    <span className="text-xl font-bold text-white tracking-tighter">₹20</span>
                  </button>
                  <button onClick={() => setPlan('lifetime')} className={`p-4 rounded-sm border flex flex-col items-center justify-center gap-1 transition-all relative overflow-hidden ${plan === 'lifetime' ? 'border-cyan-500 bg-cyan-500/10 shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'border-slate-700 hover:border-slate-500 bg-slate-800/50'}`}>
                    <div className={`absolute top-0 inset-x-0 h-1 ${plan === 'lifetime' ? 'bg-cyan-500' : 'bg-transparent'}`}></div>
                    <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${plan === 'lifetime' ? 'text-cyan-400' : 'text-slate-500'}`}>Permanent Key</span>
                    <span className="text-xl font-bold text-white tracking-tighter">₹600</span>
                  </button>
                </div>

                <button 
                  onClick={() => setStep('payment')}
                  className="w-full py-4 bg-emerald-500 text-black font-bold uppercase tracking-widest rounded-sm shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all flex items-center justify-center gap-2 hover:bg-emerald-400 hover:-translate-y-0.5"
                >
                  INITIATE TRANSFER
                </button>
              </motion.div>
            )}

            {step === 'payment' && (
              <motion.div key="payment" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <h2 className="text-xl font-bold text-center text-white uppercase tracking-tighter mb-6 font-mono">
                  Decrypt <span className="text-emerald-500">Transaction</span>
                </h2>

                <div className="bg-slate-800/50 border border-emerald-500/20 p-6 rounded-sm flex flex-col items-center justify-center mb-6 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.1)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none opacity-20"></div>
                  <img src={qrUrl} alt="UPI QR Code" className="w-48 h-48 mb-4 border-4 border-white rounded-sm p-2 bg-white relative z-10" />
                  <p className="text-emerald-400 text-[10px] font-bold tracking-[0.2em] uppercase flex items-center gap-2 relative z-10">
                    <QrCode size={14} /> Scan Matrix with UPI
                  </p>
                </div>

                <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-sm flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <ShieldCheck size={24} className="text-emerald-500" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Encrypted Tunnel ({plan})</p>
                      <p className="text-[9px] text-slate-500 tracking-[0.2em] font-mono">VALUE: ₹{amount}.00 TO {UPI_ID}</p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleSimulatePayment}
                  className="w-full py-4 bg-slate-800 text-emerald-400 border border-emerald-500/30 font-bold uppercase tracking-widest rounded-sm hover:bg-emerald-500/10 hover:border-emerald-500 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.1)] text-xs"
                >
                  <CreditCard size={18} /> BYPASS & VERIFY
                </button>
                <p className="text-center text-[9px] text-slate-600 mt-4 tracking-[0.2em] uppercase font-bold">
                  (Simulate auth handshake for testing)
                </p>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-12 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 rounded-sm bg-emerald-500/10 border border-emerald-500 flex items-center justify-center mb-6 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)] relative">
                   <div className="absolute inset-0 border-2 border-emerald-500/50 rounded-sm animate-ping opacity-20"></div>
                  <Check size={40} />
                </div>
                <h2 className="text-2xl font-bold text-white uppercase tracking-tighter mb-2 font-mono">
                  Handshake <span className="text-emerald-500">Verified</span>
                </h2>
                <p className="text-emerald-400/70 text-[10px] tracking-[0.2em] uppercase font-bold">
                  Root privileges granted. Welcome.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
