
import React, { useState, useMemo } from 'react';
import { MenuItem, Category } from '../types';

interface ModernMenuViewProps {
  categories: Category[];
  filteredItems: MenuItem[];
  activeCategory: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCategorySelect: (cat: string) => void;
  onItemSelect: (item: MenuItem) => void;
}

const ModernMenuView: React.FC<ModernMenuViewProps> = ({
  categories,
  filteredItems,
  activeCategory,
  searchQuery,
  onSearchChange,
  onCategorySelect,
  onItemSelect
}) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const availableItems = useMemo(() => filteredItems.filter(item => item.is_available !== false && !item.parent_id), [filteredItems]);
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return availableItems;
    const query = searchQuery.toLowerCase().trim();
    return availableItems.filter(item => 
      item.name.toLowerCase().includes(query) || 
      item.cat_name.toLowerCase().includes(query)
    );
  }, [availableItems, searchQuery]);

  return (
    <div className="min-h-screen bg-[#F8F8F8] pb-40 font-poppins">
      {/* Header with Greeting */}
      <header className="px-6 pt-12 pb-6 flex justify-between items-center">
        <div>
          <h2 className="text-slate-400 text-sm font-medium">Hi Guest</h2>
          <h1 className="text-xl font-bold text-[#D81B60] leading-none mt-1">Don't Wait, Order Your Food!</h1>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-slate-100">
           <i className="fa-solid fa-bell text-[#D81B60]"></i>
        </div>
      </header>

      {/* Promo Banner */}
      <div className="px-6 mb-8">
        <div className="bg-[#D81B60] rounded-[2.5rem] p-6 text-white relative overflow-hidden flex items-center min-h-[160px]">
           <div className="relative z-10 w-2/3">
             <h3 className="text-lg font-bold leading-tight mb-2">Burgers with 10% Discount!</h3>
             <p className="text-xs text-white/80 mb-4 font-light">Enjoy our delicious burgers at a lower price.</p>
             <button className="bg-white text-[#D81B60] px-4 py-2 rounded-full text-[10px] font-bold uppercase shadow-sm">Order Now</button>
           </div>
           <div className="absolute right-0 top-1/2 -translate-y-1/2 w-40 h-40 rotate-12 opacity-90 translate-x-4">
              <img src="https://images.unsplash.com/photo-1586190848861-99aa4a171e90?q=80&w=400" className="w-full h-full object-contain" />
           </div>
        </div>
      </div>

      {/* Categories Horizontal */}
      <div className="mb-8">
        <div className="flex justify-between items-center px-6 mb-4">
          <h4 className="text-sm font-bold text-slate-800">Categories</h4>
          <button className="text-[10px] font-bold text-slate-400 uppercase">See All</button>
        </div>
        <div className="flex overflow-x-auto no-scrollbar gap-4 px-6 scroll-smooth">
          {['all', ...categories.map(c => c.name)].map((cat) => (
            <button 
              key={cat} 
              onClick={() => onCategorySelect(cat)}
              className="flex flex-col items-center gap-3 shrink-0"
            >
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${
                activeCategory === cat ? 'bg-[#D81B60] shadow-lg shadow-[#D81B60]/20' : 'bg-white border border-slate-50'
              }`}>
                <i className={`fa-solid ${cat === 'all' ? 'fa-list' : cat === 'Main Course' ? 'fa-bowl-food' : 'fa-burger'} ${
                  activeCategory === cat ? 'text-white' : 'text-slate-300'
                }`}></i>
              </div>
              <span className={`text-[10px] font-bold uppercase ${activeCategory === cat ? 'text-[#D81B60]' : 'text-slate-400'}`}>
                {cat === 'all' ? 'All' : cat}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid of items */}
      <div className="px-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-sm font-bold text-slate-800">Popular</h4>
          <button className="text-[10px] font-bold text-slate-400 uppercase">See All</button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {searchResults.map((item) => (
            <button 
              key={item.id} 
              onClick={() => onItemSelect(item)}
              className="bg-white p-3 rounded-[2rem] border border-slate-50 shadow-sm text-left group"
            >
              <div className="aspect-square w-full rounded-2xl overflow-hidden mb-3 relative">
                 <img src={item.image_url} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                 <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/80 backdrop-blur shadow-sm flex items-center justify-center">
                    <i className="fa-regular fa-heart text-[#D81B60] text-xs"></i>
                 </div>
              </div>
              <h5 className="text-xs font-bold text-slate-800 line-clamp-1 mb-1">{item.name}</h5>
              <div className="flex items-center justify-between mb-2">
                 <span className="text-[11px] font-black text-[#D81B60]">₱{item.price}</span>
                 <div className="flex items-center gap-1">
                    <i className="fa-solid fa-star text-amber-400 text-[8px]"></i>
                    <span className="text-[8px] font-bold text-slate-400">4.9</span>
                 </div>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-slate-50">
                 <i className="fa-solid fa-clock text-[8px] text-slate-300"></i>
                 <span className="text-[8px] font-bold text-slate-300 uppercase">{item.serving_time}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ModernMenuView;
