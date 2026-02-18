import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MenuItem, Category } from '../types';

const Reveal: React.FC<{ children: React.ReactNode; delay?: number; noWait?: boolean }> = ({ children, delay = 0, noWait = false }) => {
  const [isVisible, setIsVisible] = useState(noWait);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (noWait) return;
    const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      }, { threshold: 0.05 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [noWait]);

  return (
    <div ref={ref} style={{ transitionDelay: `${delay}ms`, transform: isVisible ? 'translateY(0)' : 'translateY(15px)', opacity: isVisible ? 1 : 0 }} className="transition-all duration-[600ms] ease-out">
      {children}
    </div>
  );
};

interface MenuViewProps {
  popularItems: MenuItem[];
  categories: Category[];
  filteredItems: MenuItem[]; 
  activeCategory: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCategorySelect: (cat: string) => void;
  onItemSelect: (item: MenuItem) => void;
}

const MenuView: React.FC<MenuViewProps> = ({ 
  popularItems, categories, filteredItems, activeCategory, searchQuery, 
  onSearchChange, onCategorySelect, onItemSelect 
}) => {
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [priceSort, setPriceSort] = useState<'asc' | 'desc' | 'none'>('none');

  // Load all items once for group price calculation
  const [allItems, setAllItems] = useState<MenuItem[]>([]);
  useEffect(() => { setAllItems(filteredItems); }, []);

  const getPriceDisplay = (item: MenuItem) => {
    if (!item.has_variations) return `₱${item.price.toLocaleString()}`;
    const variants = allItems.filter(i => i.parent_id === item.id);
    if (variants.length === 0) return `₱${item.price.toLocaleString()}`;
    const minPrice = Math.min(...variants.map(v => v.price));
    return `Starts at ₱${minPrice.toLocaleString()}`;
  };

  const availableItems = useMemo(() => filteredItems.filter(item => item.is_available !== false && !item.parent_id), [filteredItems]);
  
  const searchResults = useMemo(() => {
    let list = [...availableItems];
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      list = list.filter(item => item.name.toLowerCase().includes(query) || item.cat_name.toLowerCase().includes(query) || item.description?.toLowerCase().includes(query));
    }
    
    if (priceSort === 'asc') list.sort((a, b) => a.price - b.price);
    if (priceSort === 'desc') list.sort((a, b) => b.price - a.price);
    
    return list;
  }, [availableItems, searchQuery, priceSort]);

  const categoryList = useMemo(() => [{ id: 'all', name: 'all', icon: 'fa-layer-group' }, ...categories], [categories]);

  return (
    <div className="animate-fade-in w-full min-h-screen pb-40 bg-white font-jakarta">
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* HEADER SECTION */}
      <header className="px-6 pt-16 pb-2 max-w-2xl mx-auto">
        <Reveal noWait>
          <p className="text-[#FF6B00] text-[11px] font-black uppercase tracking-[0.4em] mb-3">Explore Catalog</p>
          <h1 className="text-[42px] font-black tracking-tighter leading-[1] uppercase text-slate-900 mb-10">Discover our <br/>Menu</h1>
        </Reveal>
      </header>

      {/* TRENDING PICKS */}
      {popularItems.length > 0 && !searchQuery && (
        <section className="mb-12">
          <div className="px-6 mb-6 max-w-2xl mx-auto">
            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Trending Picks</h3>
          </div>
          <div className="flex overflow-x-auto no-scrollbar gap-4 px-6 pb-4">
            <div className="flex gap-4">
              {popularItems.map((item) => (
                <div key={item.id} className="shrink-0">
                  <button 
                    onClick={() => onItemSelect(item)}
                    className="w-[220px] bg-white rounded-[2rem] p-3 text-left group active:scale-[0.98] transition-all border border-slate-100 shadow-sm flex flex-col"
                  >
                    <div className="aspect-square w-full rounded-[1.6rem] overflow-hidden mb-3 relative bg-slate-50">
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      <div className="absolute top-2.5 right-2.5 bg-white/95 backdrop-blur px-2.5 py-1.5 rounded-xl text-[10px] font-black text-slate-900 shadow-sm border border-slate-50">
                        {getPriceDisplay(item)}
                      </div>
                    </div>
                    <div className="px-1 pb-1 flex-1 flex flex-col">
                      <p className="text-[8px] font-black text-orange-600 uppercase tracking-widest mb-1">{item.cat_name}</p>
                      <h4 className="text-[14px] font-bold text-slate-900 leading-tight mb-1 line-clamp-1">{item.name}</h4>
                      <p className="text-[10px] text-slate-400 font-medium line-clamp-2 mb-3 leading-snug">{item.description}</p>
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CATEGORIES SECTION */}
      <section className="sticky top-[72px] z-40 bg-white/95 backdrop-blur-xl border-b border-slate-50 mb-12 pt-2">
        <div className="max-w-2xl mx-auto px-6">
          <div className="flex overflow-x-auto no-scrollbar gap-8 scroll-smooth pb-0">
            {categoryList.map((catObj) => {
              const cat = catObj.name;
              const isActive = activeCategory === cat;
              return (
                <button key={cat} onClick={() => onCategorySelect(cat)} className={`shrink-0 py-4 text-[13px] font-black tracking-tight whitespace-nowrap transition-all uppercase flex items-center gap-2.5 relative ${isActive ? 'text-[#FF6B00]' : 'text-slate-400 hover:text-slate-600'}`}>
                  <i className={`fa-solid ${catObj.icon || 'fa-tag'} text-[14px] ${isActive ? 'text-[#FF6B00]' : 'text-slate-200'}`}></i>
                  {cat === 'all' ? 'All Items' : cat}
                  {isActive && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#FF6B00] rounded-t-full animate-fade-in"></div>}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* MAIN GRID */}
      <div className="max-w-2xl mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {searchResults.map((item, idx) => (
            <Reveal key={item.id} noWait={idx < 4}>
              <button 
                onClick={() => onItemSelect(item)}
                className="w-full bg-white p-4 rounded-[2.5rem] border border-slate-100 flex flex-col text-left group active:scale-[0.98] transition-all hover:shadow-lg shadow-sm"
              >
                <div className="aspect-[4/3] w-full rounded-[2rem] overflow-hidden mb-5 bg-slate-50 relative">
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute top-4 right-4 bg-white/95 backdrop-blur px-3 py-1.5 rounded-xl text-[12px] font-black text-slate-900 border border-slate-50">
                      {getPriceDisplay(item)}
                  </div>
                </div>
                <div className="px-2 pb-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-orange-600 mb-1.5">{item.cat_name}</p>
                  <h4 className="text-[19px] font-bold text-slate-900 leading-tight mb-2 uppercase tracking-tight">{item.name}</h4>
                  <p className="text-[12px] text-slate-400 font-medium line-clamp-2 mb-4 leading-relaxed italic">{item.description}</p>
                  
                  {item.ingredients && item.ingredients.length > 0 && (
                    <div className="flex overflow-x-auto no-scrollbar gap-1.5 mb-5 pb-1">
                      {item.ingredients.map((ing: any, i) => (
                        <span key={i} className="px-2.5 py-1 bg-slate-50 text-slate-400 rounded-lg text-[8px] font-black uppercase tracking-widest border border-slate-100">
                          {typeof ing === 'string' ? ing : (ing.label || ing.name)}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-slate-300">
                      <div className="flex items-center gap-1.5"><i className="fa-solid fa-clock text-[9px]"></i><span className="text-[9px] font-black uppercase tracking-widest">{item.serving_time}</span></div>
                      <div className="flex items-center gap-1.5"><i className="fa-solid fa-user-group text-[9px]"></i><span className="text-[9px] font-black uppercase tracking-widest">{item.pax}</span></div>
                  </div>
                </div>
              </button>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MenuView;