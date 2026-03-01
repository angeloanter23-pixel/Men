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
      className="w-full flex flex-col transition-all duration-300 group active:scale-[0.98] rounded-2xl bg-[#F2F2F7] shadow-[5px_5px_10px_#d1d1d6,-5px_-5px_10px_#ffffff] hover:shadow-[7px_7px_14px_#d1d1d6,-7px_-7px_14px_#ffffff] border border-white/50 overflow-hidden h-full"
    >
      <div className="aspect-square w-full bg-slate-100 relative overflow-hidden shadow-inner shrink-0">
        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
      </div>
      <div className="p-3 text-left w-full flex flex-col flex-1">
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

        <h4 className="text-[13px] font-bold text-slate-900 leading-tight mb-2 line-clamp-2 min-h-[2.4em]">{item.name}</h4>
        
        <div className="flex items-center justify-between mt-auto">
           <span className="text-[12px] font-black text-slate-900 tracking-tight truncate mr-2">{getPriceDisplay(item)}</span>
           <div className="w-8 h-8 rounded-full bg-[#F2F2F7] text-slate-900 flex items-center justify-center shadow-[3px_3px_6px_#d1d1d6,-3px_-3px_6px_#ffffff] group-hover:shadow-inner transition-all shrink-0">
              <i className="fa-solid fa-plus text-[10px]"></i>
           </div>
        </div>
      </div>
    </button>
  );
};

export default CompactItem;
