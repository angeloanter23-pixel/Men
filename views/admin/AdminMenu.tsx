
import React, { useState, useEffect } from 'react';
import { MenuItem, Category } from '../../types';
import * as MenuService from '../../services/menuService';

interface AdminMenuProps {
  items: MenuItem[];
  setItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  cats: Category[];
  setCats: React.Dispatch<React.SetStateAction<Category[]>>;
  isWizard?: boolean; 
  availableBranches?: any[];
}

const AdminMenu: React.FC<AdminMenuProps> = ({ items, setItems, cats, setCats, isWizard = false, availableBranches = [] }) => {
  const [activeTab, setActiveTab] = useState<'items' | 'add' | 'categories'>('items');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);
  const [catToDelete, setCatToDelete] = useState<Category | null>(null);
  const [catDeleteOption, setCatDeleteOption] = useState<'delete_all' | 'keep_items'>('keep_items');
  const [newCatName, setNewCatName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);
  
  const sessionRaw = localStorage.getItem('foodie_supabase_session');
  const session = sessionRaw ? JSON.parse(sessionRaw) : null;
  const userRole = session?.user?.role;
  const userBranchId = session?.user?.branch_id;
  const isSuperAdmin = userRole === 'super-admin' || isWizard;

  // Filtering state
  const [branchFilter, setBranchFilter] = useState<string>(isSuperAdmin ? 'all' : userBranchId || 'all');

  const initialFormState = {
    name: '', desc: '', ingredients: '', price: '', cat: '', people: '1 Person', mins: '15 mins', image: '', isPopular: false, 
    branch_ids: !isSuperAdmin && userBranchId ? [userBranchId] : (availableBranches.length > 0 ? [availableBranches[0].id] : [])
  };
  const [formData, setFormData] = useState(initialFormState);

  // Sync branch defaults if availableBranches load after init
  useEffect(() => {
    if (availableBranches.length > 0 && formData.branch_ids.length === 0 && !editingItem) {
      if (!isSuperAdmin && userBranchId) {
        setFormData(prev => ({ ...prev, branch_ids: [userBranchId] }));
      } else if (isSuperAdmin) {
        setFormData(prev => ({ ...prev, branch_ids: [availableBranches[0].id] }));
      }
    }
  }, [availableBranches, isSuperAdmin, userBranchId]);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        if (loadEvent.target?.result) setFormData(prev => ({ ...prev, image: loadEvent.target!.result as string }));
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const toggleBranch = (id: string) => {
    setFormData(prev => {
      const ids = prev.branch_ids.includes(id) 
        ? prev.branch_ids.filter(bid => bid !== id) 
        : [...prev.branch_ids, id];
      return { ...prev, branch_ids: ids };
    });
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
        is_popular: formData.isPopular,
        branch_ids: formData.branch_ids
      };

      if (isWizard) {
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
      image: item.image_url, isPopular: !!item.is_popular, branch_ids: item.branch_ids || []
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

  const filteredItems = items.filter(item => {
    if (branchFilter === 'all') return true;
    return item.branch_ids?.includes(branchFilter);
  });

  return (
    <div className="flex flex-col h-full animate-fade-in relative bg-white font-jakarta">
      <div className="bg-slate-50 border-b border-slate-100 p-6 lg:p-8 space-y-6 sticky top-0 z-[40]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div>
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Content Manager</p>
              <h3 className="text-3xl font-black uppercase tracking-tighter text-slate-900 leading-none">Menu List</h3>
           </div>
           
           <div className="flex items-center gap-3">
              {/* Branch Filter Dropdown - Only for Super Admin */}
              {activeTab === 'items' && isSuperAdmin && availableBranches.length > 0 && (
                <div className="relative group">
                   <select 
                    value={branchFilter}
                    onChange={(e) => setBranchFilter(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest outline-none appearance-none pr-10 cursor-pointer shadow-sm hover:border-indigo-300 transition-all text-slate-600 focus:ring-4 ring-indigo-500/5"
                   >
                     <option value="all">View All Branches</option>
                     {availableBranches.map(b => (
                       <option key={b.id} value={b.id}>{b.name}</option>
                     ))}
                   </select>
                   <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-300 pointer-events-none group-hover:text-indigo-400"></i>
                </div>
              )}

              <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
                <button onClick={() => setActiveTab('categories')} className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'categories' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-900'}`}>Groups</button>
                <button onClick={() => setActiveTab('items')} className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'items' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-900'}`}>Items</button>
                <button onClick={() => { setEditingItem(null); setFormData(initialFormState); setActiveTab('add'); }} className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'add' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-900'}`}>{editingItem ? 'Edit' : 'Add'}</button>
              </div>
           </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 lg:p-10 no-scrollbar pb-32">
        {activeTab === 'categories' && (
          <div className="max-w-xl mx-auto space-y-8 animate-fade-in">
             <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl">
               <h4 className="text-lg font-black uppercase mb-6 text-slate-800">New Category</h4>
               <form onSubmit={handleAddCategory} className="flex gap-2">
                 <input type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="e.g. Desserts" className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-4 ring-indigo-500/5 transition-all" />
                 <button type="submit" className="bg-indigo-600 text-white px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg">Save</button>
               </form>
             </div>
             <div className="space-y-4">
               <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest px-4">Existing Groups</h4>
               <div className="grid grid-cols-1 gap-3">
                 {cats.map(c => (
                   <div key={c.id} className="bg-white border border-slate-100 px-6 py-4 rounded-2xl flex items-center justify-between shadow-sm">
                      <div><span className="font-black text-sm text-slate-800 uppercase">{c.name}</span><span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1 block">{getItemsCountForCat(c.id)} items</span></div>
                      <button onClick={() => { setCatToDelete(c); setCatDeleteOption('keep_items'); }} className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-500 transition-all"><i className="fa-solid fa-trash-can text-xs"></i></button>
                   </div>
                 ))}
                 {cats.length === 0 && <p className="text-center py-10 text-slate-300 font-bold opacity-30">No groups defined.</p>}
               </div>
             </div>
          </div>
        )}

        {activeTab === 'items' && (
          <div className="space-y-4 max-w-4xl mx-auto">
            <div className="flex justify-between items-center px-4 mb-2">
               <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest">
                  {branchFilter === 'all' ? 'Inventory Archive' : `Location Inventory: ${availableBranches.find(b => b.id === branchFilter)?.name}`} ({filteredItems.length})
               </h4>
            </div>
            {filteredItems.map(item => (
              <div key={item.id} className="bg-white p-5 rounded-[2.5rem] border border-slate-50 flex items-center justify-between shadow-sm hover:shadow-md transition-all animate-fade-in">
                <div className="flex items-center gap-6 min-w-0">
                   <div className="w-16 h-16 rounded-[1.8rem] bg-slate-50 overflow-hidden border border-slate-100"><img src={item.image_url} className="w-full h-full object-cover" alt="" /></div>
                   <div className="min-w-0">
                      <div className="flex items-center gap-2"><h4 className="font-black text-sm text-slate-800 uppercase truncate">{item.name}</h4>{item.is_popular && <span className="bg-orange-500 text-white text-[8px] px-2 py-0.5 rounded-full font-black uppercase">Popular</span>}</div>
                      <div className="flex items-center gap-3 mt-1"><p className="text-[9px] font-black text-indigo-500 uppercase">{item.cat_name || 'Uncategorized'}</p><div className="w-1 h-1 bg-slate-200 rounded-full"></div><p className="text-[10px] font-bold text-slate-400">₱{item.price}</p></div>
                   </div>
                </div>
                <div className="flex gap-2">
                   <button onClick={() => startEdit(item)} className="w-11 h-11 rounded-[1.3rem] bg-indigo-50 text-indigo-500 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm"><i className="fa-solid fa-pen text-xs"></i></button>
                   <button onClick={() => setItemToDelete(item)} className="w-11 h-11 rounded-[1.3rem] bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm"><i className="fa-solid fa-trash-can text-xs"></i></button>
                </div>
              </div>
            ))}
            {filteredItems.length === 0 && (
              <div className="py-40 text-center flex flex-col items-center">
                 <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-slate-100 text-2xl mb-4 shadow-sm border border-slate-50">
                    <i className="fa-solid fa-box-open"></i>
                 </div>
                 <p className="text-slate-200 font-black uppercase tracking-[0.4em] opacity-50">No items found</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'add' && (
          <div className="max-w-xl mx-auto bg-white p-8 lg:p-12 rounded-[4rem] border border-slate-100 shadow-2xl space-y-10 animate-fade-in">
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">{editingItem ? 'Edit Dish' : 'Add Dish'}</h3>
            <div className="space-y-6">
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Photo</label>
                 <input type="file" id="dish-img-up" className="hidden" onChange={handleImage} />
                 <button onClick={() => document.getElementById('dish-img-up')?.click()} className="w-full bg-slate-50 border-2 border-dashed border-slate-200 py-12 rounded-[2.5rem] flex flex-col items-center gap-4 hover:border-indigo-400 relative overflow-hidden">
                   {formData.image ? <img src={formData.image} className="absolute inset-0 w-full h-full object-cover" alt="" /> : <div className="text-[10px] font-black uppercase text-slate-400">Select Image</div>}
                 </button>
               </div>
               <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-4">Dish Name</label><input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Sharp Burger" className="w-full bg-slate-50 p-6 rounded-2xl font-black text-sm outline-none shadow-inner" /></div>
               <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-4">Description</label><textarea value={formData.desc} onChange={e => setFormData({...formData, desc: e.target.value})} placeholder="Ingredients and details..." className="w-full bg-slate-50 p-7 rounded-[2.5rem] text-sm h-32 outline-none resize-none shadow-inner leading-relaxed" /></div>
               
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-4">Price (₱)</label><input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-slate-50 p-6 rounded-2xl font-black text-sm outline-none shadow-inner" /></div>
                  <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-4">Group</label><select value={formData.cat} onChange={e => setFormData({...formData, cat: e.target.value})} className="w-full bg-slate-50 p-6 rounded-2xl font-black text-[10px] uppercase outline-none shadow-inner">{cats.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}<option value="">None</option></select></div>
               </div>

               {/* Branch Selection - Only for Super Admin */}
               {isSuperAdmin && (
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Assigned Locations</label>
                    <button 
                      onClick={() => setShowBranchModal(true)}
                      className="w-full bg-slate-50 p-6 rounded-2xl font-black text-[10px] uppercase tracking-widest outline-none shadow-inner flex justify-between items-center hover:bg-slate-100 transition-colors"
                    >
                      <span>{formData.branch_ids.length} Branch{formData.branch_ids.length !== 1 ? 'es' : ''} Selected</span>
                      <i className="fa-solid fa-chevron-right text-indigo-500"></i>
                    </button>
                 </div>
               )}
            </div>
            <div className="pt-6 space-y-4">
               <button onClick={handleSaveItem} disabled={loading} className="w-full py-7 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase text-[10px] tracking-[0.4em] shadow-2xl active:scale-95 transition-all hover:bg-indigo-600 disabled:opacity-50">{loading ? <i className="fa-solid fa-sync animate-spin"></i> : 'Save Changes'}</button>
               <button onClick={() => { setEditingItem(null); setFormData(initialFormState); setActiveTab('items'); }} className="w-full text-[9px] font-black uppercase text-slate-300 tracking-widest">Discard</button>
            </div>
          </div>
        )}
      </div>

      {/* Branch Selection Dialog - Only for Super Admin */}
      {showBranchModal && isSuperAdmin && (
        <div className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-xl flex items-center justify-center p-6 animate-fade-in">
           <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-2xl space-y-8">
              <header className="flex justify-between items-start">
                 <div>
                    <p className="text-[9px] font-black uppercase text-indigo-500 mb-2">Location Assignment</p>
                    <h4 className="text-2xl font-black uppercase tracking-tighter">Select Branches</h4>
                 </div>
                 <button onClick={() => setShowBranchModal(false)} className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 hover:text-slate-900 transition-colors"><i className="fa-solid fa-xmark"></i></button>
              </header>

              <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
                 <button 
                   onClick={() => {
                     const allIds = availableBranches.map(b => b.id);
                     setFormData(prev => ({ 
                       ...prev, 
                       branch_ids: prev.branch_ids.length === allIds.length ? [] : allIds 
                     }));
                   }}
                   className="w-full p-4 rounded-2xl bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest mb-4 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                 >
                   {formData.branch_ids.length === availableBranches.length ? 'Deselect All' : 'Select All Branches'}
                 </button>

                 {availableBranches.map(branch => (
                   <button 
                     key={branch.id} 
                     onClick={() => toggleBranch(branch.id)}
                     className={`w-full p-5 rounded-2xl flex justify-between items-center transition-all group ${formData.branch_ids.includes(branch.id) ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                   >
                     <div className="text-left">
                        <p className={`text-sm font-black uppercase ${formData.branch_ids.includes(branch.id) ? 'text-white' : 'text-slate-800'}`}>{branch.name}</p>
                        <p className={`text-[8px] font-bold uppercase tracking-widest ${formData.branch_ids.includes(branch.id) ? 'text-indigo-200' : 'text-slate-300'}`}>{branch.subdomain}</p>
                     </div>
                     <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${formData.branch_ids.includes(branch.id) ? 'bg-white/20 border-white text-white' : 'border-slate-200 text-transparent group-hover:border-slate-300'}`}>
                        <i className="fa-solid fa-check text-[10px]"></i>
                     </div>
                   </button>
                 ))}

                 {availableBranches.length === 0 && (
                   <div className="py-10 text-center text-slate-300 font-bold text-xs">
                     Please add branches first.
                   </div>
                 )}
              </div>

              <button 
                onClick={() => setShowBranchModal(false)}
                className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all"
              >
                Confirm
              </button>
           </div>
        </div>
      )}

      {itemToDelete && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setItemToDelete(null)}>
           <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-2xl text-center space-y-8" onClick={e => e.stopPropagation()}>
              <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto shadow-inner"><i className="fa-solid fa-trash-can text-3xl"></i></div>
              <h4 className="text-2xl font-black uppercase tracking-tighter">Delete Item?</h4>
              <button onClick={confirmDeleteItem} className="w-full py-5 bg-rose-500 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-[0.3em] shadow-xl">Yes, Delete</button>
           </div>
        </div>
      )}

      {catToDelete && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setCatToDelete(null)}>
           <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-2xl text-center space-y-8" onClick={e => e.stopPropagation()}>
              <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto shadow-inner"><i className="fa-solid fa-folder-minus text-3xl"></i></div>
              <h4 className="text-2xl font-black uppercase tracking-tighter">Delete Group?</h4>
              <div className="space-y-3 text-left">
                   <label className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 cursor-pointer"><input type="radio" checked={catDeleteOption === 'delete_all'} onChange={() => setCatDeleteOption('delete_all')} /><span className="text-xs font-black uppercase">Delete all items</span></label>
                   <label className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 cursor-pointer"><input type="radio" checked={catDeleteOption === 'keep_items'} onChange={() => setCatDeleteOption('keep_items')} /><span className="text-xs font-black uppercase">Keep items</span></label>
              </div>
              <button onClick={confirmDeleteCategory} className="w-full py-5 bg-rose-500 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-[0.3em] shadow-xl">Confirm Delete</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminMenu;
