import React from 'react';
import { MenuItem } from '../../types';

interface MinimalItemProps {
  item: MenuItem;
  onItemSelect: (item: MenuItem) => void;
  getPriceDisplay: (item: MenuItem) => string;
}

const MinimalItem: React.FC<MinimalItemProps> = ({ item, onItemSelect, getPriceDisplay }) => {
  return (
    <button 
      onClick={() => onItemSelect(item)}
      className="w-full flex items-center gap-5 p-4 bg-white rounded-[24px] shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] transition-all duration-300 group border border-slate-100/60 active:scale-[0.99]"
    >
      <div className="w-28 h-28 shrink-0 rounded-2xl overflow-hidden relative bg-slate-100 shadow-inner">
        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
      </div>
      
      <div className="flex-1 min-w-0 text-left flex flex-col h-28 py-1.5">
        <div className="flex-1">
          <h4 className="text-[17px] font-bold text-slate-900 leading-tight mb-1.5 line-clamp-2">{item.name}</h4>
          <p className="text-[13px] text-slate-500 line-clamp-1 font-medium">{item.description || item.cat_name}</p>
        </div>

        <div className="mt-auto flex items-end justify-between">
          <div className="flex flex-col gap-1">
             <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">{item.serving_time}</span>
             </div>
             <span className="text-[18px] font-black text-slate-900 tracking-tight">{getPriceDisplay(item)}</span>
          </div>
          
          <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-900/20 group-hover:scale-110 transition-transform">
             <i className="fa-solid fa-plus text-sm"></i>
          </div>
        </div>
      </div>
    </button>
  );
};

export default MinimalItem;
