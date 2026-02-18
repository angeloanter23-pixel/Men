import React, { useState, useRef } from 'react';
import { MenuItem } from '../../../types';

interface DishGroupsListProps {
  headers: MenuItem[];
  variationMap: Record<string, MenuItem[]>;
  onEditHeader: (item: MenuItem) => void;
  onAddVariant: (parentId: string | number, catName: string) => void;
  onEditVariant: (item: MenuItem) => void;
  onDelete: (item: MenuItem) => void;
  onAddNewGroup: () => void;
}

const DishGroupsList: React.FC<DishGroupsListProps> = ({ 
  headers, variationMap, onEditHeader, onAddVariant, onEditVariant, onDelete, onAddNewGroup 
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [actionSheetItem, setActionSheetItem] = useState<MenuItem | null>(null);
  const [isPressing, setIsPressing] = useState<string | null>(null);
  const longPressTimer = useRef<number | null>(null);

  const toggleGroup = (id: string | number) => {
    setExpandedGroups(prev => ({ ...prev, [String(id)]: !prev[String(id)] }));
  };

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
    <div 
      className="space-y-6 animate-fade-in px-2 pb-20 font-jakarta select-none" 
      style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="flex justify-between items-center px-4">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none">Group List ({headers.length})</h3>
        <button 
          onClick={onAddNewGroup}
          className="text-[#007AFF] text-[13px] font-bold active:opacity-50 transition-opacity"
        >
          Add Group
        </button>
      </div>

      <div className="space-y-3">
        {headers.length > 0 ? headers.map(header => {
          const isExpanded = !!expandedGroups[String(header.id)];
          const children = variationMap[String(header.id)] || [];
          const isCurrentPress = isPressing === String(header.id);
          
          return (
            <div key={header.id} className="overflow-hidden">
              {/* Header Row */}
              <div 
                onMouseDown={() => startPress(header)}
                onMouseUp={endPress}
                onMouseLeave={endPress}
                onTouchStart={() => startPress(header)}
                onTouchEnd={endPress}
                onClick={() => !actionSheetItem && toggleGroup(header.id)}
                className={`bg-white rounded-[1.5rem] shadow-sm border border-slate-200/60 flex items-center justify-between p-4 group transition-all cursor-pointer ${isCurrentPress ? 'scale-[0.98] bg-slate-50' : 'active:bg-slate-50'} ${isExpanded ? 'rounded-b-none border-b-indigo-100' : ''}`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-14 h-14 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-50">
                    <img src={header.image_url} className="w-full h-full object-cover" alt="" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 text-[16px] truncate leading-none uppercase">{header.name}</h4>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] font-bold text-indigo-600 tracking-widest">{header.cat_name}</span>
                      <span className="text-[10px] font-bold text-slate-400">• {children.length} variations</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <i className={`fa-solid fa-chevron-right text-[10px] text-slate-200 transition-transform duration-300 ${isExpanded ? 'rotate-90 text-indigo-500' : ''}`}></i>
                </div>
              </div>

              {/* Variation Sub-items */}
              {isExpanded && (
                <div className="bg-slate-50/50 border-x border-b border-slate-200/60 rounded-b-[1.5rem] divide-y divide-slate-100 animate-fade-in">
                  {children.map(child => (
                    <div 
                        key={child.id} 
                        onMouseDown={() => startPress(child)}
                        onMouseUp={endPress}
                        onMouseLeave={endPress}
                        onTouchStart={() => startPress(child)}
                        onTouchEnd={endPress}
                        onClick={() => !actionSheetItem && onEditVariant(child)}
                        className="flex items-center justify-between p-4 pl-10 group active:bg-white transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-white overflow-hidden shrink-0 border border-slate-100 shadow-sm">
                          <img src={child.image_url} className="w-full h-full object-cover" alt="" />
                        </div>
                        <div className="min-w-0">
                          <h5 className="font-bold text-slate-800 text-[14px] truncate leading-none uppercase">{child.name}</h5>
                          <p className="text-[10px] font-bold text-[#007AFF] tracking-widest leading-none mt-1">₱{child.price.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <i className="fa-solid fa-chevron-right text-[10px] text-slate-200"></i>
                      </div>
                    </div>
                  ))}
                  {children.length === 0 && (
                    <div className="py-10 text-center">
                        <p className="text-[10px] font-bold text-slate-300 tracking-[0.4em] mb-4 uppercase">No variants found</p>
                        <button 
                          onClick={() => onAddVariant(header.id, header.cat_name)}
                          className="px-6 py-2 bg-white text-indigo-600 rounded-full text-[9px] font-bold uppercase tracking-widest border border-indigo-100 shadow-sm active:scale-95 transition-all"
                        >
                          Add variant
                        </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        }) : (
          <div className="py-24 text-center space-y-4 opacity-40">
            <i className="fa-solid fa-layer-group text-4xl text-slate-200"></i>
            <p className="text-[10px] font-bold uppercase text-slate-300 tracking-[0.4em]">Empty Registry</p>
          </div>
        )}
      </div>

      {/* Action Sheet */}
      {actionSheetItem && (
          <div className="fixed inset-0 z-[5000] flex items-end justify-center animate-fade-in p-4">
              <div onClick={() => setActionSheetItem(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
              <div className="relative w-full max-w-lg space-y-3 animate-slide-up flex flex-col">
                  <div className="bg-white/95 backdrop-blur-2xl rounded-[1.5rem] overflow-hidden flex flex-col divide-y divide-slate-100 shadow-2xl">
                      <div className="px-6 py-6 text-center">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-2 leading-none">Management</p>
                          <h4 className="text-[17px] font-bold text-slate-900 leading-none truncate px-4">{actionSheetItem.name}</h4>
                      </div>
                      
                      {actionSheetItem.has_variations && (
                          <button onClick={() => { onAddVariant(actionSheetItem.id, actionSheetItem.cat_name); setActionSheetItem(null); }} className="w-full py-5 text-[#007AFF] font-bold text-[20px] active:bg-slate-100 transition-colors">
                            Add new variant
                          </button>
                      )}

                      <button 
                        onClick={() => { 
                            if (actionSheetItem.has_variations) onEditHeader(actionSheetItem); 
                            else onEditVariant(actionSheetItem);
                            setActionSheetItem(null); 
                        }}
                        className="w-full py-5 text-[#007AFF] font-bold text-[20px] transition-colors active:bg-slate-100 flex items-center justify-center gap-3"
                      >
                        Edit information
                      </button>

                      <button onClick={() => { onDelete(actionSheetItem); setActionSheetItem(null); }} className="w-full py-5 text-rose-500 font-bold text-[20px] transition-colors active:bg-slate-100 flex items-center justify-center gap-3">
                        Delete permanently
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

export default DishGroupsList;