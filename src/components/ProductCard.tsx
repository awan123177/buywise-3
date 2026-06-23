import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
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
        className={`terminal-card p-0 flex flex-col gap-0 overflow-hidden bg-transparent ${
          isBest
            ? "border-[#cc0000] border-2 shadow-[0_0_30px_0_rgba(204,0,0,0.4)]"
            : "border-white/10"
        }`}
      >
        <div className="relative aspect-[4/5] bg-white/5 animate-pulse flex items-center justify-center overflow-hidden border-b border-white/10" />

        <div className="p-6 flex flex-col gap-4 flex-grow bg-black/20">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="h-3 w-16 bg-white/10 animate-pulse rounded-full" />
            <div className="h-3 w-8 bg-white/10 animate-pulse rounded-full" />
          </div>

          <div className="space-y-2">
            <div className="h-4 w-full bg-white/10 animate-pulse rounded-full" />
            <div className="h-4 w-2/3 bg-white/10 animate-pulse rounded-full" />
          </div>

          <div className="mt-auto pt-4 flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <div className="h-8 w-24 bg-white/10 animate-pulse rounded-full" />
              <div className="h-3 w-32 bg-white/10 animate-pulse rounded-full" />
            </div>

            <div className="w-full py-6 bg-white/10 animate-pulse rounded-lg" />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className={`terminal-card p-0 flex flex-col gap-0 overflow-hidden group transition-all duration-500 bg-transparent ${
        isBest
          ? "border-[#cc0000] border-2 shadow-[0_0_30px_0_rgba(204,0,0,0.4)] hover:shadow-[0_0_50px_0_rgba(204,0,0,0.6)]"
          : "border-white/10 hover:border-white/30"
      }`}
    >
      <div className="relative aspect-[4/5] bg-white/5 flex items-center justify-center overflow-hidden border-b border-white/10">
        <div className="absolute top-4 left-4 flex flex-col gap-1 z-20 pointer-events-none">
          <span className="text-[9px] font-black text-white/40 uppercase tracking-widest leading-none">
            NODE_ID
          </span>
          <span className="text-[10px] font-black text-white uppercase tracking-tighter leading-none">
            BS-0{Math.floor(Math.random() * 900)}
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
            className="w-full h-full object-contain filter drop-shadow-2xl transition-transform duration-700 ease-out group-hover:scale-110 group-hover:-translate-y-2 opacity-90 group-hover:opacity-100"
            referrerPolicy="no-referrer"
          />
        </div>

        {isBest && (
          <div className="absolute top-0 right-0 bg-[#cc0000] text-white text-[10px] font-black uppercase px-4 py-2 border-l border-b border-white/10 shadow-lg flex items-center gap-2 z-20 pointer-events-none backdrop-blur-md rounded-bl-lg">
            MIN_PRICE_DETECTION
          </div>
        )}
      </div>

      <div className="p-6 flex flex-col gap-4 flex-grow bg-black/20">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <span className="text-[11px] font-black text-[#cc0000] uppercase tracking-[0.1em]">
            {product.source}
          </span>
          <div className="flex items-center gap-1.5 text-[10px] text-white font-black">
            <Star size={10} fill="white" />
            {product.rating || "4.5"}
          </div>
        </div>

        <h3 className="text-sm font-black text-white line-clamp-2 leading-relaxed tracking-tight uppercase">
          {product.title}
        </h3>

        {/* Dynamic Generative Features */}
        {product.features && product.features.length > 0 && (
          <div className="flex flex-col gap-1.5 mt-2">
            {product.features.map((feat, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 text-[9px] font-black tracking-widest text-[#888] uppercase"
              >
                <div className="w-1 h-1 bg-[#cc0000]" />
                {feat}
              </div>
            ))}
          </div>
        )}

        <div className="mt-auto pt-4 flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-white tracking-tighter">
                {formatPrice(product.price)}
              </span>
              {product.old_price && (
                <span className="text-[10px] text-white/40 line-through font-black">
                  {formatPrice(product.old_price)}
                </span>
              )}
            </div>
            <div className="text-[9px] text-white/40 uppercase tracking-[0.2em] font-black flex items-center gap-2">
              <Truck size={12} className="text-[#cc0000]" />
              {product.delivery || "PRIORITY_LOGISTICS"}
            </div>
          </div>

          {/* Action Buttons Row 1 */}
          <div className="grid grid-cols-2 gap-2">
            <motion.button
              onClick={() => setShowHistory(!showHistory)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`py-2 px-3 text-[10px] font-black tracking-widest uppercase transition-colors rounded-lg border flex items-center justify-center gap-2 ${
                showHistory ? "bg-[#FF3B30] text-white border-[#FF3B30]" : "border-white/10 text-white hover:bg-white/5"
              }`}
            >
              <LineChart size={12} /> HISTORY
            </motion.button>
            <motion.button
              onClick={() => setShowOffers(!showOffers)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`py-2 px-3 text-[10px] font-black tracking-widest uppercase transition-colors rounded-lg border flex items-center justify-center gap-2 ${
                showOffers ? "bg-green-500 text-white border-green-500" : "border-green-500/30 text-green-500 bg-green-500/10 hover:bg-green-500 hover:text-white"
              }`}
            >
              <Ticket size={12} /> OFFERS {(coupons.length > 0 || cashback.length > 0) && `(${(coupons.length + cashback.length)})`}
            </motion.button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <motion.button
              onClick={() => handlePremiumFeature(() => onSummarize?.(product))}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="py-2 px-3 text-[10px] font-black tracking-widest uppercase transition-colors rounded-lg border border-[#3b82f6]/30 bg-[#3b82f6]/10 text-[#3b82f6] hover:bg-[#3b82f6] hover:text-white flex items-center justify-center gap-2"
            >
              <Sparkles size={12} /> AI SUMMARY
              {!userData?.isPremium && <Diamond size={10} className="text-[#a855f7]" />}
            </motion.button>
            <motion.button
              onClick={() => handlePremiumFeature(() => onCompare?.(product))}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="py-2 px-3 text-[10px] font-black tracking-widest uppercase transition-colors rounded-lg border border-[#a855f7]/30 bg-[#a855f7]/10 text-[#a855f7] hover:bg-[#a855f7] hover:text-white flex items-center justify-center gap-2"
            >
              <Scale size={12} /> COMPARE
              {!userData?.isPremium && <Diamond size={10} className="text-[#a855f7]" />}
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
                <div className="pt-2 pb-4 space-y-3">
                  {coupons.map((c, i) => (
                    <div key={i} className="bg-green-500/10 border border-green-500/20 p-3 rounded-lg">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-black text-green-400 tracking-widest uppercase flex items-center gap-1"><Tag size={12}/> {c.code}</span>
                        <span className="text-xs font-black text-white">{c.discount}</span>
                      </div>
                      <p className="text-[10px] text-white/50">{c.description}</p>
                    </div>
                  ))}
                  {cashback.map((c, i) => (
                    <div key={i} className="bg-[#a855f7]/10 border border-[#a855f7]/20 p-3 rounded-lg">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-black text-[#a855f7] tracking-widest uppercase">{c.provider}</span>
                        <span className="text-xs font-black text-white">{c.offer}</span>
                      </div>
                      <p className="text-[10px] text-white/50">{c.details}</p>
                    </div>
                  ))}
                  {coupons.length === 0 && cashback.length === 0 && (
                     <div className="text-[10px] text-white/40 text-center uppercase tracking-widest">No offers detected.</div>
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
              className={`w-full py-4 text-[11px] font-black tracking-[0.2em] uppercase transition-all text-center flex items-center justify-center gap-2 rounded-lg border ${
                isBest
                  ? "bg-[#FF3B30] text-white hover:bg-white hover:text-black border-[#FF3B30] shadow-[0_0_15px_rgba(255,59,48,0.5)]"
                  : "bg-white/5 text-white hover:bg-white hover:text-black border-white/10"
              }`}
            >
              ORDER_NOW <ExternalLink size={14} />
            </motion.a>
            <motion.button
              onClick={handleWishlist}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`px-4 border rounded-lg flex items-center justify-center transition-colors ${
                isWishlisted 
                  ? "bg-[#FF3B30] border-[#FF3B30] text-white" 
                  : "border-white/10 text-white hover:bg-[#FF3B30] hover:text-white hover:border-[#FF3B30]"
              }`}
              title={isWishlisted ? "Wishlisted!" : "Add to Wishlist"}
            >
               <Heart size={18} fill={isWishlisted ? "currentColor" : "none"} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`px-4 border rounded-lg flex items-center justify-center transition-colors ${
                isTracked 
                  ? "bg-white border-white text-black hover:bg-[#f5f5f5]" 
                  : "border-white/10 text-white hover:bg-[#FF3B30] hover:text-white hover:border-[#FF3B30]"
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
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-4 border rounded-lg flex items-center justify-center transition-colors border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366] hover:text-white hover:border-[#25D366]"
              title="Share on WhatsApp"
            >
              <Share2 size={18} />
            </motion.a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
