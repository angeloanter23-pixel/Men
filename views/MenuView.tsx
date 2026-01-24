
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
    <div className="animate-fade-in w-full bg-slate-50/30">
      {/* Header & Search */}
      <header className="px-6 py-8 md:py-16 max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
          <div>
            <p className="text-[10px] md:text-[12px] font-black text-orange-500 uppercase tracking-[0.4em] mb-3 italic">Curated Experience</p>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-0 leading-[0.85] italic uppercase text-slate-900">
              What's on your <br /><span className="text-orange-500">mind today?</span>
            </h1>
          </div>
          <div className="relative group w-full md:max-w-md">
            <i className="fa-solid fa-magnifying-glass absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors"></i>
            <input 
              type="text" 
              placeholder="Search favorite dishes..." 
              value={searchQuery} 
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-white border border-slate-100 rounded-3xl py-5 md:py-6 pl-16 pr-8 focus:ring-4 focus:ring-orange-500/5 transition-all outline-none text-sm md:text-base font-bold shadow-xl shadow-slate-200/50"
            />
          </div>
        </div>
      </header>

      {/* Popular Section */}
      {popularItems.length > 0 && (
        <section className="mb-12 md:mb-20">
          <div className="max-w-[1400px] mx-auto px-6 flex justify-between items-center mb-6">
            <h2 className="font-black text-xl md:text-2xl text-slate-800 uppercase italic tracking-tight">Popular 🔥</h2>
            <div className="hidden md:flex gap-2">
               <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-300 border border-slate-100"><i className="fa-solid fa-chevron-left text-[10px]"></i></div>
               <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-900 border border-slate-200 shadow-sm"><i className="fa-solid fa-chevron-right text-[10px]"></i></div>
            </div>
          </div>
          <div className="flex overflow-x-auto gap-6 px-6 md:px-0 md:pl-[calc((100%-1400px)/2+24px)] lg:pl-[calc((100%-1400px)/2+24px)] no-scrollbar pb-8">
            {popularItems.map(item => (
              <button 
                key={item.id} 
                onClick={() => onItemSelect(item)} 
                className="min-w-[200px] md:min-w-[320px] group cursor-pointer block text-left"
              >
                <div className="relative h-64 md:h-80 w-full mb-4 overflow-hidden rounded-[3rem] shadow-xl border-4 border-white transition-all duration-500 group-hover:shadow-orange-200 group-hover:-translate-y-2">
                  <img src={item.image_url} alt={item.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                  <div className="absolute bottom-6 left-8 text-white">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-400 mb-1 italic">{item.cat_name}</p>
                    <h3 className="text-lg md:text-xl font-black italic uppercase leading-none">{item.name}</h3>
                  </div>
                  <span className="absolute top-6 right-8 bg-white/90 backdrop-blur px-4 py-2 rounded-2xl text-orange-600 font-black text-sm shadow-lg">₱{item.price}</span>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Sticky Category Bar */}
      <div className="sticky top-0 md:top-20 z-30 bg-white/80 backdrop-blur-2xl border-b border-slate-100/50 mb-8 py-2">
        <div className="max-w-[1400px] mx-auto px-6 flex overflow-x-auto gap-3 no-scrollbar py-4">
          <button 
            onClick={() => onCategorySelect('all')}
            className={`px-8 py-3 rounded-2xl text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all shadow-sm border flex items-center gap-3 ${activeCategory === 'all' ? 'bg-orange-500 text-white border-orange-500 shadow-orange-200' : 'bg-white text-slate-400 border-slate-100 hover:border-orange-200'}`}
          >
            <i className="fa-solid fa-list-ul"></i>
            all
          </button>
          {categories.map(cat => (
            <button 
              key={cat.id} onClick={() => onCategorySelect(cat.name)}
              className={`px-8 py-3 rounded-2xl text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all shadow-sm border flex items-center gap-3 ${activeCategory === cat.name ? 'bg-orange-500 text-white border-orange-500 shadow-orange-200' : 'bg-white text-slate-400 border-slate-100 hover:border-orange-200'}`}
            >
              <i className={`fa-solid ${cat.icon || 'fa-folder'}`}></i>
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid List */}
      <div className="max-w-[1400px] mx-auto px-6 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
          {filteredItems.map(item => (
            <button 
              key={item.id} 
              onClick={() => onItemSelect(item)}
              className="w-full bg-white p-5 rounded-[3rem] shadow-sm border border-slate-100 transition-all duration-500 hover:shadow-2xl hover:shadow-slate-200/50 hover:-translate-y-2 cursor-pointer active:scale-[0.98] text-left group"
            >
              <div className="relative aspect-video md:aspect-square w-full mb-6 overflow-hidden rounded-[2.5rem] bg-slate-50 shadow-inner">
                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" loading="lazy" />
                {item.is_popular && (
                  <div className="absolute top-4 left-4 bg-orange-500 text-white text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">Trending</div>
                )}
              </div>
              <div className="px-2 pb-2">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-black text-slate-800 text-base md:text-lg italic uppercase tracking-tight leading-tight pr-4">{item.name}</h4>
                  <span className="text-indigo-600 font-black text-base italic">₱{item.price}</span>
                </div>
                <p className="text-xs text-slate-400 mb-6 line-clamp-2 leading-relaxed font-medium">{item.description}</p>
                <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                  <span className="text-[9px] md:text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] italic">{item.serving_time}</span>
                  <div className="w-8 h-8 rounded-full bg-slate-50 text-slate-300 flex items-center justify-center group-hover:bg-orange-50 group-hover:text-orange-500 transition-all">
                    <i className="fa-solid fa-plus text-[10px]"></i>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
        
        {filteredItems.length === 0 && (
          <div className="py-40 text-center flex flex-col items-center">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-slate-100 text-4xl mb-6 shadow-sm border border-slate-50">
              <i className="fa-solid fa-utensils"></i>
            </div>
            <p className="text-slate-300 text-sm font-black uppercase tracking-[0.5em] italic">No dishes match your search</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuView;
