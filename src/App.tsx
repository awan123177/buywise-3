import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import Navbar from './components/Navbar';
import Home from './components/Home';
import ThreeBackground from './components/ThreeBackground';
import { AuthProvider } from './contexts/AuthContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { AlertsProvider } from './contexts/AlertsContext';
import ProtectedRoute from './components/ProtectedRoute';
import PremiumModal from './components/PremiumModal';

const AdminPanel = lazy(() => import('./components/AdminPanel'));
const Radar = lazy(() => import('./components/Radar'));
const WishlistPage = lazy(() => import('./components/Wishlist'));

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <WishlistProvider>
          <AlertsProvider>
            <div className="min-h-screen bg-[#050505] text-[#f5f5f5] selection:bg-[#FF3B30] selection:text-white">
              <ThreeBackground />
              <Navbar />
              <PremiumModal />
              <Toaster 
                position="bottom-right"
                toastOptions={{
                  style: {
                    background: '#111111',
                    color: '#f5f5f5',
                    border: '1px solid rgba(255,59,48,0.2)',
                    backdropFilter: 'blur(10px)',
                  },
                }}
              />
              <main className="relative z-10">
                <Suspense fallback={
                  <div className="min-h-screen flex items-center justify-center bg-[#050505]">
                    <Loader2 className="w-8 h-8 text-[#FF3B30] animate-spin" />
                  </div>
                }>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
                    <Route path="/radar" element={<ProtectedRoute><Radar /></ProtectedRoute>} />
                    <Route path="/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
                  </Routes>
                </Suspense>
              </main>
              
              {/* Border Frame */}
              <div className="fixed inset-0 pointer-events-none z-50 border-[20px] border-black/40 hidden xl:block" />
            </div>
          </AlertsProvider>
        </WishlistProvider>
      </AuthProvider>
    </Router>
  );
}
