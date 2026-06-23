import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';

export interface WishlistItem {
  id: string; // usually a hash of title or the title itself to prevent duplicates
  title: string;
  price: string;
  old_price?: string;
  thumbnail: string;
  link: string;
  source: string;
  rating?: number;
  addedAt: any;
}

interface WishlistContextType {
  items: WishlistItem[];
  loading: boolean;
  addToWishlist: (item: Omit<WishlistItem, 'id' | 'addedAt'>) => Promise<void>;
  removeFromWishlist: (id: string) => Promise<void>;
  isInWishlist: (id: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType>({
  items: [],
  loading: true,
  addToWishlist: async () => {},
  removeFromWishlist: async () => {},
  isInWishlist: () => false,
});

export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, `users/${user.uid}/wishlist`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const wishlistItems = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })) as WishlistItem[];
      
      // Sort by addedAt descending
      wishlistItems.sort((a, b) => {
        const timeA = a.addedAt?.toMillis ? a.addedAt.toMillis() : 0;
        const timeB = b.addedAt?.toMillis ? b.addedAt.toMillis() : 0;
        return timeB - timeA;
      });

      setItems(wishlistItems);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const addToWishlist = async (item: Omit<WishlistItem, 'id' | 'addedAt'>) => {
    if (!user) return;
    // Generate a simple ID based on title and source
    const id = btoa(encodeURIComponent(`${item.title}-${item.source}`)).replace(/[^a-zA-Z0-9]/g, '');
    const docRef = doc(db, `users/${user.uid}/wishlist`, id);
    await setDoc(docRef, {
      ...item,
      addedAt: serverTimestamp()
    });
  };

  const removeFromWishlist = async (id: string) => {
    if (!user) return;
    const docRef = doc(db, `users/${user.uid}/wishlist`, id);
    await deleteDoc(docRef);
  };

  const isInWishlist = (id: string) => {
    return items.some(item => item.id === id);
  };

  return (
    <WishlistContext.Provider value={{ items, loading, addToWishlist, removeFromWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};
