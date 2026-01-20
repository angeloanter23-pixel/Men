
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

  // Get session info
  const sessionRaw = localStorage.getItem('foodie_supabase_session');
  const session = sessionRaw ? JSON.parse(sessionRaw) : null;
  const restaurantId = session?.restaurant?.id;

  const initialFormState = {
    name: '', 
    desc: '', 
    ingredients: '', 
    price: '', 
    cat: '', 
    people: '1 Person', 
    mins: '15 mins', 
    image: '',
    isPopular: false
  };
  const [formData, setFormData] = useState(initialFormState);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        if (loadEvent.target?.result) {
          setFormData(prev => ({ ...prev, image: loadEvent.target!.result as string }));
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSaveItem = async () => {
    if (!formData.name || !formData.price) return alert("Please fill in Name and Price.");
    setLoading(true);
    try {
      const targetCategory = cats.find(c => c.name === formData.cat);

      // Convert text ingredients to objects for the database
      const ingredientsArray = formData.ingredients
        .split(',')
        .map(i => {
          const trimmed = i.trim();
          if (!trimmed) return null;
          return {
            key: trimmed.toLowerCase().replace(/\s+/g, '_'),
            label: trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
          };
        })
        .filter(i => i !== null);

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

      if (editingItem) itemPayload.id = editingItem.id;

      if (!isWizard) {
        const dbItem = await MenuService.upsertMenuItem(itemPayload);
        const savedItem = { ...dbItem, cat_name: targetCategory ? targetCategory.name : 'Uncategorized' };
        
        if (editingItem) {
          setItems(prev => prev.map(it => it.id === editingItem.id ? savedItem : it));
        } else {
          setItems(prev => [savedItem, ...prev]);
        }
      } else {
        // Wizard mode
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
      }

      setFormData(initialFormState);
      setEditingItem(null);
      setActiveTab('items');
    } catch (err: any) {
      alert("Error saving: " + err.message);
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
      name: item.name,
      desc: item.description,
      ingredients: formattedIngredients,
      price: item.price.toString(),
      cat: item.cat_name === 'Uncategorized' ? '' : item.cat_name,
      people: item.pax,
      mins: item.serving_time,
      image: item.image_url,
      isPopular: !!item.is_popular
    });
    setActiveTab('add');
  };

  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;
    setLoading(true);
    try {
      if (!isWizard) {
        await MenuService.deleteMenuItem(itemToDelete.id.toString());
      }
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
            // Bulk delete items in database first
            for (const item of itemsInCat) {
                await MenuService.deleteMenuItem(item.id.toString());
            }
            // Update local state by removing items
            setItems(prev => prev.filter(i => i.category_id !== catToDelete.id));
        } else {
            // STRATEGY: Reassign items to null (Uncategorized)
            for (const item of itemsInCat) {
                const updatedPayload = { ...item, category_id: null };
                delete (updatedPayload as any).cat_name; // Clean up before DB upsert
                await MenuService.upsertMenuItem(updatedPayload);
            }
            // Update local state to reflect reassignment
            setItems(prev => prev.map(i => i.category_id === catToDelete.id ? { ...i, category_id: null, cat_name: 'Uncategorized' } : i));
        }

        await MenuService.deleteCategory(catToDelete.id.toString());
      } else {
        // Wizard mode (local only)
        if (catDeleteOption === 'delete_all') {
          setItems(prev => prev.filter(i => i.category_id !== catToDelete.id));
        } else {
          setItems(prev => prev.map(i => i.category_id === catToDelete.id ? { ...i, category_id: null, cat_name: 'Uncategorized' } : i));
        }
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
    const menuId = session?.defaultMenuId;
    if (!newCatName.trim() || !menuId) return;
    setLoading(true);
    try {
      const newCat = await MenuService.upsertCategory({
        name: newCatName.trim(),
        menu_id: menuId,
        order_index: cats.length
      });
      setCats(prev => [...prev, newCat]);
      setNewCatName('');
    } catch (err) {
      alert("Failed to add category.");
    } finally {
      setLoading(false);
    }
  };

  // Helper to get item count for specific category
  const getItemsCountForCat = (catId: number) => items.filter(i => i.category_id === catId).length;

  return (
    <div className="flex flex-col h-full animate-fade-in relative bg-white font-['Plus_Jakarta_Sans']">
      
      {/* Header with 3 Simple Tabs */}
      <div className="bg-slate-50 border-b border-slate-100 p-6 lg:p-8 space-y-6 sticky top-0 z-[40]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div>
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Tools</p>
              <h3 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">Edit Menu</h3>
           </div>
           
           <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
             <button 
              onClick={() => setActiveTab('categories')}
              className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'categories' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-900'}`}
             >
               Groups
             </button>
             <button 
              onClick={() => setActiveTab('items')}
              className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'items' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-900'}`}
             >
               Dish List
             </button>
             <button 
              onClick={() => { setEditingItem(null); setFormData(initialFormState); setActiveTab('add'); }}
              className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'add' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-900'}`}
             >
               {editingItem ? 'Edit Dish' : 'Add New'}
             </button>
           </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 lg:p-10 no-scrollbar pb-32">
        
        {/* TAB: Categories */}
        {activeTab === 'categories' && (
          <div className="max-w-xl mx-auto space-y-8 animate-fade-in">
             <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl">
               <h4 className="text-lg font-black uppercase mb-6 italic text-slate-800">New Group Name</h4>
               <form onSubmit={handleAddCategory} className="flex gap-2">
                 <input 
                   type="text" 
                   value={newCatName}
                   onChange={e => setNewCatName(e.target.value)}
                   placeholder="Enter group name (e.g. Desserts)" 
                   className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-4 ring-indigo-500/5 transition-all"
                 />
                 <button type="submit" className="bg-indigo-600 text-white px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 shadow-lg">Save</button>
               </form>
             </div>

             <div className="space-y-4">
               <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest px-4">Current Groups</h4>
               <div className="grid grid-cols-1 gap-3">
                 {cats.map(c => (
                   <div key={c.id} className="bg-white border border-slate-100 px-6 py-4 rounded-2xl flex items-center justify-between shadow-sm">
                      <div className="flex flex-col">
                        <span className="font-black text-sm text-slate-800 uppercase italic leading-none">{c.name}</span>
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1">{getItemsCountForCat(c.id)} Dishes</span>
                      </div>
                      <button 
                        onClick={() => { setCatToDelete(c); setCatDeleteOption('keep_items'); }}
                        className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all"
                      >
                        <i className="fa-solid fa-trash-can text-xs"></i>
                      </button>
                   </div>
                 ))}
                 {cats.length === 0 && <p className="text-center py-10 text-slate-300 font-bold italic">No groups yet.</p>}
               </div>
             </div>
          </div>
        )}

        {/* TAB: View Items */}
        {activeTab === 'items' && (
          <div className="space-y-4 animate-fade-in max-w-4xl mx-auto">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest px-4">All Dishes ({items.length})</h4>
            {items.map(item => (
              <div key={item.id} className="bg-white p-5 rounded-[2.5rem] border border-slate-50 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex items-center gap-6 min-w-0">
                   <div className="w-16 h-16 rounded-[1.8rem] bg-slate-50 overflow-hidden border border-slate-100 shrink-0">
                      <img src={item.image_url} className="w-full h-full object-cover" />
                   </div>
                   <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-sm text-slate-800 uppercase italic truncate">{item.name}</h4>
                        {item.is_popular && <span className="bg-orange-500 text-white text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest">Popular</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">{item.cat_name || 'Uncategorized'}</p>
                        <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                        <p className="text-[10px] font-bold text-slate-400">₱{item.price}</p>
                      </div>
                   </div>
                </div>
                <div className="flex gap-2 shrink-0">
                   <button onClick={() => startEdit(item)} className="w-11 h-11 rounded-[1.3rem] bg-indigo-50 text-indigo-500 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all active:scale-90 shadow-sm"><i className="fa-solid fa-pen text-xs"></i></button>
                   <button 
                    onClick={() => setItemToDelete(item)} 
                    className="w-11 h-11 rounded-[1.3rem] bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all active:scale-90 shadow-sm"
                   >
                     <i className="fa-solid fa-trash-can text-xs"></i>
                   </button>
                </div>
              </div>
            ))}
            {items.length === 0 && !loading && (
              <div className="py-32 text-center flex flex-col items-center justify-center opacity-20">
                <i className="fa-solid fa-book-open text-6xl mb-6 text-slate-300"></i>
                <p className="text-[11px] font-black uppercase tracking-[0.5em] italic">No dishes found</p>
              </div>
            )}
          </div>
        )}

        {/* TAB: Add/Edit Item Form */}
        {activeTab === 'add' && (
          <div className="max-w-xl mx-auto bg-white p-8 lg:p-12 rounded-[4rem] border border-slate-100 shadow-2xl space-y-10 animate-fade-in relative overflow-hidden">
            <header>
               <p className="text-[10px] font-black uppercase text-indigo-500 tracking-widest mb-1 italic">Details</p>
               <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">{editingItem ? 'Edit Dish' : 'New Dish'}</h3>
            </header>

            <div className="space-y-6">
               {/* Image Upload */}
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 ml-4 italic">Photo</label>
                 <input type="file" id="dish-img-up" className="hidden" onChange={handleImage} />
                 <button 
                   onClick={() => document.getElementById('dish-img-up')?.click()}
                   className="w-full bg-slate-50 border-2 border-dashed border-slate-200 py-12 rounded-[2.5rem] flex flex-col items-center gap-4 transition-all hover:border-indigo-400 group overflow-hidden relative"
                 >
                   {formData.image ? (
                     <img src={formData.image} className="absolute inset-0 w-full h-full object-cover" />
                   ) : (
                     <>
                       <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-slate-300 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all"><i className="fa-solid fa-image text-lg"></i></div>
                       <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic">Upload Photo</span>
                     </>
                   )}
                 </button>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-4 italic">Dish Name</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Cheese Burger" className="w-full bg-slate-50 p-6 rounded-2xl font-black text-sm italic outline-none border border-transparent focus:ring-4 ring-indigo-500/5 transition-all shadow-inner" />
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-4 italic">Description</label>
                  <textarea value={formData.desc} onChange={e => setFormData({...formData, desc: e.target.value})} placeholder="What is in this dish?" className="w-full bg-slate-50 p-7 rounded-[2.5rem] text-sm h-32 outline-none resize-none border border-transparent focus:ring-4 ring-indigo-500/5 shadow-inner italic leading-relaxed" />
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-4 italic">Ingredients (List separated by comma)</label>
                  <input type="text" value={formData.ingredients} onChange={e => setFormData({...formData, ingredients: e.target.value})} placeholder="meat, garlic, salt" className="w-full bg-slate-50 p-6 rounded-2xl text-xs font-bold outline-none border border-transparent focus:ring-4 ring-indigo-500/5 shadow-inner" />
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-4 italic">Price (₱)</label>
                    <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="0" className="w-full bg-slate-50 p-6 rounded-2xl font-black text-sm outline-none shadow-inner border border-transparent" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-4 italic">Popular Dish?</label>
                    <select 
                      value={formData.isPopular ? 'yes' : 'no'} 
                      onChange={e => setFormData({...formData, isPopular: e.target.value === 'yes'})} 
                      className="w-full bg-slate-50 p-6 rounded-2xl font-black text-[10px] uppercase outline-none shadow-inner cursor-pointer"
                    >
                       <option value="no">Not Popular</option>
                       <option value="yes">Set as Popular</option>
                    </select>
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-4 italic">Group / Category</label>
                  <select value={formData.cat} onChange={e => setFormData({...formData, cat: e.target.value})} className="w-full bg-slate-50 p-6 rounded-2xl font-black text-[10px] uppercase outline-none shadow-inner cursor-pointer">
                     <option value="">Uncategorized (None)</option>
                     {cats.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
               </div>
            </div>

            <div className="pt-6 space-y-4">
               <button 
                onClick={handleSaveItem} 
                disabled={loading}
                className="w-full py-7 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase text-[10px] tracking-[0.4em] shadow-2xl active:scale-95 transition-all hover:bg-indigo-600 disabled:opacity-50"
               >
                 {loading ? <i className="fa-solid fa-spinner animate-spin"></i> : (editingItem ? 'Save Changes' : 'Save Dish')}
               </button>
               
               <button 
                onClick={() => { setEditingItem(null); setFormData(initialFormState); setActiveTab('items'); }} 
                className="w-full text-[9px] font-black uppercase text-slate-300 hover:text-rose-500 tracking-widest transition-all"
               >
                 Cancel
               </button>
            </div>
          </div>
        )}
      </div>

      {/* CUSTOM PREMIUM DELETE MODAL (ITEMS) */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in" onClick={() => setItemToDelete(null)}>
           <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-2xl text-center space-y-8 animate-scale" onClick={e => e.stopPropagation()}>
              <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <i className="fa-solid fa-trash-can text-3xl"></i>
              </div>
              <div>
                <h4 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">Delete Dish?</h4>
                <p className="text-sm text-slate-400 font-medium mt-2">Are you sure you want to remove <span className="text-slate-900 font-bold">"{itemToDelete.name}"</span>? This cannot be undone.</p>
              </div>
              <div className="space-y-3">
                 <button 
                  onClick={confirmDeleteItem} 
                  disabled={loading}
                  className="w-full py-5 bg-rose-500 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-[0.3em] shadow-xl shadow-rose-500/20 active:scale-95 transition-all"
                 >
                   {loading ? <i className="fa-solid fa-spinner animate-spin"></i> : 'Yes, Delete Item'}
                 </button>
                 <button 
                  onClick={() => setItemToDelete(null)}
                  className="w-full py-4 text-[10px] font-black uppercase text-slate-300 hover:text-slate-600 tracking-widest transition-colors"
                 >
                   Keep this Dish
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* CUSTOM PREMIUM DELETE MODAL (CATEGORIES/GROUPS) */}
      {catToDelete && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in" onClick={() => setCatToDelete(null)}>
           <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-2xl text-center space-y-8 animate-scale" onClick={e => e.stopPropagation()}>
              <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <i className="fa-solid fa-folder-minus text-3xl"></i>
              </div>
              <div>
                <h4 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">Delete Group?</h4>
                <p className="text-sm text-slate-400 font-medium mt-2">Group <span className="text-slate-900 font-bold">"{catToDelete.name}"</span> currently contains <span className="text-indigo-600 font-black">{getItemsCountForCat(catToDelete.id)} items</span>.</p>
              </div>

              {getItemsCountForCat(catToDelete.id) > 0 && (
                <div className="space-y-3 text-left">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic text-center">Handling Instructions</p>
                   <label className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer transition-all hover:bg-white hover:border-indigo-200 group">
                      <input 
                        type="radio" 
                        name="cat-delete-opt" 
                        checked={catDeleteOption === 'delete_all'} 
                        onChange={() => setCatDeleteOption('delete_all')}
                        className="w-4 h-4 accent-indigo-600"
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-800 uppercase italic">Delete all dishes</span>
                        <span className="text-[9px] font-bold text-slate-400">Permanently remove dishes in this category</span>
                      </div>
                   </label>
                   <label className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer transition-all hover:bg-white hover:border-indigo-200 group">
                      <input 
                        type="radio" 
                        name="cat-delete-opt" 
                        checked={catDeleteOption === 'keep_items'} 
                        onChange={() => setCatDeleteOption('keep_items')}
                        className="w-4 h-4 accent-indigo-600"
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-800 uppercase italic">Keep dishes</span>
                        <span className="text-[9px] font-bold text-slate-400">Items will become uncategorized</span>
                      </div>
                   </label>
                </div>
              )}

              <div className="space-y-3 pt-2">
                 <button 
                  onClick={confirmDeleteCategory} 
                  disabled={loading}
                  className="w-full py-5 bg-rose-500 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-[0.3em] shadow-xl shadow-rose-500/20 active:scale-95 transition-all"
                 >
                   {loading ? <i className="fa-solid fa-spinner animate-spin"></i> : 'Yes, Delete Group'}
                 </button>
                 <button 
                  onClick={() => setCatToDelete(null)}
                  className="w-full py-4 text-[10px] font-black uppercase text-slate-300 hover:text-slate-600 tracking-widest transition-colors"
                 >
                   Keep this Group
                 </button>
              </div>
           </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-white/50 backdrop-blur-[2px] z-[100] flex items-center justify-center pointer-events-none">
           <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin shadow-xl"></div>
        </div>
      )}
      
      <style>{`
        @keyframes scale { 0% { transform: scale(0.9); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        .animate-scale { animation: scale 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
      `}</style>
    </div>
  );
};

export default AdminMenu;
