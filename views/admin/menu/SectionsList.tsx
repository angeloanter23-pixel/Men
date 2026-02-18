import React, { useState, useRef } from 'react';
import { Category } from '../../../types';

interface SectionsListProps {
  cats: Category[];
  onAdd: (name: string) => void;
  onDelete: (id: string | number) => void;
  onEdit?: (cat: Category) => void;
  loading: boolean;
}

const SectionsList: React.FC<SectionsListProps> = ({ cats, onAdd, onDelete, onEdit, loading }) => {
  const [newCatName, setNewCatName] = useState('');
  const [actionSheetItem, setActionSheetItem] = useState<Category | null>(null);
  const [isPressing, setIsPressing] = useState<string | null>(null);
  const longPressTimer = useRef<number | null>(null);

  const handleAdd = () => {
    if (!newCatName.trim()) return;
    onAdd(newCatName.trim());
    setNewCatName('');
  };

  const startPress = (item: Category) => {
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
    <div className="space-y-6 animate-fade-in px-2 font-jakarta">
      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200/60 space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">New Category Label</label>
          <div className="flex gap-3">
            <input 
              type="text" 
              value={newCatName} 
              onChange={e => setNewCatName(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              className="flex-1 bg-slate-50 border border-transparent p-5 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:border-slate-100 transition-all shadow-inner" 
              placeholder="e.g. Signature Dishes" 
            />
            <button 
              onClick={handleAdd} 
              disabled={loading || !newCatName.trim()} 
              className="px-8 bg-[#007AFF] text-white rounded-2xl font-bold uppercase text-[10px] tracking-widest shadow-xl active:scale-95 disabled:opacity-50 transition-all"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center px-4">
        <h3 className="text-[10px] font-bold uppercase text-slate-400 tracking-[0.2em] leading-none">Category Registry ({cats.length})</h3>
      </div>

      <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-200/60 overflow-hidden divide-y divide-slate-100">
        {cats.length > 0 ? cats.map((cat) => {
          const isCurrentPress = isPressing === String(cat.id);
          return (
            <div 
              key={cat.id} 
              onMouseDown={() => startPress(cat)}
              onMouseUp={endPress}
              onMouseLeave={endPress}
              onTouchStart={() => startPress(cat)}
              onTouchEnd={endPress}
              onClick={() => !actionSheetItem && onEdit?.(cat)}
              className={`flex items-center justify-between p-5 transition-all cursor-pointer ${isCurrentPress ? 'scale-[0.98] bg-slate-50' : 'active:bg-slate-50'}`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center border border-slate-100/50 shadow-sm"><i className="fa-solid fa-tag text-xs"></i></div>
                <span className="font-bold text-slate-800 uppercase tracking-tight text-lg">{cat.name}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <i className="fa-solid fa-chevron-right text-[10px] text-slate-200"></i>
              </div>
            </div>
          );
        }) : (
          <div className="py-24 text-center opacity-20 text-[11px] font-bold uppercase tracking-widest">No Categories Defined</div>
        )}
      </div>

      {/* APPLE ACTION SHEET */}
      {actionSheetItem && (
          <div className="fixed inset-0 z-[5000] flex items-end justify-center animate-fade-in p-4">
              <div onClick={() => setActionSheetItem(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
              
              <div className="relative w-full max-w-lg space-y-3 animate-slide-up flex flex-col">
                  <div className="bg-white/95 backdrop-blur-2xl rounded-[1.5rem] overflow-hidden flex flex-col divide-y divide-slate-100 shadow-2xl">
                      <div className="px-6 py-6 text-center">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-2 leading-none">Category Management</p>
                          <h4 className="text-[17px] font-bold text-slate-900 uppercase leading-none truncate px-4">{actionSheetItem.name}</h4>
                      </div>
                      
                      <button 
                        onClick={() => { if(onEdit) onEdit(actionSheetItem); setActionSheetItem(null); }}
                        className="w-full py-5 text-[#007AFF] font-bold text-[20px] transition-colors active:bg-slate-100 flex items-center justify-center gap-3"
                      >
                        Edit Label
                      </button>

                      <button 
                        onClick={() => { onDelete(actionSheetItem.id); setActionSheetItem(null); }}
                        className="w-full py-5 text-rose-500 font-bold text-[20px] transition-colors active:bg-slate-100 flex items-center justify-center gap-3"
                      >
                        Delete Section
                      </button>
                  </div>

                  <button 
                    onClick={() => setActionSheetItem(null)}
                    className="w-full bg-white py-5 rounded-[1.5rem] font-bold text-[18px] text-[#007AFF] shadow-xl active:scale-[0.98] transition-all"
                  >
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

export default SectionsList;