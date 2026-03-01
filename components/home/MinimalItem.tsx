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
      className="w-full flex items-center gap-4 p-3 bg-[#F2F2F7] rounded-2xl shadow-[5px_5px_10px_#d1d1d6,-5px_-5px_10px_#ffffff] hover:shadow-[7px_7px_14px_#d1d1d6,-7px_-7px_14px_#ffffff] transition-all duration-300 group border border-white/50 active:scale-[0.99] overflow-hidden"
    >
      <div className="w-24 h-24 shrink-0 rounded-xl overflow-hidden relative bg-slate-100 shadow-inner">
        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
      </div>
      
      <div className="flex-1 min-w-0 text-left flex flex-col h-24 py-1">
        <div className="flex items-center gap-1.5 mb-1.5 flex-nowrap overflow-hidden">
           <div className="flex items-center gap-1 bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full shadow-sm shrink-0">
              <i className="fa-solid fa-user-group text-[7px] shrink-0"></i>
              <span className="text-[8px] font-bold whitespace-nowrap">{item.pax || '1-2'}</span>
           </div>
           <div className="flex items-center gap-1 bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full shadow-sm shrink-0">
              <i className="fa-solid fa-clock text-[7px] shrink-0"></i>
              <span className="text-[8px] font-bold whitespace-nowrap">{item.serving_time || '15m'}</span>
           </div>
        </div>

        <h4 className="text-[14px] font-bold text-slate-900 leading-tight mb-1 line-clamp-2">{item.name}</h4>

        <div className="mt-auto flex items-center justify-between">
           <span className="text-[13px] font-black text-slate-900 tracking-tight truncate mr-2">{getPriceDisplay(item)}</span>
           
           <div className="w-8 h-8 rounded-full bg-[#F2F2F7] text-slate-900 flex items-center justify-center shadow-[3px_3px_6px_#d1d1d6,-3px_-3px_6px_#ffffff] group-hover:shadow-inner transition-all shrink-0">
              <i className="fa-solid fa-plus text-[10px]"></i>
           </div>
        </div>
      </div>
    </button>
  );
};

export default MinimalItem;
