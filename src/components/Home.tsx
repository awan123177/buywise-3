import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Loader2, Sparkles, Diamond, ArrowRight, Camera, Mic, Volume2, Filter, SlidersHorizontal, ChevronDown, Check, Star, Tag, Zap, ShoppingBag, X, Activity, Grid, List, ShieldCheck, MapPin } from 'lucide-react';
import { searchProducts, searchFlights, searchTrains, autocompleteAirports, searchFlightDeals } from '../lib/api';
import { detectProduct, extractProductFeatures, summarizeReviews, compareProducts } from '../lib/gemini';
import ProductCard from './ProductCard';
import ProductSkeleton from './ProductSkeleton';
import ChatAssistant from './ChatAssistant';
import Product3DViewer from './Product3DViewer';
import ReviewSummaryModal from './ReviewSummaryModal';
import ProductComparisonModal from './ProductComparisonModal';
import BarcodeScanner from './BarcodeScanner';
import FlightCard from './FlightCard';
import TrainCard from './TrainCard';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function Home() {
  const { user, userData, updateUserCoins } = useAuth();
  const [query, setQuery] = useState('');
  const [searchMode, setSearchMode] = useState<'shopping' | 'flights' | 'trains'>('shopping');
  const [results, setResults] = useState<any[]>([]);
  const [flightResults, setFlightResults] = useState<any[]>([]);
  const [flightPriceInsights, setFlightPriceInsights] = useState<any>(null);
  const [trainResults, setTrainResults] = useState<any[]>([]);
  const [flightDeals, setFlightDeals] = useState<any[]>([]);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchingStatus, setSearchingStatus] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  // AI Features State
  const [reviewSummary, setReviewSummary] = useState<any>(null);
  const [reviewProduct, setReviewProduct] = useState<any>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const [compareItems, setCompareItems] = useState<any[]>([]);
  const [comparisonResult, setComparisonResult] = useState<any>(null);
  const [isComparing, setIsComparing] = useState(false);

  // Advanced Filters State
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([]);

  const handleQueryChange = async (val: string) => {
    setQuery(val);
    if (searchMode === 'flights' && val.length > 2) {
      // Basic debounce would be better here, but calling directly for simplicity
      const data = await autocompleteAirports(val);
      if (data.airports) {
         setAutocompleteSuggestions(data.airports);
      }
    } else {
      setAutocompleteSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion: any) => {
    // Determine if user is typing origin or destination by checking ' to '
    if (query.includes(' to ')) {
      const parts = query.split(' to ');
      setQuery(`${parts[0].trim()} to ${suggestion.term || suggestion.id || suggestion.name}`);
    } else {
      setQuery(`${suggestion.term || suggestion.id || suggestion.name} to `);
    }
    setAutocompleteSuggestions([]);
  };

  const startVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice intelligence is not supported in this environment.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.onstart = () => {
      setIsListening(true);
    };
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      setIsListening(false);
      handleSearch(undefined, transcript);
    };
    recognition.onerror = () => {
      setIsListening(false);
    };
    recognition.start();
  };

  const handleSearch = async (e?: React.FormEvent, directQuery?: string) => {
    e?.preventDefault();
    const searchQuery = directQuery || query;
    if (!searchQuery.trim()) return;

    setLoading(true);
    setHasSearched(true);
    setShowFilters(false);
    setAutocompleteSuggestions([]);
    
    // Reward for searching
    updateUserCoins?.(10);
    
    // Reset all results
    setResults([]);
    setFlightResults([]);
    setFlightPriceInsights(null);
    setTrainResults([]);
    setFlightDeals([]);

    try {
      if (searchMode === 'shopping') {
        setSearchingStatus('Analyzing global markets...');
        const detected = await detectProduct(searchQuery);
        const features = await extractProductFeatures(detected);
        const data = await searchProducts(detected);
        
        if (data.shopping_results) {
           const processed = data.shopping_results.map((item: any) => {
             let rating = item.rating;
             let reviews = item.reviews;
             if (!rating) rating = (Math.random() * 1.5 + 3.5).toFixed(1);
             if (!reviews) reviews = Math.floor(Math.random() * 500) + 10;
             const brand = item.title.split(' ')[0].replace(/[^A-Za-z0-9]/g, '').toUpperCase();
             return { ...item, rating: Number(rating), reviews: Number(reviews), features, brand: brand || 'UNKNOWN' };
           });
           setResults(processed);
        }
      } else if (searchMode === 'flights') {
        setSearchingStatus('Scanning global flight matrices...');
        const parts = searchQuery.split(' to ');
        const dep = parts[0]?.trim().toUpperCase() || 'DEL';
        const arr = parts[1]?.trim().toUpperCase() || 'BOM';
        
        const data = await searchFlights(dep, arr);
        if (data.best_flights) {
          setFlightResults(data.best_flights);
          setFlightPriceInsights(data.price_insights);
        }

        // Fetch Deals for the departure airport
        const dealsData = await searchFlightDeals(dep);
        if (dealsData.deals) {
          setFlightDeals(dealsData.deals);
        }
      } else if (searchMode === 'trains') {
        setSearchingStatus('Connecting to railway networks...');
        const parts = searchQuery.split(' to ');
        const origin = parts[0]?.trim().toUpperCase() || 'NDLS';
        const dest = parts[1]?.trim().toUpperCase() || 'BCT';
        
        const data = await searchTrains(origin, dest);
        if (data.trains) {
          setTrainResults(data.trains);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setSearchingStatus('');
    }
  };

  const handleSummarize = async (product: any) => {
    setIsSummarizing(true);
    toast.loading("Generating AI Review Summary...", { id: 'summary' });
    const summary = await summarizeReviews(product.title, product.price);
    setReviewSummary(summary);
    setReviewProduct(product);
    setIsSummarizing(false);
    toast.success("Summary Generated!", { id: 'summary' });
  };

  const handleCompare = async (product: any) => {
    if (compareItems.find(p => p.title === product.title && p.source === product.source)) {
      setCompareItems(prev => prev.filter(p => p.title !== product.title || p.source !== product.source));
      toast.success("Removed from comparison.");
      return;
    }

    if (compareItems.length === 1) {
      const itemA = compareItems[0];
      const itemB = product;
      setCompareItems([itemA, itemB]);
      
      setIsComparing(true);
      toast.loading("Analyzing Head-to-Head Comparison...", { id: 'compare' });
      const result = await compareProducts(itemA, itemB);
      setComparisonResult(result);
      setIsComparing(false);
      toast.success("Comparison Complete!", { id: 'compare' });
    } else {
      setCompareItems([product]);
      setComparisonResult(null);
      toast.success("Select one more product to compare.");
    }
  };

  const uniqueBrands = useMemo(() => Array.from(new Set(results.map(r => r.brand))).slice(0, 10), [results]);
  const allSpecs = useMemo(() => {
     const specs = new Set<string>();
     results.forEach(r => r.features?.forEach((f: string) => specs.add(f)));
     return Array.from(specs);
  }, [results]);

  const filteredResults = useMemo(() => {
     return results.filter(item => {
        const pValue = typeof item.price === 'string' ? parseFloat(item.price.replace(/[^0-9.]/g, '')) || 0 : item.price;
        if (minPrice !== '' && pValue < Number(minPrice)) return false;
        if (maxPrice !== '' && pValue > Number(maxPrice)) return false;
        if (selectedBrands.length > 0 && !selectedBrands.includes(item.brand)) return false;
        if (selectedRating > 0 && item.rating < selectedRating) return false;
        
        if (selectedSpecs.length > 0) {
            const hasSpecs = selectedSpecs.every(spec => 
                item.features?.includes(spec) || item.title.toLowerCase().includes(spec.toLowerCase())
            );
            if (!hasSpecs) return false;
        }
        return true;
     });
  }, [results, minPrice, maxPrice, selectedBrands, selectedRating, selectedSpecs]);

  const handleSearchModeChange = (mode: 'shopping' | 'flights' | 'trains') => {
    setSearchMode(mode);
    setQuery('');
    setHasSearched(false);
    setResults([]);
    setFlightResults([]);
    setTrainResults([]);
    setFlightDeals([]);
    setAutocompleteSuggestions([]);
    setShowFilters(false);
  };

  return (
    <div className="min-h-screen pt-32 md:pt-44 pb-32 px-4 md:px-12 bg-transparent font-mono">
      <div className="max-w-[1400px] mx-auto">
        <header className="mb-16 md:mb-24 relative pt-10">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "circOut" }}
              className="mb-6"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-sm bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-8 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <Sparkles size={14} /> AI Shopping Node Active
              </div>
              <h1 className="massive-title mb-6">
                Terminal Access <br/>
                <span className="brand-text">Granted.</span>
              </h1>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <p className="text-lg md:text-xl text-slate-400 font-medium leading-relaxed tracking-wide">
                Initialize market scan. Compare prices, extract reviews, and isolate the best deals globally.
              </p>
            </motion.div>
          </div>
        </header>

        <section className="mb-16 md:mb-32 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={`glass-panel p-2 flex flex-col md:flex-row items-stretch md:items-center overflow-visible ${loading ? 'opacity-50' : ''}`}
          >
            <div className="flex space-x-1 p-2 md:p-0 md:pr-4 md:border-r border-slate-700">
              {(['shopping', 'flights', 'trains'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => handleSearchModeChange(mode)}
                  className={`px-4 py-2.5 text-[10px] uppercase tracking-widest font-bold rounded-sm transition-all ${
                    searchMode === mode ? 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)] border border-emerald-500/50' : 'text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            <div className="relative flex-grow flex items-center h-14 md:h-16 px-4">
              <Search className="mr-3 text-emerald-500/50" size={20} />
              <input
                type="text"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={searchMode === 'shopping' ? "INPUT MARKET QUERY" : "e.g. DEL to BOM"}
                className="bg-transparent border-none outline-none text-emerald-400 w-full text-lg font-bold placeholder:text-slate-600 uppercase tracking-widest"
              />

              {autocompleteSuggestions.length > 0 && (
                <div className="absolute top-[calc(100%+10px)] left-0 w-full bg-slate-900 border border-emerald-500/30 rounded-lg shadow-[0_0_20px_rgba(16,185,129,0.2)] z-50 overflow-hidden">
                  {autocompleteSuggestions.map((sug, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestionClick(sug)}
                      className="w-full text-left px-5 py-3 text-slate-300 hover:bg-emerald-500/10 hover:text-emerald-400 text-sm font-bold flex items-center gap-3 border-b border-slate-800 last:border-b-0 transition-colors uppercase tracking-widest"
                    >
                      <MapPin size={16} className="text-emerald-500" /> {sug.term || sug.id || sug.name}
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={() => setIsScanning(true)}
                className="ml-2 p-2 text-emerald-500/50 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-sm transition-colors"
                title="Scan Barcode"
              >
                <Camera size={20} />
              </button>
            </div>
            
            <div className="flex h-14 md:h-16 p-2 md:p-0 gap-2">
              <button 
                onClick={startVoiceSearch}
                className={`w-12 md:w-14 flex items-center justify-center rounded-sm transition-all ${isListening ? 'bg-emerald-500 text-black animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'}`}
              >
                <Mic size={20} />
              </button>
              <button
                onClick={() => handleSearch()}
                disabled={loading}
                className="btn-modern min-w-[120px] md:min-w-[160px] flex-grow md:flex-grow-0 h-full text-[10px] md:text-xs"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : 'INIT SEARCH'}
              </button>
            </div>
          </motion.div>

          {searchingStatus && (
              <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-bold text-emerald-400 flex items-center gap-2 uppercase tracking-widest"
            >
              <Loader2 size={12} className="animate-spin" />
              {searchingStatus}
            </motion.div>
          )}
        </section>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading-skeletons"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
            >
              {[1, 2, 3, 4].map((idx) => (
                <ProductSkeleton key={`skeleton-${idx}`} isBest={idx === 1} />
              ))}
            </motion.div>
          ) : hasSearched ? (
            <motion.div 
              key="results"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {searchMode === 'shopping' && (
                <>
                  <div className="mb-8 border border-emerald-500/20 bg-slate-900/50 backdrop-blur-md rounded-xl overflow-hidden shadow-[0_0_15px_rgba(16,185,129,0.05)]">
                    <button 
                      onClick={() => setShowFilters(!showFilters)}
                      className="w-full flex items-center justify-between p-4 hover:bg-emerald-500/5 transition-colors"
                    >
                      <div className="flex items-center gap-3 text-emerald-400">
                        <SlidersHorizontal size={20} className={showFilters ? 'text-cyan-400' : ''} />
                        <span className="font-bold tracking-widest text-xs uppercase">Filter Matrix</span>
                        {filteredResults.length !== results.length && (
                          <span className="ml-4 px-2 py-0.5 bg-[#FF3B30] text-white text-[10px] rounded-full font-black">
                            {filteredResults.length} / {results.length} MATCHES
                          </span>
                        )}
                      </div>
                      <ChevronDown size={20} className={`text-white transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                    </button>
                    
                    <AnimatePresence>
                      {showFilters && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-white/10"
                        >
                          <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-8 text-slate-300">
                            <div>
                              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <Tag size={12} className="text-emerald-500"/> Price Bounds (₹)
                              </div>
                              <div className="flex items-center gap-2">
                                <input type="number" placeholder="MIN" value={minPrice} onChange={e => setMinPrice(e.target.value ? Number(e.target.value) : '')} className="w-full bg-slate-800 border border-emerald-500/20 rounded-sm px-3 py-2 text-xs outline-none focus:border-emerald-500 text-white placeholder:text-slate-600" />
                                <span className="text-slate-600">-</span>
                                <input type="number" placeholder="MAX" value={maxPrice} onChange={e => setMaxPrice(e.target.value ? Number(e.target.value) : '')} className="w-full bg-slate-800 border border-emerald-500/20 rounded-sm px-3 py-2 text-xs outline-none focus:border-emerald-500 text-white placeholder:text-slate-600" />
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <Filter size={12} className="text-cyan-500"/> Entities
                              </div>
                              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-500/20">
                                {uniqueBrands.map(brand => (
                                  <button key={brand} onClick={() => setSelectedBrands(prev => prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand])} className={`px-2 py-1 text-[10px] font-bold tracking-widest rounded-sm border transition-all ${selectedBrands.includes(brand) ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                                    {brand}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <Star size={12} className="text-yellow-500"/> Trust Score
                              </div>
                              <div className="flex flex-col gap-2">
                                {[4.5, 4.0, 3.0].map(rating => (
                                  <button key={rating} onClick={() => setSelectedRating(prev => prev === rating ? 0 : rating)} className={`flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest transition-colors ${selectedRating === rating ? 'text-yellow-400' : 'text-slate-400 hover:text-slate-300'}`}>
                                    <div className={`w-3 h-3 border rounded-sm flex items-center justify-center ${selectedRating === rating ? 'bg-yellow-500/20 border-yellow-500' : 'border-slate-600'}`}>
                                      {selectedRating === rating && <Check size={10} className="text-yellow-500" />}
                                    </div>
                                    {rating}+ Level
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <Zap size={12} className="text-emerald-500"/> Metadata
                              </div>
                              <div className="flex flex-col gap-2 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-500/20">
                                {allSpecs.map(spec => (
                                  <button key={spec} onClick={() => setSelectedSpecs(prev => prev.includes(spec) ? prev.filter(s => s !== spec) : [...prev, spec])} className={`flex items-center gap-2 text-[10px] text-left transition-colors uppercase font-bold tracking-widest ${selectedSpecs.includes(spec) ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-300'}`}>
                                    <div className={`w-3 h-3 flex-shrink-0 border rounded-sm flex items-center justify-center ${selectedSpecs.includes(spec) ? 'bg-emerald-500/20 border-emerald-500' : 'border-slate-600'}`}>
                                      {selectedSpecs.includes(spec) && <Check size={10} className="text-emerald-500" />}
                                    </div>
                                    {spec}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]"></span>
                      <h2 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                        {filteredResults.length} ASSETS ISOLATED
                      </h2>
                    </div>
                    
                    <div className="flex gap-2">
                      <button onClick={() => setView('grid')} className={`p-2 rounded ${view === 'grid' ? 'bg-white/10 text-white' : 'text-white/40'}`}>
                        <Grid size={20} />
                      </button>
                      <button onClick={() => setView('list')} className={`p-2 rounded ${view === 'list' ? 'bg-white/10 text-white' : 'text-white/40'}`}>
                        <List size={20} />
                      </button>
                    </div>
                  </div>

                  {filteredResults.length === 0 ? (
                    <div className="text-center py-20">
                      <p className="text-white/30 font-black uppercase tracking-widest">NO ASSETS MATCH CURRENT PARAMETERS</p>
                    </div>
                  ) : view === 'list' ? (
                    <div className="flex flex-col gap-4">
                      {filteredResults.map((item, idx) => (
                        <ProductCard 
                          key={idx} 
                          product={item} 
                          isBest={idx === 0} 
                          onSummarize={handleSummarize}
                          onCompare={handleCompare}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                      {filteredResults.map((item, idx) => (
                        <div key={idx} className="relative">
                          {compareItems.find(p => p.title === item.title && p.source === item.source) && (
                            <div className="absolute -inset-1 border-2 border-[#a855f7] rounded-xl z-0 animate-pulse pointer-events-none" />
                          )}
                          <div className="relative z-10">
                            <ProductCard 
                              product={item} 
                              isBest={idx === 0} 
                              onSummarize={handleSummarize}
                              onCompare={handleCompare}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {searchMode === 'flights' && (
                <div>
                  <h2 className="text-sm font-black text-[#a855f7] uppercase tracking-widest mb-8">
                    {flightResults.length} FLIGHT ROUTES ISOLATED
                  </h2>
                  {flightResults.length === 0 ? (
                    <div className="text-center py-20 text-white/30 font-black uppercase tracking-widest">NO FLIGHTS FOUND</div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
                      {flightResults.map((flight, idx) => (
                        <FlightCard key={idx} flightData={flight} priceInsights={flightPriceInsights} />
                      ))}
                    </div>
                  )}

                  {flightDeals.length > 0 && (
                    <div className="mt-12">
                      <h2 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Tag className="text-[#a855f7]"/> TRENDING DESTINATION DEALS
                      </h2>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {flightDeals.slice(0, 4).map((deal, i) => (
                          <div key={i} className="bg-white/5 border border-white/10 p-4 rounded-xl hover:border-[#a855f7]/50 transition-colors cursor-pointer" onClick={() => setQuery(`DEL to ${deal.target || deal.city}`)}>
                             <p className="text-xs text-white/50 uppercase tracking-widest mb-1">To {deal.city || deal.target}</p>
                             <p className="text-lg font-black text-[#a855f7]">₹{deal.price}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {searchMode === 'trains' && (
                <div>
                  <h2 className="text-sm font-black text-[#10b981] uppercase tracking-widest mb-8">
                    {trainResults.length} TRAIN ROUTES ISOLATED
                  </h2>
                  {trainResults.length === 0 ? (
                    <div className="text-center py-20 text-white/30 font-black uppercase tracking-widest">NO TRAINS FOUND</div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {trainResults.map((train, idx) => (
                        <TrainCard key={idx} trainData={train} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12"
            >
              {searchMode === 'shopping' ? (
                <div className="w-full">
                  <div className="flex items-center gap-2 mb-6">
                    <Tag className="text-indigo-600" size={20} />
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">Trending Deals Today</h2>
                  </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { name: "Terminal Hack 15", discount: "SYSTEM BREACH", source: "DarkNet", img: "💻" },
                      { name: "Cyber Deck XM5", discount: "NODE UNLOCKED", source: "Nexus", img: "🎧" },
                      { name: "Neural Link S24", discount: "0-DAY EXPLOIT", source: "Grid", img: "🧠" },
                      { name: "Quantum Core M3", discount: "ROOT ACCESS", source: "Syndicate", img: "⚡" }
                    ].map((deal, i) => (
                      <div key={i} onClick={() => { setQuery(deal.name); handleSearch(undefined, deal.name); }} className="glass-panel p-5 cursor-pointer group hover:-translate-y-1 bg-slate-900/40">
                        <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center justify-center text-2xl mb-4 group-hover:bg-emerald-500/20 transition-all shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                          {deal.img}
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{deal.source}</p>
                        <p className="text-sm font-bold text-slate-200 mb-3 truncate">{deal.name}</p>
                        <span className="inline-block px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] uppercase font-bold tracking-widest rounded-sm">{deal.discount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-12 glass-panel mb-20 w-full max-w-md text-center">
                  <Search size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-lg font-bold text-gray-500">Ready to search?</p>
                  <p className="text-sm text-gray-400 mt-2">Enter your destination or query above to begin.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ChatAssistant results={filteredResults} />

      <footer className="w-full py-8 border-t border-emerald-500/20 mt-20 flex flex-col md:flex-row items-center justify-between text-[10px] uppercase tracking-widest text-slate-500 font-bold px-4 md:px-16 bg-[#020617]/50 backdrop-blur-md">
        <div>&copy; {new Date().getFullYear()} BuyHacket. All systems operational.</div>
        <div className="flex flex-wrap justify-center gap-6 mt-4 md:mt-0">
          <a href="#" className="hover:text-emerald-400 transition-colors">Data Privacy</a>
          <a href="#" className="hover:text-emerald-400 transition-colors">Protocols</a>
          <a href="#" className="hover:text-emerald-400 transition-colors">Root Access</a>
        </div>
      </footer>

      {/* Compare Floating Banner */}
      <AnimatePresence>
        {compareItems.length === 1 && !comparisonResult && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[150] bg-[#a855f7] text-white px-6 py-3 rounded-full font-black tracking-widest text-xs uppercase shadow-xl flex items-center gap-4"
          >
            <span>1 Product Selected</span>
            <span className="opacity-50">|</span>
            <span>Select another to compare</span>
            <button onClick={() => setCompareItems([])} className="ml-4 opacity-50 hover:opacity-100">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      <ReviewSummaryModal 
        isOpen={!!reviewSummary} 
        onClose={() => setReviewSummary(null)}
        summary={reviewSummary}
        productTitle={reviewProduct?.title || ''}
      />

      <ProductComparisonModal
        isOpen={!!comparisonResult}
        onClose={() => { setComparisonResult(null); setCompareItems([]); }}
        comparison={comparisonResult}
        productA={compareItems[0]}
        productB={compareItems[1]}
      />

      <BarcodeScanner
        isOpen={isScanning}
        onClose={() => setIsScanning(false)}
        onScan={(text) => {
          setQuery(text);
          handleSearch(undefined, text);
        }}
      />
    </div>
  );
}
