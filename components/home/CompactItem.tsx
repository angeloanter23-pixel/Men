import React from 'react';
import { MenuItem } from '../../types';

interface CompactItemProps {
  item: MenuItem;
  onItemSelect: (item: MenuItem) => void;
  getPriceDisplay: (item: MenuItem) => string;
}

const CompactItem: React.FC<CompactItemProps> = ({ item, onItemSelect, getPriceDisplay }) => {
  return (
    <button 
      onClick={() => onItemSelect(item)}
      className="w-full flex flex-col bg-white rounded-[24px] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] hover:shadow-[0_8px_25px_-5px_rgba(0,0,0,0.1)] transition-all duration-300 group overflow-hidden border border-slate-100/60 active:scale-[0.98]"
    >
      <div className="aspect-square w-full bg-slate-100 relative overflow-hidden">
        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        {/* Price Tag Overlay */}
        <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg shadow-sm border border-white/50">
           <span className="text-[11px] font-black text-slate-900 tracking-tight">{getPriceDisplay(item)}</span>
        </div>
      </div>
      <div className="p-4 text-left w-full">
        <h4 className="text-[15px] font-bold text-slate-900 leading-tight mb-1 line-clamp-2 h-[2.5em]">{item.name}</h4>
        <p className="text-[12px] text-slate-400 mb-3 line-clamp-1 font-medium">{item.cat_name}</p>
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-1.5 text-slate-400 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
              <i className="fa-solid fa-clock text-[9px]"></i>
              <span className="text-[10px] font-bold">{item.serving_time}</span>
           </div>
           <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-900 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-colors shadow-sm">
              <i className="fa-solid fa-plus text-[10px]"></i>
           </div>
        </div>
      </div>
    </button>
  );
};

export default CompactItem;
