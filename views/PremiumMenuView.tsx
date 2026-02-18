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
  const [allItems, setAllItems] = useState<MenuItem[]>([]);
  useEffect(() => { setAllItems(filteredItems); }, []);
  
  const getMinPrice = (item: MenuItem) => {
    if (!item.has_variations) return item.price;
    const variants = allItems.filter(i => i.parent_id === item.id);
    return variants.length > 0 ? Math.min(...variants.map(v => v.price)) : item.price;
  };

  const availableItems = useMemo(() => filteredItems.filter(item => item.is_available !== false && !item.parent_id), [filteredItems]);
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return availableItems;
    const query = searchQuery.toLowerCase().trim();
    return availableItems.filter(item => item.name.toLowerCase().includes(query) || item.description?.toLowerCase().includes(query) || item.cat_name.toLowerCase().includes(query));
  }, [availableItems, searchQuery]);

  return (
    <div className="animate-fade-in w-full min-h-screen pb-40 bg-[#0A0A0B] text-white font-['Outfit']">
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
      </header>

      <div className="sticky top-[72px] z-40 bg-[#0A0A0B]/80 backdrop-blur-2xl border-b border-white/5 py-4">
        <div className="max-w-[1200px] mx-auto px-8">
          <div className="flex overflow-x-auto no-scrollbar gap-4 scroll-smooth">
            {['all', ...categories.map(c => c.name)].map((cat) => (
              <button key={cat} onClick={() => onCategorySelect(cat)} className={`px-8 py-4 rounded-[1.8rem] text-[13px] font-black tracking-widest whitespace-nowrap transition-all uppercase border ${activeCategory === cat ? 'bg-indigo-600 border-indigo-500 text-white shadow-[0_10px_25px_rgba(79,70,229,0.4)] scale-105' : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:text-white'}`}>
                {cat === 'all' ? 'Signature Selects' : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-8 mt-12">
        <Reveal delay={200}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {searchResults.map((item) => (
              <button key={item.id} onClick={() => onItemSelect(item)} className="w-full group text-left relative">
                <div className="relative aspect-[4/5] w-full rounded-[3.5rem] overflow-hidden bg-white/5 border border-white/5 shadow-2xl transition-all duration-700 group-hover:scale-[0.98] group-hover:border-indigo-500/30">
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover transition-transform duration-[10s] group-hover:scale-110 opacity-70 group-hover:opacity-100" />
                  <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black via-black/60 to-transparent">
                     <p className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-400 mb-2">{item.cat_name}</p>
                     <h4 className="text-3xl font-black tracking-tight leading-none italic uppercase mb-2">{item.name}</h4>
                     <p className="text-[11px] text-white/50 font-medium line-clamp-2 mb-6 italic leading-relaxed">{item.description}</p>
                     
                     <div className="flex items-end justify-between border-t border-white/10 pt-6 mt-2">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">{item.has_variations ? 'Starting at' : 'Investment'}</span>
                            <span className="text-[28px] font-black tracking-tighter text-indigo-100">₱{getMinPrice(item).toLocaleString()}</span>
                        </div>
                        <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-600/20 transform group-hover:rotate-12 transition-all">
                            <i className="fa-solid fa-arrow-right-long"></i>
                        </div>
                     </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Reveal>
      </div>
    </div>
  );
};

export default PremiumMenuView;