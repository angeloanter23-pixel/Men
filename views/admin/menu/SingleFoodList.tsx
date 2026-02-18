import React, { useState, useRef } from 'react';
import { MenuItem } from '../../../types';

interface SingleFoodListProps {
  items: MenuItem[];
  onEdit: (item: MenuItem) => void;
  onDelete: (item: MenuItem) => void;
  onAddNew: () => void;
  onDiagnosticRefresh?: () => void;
  loading?: boolean;
}

const SingleFoodList: React.FC<SingleFoodListProps> = ({ items, onEdit, onDelete, onAddNew, onDiagnosticRefresh, loading }) => {
  const [actionSheetItem, setActionSheetItem] = useState<MenuItem | null>(null);
  const [isPressing, setIsPressing] = useState<string | null>(null);
  const longPressTimer = useRef<number | null>(null);

  const startPress = (item: MenuItem) => {
    setIsPressing(String(item.id));
    longPressTimer.current = window.setTimeout(() => {
      if ('vibrate' in navigator) navigator.vibrate(40);
      setActionSheetItem(item);
      setIsPressing(null);
    }, 600);
  };

  const endPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setIsPressing(null);
  };

  return (
    <div className="space-y-6 animate-fade-in px-2 pb-20 font-jakarta select-none" style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }}>
      <div className="flex justify-between items-center px-4">
        <div className="flex items-center gap-3">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none">Dish List ({items.length})</h3>
            {onDiagnosticRefresh && (
                <button 
                  onClick={onDiagnosticRefresh}
                  className={`w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all shadow-sm ${loading ? 'animate-spin' : ''}`}
                >
                    <i className="fa-solid fa-arrows-rotate text-[10px]"></i>
                </button>
            )}
        </div>
        <button 
          onClick={onAddNew}
          className="text-[#007AFF] text-[13px] font-bold active:opacity-50 transition-opacity"
        >
          Add Dish
        </button>
      </div>

      <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-200/60 overflow-hidden divide-y divide-slate-100">
        {items.length > 0 ? items.map((item) => {
          const isCurrentPress = isPressing === String(item.id);
          return (
            <div 
              key={item.id} 
              onMouseDown={() => startPress(item)}
              onMouseUp={endPress}
              onMouseLeave={endPress}
              onTouchStart={() => startPress(item)}
              onTouchEnd={endPress}
              onClick={() => !actionSheetItem && onEdit(item)}
              onContextMenu={(e) => e.preventDefault()}
              className={`flex items-center justify-between p-4 transition-all cursor-pointer ${isCurrentPress ? 'scale-[0.98] bg-slate-50' : 'active:bg-slate-50'}`}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-14 h-14 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-50">
                  <img src={item.image_url} className="w-full h-full object-cover" alt="" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-[16px] truncate leading-none">{item.name}</h4>
                    {item.is_popular && <i className="fa-solid fa-star text-[10px] text-amber-500"></i>}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] font-bold text-indigo-600 tracking-widest">{item.cat_name}</span>
                    <span className="text-[10px] font-bold text-slate-400">₱{item.price.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <i className="fa-solid fa-chevron-right text-[10px] text-slate-200"></i>
              </div>
            </div>
          );
        }) : (
          <div className="py-24 text-center space-y-4 opacity-40">
            <i className="fa-solid fa-plate-wheat text-4xl text-slate-200"></i>
            <p className="text-[10px] font-bold uppercase text-slate-300 tracking-[0.4em]">Empty List</p>
          </div>
        )}
      </div>

      {/* APPLE ACTION SHEET */}
      {actionSheetItem && (
          <div className="fixed inset-0 z-[5000] flex items-end justify-center animate-fade-in p-4">
              <div onClick={() => setActionSheetItem(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
              <div className="relative w-full max-w-lg space-y-3 animate-slide-up flex flex-col">
                  <div className="bg-white/95 backdrop-blur-2xl rounded-[1.5rem] overflow-hidden flex flex-col divide-y divide-slate-100 shadow-2xl">
                      <div className="px-6 py-6 text-center">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-2 leading-none">Management</p>
                          <h4 className="text-[17px] font-bold text-slate-900 leading-none truncate px-4">{actionSheetItem.name}</h4>
                      </div>
                      <button onClick={() => { onEdit(actionSheetItem); setActionSheetItem(null); }} className="w-full py-5 text-[#007AFF] font-bold text-[20px] transition-colors active:bg-slate-100 flex items-center justify-center gap-3">
                        Edit Dish
                      </button>
                      <button onClick={() => { onDelete(actionSheetItem); setActionSheetItem(null); }} className="w-full py-5 text-rose-500 font-bold text-[20px] transition-colors active:bg-slate-100 flex items-center justify-center gap-3">
                        Delete Dish
                      </button>
                  </div>
                  <button onClick={() => setActionSheetItem(null)} className="w-full bg-white py-5 rounded-[1.5rem] font-bold text-[18px] text-[#007AFF] shadow-xl active:scale-[0.98] transition-all">
                    Cancel
                  </button>
              </div>
          </div>
      )}

      <style>{`
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.23, 1, 0.32, 1) forwards; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default SingleFoodList;