
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MenuItem, Category } from '../types';

const Reveal: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      }, { threshold: 0.1 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ transitionDelay: `${delay}ms`, transform: isVisible ? 'translateY(0)' : 'translateY(20px)', opacity: isVisible ? 1 : 0 }} className="transition-all duration-[1000ms] ease-out">
      {children}
    </div>
  );
};

interface PremiumMenuViewProps {
  categories: Category[];
  filteredItems: MenuItem[]; 
  activeCategory: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCategorySelect: (cat: string) => void;
  onItemSelect: (item: MenuItem) => void;
}

const PremiumMenuView: React.FC<PremiumMenuViewProps> = ({ 
  categories, filteredItems, activeCategory, searchQuery, 
  onSearchChange, onCategorySelect, onItemSelect 
}) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  const availableItems = useMemo(() => filteredItems.filter(item => item.is_available !== false && !item.parent_id), [filteredItems]);
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return availableItems;
    const query = searchQuery.toLowerCase().trim();
    return availableItems.filter(item => item.name.toLowerCase().includes(query) || item.description.toLowerCase().includes(query) || item.cat_name.toLowerCase().includes(query));
  }, [availableItems, searchQuery]);

  return (
    <div className="animate-fade-in w-full min-h-screen pb-40 bg-[#0A0A0B] text-white font-['Outfit']">
      
      {/* LUXURY HERO HEADER */}
      <header className="px-8 pt-20 pb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
        <Reveal>
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]"></div>
                <p className="text-[11px] font-black uppercase tracking-[0.6em] text-indigo-400">Exclusive Reserve</p>
            </div>
            <h1 className="text-[52px] md:text-[96px] font-black tracking-tight leading-[0.9] italic uppercase">
              The <span className="text-indigo-500">Haute</span> <br/> Collection.
            </h1>
          </div>
        </Reveal>
        
        <Reveal delay={100}>
          <div className="relative max-w-xl group">
            <div className={`flex items-center gap-4 px-8 py-6 transition-all duration-500 border rounded-[2rem] bg-white/5 backdrop-blur-3xl border-white/10 ${isSearchFocused ? 'border-indigo-500 shadow-[0_0_50px_rgba(99,102,241,0.2)] scale-[1.02]' : 'hover:bg-white/[0.08]'}`}>
              <i className="fa-solid fa-magnifying-glass text-[18px] text-indigo-400"></i>
              <input 
                type="text" 
                placeholder="Seek your craving..." 
                value={searchQuery} 
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                onChange={(e) => onSearchChange(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-[18px] font-medium placeholder:text-white/20 italic"
              />
              {searchQuery && (
                  <button onClick={() => onSearchChange('')} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/30 hover:text-white"><i className="fa-solid fa-xmark text-xs"></i></button>
              )}
            </div>
          </div>
        </Reveal>
      </header>

      {/* HORIZONTAL CATEGORY SCROLLER */}
      <div className="sticky top-[72px] z-40 bg-[#0A0A0B]/80 backdrop-blur-2xl border-b border-white/5 py-4">
        <div className="max-w-[1200px] mx-auto px-8">
          <div className="flex overflow-x-auto no-scrollbar gap-4 scroll-smooth">
            {['all', ...categories.map(c => c.name)].map((cat) => (
              <button 
                key={cat} 
                onClick={() => onCategorySelect(cat)}
                className={`px-8 py-4 rounded-[1.8rem] text-[13px] font-black tracking-widest whitespace-nowrap transition-all uppercase border ${
                    activeCategory === cat 
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-[0_10px_25px_rgba(79,70,229,0.4)] scale-105' 
                    : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:text-white'
                }`}
              >
                {cat === 'all' ? 'Signature Full' : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* LUXURY GRID */}
      <div className="max-w-[1200px] mx-auto px-8 mt-12">
        <Reveal delay={200}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {searchResults.map((item) => (
              <button 
                key={item.id} 
                onClick={() => onItemSelect(item)}
                className="w-full group text-left relative"
              >
                {/* Image Reveal Layer */}
                <div className="relative aspect-[4/5] w-full rounded-[3.5rem] overflow-hidden bg-white/5 border border-white/5 shadow-2xl transition-all duration-700 group-hover:scale-[0.98] group-hover:border-indigo-500/30">
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover transition-transform duration-[10s] group-hover:scale-110 opacity-70 group-hover:opacity-100" />
                  
                  {/* Glassmorphism Overlay Info */}
                  <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black via-black/40 to-transparent">
                     <p className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-400 mb-2">{item.cat_name}</p>
                     <h4 className="text-3xl font-black tracking-tight leading-none italic uppercase mb-4">{item.name}</h4>
                     
                     <div className="flex items-end justify-between border-t border-white/10 pt-6 mt-2">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Starting at</span>
                            <span className="text-[28px] font-black tracking-tighter text-indigo-100">₱{item.price.toLocaleString()}</span>
                        </div>
                        <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-600/20 transform group-hover:rotate-12 transition-all">
                            <i className="fa-solid fa-arrow-right-long"></i>
                        </div>
                     </div>
                  </div>

                  {item.is_popular && (
                      <div className="absolute top-8 left-8 px-4 py-2 bg-indigo-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl">Trending</div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {searchResults.length === 0 && (
              <div className="py-40 text-center opacity-20">
                  <i className="fa-solid fa-cloud-moon text-6xl mb-6"></i>
                  <p className="text-xl font-black uppercase italic tracking-widest">Nothing matches your search</p>
              </div>
          )}
        </Reveal>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default PremiumMenuView;
