import React, { useState, useMemo, useEffect } from 'react';
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
  const [allItems, setAllItems] = useState<MenuItem[]>([]);
  useEffect(() => { setAllItems(filteredItems); }, []);

  const getPriceDisplay = (item: MenuItem) => {
    if (!item.has_variations) return `₱${item.price.toLocaleString()}`;
    const variants = allItems.filter(i => i.parent_id === item.id);
    const minPrice = variants.length > 0 ? Math.min(...variants.map(v => v.price)) : item.price;
    return `₱${minPrice.toLocaleString()}+`;
  };

  const availableItems = useMemo(() => filteredItems.filter(item => item.is_available !== false && !item.parent_id), [filteredItems]);
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return availableItems;
    const query = searchQuery.toLowerCase().trim();
    return availableItems.filter(item => 
      item.name.toLowerCase().includes(query) || 
      item.cat_name.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query)
    );
  }, [availableItems, searchQuery]);

  return (
    <div className="min-h-screen bg-[#F8F8F8] pb-40 font-poppins">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 flex justify-between items-center">
        <div>
          <h2 className="text-slate-400 text-sm font-medium">Order Today</h2>
          <h1 className="text-xl font-bold text-[#D81B60] leading-none mt-1">Don't Wait, Order Fast!</h1>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-slate-100">
           <i className="fa-solid fa-bolt text-[#D81B60]"></i>
        </div>
      </header>

      {/* Grid */}
      <div className="px-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h4 className="text-sm font-bold text-slate-800">Featured Choices</h4>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {searchResults.map((item) => (
            <button key={item.id} onClick={() => onItemSelect(item)} className="bg-white p-4 rounded-[2rem] border border-slate-50 shadow-sm text-left group flex gap-4">
              <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 relative bg-slate-50 shadow-inner">
                 <img src={item.image_url} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
              </div>
              <div className="flex-1 flex flex-col justify-center min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h5 className="text-sm font-bold text-slate-800 truncate pr-2">{item.name}</h5>
                </div>
                <p className="text-[10px] text-slate-400 line-clamp-1 mb-2 leading-tight italic">{item.description}</p>
                <div className="flex items-center justify-between mt-auto">
                   <span className="text-[12px] font-black text-[#D81B60]">{getPriceDisplay(item)}</span>
                   <div className="flex items-center gap-1.5"><i className="fa-solid fa-clock text-[8px] text-slate-300"></i><span className="text-[8px] font-bold text-slate-300 uppercase">{item.serving_time}</span></div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ModernMenuView;