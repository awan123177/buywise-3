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
        className={`glass-panel p-0 flex flex-col gap-0 overflow-hidden ${
          isBest ? "border-indigo-500 border-2 shadow-lg shadow-indigo-500/20" : ""
        }`}
      >
        <div className="relative aspect-[4/5] bg-gray-100 animate-pulse flex items-center justify-center overflow-hidden border-b border-gray-200" />

        <div className="p-5 flex flex-col gap-4 flex-grow bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="h-3 w-16 bg-gray-200 animate-pulse rounded-full" />
            <div className="h-3 w-8 bg-gray-200 animate-pulse rounded-full" />
          </div>

          <div className="space-y-2">
            <div className="h-4 w-full bg-gray-200 animate-pulse rounded-full" />
            <div className="h-4 w-2/3 bg-gray-200 animate-pulse rounded-full" />
          </div>

          <div className="mt-auto pt-4 flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <div className="h-8 w-24 bg-gray-200 animate-pulse rounded-full" />
              <div className="h-3 w-32 bg-gray-200 animate-pulse rounded-full" />
            </div>

            <div className="w-full h-12 bg-gray-200 animate-pulse rounded-xl" />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-panel p-0 flex flex-col gap-0 overflow-hidden group transition-all duration-500 ${
        isBest
          ? "border-indigo-500 border-2 shadow-lg shadow-indigo-500/20"
          : "hover:border-indigo-300"
      }`}
    >
      <div className="relative aspect-[4/5] bg-gray-50 flex items-center justify-center overflow-hidden border-b border-gray-200">
        <div className="absolute inset-0 w-full h-full z-10 pointer-events-none">
          <Product3DViewer imageUrl={product.thumbnail} />
        </div>

        {/* The 2D product picture overlaid or centered to ensure it's always clearly visible */}
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none p-12">
          <img
            src={product.thumbnail}
            alt={product.title}
            className="w-full h-full object-contain filter drop-shadow-xl transition-transform duration-700 ease-out group-hover:scale-105 group-hover:-translate-y-2"
            referrerPolicy="no-referrer"
          />
        </div>

        {isBest && (
          <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-bold uppercase px-3 py-1.5 shadow-md flex items-center gap-1 z-20 pointer-events-none rounded-bl-xl">
            <Sparkles size={12}/> Top Pick
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col gap-3 flex-grow bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            {product.source}
          </span>
          <div className="flex items-center gap-1 text-xs text-amber-500 font-bold bg-amber-50 px-2 py-0.5 rounded-full">
            <Star size={12} fill="currentColor" />
            {product.rating || "4.5"}
          </div>
        </div>

        <h3 className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug">
          {product.title}
        </h3>

        {/* Dynamic Generative Features */}
        {product.features && product.features.length > 0 && (
          <div className="flex flex-col gap-1 mt-1">
            {product.features.map((feat, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 text-[10px] font-medium text-gray-500 uppercase"
              >
                <Check size={10} className="text-indigo-500" />
                {feat}
              </div>
            ))}
          </div>
        )}

        <div className="mt-auto pt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-gray-900 tracking-tight">
                {formatPrice(product.price)}
              </span>
              {product.old_price && (
                <span className="text-xs text-gray-400 line-through font-medium">
                  {formatPrice(product.old_price)}
                </span>
              )}
            </div>
            <div className="text-[10px] text-green-600 font-bold flex items-center gap-1 uppercase bg-green-50 w-fit px-2 py-0.5 rounded">
              <Truck size={12} />
              {product.delivery || "Fast Delivery"}
            </div>
          </div>

          {/* Action Buttons Row 1 */}
          <div className="grid grid-cols-2 gap-2">
            <motion.button
              onClick={() => setShowHistory(!showHistory)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`py-2 px-3 text-xs font-bold transition-colors rounded-xl flex items-center justify-center gap-2 ${
                showHistory ? "bg-gray-900 text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <LineChart size={14} /> History
            </motion.button>
            <motion.button
              onClick={() => setShowOffers(!showOffers)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`py-2 px-3 text-xs font-bold transition-colors rounded-xl flex items-center justify-center gap-2 ${
                showOffers ? "bg-green-500 text-white shadow-md" : "bg-green-50 text-green-700 hover:bg-green-100"
              }`}
            >
              <Ticket size={14} /> Offers {(coupons.length > 0 || cashback.length > 0) && `(${(coupons.length + cashback.length)})`}
            </motion.button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <motion.button
              onClick={() => handlePremiumFeature(() => onSummarize?.(product))}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="py-2 px-3 text-xs font-bold transition-colors rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center gap-1.5"
            >
              <Sparkles size={14} /> Summary
              {!userData?.isPremium && <Diamond size={10} className="text-purple-500 ml-1" />}
            </motion.button>
            <motion.button
              onClick={() => handlePremiumFeature(() => onCompare?.(product))}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="py-2 px-3 text-xs font-bold transition-colors rounded-xl bg-purple-50 text-purple-600 hover:bg-purple-100 flex items-center justify-center gap-1.5"
            >
              <Scale size={14} /> Compare
              {!userData?.isPremium && <Diamond size={10} className="text-purple-500 ml-1" />}
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
                    <div key={i} className="bg-green-50 border border-green-100 p-3 rounded-xl">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-green-700 flex items-center gap-1"><Tag size={12}/> {c.code}</span>
                        <span className="text-xs font-bold text-gray-900">{c.discount}</span>
                      </div>
                      <p className="text-[10px] text-gray-600">{c.description}</p>
                    </div>
                  ))}
                  {cashback.map((c, i) => (
                    <div key={i} className="bg-purple-50 border border-purple-100 p-3 rounded-xl">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-purple-700">{c.provider}</span>
                        <span className="text-xs font-bold text-gray-900">{c.offer}</span>
                      </div>
                      <p className="text-[10px] text-gray-600">{c.details}</p>
                    </div>
                  ))}
                  {coupons.length === 0 && cashback.length === 0 && (
                     <div className="text-xs text-gray-500 text-center py-2 bg-gray-50 rounded-xl">No offers detected.</div>
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
              className={`w-full py-3.5 text-sm font-bold transition-all text-center flex items-center justify-center gap-2 rounded-xl ${
                isBest
                  ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20"
                  : "bg-gray-900 text-white hover:bg-gray-800"
              }`}
            >
              Get Deal <ExternalLink size={16} />
            </motion.a>
            <motion.button
              onClick={handleWishlist}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`w-12 border rounded-xl flex items-center justify-center transition-colors ${
                isWishlisted 
                  ? "bg-red-50 border-red-100 text-red-500" 
                  : "border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-red-500"
              }`}
              title={isWishlisted ? "Wishlisted!" : "Add to Wishlist"}
            >
               <Heart size={20} fill={isWishlisted ? "currentColor" : "none"} className={isWishlisted ? "text-red-500" : ""} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`w-12 border rounded-xl flex items-center justify-center transition-colors ${
                isTracked 
                  ? "bg-indigo-50 border-indigo-100 text-indigo-600" 
                  : "border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-indigo-600"
              }`}
              title={isTracked ? "Alert Set!" : "Set Price Drop Alert"}
              onClick={handleTrackPrice}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {isTracked ? (
                <Check size={20} />
              ) : (
                <TrendingDown size={20} />
              )}
            </motion.button>
            <motion.a
              href={`https://wa.me/?text=${encodeURIComponent(`Check out ${product.title} at ${product.price} on ${product.source}!\n${getOrderLink()}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-12 border rounded-xl flex items-center justify-center transition-colors border-green-100 text-green-500 hover:bg-green-50"
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
