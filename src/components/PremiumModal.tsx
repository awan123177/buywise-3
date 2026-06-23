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
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-[#111] border border-[#a855f7]/30 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.15)] relative"
      >
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-1 bg-gradient-to-r from-transparent via-[#a855f7] to-transparent opacity-50"></div>
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-[#a855f7] rounded-full mix-blend-screen filter blur-[100px] opacity-20 pointer-events-none"></div>

        <button 
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors z-10 text-xs font-black uppercase"
        >
          Close
        </button>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {step === 'info' && (
              <motion.div key="info" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#a855f7] to-[#3b82f6] flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.5)]">
                    <Diamond size={32} className="text-white" />
                  </div>
                </div>
                
                <h2 className="text-2xl font-black text-center text-white uppercase tracking-tighter mb-2">
                  BuyWise <span className="text-[#a855f7]">Premium</span>
                </h2>
                <p className="text-center text-white/50 text-sm tracking-widest uppercase mb-8">
                  Supercharge your intelligence
                </p>

                <div className="space-y-4 mb-8">
                  {[
                    "Exclusive Price Drop Alerts",
                    "Unlimited AI Comparison Engine",
                    "Advanced Historical Analytics (1 Year)",
                    "Priority Customer Support"
                  ].map((perk, i) => (
                    <div key={i} className="flex items-center gap-3 bg-white/5 p-3 rounded-lg border border-white/5">
                      <div className="w-6 h-6 rounded bg-[#a855f7]/20 flex items-center justify-center flex-shrink-0">
                        <Check size={14} className="text-[#a855f7]" />
                      </div>
                      <span className="text-xs font-bold text-white/90">{perk}</span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <button onClick={() => setPlan('monthly')} className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${plan === 'monthly' ? 'border-[#a855f7] bg-[#a855f7]/10' : 'border-white/10 hover:border-white/30'}`}>
                    <span className="text-xs font-black uppercase tracking-widest text-white/70">Monthly</span>
                    <span className="text-xl font-black text-white">₹20</span>
                  </button>
                  <button onClick={() => setPlan('lifetime')} className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all relative overflow-hidden ${plan === 'lifetime' ? 'border-[#3b82f6] bg-[#3b82f6]/10' : 'border-white/10 hover:border-white/30'}`}>
                    <div className="absolute top-0 inset-x-0 h-1 bg-[#3b82f6]"></div>
                    <span className="text-xs font-black uppercase tracking-widest text-white/70">Lifetime</span>
                    <span className="text-xl font-black text-white">₹600</span>
                  </button>
                </div>

                <button 
                  onClick={() => setStep('payment')}
                  className="w-full py-4 bg-gradient-to-r from-[#a855f7] to-[#3b82f6] text-white font-black uppercase tracking-[0.2em] rounded-xl hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all flex items-center justify-center gap-2"
                >
                  Continue to Payment
                </button>
              </motion.div>
            )}

            {step === 'payment' && (
              <motion.div key="payment" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <h2 className="text-xl font-black text-center text-white uppercase tracking-tighter mb-6">
                  Complete <span className="text-[#a855f7]">Payment</span>
                </h2>

                <div className="bg-white p-6 rounded-xl flex flex-col items-center justify-center mb-6">
                  <img src={qrUrl} alt="UPI QR Code" className="w-48 h-48 mb-4" />
                  <p className="text-black text-xs font-bold tracking-widest uppercase flex items-center gap-2">
                    <QrCode size={14} /> Scan with any UPI App
                  </p>
                </div>

                <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <ShieldCheck size={24} className="text-green-400" />
                    <div>
                      <p className="text-xs font-bold text-white uppercase">Secure Checkout ({plan})</p>
                      <p className="text-[10px] text-white/50 tracking-widest">Amount: ₹{amount}.00 to {UPI_ID}</p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleSimulatePayment}
                  className="w-full py-4 bg-white/10 text-white font-black uppercase tracking-[0.2em] rounded-xl hover:bg-white/20 transition-all flex items-center justify-center gap-2"
                >
                  <CreditCard size={18} /> Simulate Successful Payment
                </button>
                <p className="text-center text-[10px] text-white/30 mt-4 tracking-widest uppercase">
                  (For testing purposes, click above to verify)
                </p>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-12 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center mb-6 text-green-500 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                  <Check size={40} />
                </div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">
                  Payment <span className="text-green-500">Successful</span>
                </h2>
                <p className="text-white/50 text-sm tracking-widest uppercase">
                  Your premium features are now unlocked.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
