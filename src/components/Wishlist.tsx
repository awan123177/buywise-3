import React from 'react';
import { motion } from 'motion/react';
import { useWishlist } from '../contexts/WishlistContext';
import ProductCard from './ProductCard';
import { PackageOpen } from 'lucide-react';

export default function Wishlist() {
  const { items, loading } = useWishlist();

  if (loading) {
    return (
      <div className="pt-32 px-4 md:px-16 min-h-screen">
        <div className="text-center">Loading wishlist...</div>
      </div>
    );
  }

  return (
    <div className="pt-32 px-4 md:px-16 pb-20 min-h-screen">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase text-[#f5f5f5]">
          Your <span className="text-[#FF3B30]">Wishlist</span>
        </h1>
        <p className="text-sm tracking-widest text-[#f5f5f5]/60 mt-2">SAVED PRODUCTS DIRECTORY</p>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-white/5 bg-white/5 rounded-xl">
          <PackageOpen className="w-16 h-16 text-[#FF3B30]/50 mb-4" />
          <h2 className="text-xl font-bold tracking-widest uppercase">Wishlist is empty</h2>
          <p className="text-sm text-white/50 mt-2">Start adding products to track them here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <ProductCard
                product={item}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
