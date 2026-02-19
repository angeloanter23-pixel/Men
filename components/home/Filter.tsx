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
      <div className="flex overflow-x-auto no-scrollbar gap-6 scroll-smooth">
        {categoryList.map((catObj) => {
          const cat = catObj.name;
          const isActive = activeCategory === cat;
          return (
            <button 
              key={cat} 
              onClick={() => onCategorySelect(cat)} 
              className={`shrink-0 py-2 text-[13px] font-bold tracking-tight whitespace-nowrap transition-all flex items-center gap-2 relative ${isActive ? 'text-[#FF6B00]' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <i className={`fa-solid ${catObj.icon || 'fa-tag'} text-[12px] ${isActive ? 'text-[#FF6B00]' : 'text-slate-200'}`}></i>
              {cat === 'all' ? 'All' : cat}
              {isActive && <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#FF6B00] rounded-full animate-fade-in"></div>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Filter;
