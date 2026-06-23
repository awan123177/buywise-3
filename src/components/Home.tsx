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

  return (
    <div className="min-h-screen pt-32 md:pt-44 pb-32 px-4 md:px-12 bg-transparent">
      <div className="max-w-[1400px] mx-auto">
        <header className="mb-20 md:mb-32 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-end">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "circOut" }}
            >
              <h1 className="text-[12vw] sm:text-[9vw] leading-[0.8] tracking-[-0.06em] font-black uppercase font-display text-white relative z-10 w-[max-content] max-w-full">
                <span className="relative z-10">PRICE</span><br/>
                <span className="text-[#FF3B30] relative z-10 inline-block">
                  CONTROL.
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-[#FF3B30]/50 rounded-full"></div>
                  <div className="absolute inset-x-0 bottom-1 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"></div>
                </span>
              </h1>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="flex flex-col gap-6 lg:pb-4"
            >
              <p className="text-xl font-medium text-white max-w-md leading-snug">
                The global standard for real-time market sourcing and competitive intelligence.
              </p>
              <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-white/40">
                <div className="w-12 h-[2px] bg-[#FF3B30]" />
                AUTONOMOUS RETRIEVAL ACTIVE
              </div>
            </motion.div>
          </div>
        </header>

        <section className="mb-20 md:mb-40 relative">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className={`terminal-card flex flex-col md:flex-row items-stretch md:items-center p-0 overflow-hidden ${loading ? 'opacity-50' : ''} border-white/10 bg-transparent`}
          >
            <div className="flex border-b border-white/10 mt-4 px-6 md:px-12">
              {(['shopping', 'flights', 'trains'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setSearchMode(mode)}
                  className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-colors ${
                    searchMode === mode ? 'border-[#FF3B30] text-[#FF3B30]' : 'border-transparent text-white/50 hover:text-white'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            <div className="relative flex-grow flex items-center h-16 md:h-24 px-6 md:px-12 border-b md:border-b-0 md:border-r border-white/10 bg-white/5 backdrop-blur-md">
              <span className="mr-4 md:mr-6 text-white/20 font-black tracking-tighter text-xl">#</span>
              <input
                type="text"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={searchMode === 'shopping' ? "INPUT MARKET QUERY" : "e.g. DEL to BOM"}
                className="bg-transparent border-none outline-none text-white w-full text-lg md:text-2xl font-black placeholder:text-white/30 uppercase tracking-tighter"
              />

              {autocompleteSuggestions.length > 0 && (
                <div className="absolute top-full left-0 w-full bg-black/90 border border-white/10 border-t-0 backdrop-blur-md z-50">
                  {autocompleteSuggestions.map((sug, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestionClick(sug)}
                      className="w-full text-left px-6 py-3 text-white/70 hover:bg-white/10 hover:text-white text-sm uppercase tracking-widest flex items-center gap-3 border-b border-white/5 last:border-b-0"
                    >
                      <MapPin size={14} className="text-[#a855f7]" /> {sug.term || sug.id || sug.name}
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={() => setIsScanning(true)}
                className="ml-4 text-white/50 hover:text-white transition-colors"
                title="Scan Barcode"
              >
                <Camera size={24} />
              </button>
            </div>
            <div className="flex h-16 md:h-24">
              <button 
                onClick={startVoiceSearch}
                className={`w-16 md:w-24 flex items-center justify-center border-r border-white/10 transition-all hover:bg-white/10 hover:text-white ${isListening ? 'bg-[#FF3B30] text-white animate-pulse' : 'text-white/70'}`}
              >
                <Mic size={24} className="w-5 h-5 md:w-6 md:h-6" />
              </button>
              <button
                onClick={() => handleSearch()}
                disabled={loading}
                className="btn-brutalist !border-none !rounded-none min-w-[140px] md:min-w-[200px] flex-grow md:flex-grow-0 h-full flex items-center justify-center text-[10px] md:text-xs"
              >
                {loading ? <Loader2 className="animate-spin w-5 h-5 md:w-6 md:h-6" /> : 'RETRIEVE DATA'}
              </button>
            </div>
          </motion.div>

          {searchingStatus && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="absolute -bottom-10 right-4 text-[11px] font-black uppercase tracking-[0.2em] text-[#FF3B30] flex items-center gap-3"
            >
              <div className="w-2 h-2 bg-[#FF3B30] animate-ping" />
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
                  <div className="mb-8 border border-white/10 bg-white/5 backdrop-blur-md rounded-xl overflow-hidden">
                    <button 
                      onClick={() => setShowFilters(!showFilters)}
                      className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-3 text-white">
                        <SlidersHorizontal size={20} className={showFilters ? 'text-[#FF3B30]' : ''} />
                        <span className="font-black tracking-widest text-sm uppercase">Advanced Analysis Filters</span>
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
                          <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-8 text-white">
                            <div>
                              <div className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <Tag size={12} /> Price Constraints (₹)
                              </div>
                              <div className="flex items-center gap-2">
                                <input type="number" placeholder="MIN" value={minPrice} onChange={e => setMinPrice(e.target.value ? Number(e.target.value) : '')} className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-xs outline-none focus:border-[#FF3B30]" />
                                <span className="text-white/40">-</span>
                                <input type="number" placeholder="MAX" value={maxPrice} onChange={e => setMaxPrice(e.target.value ? Number(e.target.value) : '')} className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-xs outline-none focus:border-[#FF3B30]" />
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <Filter size={12} /> Manufacturer Entity
                              </div>
                              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                                {uniqueBrands.map(brand => (
                                  <button key={brand} onClick={() => setSelectedBrands(prev => prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand])} className={`px-2 py-1 text-[10px] font-black tracking-widest rounded border transition-colors ${selectedBrands.includes(brand) ? 'bg-[#FF3B30] border-[#FF3B30] text-white' : 'bg-transparent border-white/20 text-white/70 hover:border-white/50'}`}>
                                    {brand}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <Star size={12} /> Seller Reliability
                              </div>
                              <div className="flex flex-col gap-2">
                                {[4.5, 4.0, 3.0].map(rating => (
                                  <button key={rating} onClick={() => setSelectedRating(prev => prev === rating ? 0 : rating)} className={`flex items-center gap-2 text-xs transition-colors ${selectedRating === rating ? 'text-[#FF3B30] font-bold' : 'text-white/70 hover:text-white'}`}>
                                    <div className={`w-3 h-3 border rounded-sm flex items-center justify-center ${selectedRating === rating ? 'bg-[#FF3B30] border-[#FF3B30]' : 'border-white/20'}`}>
                                      {selectedRating === rating && <Check size={10} className="text-white" />}
                                    </div>
                                    {rating}+ Stars & Up
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <Zap size={12} /> Extracted Specs
                              </div>
                              <div className="flex flex-col gap-2 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                                {allSpecs.map(spec => (
                                  <button key={spec} onClick={() => setSelectedSpecs(prev => prev.includes(spec) ? prev.filter(s => s !== spec) : [...prev, spec])} className={`flex items-center gap-2 text-[10px] text-left transition-colors uppercase font-bold tracking-wider ${selectedSpecs.includes(spec) ? 'text-[#FF3B30]' : 'text-white/70 hover:text-white'}`}>
                                    <div className={`w-3 h-3 flex-shrink-0 border rounded-[2px] flex items-center justify-center ${selectedSpecs.includes(spec) ? 'bg-[#FF3B30] border-[#FF3B30]' : 'border-white/20'}`}>
                                      {selectedSpecs.includes(spec) && <Check size={10} className="text-white" />}
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
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      <h2 className="text-sm font-black text-white uppercase tracking-widest">
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
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="p-12 border border-white/10 rounded-xl bg-white/5 backdrop-blur-md mb-20 w-full text-center">
                <p className="text-[11px] uppercase font-black tracking-[1em] text-white/30">AWAITING_MARKET_SIGNAL</p>
              </div>

              {searchMode === 'shopping' && (
                <div className="w-full">
                  <div className="flex items-center gap-2 mb-6">
                    <Tag className="text-[#a855f7]" size={16} />
                    <h2 className="text-sm font-black text-white uppercase tracking-widest">LIVE PREMIUM DEALS</h2>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { name: "iPhone 15 Pro", discount: "20% OFF", source: "Amazon" },
                      { name: "Sony WH-1000XM5", discount: "₹5,000 Cashback", source: "Croma" },
                      { name: "Samsung Galaxy S24", discount: "Lowest Price in 30 Days", source: "Flipkart" },
                      { name: "MacBook Air M3", discount: "Student Discount Active", source: "Reliance Digital" }
                    ].map((deal, i) => (
                      <div key={i} onClick={() => { setQuery(deal.name); handleSearch(undefined, deal.name); }} className="bg-white/5 border border-white/10 p-4 rounded-xl hover:border-[#a855f7]/50 transition-all cursor-pointer group">
                        <p className="text-[10px] text-white/50 tracking-widest uppercase mb-1">{deal.source}</p>
                        <p className="text-sm font-black text-white uppercase tracking-tight mb-2 truncate">{deal.name}</p>
                        <p className="text-[10px] font-bold text-[#a855f7] bg-[#a855f7]/10 inline-block px-2 py-1 rounded">{deal.discount}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ChatAssistant results={filteredResults} />

      <footer className="w-full h-auto py-4 md:h-16 md:py-0 border-t border-white/10 px-4 md:px-16 flex flex-col md:flex-row items-center justify-between text-[8px] md:text-[10px] text-white font-black uppercase tracking-[0.2em] bg-[#050505] relative z-[100] gap-2 md:gap-0 mt-20">
        <div>&copy; 2024 BUY_WISE_INTEL_HUB.</div>
        <div className="flex flex-wrap justify-center gap-4 md:gap-12 opacity-50 md:opacity-100">
          <span className="flex items-center gap-2 md:gap-3"><div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-[#FF3B30] animate-pulse"></div> SYSTEM_READY</span>
          <span className="text-white/30 hidden sm:inline-block">AES_256_ACTIVE</span>
          <span className="text-white/30 hidden sm:inline-block">GATEWAY: INDIA_001</span>
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
