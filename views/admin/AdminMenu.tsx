import React, { useState } from 'react';
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

  const sessionRaw = localStorage.getItem('foodie_supabase_session');
  const session = sessionRaw ? JSON.parse(sessionRaw) : null;

  const initialFormState = {
    name: '', desc: '', ingredients: '', price: '', cat: '', people: '1 Person', mins: '15 mins', image: '', isPopular: false
  };
  const [formData, setFormData] = useState(initialFormState);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        if (loadEvent.target?.result) setFormData(prev => ({ ...prev, image: loadEvent.target!.result as string }));
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSaveItem = async () => {
    if (!formData.name || !formData.price) return alert("Fill in Name and Price.");
    setLoading(true);
    try {
      const targetCategory = cats.find(c => c.name === formData.cat);
      const ingredientsArray = formData.ingredients.split(',').map(i => {
        const t = i.trim();
        return t ? { key: t.toLowerCase().replace(/\s+/g, '_'), label: t.charAt(0).toUpperCase() + t.slice(1) } : null;
      }).filter(i => i !== null);

      const itemPayload: any = {
        name: formData.name,
        price: Number(formData.price),
        description: formData.desc,
        ingredients: ingredientsArray,
        image_url: formData.image || 'https://picsum.photos/seed/dish/400/400',
        category_id: targetCategory ? targetCategory.id : null,
        pax: formData.people,
        serving_time: formData.mins,
        is_popular: formData.isPopular
      };

      if (isWizard) {
        // Purely local logic for the product tour
        const wizardItem: any = {
          ...itemPayload,
          id: editingItem ? editingItem.id : Math.floor(Math.random() * 1000000),
          cat_name: targetCategory ? targetCategory.name : 'Uncategorized'
        };
        if (editingItem) {
          setItems(prev => prev.map(it => it.id === editingItem.id ? wizardItem : it));
        } else {
          setItems(prev => [wizardItem, ...prev]);
        }
      } else {
        // Live database update for authenticated merchants
        if (editingItem) itemPayload.id = editingItem.id;
        const dbItem = await MenuService.upsertMenuItem(itemPayload);
        const savedItem = { ...dbItem, cat_name: targetCategory ? targetCategory.name : 'Uncategorized' };
        if (editingItem) {
          setItems(prev => prev.map(it => it.id === editingItem.id ? savedItem : it));
        } else {
          setItems(prev => [savedItem, ...prev]);
        }
      }

      setFormData(initialFormState);
      setEditingItem(null);
      setActiveTab('items');
    } catch (err: any) {
      alert("Save failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (item: MenuItem) => {
    setEditingItem(item);
    const formattedIngredients = Array.isArray(item.ingredients) 
      ? item.ingredients.map((ing: any) => typeof ing === 'object' ? (ing.label || ing.key) : ing).join(', ')
      : '';
    setFormData({
      name: item.name, desc: item.description, ingredients: formattedIngredients, price: item.price.toString(),
      cat: item.cat_name === 'Uncategorized' ? '' : item.cat_name, people: item.pax, mins: item.serving_time,
      image: item.image_url, isPopular: !!item.is_popular
    });
    setActiveTab('add');
  };

  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;
    setLoading(true);
    try {
      if (!isWizard) await MenuService.deleteMenuItem(itemToDelete.id.toString());
      setItems(prev => prev.filter(it => it.id !== itemToDelete.id));
      setItemToDelete(null);
    } catch (err: any) {
      alert("Delete failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteCategory = async () => {
    if (!catToDelete) return;
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
      setCatToDelete(null);
    } catch (err: any) {
      alert("Delete failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setLoading(true);
    try {
      if (!isWizard) {
        const menuId = session?.defaultMenuId;
        if (!menuId) throw new Error("No active menu context.");
        const newCat = await MenuService.upsertCategory({ name: newCatName.trim(), menu_id: menuId, order_index: cats.length });
        setCats(prev => [...prev, newCat]);
      } else {
        setCats(prev => [...prev, { id: Math.floor(Math.random() * 1000000), name: newCatName.trim() }]);
      }
      setNewCatName('');
    } catch (err) {
      alert("Add failed.");
    } finally {
      setLoading(false);
    }
  };

  const getItemsCountForCat = (catId: number) => items.filter(i => i.category_id === catId).length;

  return (
    <div className="flex flex-col h-full animate-fade-in relative bg-white font-['Plus_Jakarta_Sans']">
      <div className="bg-slate-50 border-b border-slate-100 p-6 lg:p-8 space-y-6 sticky top-0 z-[40]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div>
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1 italic">Content Engine</p>
              <h3 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">Menu Lab</h3>
           </div>
           <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
             <button onClick={() => setActiveTab('categories')} className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'categories' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-900'}`}>Groups</button>
             <button onClick={() => setActiveTab('items')} className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'items' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-900'}`}>Items</button>
             <button onClick={() => { setEditingItem(null); setFormData(initialFormState); setActiveTab('add'); }} className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'add' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-900'}`}>{editingItem ? 'Edit' : 'Add'}</button>
           </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 lg:p-10 no-scrollbar pb-32">
        {activeTab === 'categories' && (
          <div className="max-w-xl mx-auto space-y-8 animate-fade-in">
             <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl">
               <h4 className="text-lg font-black uppercase mb-6 italic text-slate-800">New Category</h4>
               <form onSubmit={handleAddCategory} className="flex gap-2">
                 <input type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="e.g. Desserts" className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-4 ring-indigo-500/5 transition-all" />
                 <button type="submit" className="bg-indigo-600 text-white px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg">Save</button>
               </form>
             </div>
             <div className="space-y-4">
               <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest px-4 italic">Existing Groups</h4>
               <div className="grid grid-cols-1 gap-3">
                 {cats.map(c => (
                   <div key={c.id} className="bg-white border border-slate-100 px-6 py-4 rounded-2xl flex items-center justify-between shadow-sm">
                      <div><span className="font-black text-sm text-slate-800 uppercase italic">{c.name}</span><span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1 block">{getItemsCountForCat(c.id)} items</span></div>
                      <button onClick={() => { setCatToDelete(c); setCatDeleteOption('keep_items'); }} className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-500 transition-all"><i className="fa-solid fa-trash-can text-xs"></i></button>
                   </div>
                 ))}
                 {cats.length === 0 && <p className="text-center py-10 text-slate-300 font-bold italic opacity-30">No groups defined.</p>}
               </div>
             </div>
          </div>
        )}

        {activeTab === 'items' && (
          <div className="space-y-4 max-w-4xl mx-auto">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest px-4 italic">Master List ({items.length})</h4>
            {items.map(item => (
              <div key={item.id} className="bg-white p-5 rounded-[2.5rem] border border-slate-50 flex items-center justify-between shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-6 min-w-0">
                   <div className="w-16 h-16 rounded-[1.8rem] bg-slate-50 overflow-hidden border border-slate-100"><img src={item.image_url} className="w-full h-full object-cover" /></div>
                   <div className="min-w-0">
                      <div className="flex items-center gap-2"><h4 className="font-black text-sm text-slate-800 uppercase italic truncate">{item.name}</h4>{item.is_popular && <span className="bg-orange-500 text-white text-[8px] px-2 py-0.5 rounded-full font-black uppercase">Popular</span>}</div>
                      <div className="flex items-center gap-3 mt-1"><p className="text-[9px] font-black text-indigo-500 uppercase">{item.cat_name || 'Uncategorized'}</p><div className="w-1 h-1 bg-slate-200 rounded-full"></div><p className="text-[10px] font-bold text-slate-400">₱{item.price}</p></div>
                   </div>
                </div>
                <div className="flex gap-2">
                   <button onClick={() => startEdit(item)} className="w-11 h-11 rounded-[1.3rem] bg-indigo-50 text-indigo-500 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm"><i className="fa-solid fa-pen text-xs"></i></button>
                   <button onClick={() => setItemToDelete(item)} className="w-11 h-11 rounded-[1.3rem] bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm"><i className="fa-solid fa-trash-can text-xs"></i></button>
                </div>
              </div>
            ))}
            {items.length === 0 && <p className="text-center py-40 text-slate-200 font-black uppercase tracking-[0.4em] italic opacity-50">Empty Archive</p>}
          </div>
        )}

        {activeTab === 'add' && (
          <div className="max-w-xl mx-auto bg-white p-8 lg:p-12 rounded-[4rem] border border-slate-100 shadow-2xl space-y-10 animate-fade-in">
            <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">{editingItem ? 'Edit Entry' : 'New Entry'}</h3>
            <div className="space-y-6">
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 ml-4 italic">Media</label>
                 <input type="file" id="dish-img-up" className="hidden" onChange={handleImage} />
                 <button onClick={() => document.getElementById('dish-img-up')?.click()} className="w-full bg-slate-50 border-2 border-dashed border-slate-200 py-12 rounded-[2.5rem] flex flex-col items-center gap-4 hover:border-indigo-400 relative overflow-hidden">
                   {formData.image ? <img src={formData.image} className="absolute inset-0 w-full h-full object-cover" /> : <div className="text-[10px] font-black uppercase text-slate-400 italic">Select Image</div>}
                 </button>
               </div>
               <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-4 italic">Title</label><input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Sharp Burger" className="w-full bg-slate-50 p-6 rounded-2xl font-black text-sm italic outline-none shadow-inner" /></div>
               <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-4 italic">Context</label><textarea value={formData.desc} onChange={e => setFormData({...formData, desc: e.target.value})} placeholder="Ingredients, story, etc." className="w-full bg-slate-50 p-7 rounded-[2.5rem] text-sm h-32 outline-none resize-none shadow-inner italic leading-relaxed" /></div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-4 italic">Value (₱)</label><input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-slate-50 p-6 rounded-2xl font-black text-sm outline-none shadow-inner" /></div>
                  <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-4 italic">Group</label><select value={formData.cat} onChange={e => setFormData({...formData, cat: e.target.value})} className="w-full bg-slate-50 p-6 rounded-2xl font-black text-[10px] uppercase outline-none shadow-inner">{cats.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}<option value="">None</option></select></div>
               </div>
            </div>
            <div className="pt-6 space-y-4">
               <button onClick={handleSaveItem} disabled={loading} className="w-full py-7 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase text-[10px] tracking-[0.4em] shadow-2xl active:scale-95 transition-all hover:bg-indigo-600 disabled:opacity-50">{loading ? <i className="fa-solid fa-sync animate-spin"></i> : 'Commit Changes'}</button>
               <button onClick={() => { setEditingItem(null); setFormData(initialFormState); setActiveTab('items'); }} className="w-full text-[9px] font-black uppercase text-slate-300 tracking-widest italic">Discard</button>
            </div>
          </div>
        )}
      </div>

      {itemToDelete && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setItemToDelete(null)}>
           <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-2xl text-center space-y-8" onClick={e => e.stopPropagation()}>
              <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto shadow-inner"><i className="fa-solid fa-trash-can text-3xl"></i></div>
              <h4 className="text-2xl font-black uppercase italic tracking-tighter">Purge Entity?</h4>
              <button onClick={confirmDeleteItem} className="w-full py-5 bg-rose-500 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-[0.3em] shadow-xl">Yes, Delete</button>
           </div>
        </div>
      )}

      {catToDelete && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setCatToDelete(null)}>
           <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-2xl text-center space-y-8" onClick={e => e.stopPropagation()}>
              <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto shadow-inner"><i className="fa-solid fa-folder-minus text-3xl"></i></div>
              <h4 className="text-2xl font-black uppercase italic tracking-tighter">Delete Group?</h4>
              <div className="space-y-3 text-left">
                   <label className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 cursor-pointer"><input type="radio" checked={catDeleteOption === 'delete_all'} onChange={() => setCatDeleteOption('delete_all')} /><span className="text-xs font-black uppercase italic">Delete all items</span></label>
                   <label className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 cursor-pointer"><input type="radio" checked={catDeleteOption === 'keep_items'} onChange={() => setCatDeleteOption('keep_items')} /><span className="text-xs font-black uppercase italic">Keep items (Uncategorized)</span></label>
              </div>
              <button onClick={confirmDeleteCategory} className="w-full py-5 bg-rose-500 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-[0.3em] shadow-xl">Purge Group</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminMenu;