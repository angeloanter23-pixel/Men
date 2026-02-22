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

      {/* HEADER SECTION */}
      <header className="px-6 pt-16 pb-2 max-w-2xl mx-auto">
        <Reveal noWait>
          <p className="text-[#FF6B00] text-[11px] font-black tracking-[0.4em] mb-3">{getGreeting()}</p>
          <h1 className="text-[42px] font-black tracking-tighter leading-[1] text-slate-900 mb-10">Discover our <br/><span className="text-slate-400">Menu</span></h1>
        </Reveal>
      </header>

      {/* TRENDING PICKS (Moved Above Search) */}
      {!searchQuery && (
        <Popular 
          items={popularItems} 
          onItemSelect={onItemSelect} 
          getPriceDisplay={getPriceDisplay} 
        />
      )}

      {/* SEARCH BAR */}
      <SearchBar 
        value={searchQuery} 
        onChange={onSearchChange} 
        onFilterClick={() => setIsFilterOpen(true)}
        suggestions={availableItems}
        onSuggestionClick={onItemSelect}
      />

      {/* CATEGORIES SECTION (Under Search Bar) */}
      <Filter 
        categories={categories} 
        activeCategory={activeCategory} 
        onCategorySelect={onCategorySelect} 
      />

      {/* MAIN GRID */}
      <ItemList 
        items={searchResults} 
        onItemSelect={onItemSelect} 
        getPriceDisplay={getPriceDisplay} 
        Reveal={Reveal}
        layout={layout}
      />

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
