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

  // Only show items that are available
  const availableItems = useMemo(() => {
    return filteredItems.filter(item => item.is_available !== false);
  }, [filteredItems]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return availableItems;
    const query = searchQuery.toLowerCase().trim();
    return availableItems.filter(item => 
      item.name.toLowerCase().includes(query) || 
      item.description.toLowerCase().includes(query) ||
      item.cat_name.toLowerCase().includes(query)
    );
  }, [availableItems, searchQuery]);

  const suggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase().trim();
    return availableItems.filter(item => 
      item.name.toLowerCase().includes(query)
    ).slice(0, 5);
  }, [availableItems, searchQuery]);

  // Only show popular items that are available
  const availablePopular = useMemo(() => {
    return popularItems.filter(item => item.is_available !== false);
  }, [popularItems]);

  return (
    <div className="animate-fade-in w-full bg-white">
      {/* Header & Search Area */}
      <header className="px-6 py-10 md:py-20 max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-brand-primary uppercase tracking-[0.5em] mb-2 leading-none">Curated Selection</p>
            <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.85] uppercase text-slate-900">
              Browse our <br /><span className="text-brand-primary">Menu.</span>
            </h1>
          </div>
          
          <div className="relative w-full md:max-w-sm">
            <div className="relative group z-50">
              <i className="fa-solid fa-magnifying-glass absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 text-sm"></i>
              <input 
                type="text" 
                placeholder="Find your favorite..." 
                value={searchQuery} 
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                onChange={(e) => onSearchChange(e.target.value)}
                className={`w-full bg-slate-50 border border-slate-100 py-5 pl-14 pr-6 transition-all outline-none text-base font-bold shadow-inner focus:border-indigo-200 focus:bg-white focus:ring-4 ring-indigo-500/5 ${isSearchFocused && suggestions.length > 0 ? 'rounded-t-[2rem] border-b-transparent' : 'rounded-[2rem]'}`}
                style={{ WebkitAppearance: 'none' }}
              />
              
              {/* Search Suggestions */}
              {isSearchFocused && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border-x border-b border-slate-100 rounded-b-[2rem] shadow-2xl overflow-hidden animate-fade-in z-50">
                  <div className="py-3">
                    <p className="px-6 py-2 text-[8px] font-black uppercase text-slate-300 tracking-[0.3em] border-b border-slate-50 mb-1">Matching Results</p>
                    {suggestions.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          onItemSelect(item);
                          setIsSearchFocused(false);
                          onSearchChange('');
                        }}
                        className="w-full flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50 transition-colors text-left group"
                      >
                        <img src={item.image_url} alt="" className="w-12 h-12 rounded-xl object-cover bg-slate-100 border border-slate-100 shadow-sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black uppercase text-slate-800 truncate group-hover:text-brand-primary transition-colors">{item.name}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">₱{item.price} • {item.cat_name}</p>
                        </div>
                        <i className="fa-solid fa-arrow-right text-[10px] text-slate-200 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all"></i>
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
      {availablePopular.length > 0 && !searchQuery && (
        <section className="mb-14">
          <div className="max-w-[1400px] mx-auto px-6 mb-6 flex items-center gap-4">
            <h2 className="font-black text-[10px] text-slate-900 uppercase tracking-[0.5em]">Today's Specials</h2>
            <div className="h-px bg-slate-100 flex-1"></div>
          </div>
          <div className="flex overflow-x-auto gap-5 px-6 md:px-0 md:pl-[calc((100%-1400px)/2+24px)] no-scrollbar pb-8">
            {availablePopular.map((item) => (
              <button 
                key={item.id} 
                onClick={() => onItemSelect(item)} 
                className="min-w-[200px] md:min-w-[260px] bg-white rounded-[2.5rem] p-4 border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 text-left group relative"
              >
                <div className="relative h-40 md:h-52 w-full mb-5 overflow-hidden rounded-[2rem] bg-slate-50 shadow-inner">
                  <img src={item.image_url} alt={item.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-[1.5s]" />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm">
                    <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest">₱{item.price}</span>
                  </div>
                </div>
                <div className="px-2 pb-2">
                  <h3 className="text-sm font-black uppercase text-slate-900 truncate leading-none mb-1.5 tracking-tight">{item.name}</h3>
                  <div className="flex justify-between items-center">
                    <p className="text-[9px] font-black text-brand-primary uppercase tracking-[0.2em]">{item.cat_name}</p>
                    <i className="fa-solid fa-plus-circle text-slate-100 group-hover:text-brand-primary transition-colors text-lg"></i>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Sticky Tab Navigator */}
      <div className="sticky top-[72px] z-40 bg-white/90 backdrop-blur-3xl border-b border-slate-100 mb-10 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.03)]">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="py-5">
            <div className="flex items-center gap-6">
              <h2 className="hidden md:block font-black text-[10px] text-slate-300 uppercase tracking-widest shrink-0">Filter /</h2>
              <div className="flex overflow-x-auto gap-3 no-scrollbar flex-1 items-center">
                <button 
                  onClick={() => onCategorySelect('all')}
                  className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border shadow-sm ${activeCategory === 'all' ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-100' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}
                >
                  Everything
                </button>
                {categories.map(cat => (
                  <button 
                    key={cat.id} 
                    onClick={() => onCategorySelect(cat.name)}
                    className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border shadow-sm ${activeCategory === cat.name ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-100' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}
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
      <div className="max-w-[1400px] mx-auto px-6 mb-10 flex items-center gap-4">
        <h2 className="font-black text-[10px] text-slate-400 uppercase tracking-[0.5em]">
          {searchQuery ? `Search: ${searchQuery}` : 'Full Inventory'}
        </h2>
        <div className="h-px bg-slate-50 flex-1"></div>
      </div>

      {/* Main Grid List */}
      <div className="max-w-[1400px] mx-auto px-6 pb-48">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
          {searchResults.map(item => (
            <button 
              key={item.id} 
              onClick={() => onItemSelect(item)}
              className="w-full bg-white p-5 rounded-[3rem] border border-slate-50 shadow-sm transition-all hover:shadow-2xl hover:border-indigo-50 active:scale-[0.98] text-left group flex flex-col relative"
            >
              <div className="relative aspect-square w-full mb-6 overflow-hidden rounded-[2.2rem] bg-slate-50 shadow-inner">
                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1s]" loading="lazy" />
                {item.is_popular && (
                  <div className="absolute top-5 left-5 bg-slate-900/90 backdrop-blur-md text-white text-[8px] font-black uppercase tracking-[0.3em] px-4 py-2 rounded-full shadow-lg">Featured</div>
                )}
              </div>
              <div className="px-2 flex-1 flex flex-col">
                <div className="mb-4">
                  <h4 className="font-black text-slate-900 text-2xl uppercase tracking-tight italic leading-tight mb-2 truncate pr-2">{item.name}</h4>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{item.cat_name}</span>
                    <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">{item.serving_time}</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mb-8 font-medium">{item.description}</p>
                <div className="flex justify-between items-center mt-auto">
                  <div className="flex flex-col">
                     <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1 leading-none">Price</span>
                     <span className="text-3xl font-black text-slate-900 tracking-tighter leading-none">₱{item.price}</span>
                  </div>
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 group-hover:bg-brand-primary group-hover:text-white transition-all shadow-sm">
                    <i className="fa-solid fa-plus text-sm"></i>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
        
        {searchResults.length === 0 && (
          <div className="py-64 text-center flex flex-col items-center">
            <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center text-slate-100 text-5xl mb-10 shadow-inner">
              <i className="fa-solid fa-search"></i>
            </div>
            <p className="text-slate-300 text-sm font-black uppercase tracking-[0.6em]">No results found</p>
            <button onClick={() => onSearchChange('')} className="mt-8 bg-slate-900 text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">Clear Search</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuView;