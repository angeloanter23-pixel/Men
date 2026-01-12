import React, { useEffect, useState } from 'react';
import * as MenuService from '../services/menuService';

type ModalType = 'restaurant' | 'branch' | 'category' | 'item' | 'delete-restaurant' | null;

function parseError(err: any) {
  if (!err) return null;
  return {
    message: err.message || "Unknown error occurred",
    details: err.details || null,
    hint: err.hint || null,
    code: err.code || null,
    stack: err.stack || null,
    ...err
  };
}

const TestSupabaseView: React.FC = () => {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [selectedRestId, setSelectedRestId] = useState<string | null>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [activeBranch, setActiveBranch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorLogs, setErrorLogs] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [formValues, setFormValues] = useState<any>({});

  const refreshGlobal = async () => {
    try {
      setLoading(true);
      const data = await MenuService.getAllRestaurants();
      setRestaurants(data);
      if (data.length > 0 && !selectedRestId) {
        setSelectedRestId(data[0].id);
      }
    } catch (err: any) {
      setError("There was an unexpected error syncing data.");
      setErrorLogs(parseError(err));
    } finally {
      setLoading(false);
    }
  };

  const refreshBranches = async (id: string) => {
    try {
      const data = await MenuService.getBranchesForRestaurant(id);
      setBranches(data);
    } catch (err: any) {
      setError("Failed to load branches.");
      setErrorLogs(parseError(err));
    }
  };

  const loadBranchMenu = async (subdomain: string) => {
    try {
      setLoading(true);
      const data = await MenuService.getMenuForBranch(subdomain);
      setActiveBranch(data);
    } catch (err: any) {
      setError("There was an unexpected error loading the menu.");
      setErrorLogs(parseError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refreshGlobal(); }, []);

  useEffect(() => {
    if (selectedRestId) {
      refreshBranches(selectedRestId);
      setActiveBranch(null);
    }
  }, [selectedRestId]);

  const handleCopyId = () => {
    if (!selectedRestId) return;
    navigator.clipboard.writeText(selectedRestId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openModal = (type: ModalType, extraData: any = {}) => {
    setModalType(type);
    setFormValues({ 
      name: '', 
      subdomain: '', 
      price: '', 
      description: '', 
      pax: '1-2 Persons', 
      serving_time: '15 mins', 
      is_popular: false,
      ...extraData 
    });
    setIsModalOpen(true);
    setError(null);
    setErrorLogs(null);
  };

  const closeModal = () => {
    if (modalLoading) return;
    setIsModalOpen(false);
    setModalType(null);
    setErrorLogs(null);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setError(null);
    setErrorLogs(null);
    try {
      if (modalType === 'restaurant') {
        const newRest = await MenuService.insertRestaurant(formValues.name);
        setRestaurants(prev => [...prev, newRest].sort((a,b) => a.name.localeCompare(b.name)));
        setSelectedRestId(newRest.id);
      } else if (modalType === 'branch') {
        const subdomain = formValues.subdomain || formValues.name.toLowerCase().replace(/\s+/g, '-');
        if (!selectedRestId) throw new Error("Must select a restaurant first.");
        await MenuService.insertBranch(formValues.name, subdomain, selectedRestId);
        await refreshBranches(selectedRestId);
      } else if (modalType === 'category') {
        await MenuService.upsertCategory({ 
          id: formValues.id || undefined,
          name: formValues.name, 
          menu_id: activeBranch.menu_id, 
          order_index: (activeBranch.categories?.length || 0) 
        });
        await loadBranchMenu(activeBranch.subdomain);
      } else if (modalType === 'item') {
        await MenuService.upsertMenuItem({
          id: formValues.id || undefined,
          name: formValues.name,
          price: parseFloat(formValues.price),
          category_id: formValues.category_id,
          description: formValues.description,
          image_url: formValues.image_url || `https://picsum.photos/seed/${formValues.id || Math.random()}/400`,
          serving_time: formValues.serving_time,
          pax: formValues.pax,
          is_popular: formValues.is_popular
        });
        await loadBranchMenu(activeBranch.subdomain);
      } else if (modalType === 'delete-restaurant') {
        await handleActualDeleteRestaurant();
        return; 
      }
      closeModal();
    } catch (err: any) {
      setError(err.message || "Action refused by server.");
      setErrorLogs(parseError(err));
      console.error("Submit Error:", err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleActualDeleteRestaurant = async () => {
    if (!selectedRestId) return;
    try {
      await MenuService.deleteRestaurant(selectedRestId);
      const remaining = restaurants.filter(r => r.id !== selectedRestId);
      setRestaurants(remaining);
      setBranches([]);
      setActiveBranch(null);
      setSelectedRestId(remaining.length > 0 ? remaining[0].id : null);
      closeModal();
    } catch (err: any) {
      setError("Deletion failed. Ensure no branches or menu dependencies exist.");
      setErrorLogs(parseError(err));
    }
  };

  const handleDeleteBranch = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (!confirm(`Delete branch "${name}"?`)) return;
    try {
      setLoading(true);
      await MenuService.deleteBranch(id);
      if (activeBranch?.id === id) setActiveBranch(null);
      if (selectedRestId) await refreshBranches(selectedRestId);
    } catch (err: any) {
      setError("Failed to delete branch.");
      setErrorLogs(parseError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Delete this menu item?")) return;
    try {
      setLoading(true);
      await MenuService.deleteMenuItem(id);
      if (activeBranch) loadBranchMenu(activeBranch.subdomain);
    } catch (err: any) {
      setError("Failed to delete item.");
      setErrorLogs(parseError(err));
    } finally {
      setLoading(false);
    }
  };

  const currentRestaurantName = restaurants.find(r => r.id === selectedRestId)?.name || "Foodie Premium";

  if (loading && restaurants.length === 0) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-6"></div>
        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] animate-pulse">Syncing Merchant Cloud...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFBFD] font-['Plus_Jakarta_Sans'] pb-40 text-slate-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shrink-0 shadow-sm">
        <div className="h-16 lg:h-20 flex items-center justify-between px-6 max-w-xl mx-auto">
          <div className="flex items-center gap-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Control Center / <span className="text-slate-900">{activeBranch?.name || 'Live Environment'}</span>
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => openModal('restaurant')} 
              className="w-10 h-10 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-transform"
              title="New Entity"
            >
              <i className="fa-solid fa-plus text-xs"></i>
            </button>
            {selectedRestId && (
              <button 
                onClick={() => openModal('delete-restaurant')} 
                className="w-10 h-10 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center border border-rose-100 hover:bg-rose-500 hover:text-white transition-colors"
                title="Purge System"
              >
                <i className="fa-solid fa-trash-can text-xs"></i>
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="px-6 py-10 max-w-xl mx-auto space-y-10 animate-fade-in">
        
        <section className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl space-y-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8">
            <i className="fa-solid fa-building-shield text-slate-50 text-6xl group-hover:text-indigo-50 transition-colors"></i>
          </div>
          <div className="relative z-10">
            <div className="flex justify-between items-end mb-1 px-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Select Infrastructure</label>
              {selectedRestId && (
                <button 
                  onClick={handleCopyId}
                  className={`text-[8px] font-black uppercase tracking-widest transition-colors ${copied ? 'text-emerald-500' : 'text-indigo-400 hover:text-indigo-600'}`}
                >
                  {copied ? 'Copied ID' : 'Copy ID'}
                </button>
              )}
            </div>
            <select 
              disabled={loading}
              value={selectedRestId || ''} 
              onChange={(e) => setSelectedRestId(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-[2rem] p-5 font-black text-xs uppercase outline-none focus:ring-4 ring-indigo-500/5 disabled:opacity-50 appearance-none shadow-inner"
            >
              {restaurants.length === 0 && <option value="">Initialize Enterprise First</option>}
              {restaurants.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
        </section>

        {error && !isModalOpen && (
          <div className="bg-rose-50 border border-rose-100 p-8 rounded-[3rem] animate-fade-in flex flex-col gap-4 shadow-sm">
            <div className="flex items-start gap-4">
              <i className="fa-solid fa-triangle-exclamation text-rose-500 mt-1"></i>
              <div>
                <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest leading-none">Protocol Interruption</p>
                <p className="text-xs font-bold text-rose-400 mt-2">{error}</p>
              </div>
            </div>
          </div>
        )}

        <section className="space-y-6">
          <div className="flex justify-between items-center px-4">
             <h3 className="text-xl font-black italic tracking-tighter uppercase text-slate-800 leading-none">
               Active <span className="text-indigo-600">Zones</span>
             </h3>
             <button 
               disabled={!selectedRestId} 
               onClick={() => openModal('branch')} 
               className="bg-slate-900 text-white px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest active:scale-95 disabled:opacity-50 shadow-xl shadow-slate-100 transition-all hover:bg-indigo-600"
             >
               Deploy Zone
             </button>
          </div>

          <div className="flex overflow-x-auto no-scrollbar gap-4 px-2 pb-6">
            {branches.map(b => (
              <div key={b.id} className="relative group shrink-0">
                <button 
                  onClick={() => loadBranchMenu(b.subdomain)}
                  className={`px-8 py-6 rounded-[2.5rem] border transition-all whitespace-nowrap flex flex-col items-start min-w-[160px] pr-14 ${activeBranch?.id === b.id ? 'bg-indigo-600 border-indigo-600 shadow-2xl shadow-indigo-100 text-white' : 'bg-white border-slate-100 text-slate-400 shadow-md hover:shadow-lg hover:-translate-y-1'}`}
                >
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">{b.subdomain}</span>
                  <span className="font-black text-sm uppercase italic leading-none">{b.name}</span>
                </button>
                <button 
                  onClick={(e) => handleDeleteBranch(e, b.id, b.name)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-rose-500/10 text-rose-500 opacity-0 group-hover:opacity-100 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center z-10"
                >
                  <i className="fa-solid fa-trash-can text-[10px]"></i>
                </button>
              </div>
            ))}
          </div>
        </section>

        {activeBranch ? (
          <div className="space-y-12 pt-6">
            <div className="bg-[#0f172a] p-10 rounded-[4rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.3)] relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 flex gap-3 z-10">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]"></div>
                  <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.3em] italic">V5.0 PLATINUM CORE</span>
               </div>
               <div className="relative z-10">
                  <h4 className="text-white text-3xl lg:text-4xl font-black uppercase italic tracking-tighter leading-none mb-4">{activeBranch.name}</h4>
                  <p className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.4em] mb-10 opacity-60">System Environment Hub</p>
                  <button onClick={() => openModal('category')} className="bg-indigo-600 text-white px-10 py-4 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-[0_15px_30px_rgba(79,70,229,0.3)] active:scale-95 transition-all hover:bg-indigo-500">
                    Register Category
                  </button>
               </div>
            </div>

            {activeBranch.categories?.length > 0 ? activeBranch.categories.map((cat: any) => (
              <div key={cat.id} className="space-y-8 animate-fade-in-up">
                <div className="flex items-center gap-6 group px-2">
                  <h5 className="text-[11px] font-black uppercase text-slate-900 tracking-[0.5em] bg-white px-8 py-4 rounded-full border border-slate-100 shadow-lg italic">
                    {cat.name}
                  </h5>
                  <div className="h-[2px] bg-slate-100 flex-1 rounded-full opacity-40"></div>
                  <button onClick={() => MenuService.deleteCategory(cat.id).then(() => loadBranchMenu(activeBranch.subdomain))} className="w-12 h-12 bg-white rounded-full text-slate-200 hover:text-rose-500 shadow-md border border-slate-50 transition-all flex items-center justify-center hover:shadow-xl">
                    <i className="fa-solid fa-trash-can text-sm"></i>
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {cat.items?.map((item: any) => (
                    <div key={item.id} className="bg-white p-6 rounded-[3.5rem] border border-slate-50 flex gap-6 shadow-md group hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.05)] transition-all duration-500 relative overflow-hidden">
                      <div className="w-28 h-28 rounded-[2.5rem] overflow-hidden bg-slate-100 shrink-0 shadow-inner group-hover:shadow-lg transition-all duration-700">
                        <img src={item.image_url} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={item.name} />
                      </div>
                      <div className="flex-1 py-1 flex flex-col justify-center">
                        <div className="flex justify-between items-start mb-2 pr-2">
                           <h6 className="font-black text-slate-800 text-base uppercase tracking-tight italic leading-none">{item.name}</h6>
                           <span className="font-black text-xl text-indigo-600 tracking-tighter italic">₱{item.price}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed mb-3">{item.description}</p>
                        <div className="flex gap-4 items-center mb-4">
                           <span className="flex items-center gap-1.5 text-[9px] font-black text-slate-300 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                              <i className="fa-solid fa-users text-[8px]"></i> {item.pax || '1-2'}
                           </span>
                           <span className="flex items-center gap-1.5 text-[9px] font-black text-slate-300 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                              <i className="fa-solid fa-clock text-[8px]"></i> {item.serving_time || '15 mins'}
                           </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                           <button onClick={() => openModal('item', { ...item, category_id: cat.id })} className="bg-slate-50 text-slate-900 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm">Sync Edit</button>
                           <button onClick={() => handleDeleteItem(item.id)} className="bg-rose-50 text-rose-500 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all shadow-sm">Purge</button>
                        </div>
                      </div>
                      {item.is_popular && (
                        <div className="absolute top-4 right-4 text-orange-500 text-[8px] font-black uppercase tracking-[0.3em] bg-orange-50 px-3 py-1 rounded-full border border-orange-100 shadow-sm">Trending</div>
                      )}
                    </div>
                  ))}
                  <button onClick={() => openModal('item', { category_id: cat.id })} className="w-full py-14 border-4 border-dashed border-slate-100 rounded-[4rem] text-[10px] font-black uppercase text-slate-300 tracking-[0.5em] hover:border-indigo-200 hover:text-indigo-400 transition-all flex flex-col items-center justify-center gap-5 bg-slate-50/30 group">
                    <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                      <i className="fa-solid fa-plus-circle text-2xl opacity-40"></i>
                    </div>
                    <span>Commit Item to {cat.name}</span>
                  </button>
                </div>
              </div>
            )) : (
              <div className="py-24 text-center space-y-8 animate-fade-in">
                <button onClick={() => openModal('category')} className="bg-indigo-600 text-white px-12 py-5 rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl active:scale-95 transition-all hover:bg-indigo-700">Deploy Structure</button>
              </div>
            )}
          </div>
        ) : selectedRestId && !loading && (
          <div className="py-32 flex flex-col items-center justify-center text-center opacity-30 animate-pulse">
            <i className="fa-solid fa-satellite text-6xl mb-8 text-indigo-400"></i>
            <p className="text-[11px] font-black uppercase tracking-[0.6em] italic text-slate-900">Scan for territory to unlock control</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-2xl animate-fade-in overflow-y-auto">
          <div className={`bg-white w-full max-w-sm rounded-[4.5rem] p-10 lg:p-12 shadow-2xl relative transition-all my-auto ${modalType === 'delete-restaurant' ? 'border-8 border-rose-500/10' : 'border-8 border-indigo-500/5'}`} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-8">
              <div className="pr-4">
                <p className={`text-[9px] font-black uppercase tracking-[0.5em] mb-3 ${modalType === 'delete-restaurant' ? 'text-rose-500' : 'text-indigo-500'}`}>{currentRestaurantName}</p>
                <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900 leading-none italic">
                  {modalType === 'restaurant' && 'New Entity'}
                  {modalType === 'branch' && 'Deploy Zone'}
                  {modalType === 'category' && 'Category Key'}
                  {modalType === 'item' && 'Library Entry'}
                  {modalType === 'delete-restaurant' && 'SYSTEM PURGE'}
                </h2>
              </div>
              <button disabled={modalLoading} onClick={closeModal} className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-300 hover:text-rose-500 transition-all flex items-center justify-center">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="space-y-6">
              {modalType === 'delete-restaurant' ? (
                <div className="space-y-8">
                  <div className="p-8 bg-rose-50 rounded-[3rem] border border-rose-100 shadow-inner text-center">
                    <p className="text-[11px] font-bold text-rose-600 uppercase tracking-tight italic">Action is irreversible.</p>
                  </div>
                </div>
              ) : modalType === 'item' ? (
                <div className="space-y-5">
                   <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-6">Item Identity</label>
                    <input autoFocus required disabled={modalLoading} type="text" value={formValues.name} onChange={e => setFormValues({...formValues, name: e.target.value})} className="w-full bg-slate-50 border-none rounded-[2rem] p-5 text-sm font-black outline-none ring-4 ring-indigo-500/5 focus:ring-indigo-500/10 transition-all shadow-inner italic" placeholder="e.g. Wagyu Ribeye" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-6">Unit Price (₱)</label>
                      <input required disabled={modalLoading} type="number" value={formValues.price} onChange={e => setFormValues({...formValues, price: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-black outline-none ring-4 ring-indigo-500/5 focus:ring-indigo-500/10 transition-all shadow-inner" placeholder="0.00" />
                    </div>
                    <div className="space-y-2 flex flex-col justify-end">
                      <button type="button" onClick={() => setFormValues({...formValues, is_popular: !formValues.is_popular})} className={`w-full py-5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm ${formValues.is_popular ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                        {formValues.is_popular ? '★ Popular' : 'Mark Popular'}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-6">Gourmet Description</label>
                    <textarea disabled={modalLoading} value={formValues.description} onChange={e => setFormValues({...formValues, description: e.target.value})} className="w-full bg-slate-50 border-none rounded-[2rem] p-6 text-sm font-bold outline-none ring-4 ring-indigo-500/5 focus:ring-indigo-500/10 transition-all shadow-inner italic h-24 resize-none" placeholder="Describe flavor profile..." />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-6">Pax Count</label>
                      <input disabled={modalLoading} type="text" value={formValues.pax} onChange={e => setFormValues({...formValues, pax: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-5 text-xs font-black outline-none ring-4 ring-indigo-500/5 focus:ring-indigo-500/10 transition-all shadow-inner" placeholder="1-2 Persons" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-6">Wait Time</label>
                      <input disabled={modalLoading} type="text" value={formValues.serving_time} onChange={e => setFormValues({...formValues, serving_time: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-5 text-xs font-black outline-none ring-4 ring-indigo-500/5 focus:ring-indigo-500/10 transition-all shadow-inner" placeholder="15-20 mins" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-6">Identifier</label>
                    <input autoFocus required disabled={modalLoading} type="text" value={formValues.name} onChange={e => setFormValues({...formValues, name: e.target.value})} className="w-full bg-slate-50 border-none rounded-[2rem] p-6 text-sm font-black outline-none ring-4 ring-indigo-500/5 focus:ring-indigo-500/10 transition-all shadow-inner italic" placeholder="Name..." />
                  </div>
                  {modalType === 'branch' && (
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-6">Target Subdomain</label>
                      <input required disabled={modalLoading} type="text" value={formValues.subdomain} onChange={e => setFormValues({...formValues, subdomain: e.target.value.toLowerCase().replace(/\s+/g, '-')})} className="w-full bg-slate-50 border-none rounded-[2rem] p-6 text-sm font-black outline-none ring-4 ring-indigo-500/5 focus:ring-indigo-500/10 transition-all shadow-inner italic" placeholder="subdomain-slug" />
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-4 pt-8">
                <button type="button" disabled={modalLoading} onClick={closeModal} className="flex-1 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 rounded-[2.5rem] hover:bg-slate-100 transition-all">Discard</button>
                <button type="submit" disabled={modalLoading} className={`flex-[2] py-6 text-[10px] font-black uppercase tracking-[0.4em] text-white rounded-[2.5rem] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 ${modalType === 'delete-restaurant' ? 'bg-rose-600' : 'bg-indigo-600'}`}>
                  {modalLoading ? <i className="fa-solid fa-sync-alt animate-spin"></i> : (modalType === 'delete-restaurant' ? 'PURGE' : 'COMMIT')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer className="mt-40 text-center py-24 opacity-30">
        <p className="text-[10px] font-black text-slate-900 uppercase tracking-[1.2em] italic">Enterprise Digital Ecosystem v5.0 Platinum</p>
      </footer>
    </div>
  );
};

export { TestSupabaseView as default };
