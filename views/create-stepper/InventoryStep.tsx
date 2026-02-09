
import React, { useState, useMemo } from 'react';
import { MenuItem, Category, ItemOptionGroup } from '../../types';

interface InventoryStepProps {
  items: any[];
  setItems: (items: any[]) => void;
  categories: Category[];
  setCategories: (cats: Category[]) => void;
}

type SubTab = 'single' | 'groups' | 'categories';

const InventoryStep: React.FC<InventoryStepProps> = ({ items, setItems, categories, setCategories }) => {
  // Fix: Defined initialFormState to resolve the error on line 172 where it was being referenced but not defined
  const initialFormState = {
    name: '', price: '', description: '', 
    image_url: 'https://picsum.photos/seed/foodie/600/600', 
    cat_name: categories[0]?.name || 'Main Course',
    has_variations: false,
    parent_id: null as number | null,
    optionGroups: [] as ItemOptionGroup[]
  };

  const [activeTab, setActiveTab] = useState<SubTab>('single');
  const [isDishModalOpen, setIsDishModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [newCatName, setNewCatName] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  
  // Fix: Used the newly defined initialFormState for the initial value of formData
  const [formData, setFormData] = useState(initialFormState);

  const handleSaveItem = () => {
    if (!formData.name || (!formData.price && !formData.has_variations)) return;
    const newItem = { 
        ...formData, 
        id: editingItem ? editingItem.id : Date.now(),
        parent_id: formData.parent_id || editingItem?.parent_id || null 
    };
    if (editingItem) {
        setItems(items.map(i => i.id === editingItem.id ? newItem : i));
    } else {
        setItems([...items, newItem]);
    }
    setIsDishModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setEditingItem(null);
    // Fix: Reusing initialFormState for consistency during form resets
    setFormData(initialFormState);
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    setCategories([...categories, { id: Date.now(), name: newCatName.trim() }]);
    setNewCatName('');
    setIsCatModalOpen(false);
  };

  const startEdit = (item: any) => {
    setEditingItem(item);
    setFormData({ ...item });
    setIsDishModalOpen(true);
  };

  const toggleGroup = (id: string | number) => {
    setExpandedGroups(prev => ({ ...prev, [String(id)]: !prev[String(id)] }));
  };

  const groupedItems = useMemo(() => {
    const standalone = items.filter(i => !i.parent_id && !i.has_variations);
    const headers = items.filter(i => i.has_variations);
    const map: Record<string, any[]> = {};
    items.filter(i => i.parent_id).forEach(c => {
        const pid = String(c.parent_id);
        if (!map[pid]) map[pid] = [];
        map[pid].push(c);
    });
    return { standalone, headers, variationMap: map };
  }, [items]);

  const ItemCard: React.FC<{ item: any; isVariant?: boolean }> = ({ item, isVariant = false }) => (
    <div className={`bg-white rounded-[2rem] p-5 shadow-sm border border-slate-200/50 flex items-center justify-between group animate-fade-in ${isVariant ? 'bg-slate-50/30 border-l-4 border-l-indigo-400' : ''}`}>
      <div className="flex items-center gap-4 min-w-0">
        <img src={item.image_url} className="w-14 h-14 rounded-2xl object-cover border border-slate-50 shadow-inner shrink-0" />
        <div className="min-w-0">
          <h4 className="text-[15px] font-bold text-slate-900 uppercase tracking-tight leading-none mb-1.5 truncate">{item.name}</h4>
          <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">₱{item.price} • {item.cat_name}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => startEdit(item)} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-300 hover:text-indigo-600 transition-all flex items-center justify-center"><i className="fa-solid fa-pen-to-square text-sm"></i></button>
        <button onClick={() => setItems(items.filter(i => i.id !== item.id))} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-200 hover:text-rose-500 transition-all flex items-center justify-center"><i className="fa-solid fa-circle-xmark text-lg"></i></button>
      </div>
    </div>
  );

  return (
    <div className="space-y-10 animate-fade-in pb-32">
      <header className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-[34px] font-bold tracking-tight text-slate-900 leading-tight">Menu Catalog</h1>
          <p className="text-[17px] text-slate-500 font-medium leading-relaxed">Build your digital food and drink library.</p>
        </div>
        <div className="bg-[#E8E8ED] p-1 rounded-2xl flex border border-slate-200/50 shadow-inner overflow-x-auto no-scrollbar">
          {(['single', 'groups', 'categories'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 min-w-[100px] py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>
              {tab === 'single' ? 'Single Food' : tab === 'groups' ? 'Dish Groups' : 'Sections'}
            </button>
          ))}
        </div>
      </header>

      <main>
        {activeTab === 'single' && (
          <div className="space-y-6 animate-fade-in">
            <button onClick={() => { resetForm(); setIsDishModalOpen(true); }} className="w-full bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200/60 flex items-center justify-between group active:scale-[0.98] transition-all">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-[1.4rem] flex items-center justify-center shadow-inner"><i className="fa-solid fa-utensils text-xl"></i></div>
                    <div className="text-left">
                        <p className="text-[15px] font-bold text-slate-900">Add New Dish</p>
                        <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest mt-1">One item, one price</p>
                    </div>
                </div>
                <i className="fa-solid fa-plus text-slate-200 group-hover:text-indigo-600 transition-colors mr-2"></i>
            </button>
            <div className="space-y-3">
               {groupedItems.standalone.length > 0 ? groupedItems.standalone.map(item => <ItemCard key={item.id} item={item} />) : (
                   <div className="py-24 bg-white/50 border-4 border-dashed border-white rounded-[3.5rem] text-center flex flex-col items-center gap-4 opacity-60">
                       <i className="fa-solid fa-plate-wheat text-3xl text-slate-200"></i>
                       <p className="text-[11px] font-black uppercase text-slate-300 tracking-[0.5em]">No standalone items</p>
                   </div>
               )}
            </div>
          </div>
        )}

        {activeTab === 'groups' && (
          <div className="space-y-6 animate-fade-in">
            <button onClick={() => { resetForm(); setFormData(p => ({ ...p, has_variations: true })); setIsDishModalOpen(true); }} className="w-full bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200/60 flex items-center justify-between group active:scale-[0.98] transition-all">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-[1.4rem] flex items-center justify-center shadow-inner"><i className="fa-solid fa-layer-group text-xl"></i></div>
                    <div className="text-left">
                        <p className="text-[15px] font-bold text-slate-900">New Dish Group</p>
                        <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest mt-1">e.g. Fries (Small, Med, Large)</p>
                    </div>
                </div>
                <i className="fa-solid fa-plus text-slate-200 group-hover:text-indigo-600 transition-colors mr-2"></i>
            </button>

            <div className="space-y-8">
               {groupedItems.headers.length > 0 ? groupedItems.headers.map(header => {
                   const isExpanded = !!expandedGroups[String(header.id)];
                   const children = groupedItems.variationMap[String(header.id)] || [];
                   return (
                       <div key={header.id} className="space-y-3">
                           <div onClick={() => toggleGroup(header.id)} className="bg-white rounded-[2.5rem] p-6 flex justify-between items-center shadow-sm border border-slate-200/60 group cursor-pointer hover:bg-slate-50 transition-all active:scale-[0.99]">
                               <div className="flex items-center gap-4 min-w-0">
                                   <img src={header.image_url} className="w-14 h-14 rounded-2xl object-cover border shadow-sm shrink-0" />
                                   <div className="min-w-0">
                                       <h4 className="text-slate-900 font-black uppercase tracking-tight text-lg leading-none mb-1.5 truncate">{header.name}</h4>
                                       <span className="text-indigo-600 text-[9px] font-black uppercase tracking-widest">{children.length} {children.length === 1 ? 'Variant' : 'Variants'}</span>
                                   </div>
                               </div>
                               <div className="flex items-center gap-4">
                                   {/* Fix: Line 172 reference now correctly points to initialFormState */}
                                   <button onClick={(e) => { e.stopPropagation(); resetForm(); setFormData({ ...initialFormState, parent_id: header.id, cat_name: header.cat_name }); setIsDishModalOpen(true); }} className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center active:scale-90 shadow-xl"><i className="fa-solid fa-plus text-xs"></i></button>
                                   <i className={`fa-solid fa-chevron-down text-slate-300 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}></i>
                               </div>
                           </div>
                           <div className={`overflow-hidden transition-all duration-500 ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                               <div className="space-y-3 pl-8 border-l-[3px] border-slate-200 ml-6 pb-2">
                                   {children.map(child => <ItemCard key={child.id} item={child} isVariant={true} />)}
                                   {children.length === 0 && <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest py-4 pl-4 italic">No variants added yet.</p>}
                               </div>
                           </div>
                       </div>
                   );
               }) : (
                   <div className="py-24 bg-white/50 border-4 border-dashed border-white rounded-[3.5rem] text-center flex flex-col items-center gap-4 opacity-60">
                       <i className="fa-solid fa-boxes-stacked text-3xl text-slate-200"></i>
                       <p className="text-[11px] font-black uppercase text-slate-300 tracking-[0.5em]">No dish groups</p>
                   </div>
               )}
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="space-y-6 animate-fade-in">
             <button onClick={() => setIsCatModalOpen(true)} className="w-full bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200/60 flex items-center justify-between group active:scale-[0.98] transition-all">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-[1.4rem] flex items-center justify-center shadow-inner"><i className="fa-solid fa-tag text-xl"></i></div>
                    <div className="text-left">
                        <p className="text-[15px] font-bold text-slate-900">New Section</p>
                        <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest mt-1">Organize your menu menu</p>
                    </div>
                </div>
                <i className="fa-solid fa-plus text-slate-200 group-hover:text-indigo-600 transition-colors mr-2"></i>
            </button>
            <div className="grid grid-cols-1 gap-3">
                {categories.map((cat, idx) => (
                    <div key={cat.id || idx} className="bg-white px-8 py-5 rounded-[2rem] border border-slate-100 flex items-center justify-between shadow-sm">
                        <span className="font-bold text-slate-800 uppercase tracking-tight">{cat.name}</span>
                        <button onClick={() => setCategories(categories.filter((_, i) => i !== idx))} className="text-slate-200 hover:text-rose-500 transition-colors"><i className="fa-solid fa-circle-minus text-xl"></i></button>
                    </div>
                ))}
            </div>
          </div>
        )}
      </main>

      {/* DISH MODAL (APPLE BOTTOM SHEET) */}
      {isDishModalOpen && (
          <div className="fixed inset-0 z-[5000] flex items-end justify-center animate-fade-in p-0">
              <div onClick={() => setIsDishModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" />
              <div className="relative bg-[#F2F2F7] w-full max-w-lg rounded-t-[3rem] shadow-2xl flex flex-col p-0 animate-slide-up max-h-[94vh] overflow-hidden">
                  <div className="w-12 h-1.5 bg-slate-300/50 rounded-full mx-auto my-5 shrink-0" />
                  <header className="px-10 pb-8 bg-white border-b border-slate-100 shrink-0">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">
                                {formData.has_variations ? 'Edit Group' : (editingItem ? 'Edit Dish' : 'New Entry')}
                            </h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-2 tracking-widest">
                                {formData.parent_id ? 'Nested Variant' : formData.has_variations ? 'Container' : 'Stand-alone'}
                            </p>
                        </div>
                        <button onClick={() => setIsDishModalOpen(false)} className="w-12 h-12 rounded-full bg-slate-50 text-slate-300 flex items-center justify-center border border-slate-100"><i className="fa-solid fa-xmark text-lg"></i></button>
                    </div>
                  </header>
                  <div className="flex-1 overflow-y-auto no-scrollbar p-10 space-y-8">
                      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm space-y-6">
                          <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Name</label>
                              <input autoFocus value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border-none p-5 rounded-2xl font-bold text-[15px] outline-none shadow-inner" placeholder="e.g. Crispy Fries" />
                          </div>
                          {!formData.has_variations && (
                              <div className="space-y-1">
                                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Price (₱)</label>
                                  <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-slate-50 border-none p-5 rounded-2xl font-black text-lg outline-none shadow-inner" placeholder="0.00" />
                              </div>
                          )}
                          <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Section</label>
                              <select value={formData.cat_name} onChange={e => setFormData({...formData, cat_name: e.target.value})} className="w-full bg-slate-50 border-none p-5 rounded-2xl font-bold text-sm outline-none shadow-inner">
                                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                  {categories.length === 0 && <option>Main Course</option>}
                              </select>
                          </div>
                          <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Description</label>
                              <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-slate-50 border-none p-5 rounded-2xl font-medium text-xs outline-none h-24 resize-none shadow-inner" placeholder="Optional details..." />
                          </div>
                      </div>
                  </div>
                  <div className="p-10 bg-white border-t border-slate-100 shrink-0">
                      <button onClick={handleSaveItem} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-[12px] tracking-[0.4em] shadow-2xl active:scale-95 transition-all">Save to Catalog</button>
                  </div>
              </div>
          </div>
      )}

      {/* CATEGORY MODAL (APPLE POPUP) */}
      {isCatModalOpen && (
          <div className="fixed inset-0 z-[5000] flex items-center justify-center p-6 animate-fade-in">
              <div onClick={() => setIsCatModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" />
              <div className="relative bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-2xl animate-scale">
                  <h3 className="text-xl font-black uppercase tracking-tighter mb-8 text-center">New Section</h3>
                  <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Name</label>
                        <input autoFocus value={newCatName} onChange={e => setNewCatName(e.target.value)} className="w-full bg-slate-50 border-none p-5 rounded-2xl font-bold text-sm outline-none shadow-inner" placeholder="e.g. Refreshments" />
                      </div>
                      <div className="grid grid-cols-2 gap-3 pt-4">
                          <button onClick={() => setIsCatModalOpen(false)} className="py-4 bg-slate-50 text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-widest">Cancel</button>
                          <button onClick={handleAddCategory} className="py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-100">Create</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      <style>{`
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.23, 1, 0.32, 1) forwards; }
        @keyframes scale { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-scale { animation: scale 0.3s cubic-bezier(0.23, 1, 0.32, 1) forwards; }
      `}</style>
    </div>
  );
};

export { InventoryStep as default };
