import React, { useState, useEffect } from 'react';
import { MenuItem, Category } from '../../types';
import * as MenuService from '../../services/menuService';

interface AdminMenuProps {
  items: MenuItem[];
  setItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  cats: Category[];
  setCats: React.Dispatch<React.SetStateAction<Category[]>>;
  isWizard?: boolean; 
}

const AdminMenu: React.FC<AdminMenuProps> = ({ items, setItems, cats, setCats, isWizard = false }) => {
  const [activeTab, setActiveTab] = useState<'items' | 'add' | 'categories'>('items');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);
  const [catToDelete, setCatToDelete] = useState<Category | null>(null);
  const [catDeleteOption, setCatDeleteOption] = useState<'delete_all' | 'keep_items'>('keep_items');
  const [newCatName, setNewCatName] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const sessionRaw = localStorage.getItem('foodie_supabase_session');
  const session = sessionRaw ? JSON.parse(sessionRaw) : null;
  const restaurantId = session?.restaurant?.id;

  const initialFormState = { 
    name: '', desc: '', ingredients: '', price: '', cat: '', 
    people: '1 Person', mins: '15 mins', image: '', 
    isPopular: false, isAvailable: true 
  };
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: 'success' | 'error') => { setToast({ message, type }); };

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (loadEvent) => { if (loadEvent.target?.result) setFormData(prev => ({ ...prev, image: loadEvent.target!.result as string })); };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSaveItem = async () => {
    if (loading) return;
    setLocalError(null);
    if (!formData.name.trim()) return showToast("Name is required.", 'error');
    if (!formData.price || Number(formData.price) <= 0) return showToast("Valid price required.", 'error');
    if (!restaurantId && !isWizard) return showToast("Session expired.", 'error');

    if (!editingItem && items.some(it => it.name.toLowerCase() === formData.name.trim().toLowerCase())) {
        return showToast(`"${formData.name.trim()}" exists in menu.`, 'error');
    }

    setLoading(true);
    try {
      const targetCategory = cats.find(c => c.name === formData.cat);
      const ingredientsArray = formData.ingredients.split(',').map(i => {
        const t = i.trim();
        return t ? { key: t.toLowerCase().replace(/\s+/g, '_'), label: t.charAt(0).toUpperCase() + t.slice(1) } : null;
      }).filter(i => i !== null);

      const itemPayload: any = {
        name: formData.name.trim(), price: Number(formData.price), description: formData.desc,
        ingredients: ingredientsArray, image_url: formData.image || 'https://picsum.photos/seed/dish/400/400',
        category_id: targetCategory ? targetCategory.id : null, pax: formData.people, serving_time: formData.mins,
        is_popular: formData.isPopular, is_available: formData.isAvailable
      };

      if (isWizard) {
        const wizardItem: any = { ...itemPayload, id: editingItem ? editingItem.id : Math.floor(Math.random() * 1000000), cat_name: targetCategory ? targetCategory.name : 'Uncategorized' };
        if (editingItem) setItems(prev => prev.map(it => it.id === editingItem.id ? wizardItem : it));
        else setItems(prev => [wizardItem, ...prev]);
        showToast("Saved.", 'success');
      } else {
        if (editingItem) itemPayload.id = editingItem.id;
        const dbItem = await MenuService.upsertMenuItem(itemPayload);
        if (!dbItem) throw new Error("Database failed to respond.");
        const savedItem = { ...dbItem, cat_name: targetCategory ? targetCategory.name : 'Uncategorized' };
        if (editingItem) setItems(prev => prev.map(it => it.id === editingItem.id ? savedItem : it));
        else setItems(prev => [savedItem, ...prev]);
        showToast("Synchronized.", 'success');
      }
      setFormData(initialFormState); setEditingItem(null); setActiveTab('items');
    } catch (err: any) {
      setLocalError(err.message || "Failed to sync.");
      showToast(err.message || "Sync failure.", 'error');
    } finally { setLoading(false); }
  };

  const startEdit = (item: MenuItem) => {
    setEditingItem(item); setLocalError(null);
    const formattedIngredients = Array.isArray(item.ingredients) ? item.ingredients.map((ing: any) => typeof ing === 'object' ? (ing.label || ing.key) : ing).join(', ') : '';
    setFormData({ 
      name: item.name, desc: item.description, ingredients: formattedIngredients, 
      price: item.price.toString(), cat: item.cat_name === 'Uncategorized' ? '' : item.cat_name, 
      people: item.pax, mins: item.serving_time, image: item.image_url, 
      isPopular: !!item.is_popular, isAvailable: item.is_available !== undefined ? !!item.is_available : true 
    });
    setActiveTab('add');
  };

  const confirmDeleteItem = async () => {
    if (loading || !itemToDelete) return;
    setLoading(true);
    try {
      if (!isWizard) await MenuService.deleteMenuItem(itemToDelete.id.toString());
      setItems(prev => prev.filter(it => it.id !== itemToDelete.id));
      setItemToDelete(null); showToast("Purged.", 'success');
    } catch (err: any) { showToast("Purge failed.", 'error'); } finally { setLoading(false); }
  };

  const confirmDeleteCategory = async () => {
    if (loading || !catToDelete) return;
    setLoading(true);
    try {
      const itemsInCat = items.filter(i => i.category_id === catToDelete.id);
      if (!isWizard) {
        if (catDeleteOption === 'delete_all') {
            for (const item of itemsInCat) await MenuService.deleteMenuItem(item.id.toString());
            setItems(prev => prev.filter(i => i.category_id !== catToDelete.id));
        } else {
            for (const item of itemsInCat) {
                const up = { ...item, category_id: null };
                delete (up as any).cat_name;
                await MenuService.upsertMenuItem(up);
            }
            setItems(prev => prev.map(i => i.category_id === catToDelete.id ? { ...i, category_id: null, cat_name: 'Uncategorized' } : i));
        }
        await MenuService.deleteCategory(catToDelete.id.toString());
      } else {
        if (catDeleteOption === 'delete_all') setItems(prev => prev.filter(i => i.category_id !== catToDelete.id));
        else setItems(prev => prev.map(i => i.category_id === catToDelete.id ? { ...i, category_id: null, cat_name: 'Uncategorized' } : i));
      }
      setCats(prev => prev.filter(cat => cat.id !== catToDelete.id));
      setCatToDelete(null); showToast("Groups updated.", 'success');
    } catch (err: any) { showToast("Failed.", 'error'); } finally { setLoading(false); }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newCatName.trim();
    if (loading || !cleanName) return;
    if (cats.some(c => c.name.toLowerCase() === cleanName.toLowerCase())) return showToast("Group exists.", 'error');
    setLoading(true);
    try {
      if (!isWizard) {
        const menuId = session?.defaultMenuId;
        if (!menuId) throw new Error("No menu context.");
        const newCat = await MenuService.upsertCategory({ name: cleanName, menu_id: menuId, order_index: cats.length });
        setCats(prev => [...prev, newCat]);
      } else {
        setCats(prev => [...prev, { id: Math.floor(Math.random() * 1000000), name: cleanName }]);
      }
      setNewCatName(''); showToast("Group created.", 'success');
    } catch (err: any) { showToast("Failed.", 'error'); } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col h-screen animate-fade-in relative bg-white font-jakarta">
      {toast && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[200] px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-4 animate-scale border ${toast.type === 'success' ? 'bg-slate-900 text-white border-emerald-500/20' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500 text-white'}`}><i className={`fa-solid ${toast.type === 'success' ? 'fa-check' : 'fa-triangle-exclamation'} text-[10px]`}></i></div>
          <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">{toast.message}</span>
        </div>
      )}

      <div className="bg-slate-50 border-b border-slate-100 p-6 lg:p-8 space-y-6 sticky top-0 z-[40]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div><p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Content Manager</p><h3 className="text-3xl font-black uppercase tracking-tighter text-slate-900 leading-none">Menu List</h3></div>
           <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
             <button onClick={() => setActiveTab('categories')} className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'categories' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-900'}`}>Groups</button>
             <button onClick={() => setActiveTab('items')} className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'items' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-900'}`}>Items</button>
             <button onClick={() => { setEditingItem(null); setFormData(initialFormState); setLocalError(null); setActiveTab('add'); }} className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'add' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-900'}`}>{editingItem ? 'Edit' : 'Add'}</button>
           </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 lg:p-10 no-scrollbar pb-40">
        {activeTab === 'categories' && (
          <div className="max-w-xl mx-auto space-y-8 animate-fade-in">
             <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl">
               <h4 className="text-lg font-black uppercase mb-6 text-slate-800">New Group</h4>
               <form onSubmit={handleAddCategory} className="flex flex-col sm:flex-row gap-3">
                 <input type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="e.g. Desserts" className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none" />
                 <button type="submit" disabled={loading} className="bg-indigo-600 text-white px-8 py-4 sm:py-0 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg">Create</button>
               </form>
             </div>
             <div className="grid grid-cols-1 gap-3">
               {cats.map(c => (
                 <div key={c.id} className="bg-white border border-slate-100 px-6 py-4 rounded-2xl flex items-center justify-between shadow-sm">
                    <div><span className="font-black text-sm text-slate-800 uppercase">{c.name}</span></div>
                    <button onClick={() => setCatToDelete(c)} className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all"><i className="fa-solid fa-trash-can text-xs"></i></button>
                 </div>
               ))}
             </div>
          </div>
        )}

        {activeTab === 'items' && (
          <div className="space-y-4 max-w-4xl mx-auto pb-20">
            {items.map(item => (
              <div key={item.id} className="bg-white p-4 md:p-5 rounded-[2.5rem] border border-slate-50 flex items-center justify-between shadow-sm hover:shadow-md transition-all animate-fade-in group">
                <div className="flex items-center gap-4 md:gap-6 min-w-0">
                   <div className="w-14 h-14 md:w-16 md:h-16 rounded-3xl bg-slate-50 overflow-hidden border border-slate-100 shrink-0"><img src={item.image_url} className="w-full h-full object-cover" /></div>
                   <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-black text-xs md:text-sm text-slate-800 uppercase truncate">{item.name}</h4>
                        {item.is_popular && <span className="bg-orange-500 text-white text-[7px] px-1.5 py-0.5 rounded-md font-black uppercase">Popular</span>}
                        {!item.is_available && <span className="bg-slate-400 text-white text-[7px] px-1.5 py-0.5 rounded-md font-black uppercase ml-1">Sold Out</span>}
                      </div>
                      <div className="flex items-center gap-2 md:gap-3"><p className="text-[8px] md:text-[9px] font-black text-indigo-500 uppercase">{item.cat_name || 'Uncategorized'}</p><div className="w-1 h-1 bg-slate-200 rounded-full"></div><p className="text-[9px] md:text-[10px] font-bold text-slate-400">₱{item.price}</p></div>
                   </div>
                </div>
                <div className="flex gap-1.5 md:gap-2 shrink-0">
                   <button onClick={() => startEdit(item)} className="w-9 h-9 md:w-11 md:h-11 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all"><i className="fa-solid fa-pen text-[10px]"></i></button>
                   <button onClick={() => setItemToDelete(item)} className="w-9 h-9 md:w-11 md:h-11 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all"><i className="fa-solid fa-trash-can text-[10px]"></i></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'add' && (
          <div className="max-w-xl mx-auto bg-white p-6 md:p-8 lg:p-12 rounded-[2.5rem] md:rounded-[4rem] border border-slate-100 shadow-2xl space-y-8 animate-fade-in mb-20">
            <h3 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tighter">{editingItem ? 'Edit Dish' : 'Add Dish'}</h3>
            <div className="space-y-6">
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 ml-4 italic">Photo Asset</label>
                 <input type="file" id="dish-img-up" className="hidden" onChange={handleImage} />
                 <button onClick={() => document.getElementById('dish-img-up')?.click()} className="w-full bg-slate-50 border-2 border-dashed border-slate-200 py-10 rounded-3xl flex flex-col items-center gap-4 group overflow-hidden relative min-h-[140px]">
                   {formData.image ? <img src={formData.image} className="absolute inset-0 w-full h-full object-cover" /> : <><i className="fa-solid fa-cloud-arrow-up text-3xl text-slate-200"></i><div className="text-[9px] font-black uppercase text-slate-400">Pick High-Res Image</div></>}
                 </button>
               </div>
               <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-4 italic">Product Name</label><input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Classic Burger" className="w-full bg-slate-50 border-none rounded-2xl p-5 font-black text-sm outline-none shadow-inner italic" /></div>
               <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-4 italic">Description</label><textarea value={formData.desc} onChange={e => setFormData({...formData, desc: e.target.value})} placeholder="Describe story and taste..." className="w-full bg-slate-50 border-none p-6 rounded-3xl text-sm h-32 outline-none resize-none shadow-inner" /></div>
               <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-4 italic">Ingredients (Comma separated)</label><input type="text" value={formData.ingredients} onChange={e => setFormData({...formData, ingredients: e.target.value})} placeholder="Beef, Lettuce, Tomato..." className="w-full bg-slate-50 border-none rounded-2xl p-5 font-black text-sm outline-none shadow-inner italic" /></div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-4 italic">Price (₱)</label><input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-slate-50 border-none p-5 rounded-2xl font-black text-sm outline-none shadow-inner" /></div>
                  <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-4 italic">Group</label><select value={formData.cat} onChange={e => setFormData({...formData, cat: e.target.value})} className="w-full bg-slate-50 border-none p-5 rounded-2xl font-black text-[10px] uppercase outline-none shadow-inner">{cats.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}<option value="">None</option></select></div>
               </div>

               <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                  <button 
                    onClick={() => setFormData({...formData, isPopular: !formData.isPopular})}
                    className={`p-5 rounded-2xl flex items-center justify-between transition-all border ${formData.isPopular ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest">Is Popular?</span>
                    <i className={`fa-solid ${formData.isPopular ? 'fa-star text-amber-400' : 'fa-star-half-stroke'}`}></i>
                  </button>

                  <button 
                    onClick={() => setFormData({...formData, isAvailable: !formData.isAvailable})}
                    className={`p-5 rounded-2xl flex items-center justify-between transition-all border ${formData.isAvailable ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-rose-50 border-rose-100 text-rose-500'}`}
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest">Available?</span>
                    <i className={`fa-solid ${formData.isAvailable ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                  </button>
               </div>
            </div>
            <div className="pt-4 space-y-4">
               <button onClick={handleSaveItem} disabled={loading} className="w-full py-6 bg-slate-900 text-white rounded-3xl font-black uppercase text-[10px] tracking-[0.4em] shadow-2xl active:scale-95 transition-all hover:bg-indigo-600 disabled:opacity-50">{loading ? <i className="fa-solid fa-sync animate-spin"></i> : null} {editingItem ? 'Commit Changes' : 'Initialize Dish'}</button>
               {localError && <div className="bg-rose-50 border border-rose-100 p-5 rounded-3xl animate-fade-in flex items-start gap-4"><i className="fa-solid fa-circle-exclamation text-rose-500 mt-0.5"></i><div className="flex-1"><p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Database Sync Error</p><p className="text-[11px] text-rose-500 font-bold leading-relaxed">{localError}</p></div></div>}
               <button onClick={() => { setEditingItem(null); setFormData(initialFormState); setLocalError(null); setActiveTab('items'); }} className="w-full text-[9px] font-black uppercase text-slate-300 tracking-[0.2em] hover:text-slate-500">Discard Draft</button>
            </div>
          </div>
        )}
      </div>

      {itemToDelete && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in" onClick={() => setItemToDelete(null)}>
           <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-2xl text-center space-y-8 animate-scale" onClick={e => e.stopPropagation()}>
              <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto shadow-inner"><i className="fa-solid fa-trash-can text-3xl"></i></div>
              <h4 className="text-2xl font-black uppercase tracking-tighter">Purge Dish?</h4>
              <button disabled={loading} onClick={confirmDeleteItem} className="w-full py-5 bg-rose-500 text-white rounded-3xl font-black uppercase text-[10px] tracking-[0.4em] shadow-xl active:scale-95 transition-all">Execute Deletion</button>
           </div>
        </div>
      )}

      {catToDelete && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in" onClick={() => setCatToDelete(null)}>
           <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-2xl text-center space-y-8 animate-scale" onClick={e => e.stopPropagation()}>
              <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto shadow-inner"><i className="fa-solid fa-folder-minus text-3xl"></i></div>
              <h4 className="text-2xl font-black uppercase tracking-tighter">Purge Group?</h4>
              <div className="space-y-3 text-left">
                   <label className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors group"><input type="radio" className="accent-rose-500" checked={catDeleteOption === 'delete_all'} onChange={() => setCatDeleteOption('delete_all')} /><span className="text-[10px] font-black uppercase group-hover:text-rose-600">Delete all nested items</span></label>
                   <label className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors group"><input type="radio" className="accent-rose-500" checked={catDeleteOption === 'keep_items'} onChange={() => setCatDeleteOption('keep_items')} /><span className="text-[10px] font-black uppercase group-hover:text-indigo-600">Preserve orphan items</span></label>
              </div>
              <button disabled={loading} onClick={confirmDeleteCategory} className="w-full py-5 bg-rose-500 text-white rounded-3xl font-black uppercase text-[10px] tracking-[0.4em] shadow-xl active:scale-95 transition-all">Confirm Purge</button>
           </div>
        </div>
      )}

      <style>{` @keyframes scale { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } } .animate-scale { animation: scale 0.3s cubic-bezier(0.23, 1, 0.32, 1) forwards; } `}</style>
    </div>
  );
};

export default AdminMenu;