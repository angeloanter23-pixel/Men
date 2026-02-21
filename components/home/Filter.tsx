import React from 'react';
import { Category } from '../../types';

interface FilterProps {
  categories: Category[];
  activeCategory: string;
  onCategorySelect: (cat: string) => void;
}

const Filter: React.FC<FilterProps> = ({ categories, activeCategory, onCategorySelect }) => {
  const categoryList = [
    { id: 'all', name: 'all', icon: 'fa-layer-group' }, 
    ...categories.filter(c => c.name.toLowerCase() !== 'uncategorized')
  ];

  return (
    <div className="max-w-2xl mx-auto px-6 mb-8">
      <div className="flex overflow-x-auto no-scrollbar gap-3 scroll-smooth pb-2">
        {categoryList.map((catObj) => {
          const cat = catObj.name;
          const isActive = activeCategory === cat;
          return (
            <button 
              key={cat} 
              onClick={() => onCategorySelect(cat)} 
              className={`shrink-0 px-5 py-2.5 text-[14px] font-bold tracking-tight whitespace-nowrap transition-all flex items-center gap-2.5 rounded-full shadow-sm active:scale-95 ${
                isActive 
                  ? 'bg-slate-900 text-white border border-slate-900' 
                  : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <i className={`fa-solid ${catObj.icon || 'fa-tag'} text-[13px] ${isActive ? 'text-white/80' : 'text-slate-400'}`}></i>
              <span>
                {cat === 'all' ? 'All' : cat}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Filter;
