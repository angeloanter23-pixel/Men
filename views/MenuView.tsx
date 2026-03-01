import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MenuItem, Category } from '../types';
import SearchBar from '../components/home/SearchBar';
import Filter from '../components/home/Filter';
import Popular from '../components/home/Popular';
import ItemList from '../components/home/ItemList';
import FilterModal from '../components/home/FilterModal';

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
  const [priceSort, setPriceSort] = useState<'asc' | 'desc' | 'none'>('none');
  const [layout, setLayout] = useState<'default' | 'compact' | 'minimal'>('compact');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Load all items once for group price calculation
  const [allItems, setAllItems] = useState<MenuItem[]>([]);
  useEffect(() => { setAllItems(filteredItems); }, []);

  const getPriceDisplay = (item: MenuItem) => {
    if (!item.has_variations) return `₱${item.price.toLocaleString()}`;
    const variants = allItems.filter(i => i.parent_id === item.id);
    if (variants.length === 0) return `₱${item.price.toLocaleString()}`;
    const minPrice = Math.min(...variants.map(v => v.price));
    return `₱${minPrice.toLocaleString()}`;
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="animate-fade-in w-full min-h-screen pb-40 bg-[#F2F2F7] font-jakarta selection:bg-orange-100">
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-4">
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden lg:block w-64 shrink-0 pt-16 sticky top-0 h-screen overflow-y-auto no-scrollbar px-6">
          <Reveal noWait>
            <p className="text-[#FF6B00] text-[13px] font-bold tracking-normal mb-1">{getGreeting()}</p>
            <h1 className="text-[32px] font-black tracking-tighter leading-[1] text-slate-900 mb-6">Our <br/><span className="text-slate-400">Menu</span></h1>
          </Reveal>

          <div className="space-y-2">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Categories</h3>
            {[{ id: 'all', name: 'all', icon: 'fa-layer-group' }, ...categories.filter(c => c.name.toLowerCase() !== 'uncategorized')].map((catObj) => {
              const cat = catObj.name;
              const isActive = activeCategory === cat;
              return (
                <button 
                  key={cat} 
                  onClick={() => onCategorySelect(cat)} 
                  className={`w-full px-3 py-2 rounded-xl text-left transition-all flex items-center gap-2 group border border-white/50 ${
                    isActive 
                      ? 'bg-[#FF6B00] text-white shadow-[inset_2px_2px_4px_#cc5500,inset_-2px_-2px_4px_#ff8100]' 
                      : 'bg-[#F2F2F7] text-slate-500 shadow-[3px_3px_6px_#d1d1d6,-3px_-3px_6px_#ffffff] hover:shadow-[5px_5px_10px_#d1d1d6,-5px_-5px_10px_#ffffff] active:scale-[0.98]'
                  }`}
                >
                  <i className={`fa-solid ${catObj.icon || 'fa-tag'} text-xs ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-900'}`}></i>
                  <span className="text-xs font-bold capitalize">{cat === 'all' ? 'All Items' : cat}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="flex-1">
          {/* MOBILE HEADER SECTION */}
          <header className="px-6 pt-8 pb-2 lg:hidden">
            <Reveal noWait>
              <p className="text-[#FF6B00] text-[13px] font-bold tracking-normal mb-1">{getGreeting()}</p>
              <h1 className="text-[42px] font-black tracking-tighter leading-[1] text-slate-900 mb-4">Discover our <br/><span className="text-slate-400">Menu</span></h1>
            </Reveal>
          </header>

          {/* SEARCH BAR */}
          <SearchBar 
            value={searchQuery} 
            onChange={onSearchChange} 
            onFilterClick={() => setIsFilterOpen(true)}
            suggestions={availableItems}
            onSuggestionClick={onItemSelect}
          />

          {/* TRENDING PICKS */}
          {!searchQuery && (
            <Popular 
              items={popularItems} 
              onItemSelect={onItemSelect} 
              getPriceDisplay={getPriceDisplay} 
            />
          )}

          {/* MOBILE CATEGORIES SECTION */}
          <div className="lg:hidden">
            <div className="px-6 mb-3 flex justify-between items-center">
              <h3 className="text-[20px] font-black text-slate-900 tracking-tighter">Categories</h3>
               <button onClick={() => setIsFilterOpen(true)} className="w-8 h-8 flex items-center justify-center text-slate-500 bg-[#F2F2F7] rounded-xl border border-white/50 shadow-[3px_3px_6px_#d1d1d6,-3px_-3px_6px_#ffffff] active:shadow-[inset_2px_2px_5px_#d1d1d6,inset_-2px_-2px_5px_#ffffff] active:scale-[0.98] transition-all">
                 <i className="fa-solid fa-sliders text-xs"></i>
               </button>
            </div>
            <Filter 
              categories={categories} 
              activeCategory={activeCategory} 
              onCategorySelect={onCategorySelect} 
            />
          </div>

          {/* MAIN GRID */}
          <ItemList 
            items={searchResults} 
            onItemSelect={onItemSelect} 
            getPriceDisplay={getPriceDisplay} 
            Reveal={Reveal}
            layout={layout}
          />
        </div>
      </div>

      <FilterModal 
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        currentSort={priceSort}
        currentLayout={layout}
        onApply={(settings) => {
          setPriceSort(settings.sort);
          setLayout(settings.layout);
        }}
      />
    </div>
  );
};

export default MenuView;
