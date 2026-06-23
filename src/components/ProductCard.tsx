import React, { useState } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "motion/react";
import { ExternalLink, Star, Truck, TrendingDown, Check, Heart, Share2, Sparkles, Scale, LineChart, Tag, Diamond, Ticket } from "lucide-react";
import Product3DViewer from "./Product3DViewer";
import { useAuth } from "../contexts/AuthContext";
import { useWishlist } from "../contexts/WishlistContext";
import { useAlerts } from "../contexts/AlertsContext";
import PriceHistoryChart from "./PriceHistoryChart";
import { getCoupons, getCashback } from "../lib/api";
import toast from 'react-hot-toast';

interface ProductCardProps {
  product?: {
    title: string;
    price: string;
    thumbnail: string;
    link: string;
    source: string;
    rating?: number;
    reviews?: number;
    delivery?: string;
    old_price?: string;
    features?: string[];
  };
  isBest?: boolean;
  isLoading?: boolean;
  onCompare?: (product: any) => void;
  onSummarize?: (product: any) => void;
}

export default function ProductCard({
  product,
  isBest,
  isLoading,
  onCompare,
  onSummarize,
}: ProductCardProps) {
  const { user, userData, signInWithGoogle, updateUserCoins } = useAuth();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { hasAlert, addAlert, removeAlert } = useAlerts();
  const [isHovered, setIsHovered] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showOffers, setShowOffers] = useState(false);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [cashback, setCashback] = useState<any[]>([]);

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
    setIsHovered(false);
  };

  React.useEffect(() => {
    if (product?.source) {
      getCoupons(product.source).then(data => setCoupons(data.coupons || []));
      getCashback(product.source).then(data => setCashback(data.cashback || []));
    }
  }, [product?.source]);

  const handlePremiumFeature = (callback?: () => void) => {
    if (!user) {
      signInWithGoogle();
      return;
    }
    if (!userData?.isPremium) {
      toast.error("Unlock BuyWise Premium for Advanced AI Features.");
      window.dispatchEvent(new CustomEvent('open-premium-modal'));
      return;
    }
    callback?.();
  };

  const formatPrice = (p: string) => {
    if (!p) return "N/A";
    return p.replace("$", "₹");
  };

  const getCleanId = () => {
    if (!product) return "";
    return btoa(encodeURIComponent(`${product.title}-${product.source}`)).replace(/[^a-zA-Z0-9]/g, '');
  };

  const isWishlisted = isInWishlist(getCleanId());
  const isTracked = hasAlert(getCleanId());

  const parsePrice = (priceStr: string) => {
    if (!priceStr) return 0;
    return parseFloat(priceStr.replace(/[^0-9.]/g, ""));
  };

  const handleTrackPrice = async () => {
    if (!product) return;
    if (!user) {
      await signInWithGoogle();
      return;
    }
    
    if (isTracked) {
      await removeAlert(getCleanId());
    } else {
      await addAlert({
        title: product.title,
        targetPrice: parsePrice(product.price) * 0.9, // Default target is 10% drop
        currentPrice: parsePrice(product.price),
        thumbnail: product.thumbnail,
        link: product.link,
        source: product.source
      });
    }
  };

  const handleWishlist = async () => {
    if (!product) return;
    if (!user) {
      await signInWithGoogle();
      return;
    }
    
    if (isWishlisted) {
      await removeFromWishlist(getCleanId());
    } else {
      await addToWishlist({
        title: product.title,
        price: product.price,
        old_price: product.old_price,
        thumbnail: product.thumbnail,
        link: product.link,
        source: product.source,
        rating: product.rating
      });
      updateUserCoins(50);
    }
  };

  const getOrderLink = () => {
    if (!product) return "#";
    let orderLink = product.link || (product as any).product_link;
    
    // Extract actual destination from google.com/url?q=... or url=...
    if (orderLink && orderLink.includes("google.com/url")) {
      try {
        const urlObj = new URL(orderLink);
        const actualUrl = urlObj.searchParams.get("url") || urlObj.searchParams.get("q");
        if (actualUrl) {
          return actualUrl;
        }
      } catch (e) {
        console.error("Failed to parse Google redirect URL", e);
      }
    }

    // Force direct links based on source if link is missing
    if (!orderLink || orderLink.includes("serpapi.com") || orderLink.includes("google.com/shopping")) {
      const encodeQ = encodeURIComponent(product.title);
      const src = product.source.toLowerCase();
      if (src.includes("amazon")) return `https://www.amazon.in/s?k=${encodeQ}`;
      if (src.includes("flipkart")) return `https://www.flipkart.com/search?q=${encodeQ}`;
      if (src.includes("croma")) return `https://www.croma.com/searchB?q=${encodeQ}`;
      if (src.includes("reliance")) return `https://www.reliancedigital.in/search?q=${encodeQ}`;
      // Fallback
      return `https://www.google.com/search?q=${encodeQ}`;
    }
    return orderLink;
  };

  if (isLoading || !product) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className={`glass-panel p-0 flex flex-col gap-0 overflow-hidden ${
          isBest ? "border-emerald-500 border-2 shadow-[0_0_20px_rgba(16,185,129,0.3)]" : ""
        }`}
      >
        <div className="relative aspect-[4/5] bg-slate-800/50 animate-pulse flex items-center justify-center overflow-hidden border-b border-emerald-500/20" />

        <div className="p-5 flex flex-col gap-4 flex-grow bg-slate-900/50">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="h-3 w-16 bg-slate-800 animate-pulse rounded-sm" />
            <div className="h-3 w-8 bg-slate-800 animate-pulse rounded-sm" />
          </div>

          <div className="space-y-2">
            <div className="h-4 w-full bg-slate-800 animate-pulse rounded-sm" />
            <div className="h-4 w-2/3 bg-slate-800 animate-pulse rounded-sm" />
          </div>

          <div className="mt-auto pt-4 flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <div className="h-8 w-24 bg-slate-800 animate-pulse rounded-sm" />
              <div className="h-3 w-32 bg-slate-800 animate-pulse rounded-sm" />
            </div>

            <div className="w-full h-12 bg-slate-800 animate-pulse rounded-sm" />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={() => setIsHovered(true)}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className={`glass-panel p-0 flex flex-col gap-0 overflow-hidden group transition-all duration-500 ${
        isBest
          ? "border-emerald-500 border-2 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
          : "hover:border-emerald-500/50"
      }`}
    >
      <div className="relative aspect-[4/5] bg-slate-900 flex items-center justify-center overflow-hidden border-b border-emerald-500/20">
        <div className="absolute top-4 left-4 flex flex-col gap-1 z-20 pointer-events-none">
          <span className="text-[9px] font-bold text-emerald-500/50 uppercase tracking-widest leading-none">
            NODE_ID
          </span>
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-tighter leading-none">
            BH-0{Math.floor(Math.random() * 900)}
          </span>
        </div>

        <div className="absolute inset-0 w-full h-full z-10 pointer-events-none">
          <Product3DViewer imageUrl={product.thumbnail} />
        </div>

        {/* The 2D product picture overlaid or centered to ensure it's always clearly visible */}
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none p-12">
          <img
            src={product.thumbnail}
            alt={product.title}
            className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-transform duration-700 ease-out group-hover:scale-105 group-hover:-translate-y-2 opacity-90 group-hover:opacity-100"
            referrerPolicy="no-referrer"
          />
        </div>

        {isBest && (
          <div className="absolute top-0 right-0 bg-emerald-500 text-black text-[10px] font-bold uppercase px-3 py-1.5 shadow-[0_0_15px_rgba(16,185,129,0.5)] flex items-center gap-1 z-20 pointer-events-none rounded-bl-sm tracking-widest">
            <Sparkles size={12}/> Root Pick
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col gap-3 flex-grow bg-slate-900/60">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.2em]">
            {product.source}
          </span>
          <div className="flex items-center gap-1 text-[10px] text-yellow-400 font-bold bg-yellow-400/10 border border-yellow-400/20 px-2 py-0.5 rounded-sm">
            <Star size={10} fill="currentColor" />
            {product.rating || "4.5"}
          </div>
        </div>

        <h3 className="text-sm font-bold text-slate-200 line-clamp-2 leading-snug tracking-wide uppercase">
          {product.title}
        </h3>

        {/* Dynamic Generative Features */}
        {product.features && product.features.length > 0 && (
          <div className="flex flex-col gap-1 mt-1">
            {product.features.map((feat, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 text-[9px] font-bold tracking-widest text-slate-400 uppercase"
              >
                <div className="w-1 h-1 bg-emerald-500" />
                {feat}
              </div>
            ))}
          </div>
        )}

        <div className="mt-auto pt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white tracking-tighter">
                {formatPrice(product.price)}
              </span>
              {product.old_price && (
                <span className="text-[10px] text-slate-500 line-through font-bold">
                  {formatPrice(product.old_price)}
                </span>
              )}
            </div>
            <div className="text-[9px] text-emerald-400 font-bold flex items-center gap-1 uppercase bg-emerald-500/10 border border-emerald-500/30 w-fit px-2 py-0.5 rounded-sm tracking-widest">
              <Truck size={10} />
              {product.delivery || "Fast Delivery"}
            </div>
          </div>

          {/* Action Buttons Row 1 */}
          <div className="grid grid-cols-2 gap-2">
            <motion.button
              onClick={() => setShowHistory(!showHistory)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`py-2 px-3 text-[10px] font-bold uppercase tracking-widest transition-colors rounded-sm border flex items-center justify-center gap-2 ${
                showHistory ? "bg-[#FF3B30]/20 text-[#FF3B30] border-[#FF3B30]" : "border-slate-700 text-slate-300 hover:bg-slate-800"
              }`}
            >
              <LineChart size={12} /> History
            </motion.button>
            <motion.button
              onClick={() => setShowOffers(!showOffers)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`py-2 px-3 text-[10px] font-bold uppercase tracking-widest transition-colors rounded-sm border flex items-center justify-center gap-2 ${
                showOffers ? "bg-emerald-500/20 text-emerald-400 border-emerald-500" : "border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10"
              }`}
            >
              <Ticket size={12} /> Offers {(coupons.length > 0 || cashback.length > 0) && `(${(coupons.length + cashback.length)})`}
            </motion.button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <motion.button
              onClick={() => handlePremiumFeature(() => onSummarize?.(product))}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="py-2 px-3 text-[10px] font-bold uppercase tracking-widest transition-colors rounded-sm border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500 hover:text-black flex items-center justify-center gap-1.5"
            >
              <Sparkles size={12} /> Summary
              {!userData?.isPremium && <Diamond size={10} className="text-cyan-400 ml-1" />}
            </motion.button>
            <motion.button
              onClick={() => handlePremiumFeature(() => onCompare?.(product))}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="py-2 px-3 text-[10px] font-bold uppercase tracking-widest transition-colors rounded-sm border border-purple-500/30 bg-purple-500/10 text-purple-400 hover:bg-purple-500 hover:text-white flex items-center justify-center gap-1.5"
            >
              <Scale size={12} /> Compare
              {!userData?.isPremium && <Diamond size={10} className="text-purple-400 ml-1" />}
            </motion.button>
          </div>

          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-2 pb-4">
                  <PriceHistoryChart currentPrice={parsePrice(product.price)} />
                </div>
              </motion.div>
            )}

            {showOffers && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-2 pb-2 space-y-2">
                  {coupons.map((c, i) => (
                    <div key={i} className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-sm">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold text-emerald-400 tracking-widest uppercase flex items-center gap-1"><Tag size={12}/> {c.code}</span>
                        <span className="text-[10px] font-bold text-white">{c.discount}</span>
                      </div>
                      <p className="text-[9px] text-slate-400">{c.description}</p>
                    </div>
                  ))}
                  {cashback.map((c, i) => (
                    <div key={i} className="bg-purple-500/10 border border-purple-500/20 p-3 rounded-sm">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">{c.provider}</span>
                        <span className="text-[10px] font-bold text-white">{c.offer}</span>
                      </div>
                      <p className="text-[9px] text-slate-400">{c.details}</p>
                    </div>
                  ))}
                  {coupons.length === 0 && cashback.length === 0 && (
                     <div className="text-[10px] text-slate-500 text-center py-2 bg-slate-800/50 rounded-sm border border-slate-700 uppercase tracking-widest">No offers detected.</div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons Row 2 */}

          <div className="flex gap-2">
            <motion.a
              href={getOrderLink()}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full py-3.5 text-xs font-bold uppercase tracking-widest transition-all text-center flex items-center justify-center gap-2 rounded-sm border ${
                isBest
                  ? "bg-emerald-500 text-black border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                  : "bg-slate-800 text-white border-slate-700 hover:bg-emerald-500/20 hover:border-emerald-500 hover:text-emerald-400"
              }`}
            >
              EXECUTE <ExternalLink size={14} />
            </motion.a>
            <motion.button
              onClick={handleWishlist}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`w-12 border rounded-sm flex items-center justify-center transition-colors ${
                isWishlisted 
                  ? "bg-[#FF3B30]/20 border-[#FF3B30] text-[#FF3B30]" 
                  : "border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-[#FF3B30]"
              }`}
              title={isWishlisted ? "Wishlisted!" : "Add to Wishlist"}
            >
               <Heart size={18} fill={isWishlisted ? "currentColor" : "none"} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`w-12 border rounded-sm flex items-center justify-center transition-colors ${
                isTracked 
                  ? "bg-cyan-500/20 border-cyan-500 text-cyan-400" 
                  : "border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-cyan-400"
              }`}
              title={isTracked ? "Alert Set!" : "Set Price Drop Alert"}
              onClick={handleTrackPrice}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {isTracked ? (
                <Check size={18} />
              ) : (
                <TrendingDown size={18} />
              )}
            </motion.button>
            <motion.a
              href={`https://wa.me/?text=${encodeURIComponent(`Check out ${product.title} at ${product.price} on ${product.source}!\n${getOrderLink()}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-12 border rounded-sm flex items-center justify-center transition-colors border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10"
              title="Share on WhatsApp"
            >
              <Share2 size={16} />
            </motion.a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
