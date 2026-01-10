
import React from 'react';
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
  return (
    <div className="animate-fade-in">
      <header className="px-6 py-8">
        <h1 className="text-4xl font-black tracking-tight mb-6 leading-tight">What's on your <br /><span className="text-orange-500">mind today?</span></h1>
        <div className="relative group">
          <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors"></i>
          <input 
            type="text" placeholder="Search favorite dishes..." value={searchQuery} onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-orange-500 transition-all outline-none text-sm shadow-sm"
          />
        </div>
      </header>

      <section className="mb-8">
        <h2 className="px-6 font-black text-lg mb-4 text-slate-800">Popular 🔥</h2>
        <div className="flex overflow-x-auto gap-5 px-6 no-scrollbar pb-2">
          {popularItems.map(item => (
            <div key={item.id} onClick={() => onItemSelect(item)} className="min-w-[160px] group cursor-pointer">
              <div className="relative h-48 w-full mb-3 overflow-hidden rounded-[2.5rem] shadow-lg border-4 border-white transition-all group-hover:shadow-orange-100">
                <img src={item.image_url} alt={item.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <span className="absolute bottom-4 left-4 text-white font-black text-sm">₱{item.price}</span>
              </div>
              <h3 className="text-xs font-bold text-slate-800 ml-2 truncate">{item.name}</h3>
            </div>
          ))}
        </div>
      </section>

      <div className="flex overflow-x-auto gap-3 px-6 py-4 no-scrollbar sticky top-16 bg-white/90 backdrop-blur-md z-30 mb-4 border-b border-slate-50">
        {['all', ...categories.map(c => c.name)].map(cat => (
          <button 
            key={cat} onClick={() => onCategorySelect(cat)}
            className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all shadow-sm border ${activeCategory === cat ? 'bg-orange-500 text-white border-orange-500 shadow-orange-100' : 'bg-white text-slate-400 border-slate-100'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="px-6 space-y-6 pb-24">
        {filteredItems.map(item => (
          <div 
            key={item.id} onClick={() => onItemSelect(item)}
            className="flex gap-4 bg-white p-4 rounded-[2.5rem] shadow-sm border border-slate-100 transition-all duration-300 hover:shadow-xl hover:translate-y-[-2px] cursor-pointer active:scale-[0.98]"
          >
            <div className="relative w-24 h-24 flex-shrink-0 overflow-hidden rounded-3xl bg-slate-50">
              <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
            </div>
            <div className="flex-1 flex flex-col justify-center py-1">
              <div className="flex justify-between items-start mb-1">
                <h4 className="font-bold text-slate-800 text-sm leading-tight pr-2">{item.name}</h4>
                <span className="text-orange-600 font-black text-sm">₱{item.price}</span>
              </div>
              <p className="text-[10px] text-slate-400 mb-3 line-clamp-2 leading-relaxed">{item.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{item.serving_time}</span>
                <i className="fa-solid fa-chevron-right text-slate-200 text-xs"></i>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MenuView;
