import React, { useState, useRef } from 'react';
import { Category } from '../../../types';

interface SectionsListProps {
  cats: Category[];
  onAdd: (name: string, icon: string) => void;
  onDelete: (id: string | number) => void;
  onEdit?: (cat: Category) => void;
  loading: boolean;
}

const SectionsList: React.FC<SectionsListProps> = ({ cats, onAdd, onDelete, onEdit, loading }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('fa-tag');
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [actionSheetItem, setActionSheetItem] = useState<Category | null>(null);
  const [isPressing, setIsPressing] = useState<string | null>(null);
  const longPressTimer = useRef<number | null>(null);

  const handleAdd = () => {
    if (!newCatName.trim()) return;
    onAdd(newCatName.trim(), newCatIcon.trim() || 'fa-tag');
    setNewCatName('');
    setNewCatIcon('fa-tag');
    setIsAddModalOpen(false);
  };

  const handleSave = () => {
    if (editingCat && onEdit) {
        onEdit(editingCat);
        setIsEditModalOpen(false);
        setEditingCat(null);
    }
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

  const openEditor = (cat: Category) => {
    setEditingCat(cat);
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in px-2 font-jakarta">
      {/* HEADER MATCHING DISH GROUPS STYLE */}
      <div className="flex justify-between items-center px-4">
        <h3 className="text-[10px] font-bold uppercase text-slate-400 tracking-[0.2em] leading-none">Categories ({cats.length})</h3>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="text-[#007AFF] text-[13px] font-bold active:opacity-50 transition-opacity"
        >
          Add Category
        </button>
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
              onClick={() => !actionSheetItem && openEditor(cat)}
              className={`flex items-center justify-between p-5 transition-all cursor-pointer ${isCurrentPress ? 'scale-[0.98] bg-slate-50' : 'active:bg-slate-50'}`}
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center border border-slate-100/50 shadow-sm">
                    <i className={`fa-solid ${cat.icon || 'fa-tag'} text-xs`}></i>
                </div>
                <span className="font-bold text-slate-800 uppercase tracking-tight text-[16px]">{cat.name}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <i className="fa-solid fa-chevron-right text-[10px] text-slate-200"></i>
              </div>
            </div>
          );
        }) : (
          <div className="py-24 text-center opacity-20 text-[11px] font-black uppercase tracking-widest">No Sections Defined</div>
        )}
      </div>

      {/* CREATE CATEGORY MODAL */}
      {isAddModalOpen && (
          <div className="fixed inset-0 z-[5000] flex items-end justify-center animate-fade-in p-0 font-jakarta">
              <div onClick={() => setIsAddModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
              <div className="relative bg-white w-full max-w-lg rounded-t-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-slide-up pb-12">
                  <header className="px-6 py-4 flex items-center justify-between border-b border-slate-50 shrink-0">
                      <button onClick={() => setIsAddModalOpen(false)} className="text-[#007AFF] text-[17px] font-medium">Cancel</button>
                      <h3 className="text-[17px] font-black uppercase tracking-tight text-slate-900">New Category</h3>
                      <button onClick={handleAdd} disabled={!newCatName.trim()} className="text-[#007AFF] text-[17px] font-black disabled:opacity-30">Create</button>
                  </header>
                  <div className="p-8 space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-300 tracking-widest ml-4">Category Name</label>
                        <input 
                            type="text" 
                            autoFocus
                            value={newCatName} 
                            onChange={e => setNewCatName(e.target.value)} 
                            onKeyDown={e => e.key === 'Enter' && handleAdd()}
                            className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl font-bold text-lg outline-none focus:bg-white focus:border-slate-300 transition-all shadow-inner" 
                            placeholder="e.g. Desserts"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-300 tracking-widest ml-4">Icon Class (FontAwesome)</label>
                        <input 
                            type="text" 
                            value={newCatIcon} 
                            onChange={e => setNewCatIcon(e.target.value)} 
                            className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:border-slate-300 transition-all shadow-inner" 
                            placeholder="e.g. fa-tag"
                        />
                        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest ml-4">Ex: fa-utensils, fa-burger, fa-mug-saucer</p>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* CATEGORY EDITOR MODAL */}
      {isEditModalOpen && editingCat && (
          <div className="fixed inset-0 z-[5000] flex items-end justify-center animate-fade-in p-0 font-jakarta">
              <div onClick={() => setIsEditModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
              <div className="relative bg-white w-full max-w-lg rounded-t-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-slide-up pb-12">
                  <header className="px-6 py-4 flex items-center justify-between border-b border-slate-50 shrink-0">
                      <button onClick={() => setIsEditModalOpen(false)} className="text-[#007AFF] text-[17px] font-medium">Cancel</button>
                      <h3 className="text-[17px] font-black uppercase tracking-tight text-slate-900">Edit Category</h3>
                      <button onClick={handleSave} className="text-[#007AFF] text-[17px] font-black">Done</button>
                  </header>
                  <div className="p-8 space-y-10">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-300 tracking-widest ml-4">Category Label</label>
                        <input 
                            type="text" 
                            autoFocus
                            value={editingCat.name} 
                            onChange={e => setEditingCat({...editingCat, name: e.target.value})} 
                            className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl font-bold text-lg outline-none focus:bg-white focus:border-slate-300 transition-all shadow-inner" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-300 tracking-widest ml-4">Icon Class (FontAwesome)</label>
                        <input 
                            type="text" 
                            value={editingCat.icon || ''} 
                            onChange={e => setEditingCat({...editingCat, icon: e.target.value})} 
                            className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:border-slate-300 transition-all shadow-inner" 
                            placeholder="e.g. fa-tag"
                        />
                        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest ml-4">Ex: fa-utensils, fa-burger, fa-mug-saucer</p>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* APPLE ACTION SHEET */}
      {actionSheetItem && (
          <div className="fixed inset-0 z-[5000] flex items-end justify-center animate-fade-in p-4">
              <div onClick={() => setActionSheetItem(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
              <div className="relative w-full max-w-lg space-y-3 animate-slide-up flex flex-col">
                  <div className="bg-white/95 backdrop-blur-2xl rounded-[1.5rem] overflow-hidden flex flex-col divide-y divide-slate-100 shadow-2xl">
                      <div className="px-6 py-6 text-center">
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.25em] mb-2 leading-none">Management</p>
                          <h4 className="text-[17px] font-black text-slate-900 uppercase leading-none truncate px-4">{actionSheetItem.name}</h4>
                      </div>
                      <button 
                        onClick={() => { openEditor(actionSheetItem); setActionSheetItem(null); }}
                        className="w-full py-5 text-[#007AFF] font-bold text-[20px] transition-colors active:bg-slate-100 flex items-center justify-center gap-3"
                      >
                        Edit information
                      </button>
                      <button 
                        onClick={() => { onDelete(actionSheetItem.id); setActionSheetItem(null); }}
                        className="w-full py-5 text-rose-500 font-bold text-[20px] transition-colors active:bg-slate-100 flex items-center justify-center gap-3"
                      >
                        Delete Section
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

export default SectionsList;