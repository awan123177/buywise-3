import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { X, Camera, RefreshCw } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (text: string) => void;
}

export default function BarcodeScanner({ isOpen, onClose, onScan }: BarcodeScannerProps) {
  const [error, setError] = useState('');
  const [hasCamera, setHasCamera] = useState(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (!isOpen) {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
        scannerRef.current = null;
      }
      return;
    }

    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode("reader");
        scannerRef.current = scanner;
        
        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 150 },
            aspectRatio: 1.0
          },
          (decodedText) => {
            scanner.stop().then(() => {
              scannerRef.current = null;
              onScan(decodedText);
              onClose();
            }).catch(console.error);
          },
          (errorMessage) => {
            // Ignore ongoing read errors as they just mean no barcode is in view
          }
        );
      } catch (err) {
        console.error("Camera error:", err);
        setHasCamera(false);
        setError('Camera access denied or no camera found. Please ensure you are on HTTPS.');
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, [isOpen, onClose, onScan]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#111] border border-white/10 rounded-xl max-w-md w-full overflow-hidden shadow-2xl relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white z-10 bg-black/50 p-2 rounded-full backdrop-blur"
        >
          <X size={20} />
        </button>

        <div className="p-6 border-b border-white/5 text-center">
          <h2 className="text-xl font-black uppercase tracking-widest text-[#f5f5f5] mb-1 flex items-center justify-center gap-2">
            <Camera size={18} className="text-[#FF3B30]" /> Product Scanner
          </h2>
          <p className="text-[10px] text-white/50 tracking-[0.2em] uppercase">
            Align barcode within frame
          </p>
        </div>

        <div className="p-6">
          {error ? (
            <div className="text-center p-8 bg-[#FF3B30]/10 border border-[#FF3B30]/20 rounded-lg">
              <p className="text-sm text-[#FF3B30]">{error}</p>
            </div>
          ) : (
            <div className="relative rounded-lg overflow-hidden border border-white/10 bg-black">
              <div id="reader" className="w-full" style={{ minHeight: '300px' }}></div>
              <div className="absolute inset-0 border-2 border-[#FF3B30]/30 m-4 rounded pointer-events-none"></div>
              <div className="absolute inset-0 border-b-2 border-[#FF3B30] animate-[scan_2s_ease-in-out_infinite] shadow-[0_5px_15px_rgba(255,59,48,0.5)] pointer-events-none"></div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
