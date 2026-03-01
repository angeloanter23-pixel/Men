import React from 'react';
import { Category } from '../../types';

interface FilterProps {
  categories: Category[];
  activeCategory: string;
  onCategorySelect: (cat: string) => void;
}

// Category Filter Component
const Filter: React.FC<FilterProps> = ({ categories, activeCategory, onCategorySelect }) => {
  const categoryList = [
    { id: 'all', name: 'all', icon: 'fa-layer-group' }, 
    ...categories.filter(c => c.name.toLowerCase() !== 'uncategorized')
  ];

  return (
    <div className="px-6 mb-4">
      <div className="flex overflow-x-auto no-scrollbar gap-2 scroll-smooth pb-2">
        {categoryList.map((catObj) => {
          const cat = catObj.name;
          const isActive = activeCategory === cat;
          return (
            <button 
              key={cat} 
              onClick={() => onCategorySelect(cat)} 
              className={`shrink-0 px-3 py-2 text-[11px] font-bold tracking-tight whitespace-nowrap transition-all flex items-center gap-1.5 rounded-xl active:scale-[0.98] border border-white/50 ${
                isActive 
                  ? 'bg-[#FF6B00] text-white shadow-[inset_2px_2px_4px_#cc5500,inset_-2px_-2px_4px_#ff8100]' 
                  : 'bg-[#F2F2F7] text-slate-500 shadow-[3px_3px_6px_#d1d1d6,-3px_-3px_6px_#ffffff] hover:shadow-[5px_5px_10px_#d1d1d6,-5px_-5px_10px_#ffffff]'
              }`}
            >
              <i className={`fa-solid ${catObj.icon || 'fa-tag'} text-[11px] ${isActive ? 'text-white/80' : 'text-slate-400'}`}></i>
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
