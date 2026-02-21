import React from 'react';
import { Category } from '../../../types';

interface FilterProps {
  categories: Category[];
  activeCategory: string;
  onCategorySelect: (cat: string) => void;
}

const Filter: React.FC<FilterProps> = ({ categories, activeCategory, onCategorySelect }) => {
  const categoryList = [{ id: 'all', name: 'all', icon: 'fa-layer-group' }, ...categories];

  return (
    <section className="sticky top-[72px] z-40 bg-white/95 backdrop-blur-xl border-b border-slate-50 mb-12 pt-2">
      <div className="max-w-2xl mx-auto px-6">
        <div className="flex overflow-x-auto no-scrollbar gap-8 scroll-smooth pb-0">
          {categoryList.map((catObj) => {
            const cat = catObj.name;
            const isActive = activeCategory === cat;
            return (
              <button 
                key={cat} 
                onClick={() => onCategorySelect(cat)} 
                className={`shrink-0 py-4 text-[13px] font-black tracking-tight whitespace-nowrap transition-all uppercase flex items-center gap-2.5 relative ${isActive ? 'text-[#FF6B00]' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <i className={`fa-solid ${catObj.icon || 'fa-tag'} text-[14px] ${isActive ? 'text-[#FF6B00]' : 'text-slate-200'}`}></i>
                {cat === 'all' ? 'All Items' : cat}
                {isActive && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#FF6B00] rounded-t-full animate-fade-in"></div>}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Filter;
