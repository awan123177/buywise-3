import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast';

export interface AlertItem {
  id: string;
  title: string;
  targetPrice: number;
  currentPrice: number;
  thumbnail: string;
  link: string;
  source: string;
  createdAt: any;
}

interface AlertsContextType {
  alerts: AlertItem[];
  loading: boolean;
  addAlert: (item: Omit<AlertItem, 'id' | 'createdAt'>) => Promise<void>;
  removeAlert: (id: string) => Promise<void>;
  hasAlert: (id: string) => boolean;
}

const AlertsContext = createContext<AlertsContextType>({
  alerts: [],
  loading: true,
  addAlert: async () => {},
  removeAlert: async () => {},
  hasAlert: () => false,
});

export const useAlerts = () => useContext(AlertsContext);

export const AlertsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setAlerts([]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, `users/${user.uid}/alerts`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const alertItems = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })) as AlertItem[];
      
      // Sort by createdAt descending
      alertItems.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });

      setAlerts(alertItems);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const addAlert = async (item: Omit<AlertItem, 'id' | 'createdAt'>) => {
    if (!user) return;
    const id = btoa(encodeURIComponent(`${item.title}-${item.source}`)).replace(/[^a-zA-Z0-9]/g, '');
    const docRef = doc(db, `users/${user.uid}/alerts`, id);
    await setDoc(docRef, {
      ...item,
      createdAt: serverTimestamp()
    });
    toast.success('Price drop alert set!');
  };

  const removeAlert = async (id: string) => {
    if (!user) return;
    const docRef = doc(db, `users/${user.uid}/alerts`, id);
    await deleteDoc(docRef);
    toast.success('Price drop alert removed!');
  };

  const hasAlert = (id: string) => {
    return alerts.some(alert => alert.id === id);
  };

  return (
    <AlertsContext.Provider value={{ alerts, loading, addAlert, removeAlert, hasAlert }}>
      {children}
    </AlertsContext.Provider>
  );
};
