import React, { useState, useMemo } from 'react';
import { MenuItem, Category } from '../types';

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
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return filteredItems;
    const query = searchQuery.toLowerCase().trim();
    return filteredItems.filter(item => 
      item.name.toLowerCase().includes(query) || 
      item.description.toLowerCase().includes(query) ||
      item.cat_name.toLowerCase().includes(query)
    );
  }, [filteredItems, searchQuery]);

  const suggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase().trim();
    return filteredItems.filter(item => 
      item.name.toLowerCase().includes(query)
    ).slice(0, 5);
  }, [filteredItems, searchQuery]);

  return (
    <div className="animate-fade-in w-full bg-[#FBFBFD]">
      {/* Header & Search Area */}
      <header className="px-6 py-10 md:py-20 max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
          <div className="space-y-2">
            <p className="text-[10px] font-black text-brand-primary uppercase tracking-[0.5em] mb-1 leading-none">Our Selection</p>
            <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.8] uppercase text-slate-900">
              Order your <br /><span className="text-brand-primary">food.</span>
            </h1>
          </div>
          
          <div className="relative w-full md:max-w-sm">
            <div className="relative group z-50">
              <i className="fa-solid fa-magnifying-glass absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 text-sm"></i>
              <input 
                type="text" 
                placeholder="Search food..." 
                value={searchQuery} 
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                onChange={(e) => onSearchChange(e.target.value)}
                className={`w-full bg-white border border-slate-100 py-5 pl-14 pr-6 transition-all outline-none text-base font-bold shadow-sm focus:border-brand-primary/20 ${isSearchFocused && suggestions.length > 0 ? 'rounded-t-2xl border-b-transparent' : 'rounded-2xl'}`}
                style={{ WebkitAppearance: 'none', boxShadow: isSearchFocused ? '0 10px 30px -10px rgba(0,0,0,0.05)' : '' }}
              />
              
              {/* Search Suggestions */}
              {isSearchFocused && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border-x border-b border-slate-100 rounded-b-2xl shadow-2xl overflow-hidden animate-fade-in z-50">
                  <div className="py-2">
                    <p className="px-5 py-2 text-[8px] font-black uppercase text-slate-300 tracking-[0.2em] border-b border-slate-50">Suggestions</p>
                    {suggestions.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          onItemSelect(item);
                          setIsSearchFocused(false);
                          onSearchChange('');
                        }}
                        className="w-full flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition-colors text-left group"
                      >
                        <img src={item.image_url} alt="" className="w-10 h-10 rounded-lg object-cover bg-slate-100" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black uppercase text-slate-800 truncate group-hover:text-brand-primary transition-colors">{item.name}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{item.cat_name} • ₱{item.price}</p>
                        </div>
                        <i className="fa-solid fa-arrow-right text-[10px] text-slate-200 group-hover:text-brand-primary group-hover:translate-x-1 transition-all"></i>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Popular Items */}
      {popularItems.length > 0 && !searchQuery && (
        <section className="mb-14">
          <div className="max-w-[1400px] mx-auto px-6 mb-5 flex items-center gap-4">
            <h2 className="font-black text-[10px] text-slate-400 uppercase tracking-[0.4em]">Popular Dishes 🔥</h2>
            <div className="h-px bg-slate-100 flex-1"></div>
          </div>
          <div className="flex overflow-x-auto gap-4 px-6 md:px-0 md:pl-[calc((100%-1400px)/2+24px)] no-scrollbar pb-6">
            {popularItems.map((item) => (
              <button 
                key={item.id} 
                onClick={() => onItemSelect(item)} 
                className="min-w-[180px] md:min-w-[220px] bg-white rounded-[2rem] p-3 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left group relative"
              >
                <div className="relative h-32 md:h-40 w-full mb-4 overflow-hidden rounded-[1.5rem] bg-slate-50">
                  <img src={item.image_url} alt={item.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700" />
                </div>
                <div className="px-2 pb-2">
                  <h3 className="text-[11px] font-black uppercase text-slate-900 truncate leading-none mb-1">{item.name}</h3>
                  <div className="flex justify-between items-center">
                    <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">{item.cat_name}</p>
                    <span className="text-brand-primary font-black text-[11px]">₱{item.price}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Sticky Tab Navigator */}
      <div className="sticky top-[72px] z-40 bg-white/95 backdrop-blur-3xl border-b border-slate-100 mb-8 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.02)]">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="py-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Categories</p>
            <div className="flex items-center gap-6">
              <h2 className="hidden md:block font-black text-[10px] text-slate-400 uppercase tracking-[0.4em] shrink-0">Menu /</h2>
              <div className="flex overflow-x-auto gap-2 no-scrollbar flex-1 items-center">
                <button 
                  onClick={() => onCategorySelect('all')}
                  className={`px-5 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all border shadow-sm ${activeCategory === 'all' ? 'bg-brand-primary text-white border-brand-primary shadow-lg shadow-brand-primary/20' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}
                >
                  All
                </button>
                {categories.map(cat => (
                  <button 
                    key={cat.id} 
                    onClick={() => onCategorySelect(cat.name)}
                    className={`px-5 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all border shadow-sm ${activeCategory === cat.name ? 'bg-brand-primary text-white border-brand-primary shadow-lg shadow-brand-primary/20' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Label */}
      <div className="max-w-[1400px] mx-auto px-6 mb-8 flex items-center gap-4">
        <h2 className="font-black text-[10px] text-slate-400 uppercase tracking-[0.4em]">
          {searchQuery ? `Search results for "${searchQuery}"` : 'All Food 🍽️'}
        </h2>
        <div className="h-px bg-slate-100 flex-1"></div>
      </div>

      {/* Main Grid List */}
      <div className="max-w-[1400px] mx-auto px-6 pb-48">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {searchResults.map(item => (
            <button 
              key={item.id} 
              onClick={() => onItemSelect(item)}
              className="w-full bg-white p-4 rounded-[2rem] border border-slate-50 shadow-sm transition-all hover:shadow-xl active:scale-[0.99] text-left group flex flex-col relative"
            >
              <div className="relative aspect-square w-full mb-6 overflow-hidden rounded-[1.5rem] bg-slate-50">
                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1s]" loading="lazy" />
                {item.is_popular && (
                  <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md text-white text-[7px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full">Trending</div>
                )}
              </div>
              <div className="px-1 flex-1 flex flex-col">
                <div className="mb-3">
                  <h4 className="font-black text-slate-900 text-xl uppercase tracking-tight leading-tight mb-1">{item.name}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-brand-primary uppercase tracking-widest">{item.cat_name}</span>
                    <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{item.serving_time}</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-6 font-medium">{item.description}</p>
                <div className="flex justify-between items-center mt-auto">
                  <span className="text-2xl font-black text-slate-900 tracking-tighter leading-none">₱{item.price}</span>
                  <div className="text-slate-200 group-hover:text-brand-primary transition-all pr-1">
                    <i className="fa-solid fa-plus-circle text-2xl"></i>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
        
        {searchResults.length === 0 && (
          <div className="py-64 text-center flex flex-col items-center">
            <div className="w-28 h-28 bg-slate-50 rounded-full flex items-center justify-center text-slate-100 text-5xl mb-8">
              <i className="fa-solid fa-magnifying-glass"></i>
            </div>
            <p className="text-slate-300 text-sm font-black uppercase tracking-[0.5em]">Nothing found</p>
            <button onClick={() => onSearchChange('')} className="mt-6 text-brand-primary font-black uppercase text-[10px] tracking-widest">Clear search</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuView;