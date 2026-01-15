import React, { useEffect, useState } from 'react';
import * as MenuService from '../services/menuService';

type ModalType = 'branch' | 'category' | 'item' | 'delete-account' | null;

const CATEGORY_PRESETS = ['Signature', 'Main Course', 'Appetizers', 'Beverages', 'Desserts', 'Snacks'];

const TestSupabaseView: React.FC = () => {
  // Auth State
  const [session, setSession] = useState<{user: any, restaurant: any} | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authForm, setAuthForm] = useState({ email: '', password: '' });
  
  // Dashboard State
  const [branches, setBranches] = useState<any[]>([]);
  const [activeBranch, setActiveBranch] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Enterprise Editing
  const [isEditingRestName, setIsEditingRestName] = useState(false);
  const [newRestName, setNewRestName] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [formValues, setFormValues] = useState<any>({});

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem('foodie_supabase_session');
    if (saved) {
      try {
        setSession(JSON.parse(saved));
      } catch (e) {
        localStorage.removeItem('foodie_supabase_session');
      }
    }
  }, []);

  useEffect(() => {
    if (session?.restaurant?.id) {
      refreshBranches();
      setNewRestName(session.restaurant.name);
    }
  }, [session]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      let res;
      if (authMode === 'signup') {
        res = await MenuService.authSignUp(authForm.email, authForm.password);
      } else {
        res = await MenuService.authSignIn(authForm.email, authForm.password);
      }
      setSession(res);
      localStorage.setItem('foodie_supabase_session', JSON.stringify(res));
    } catch (err: any) {
      setError(err.message || "Access Denied.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRestaurantName = async () => {
    if (!newRestName.trim() || !session?.restaurant?.id) return;
    setLoading(true);
    try {
      const updated = await MenuService.updateRestaurant(session.restaurant.id, newRestName);
      const newSession = { ...session, restaurant: updated };
      setSession(newSession);
      localStorage.setItem('foodie_supabase_session', JSON.stringify(newSession));
      setIsEditingRestName(false);
    } catch (err: any) {
      setError("Failed to update identity.");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setSession(null);
    setBranches([]);
    setActiveBranch(null);
    localStorage.removeItem('foodie_supabase_session');
  };

  const refreshBranches = async () => {
    if (!session?.restaurant?.id) return;
    try {
      setLoading(true);
      const data = await MenuService.getBranchesForRestaurant(session.restaurant.id);
      setBranches(data);
    } catch (err: any) {
      setError("Sync failed.");
    } finally {
      setLoading(false);
    }
  };

  const loadBranchMenu = async (subdomain: string) => {
    try {
      setLoading(true);
      const data = await MenuService.getMenuForBranch(subdomain);
      setActiveBranch(data);
    } catch (err: any) {
      setError("Failed to load branch resources.");
    } finally {
      setLoading(false);
    }
  };

  const openModal = (type: ModalType, extraData: any = {}) => {
    setModalType(type);
    setFormValues({ 
      name: '', subdomain: '', price: '', description: '', 
      pax: '1 Person', serving_time: '15 mins', is_popular: false,
      image_url: '',
      ...extraData 
    });
    setIsModalOpen(true);
    setError(null);
  };

  const closeModal = () => {
    if (modalLoading) return;
    setIsModalOpen(false);
    setModalType(null);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setError(null);
    try {
      if (modalType === 'branch') {
        const sub = formValues.subdomain || formValues.name.toLowerCase().replace(/\s+/g, '-');
        await MenuService.insertBranch(formValues.name, sub, session!.restaurant.id);
        await refreshBranches();
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
      } else if (modalType === 'delete-account') {
        await MenuService.deleteRestaurant(session!.restaurant.id);
        logout();
      }
      closeModal();
    } catch (err: any) {
      setError(err.message || "Operation failed.");
    } finally {
      setModalLoading(false);
    }
  };

  const quickAddCategory = async (name: string) => {
    if (!activeBranch) return;
    try {
      setLoading(true);
      await MenuService.upsertCategory({ 
        name, 
        menu_id: activeBranch.menu_id, 
        order_index: (activeBranch.categories?.length || 0) 
      });
      await loadBranchMenu(activeBranch.subdomain);
    } catch (err) {
      setError("Category deployment failed.");
    } finally {
      setLoading(false);
    }
  };

  // --- Auth Render ---
  if (!session) {
    return (
      <div className="min-h-screen bg-[#FBFBFD] flex flex-col items-center justify-center p-8 font-['Plus_Jakarta_Sans']">
        <div className="w-full max-w-sm bg-white p-12 rounded-[4rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.04)] border border-slate-50">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-black tracking-tighter italic uppercase text-slate-900 leading-none">ZEN<span className="text-indigo-600">HUB</span></h1>
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] mt-4 italic">Enterprise Digital Ecosystem</p>
          </div>

          <div className="flex bg-slate-50 p-1.5 rounded-2xl mb-10 border border-slate-100">
            <button onClick={() => setAuthMode('login')} className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${authMode === 'login' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Sign In</button>
            <button onClick={() => setAuthMode('signup')} className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${authMode === 'signup' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Sign Up</button>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Access Email</label>
              <input required type="email" value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-bold outline-none focus:ring-4 ring-indigo-500/5 transition-all shadow-inner" placeholder="name@enterprise.com" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Security Key</label>
              <input required type="password" value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-bold outline-none focus:ring-4 ring-indigo-500/5 transition-all shadow-inner" placeholder="••••••••" />
            </div>
            {error && <p className="text-rose-500 text-[10px] font-black text-center uppercase tracking-widest leading-relaxed">{error}</p>}
            <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black uppercase text-[10px] tracking-[0.4em] shadow-2xl active:scale-95 transition-all">
              {loading ? <i className="fa-solid fa-sync-alt animate-spin"></i> : (authMode === 'login' ? 'Enter Space' : 'Enroll Merchant')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- Main Hub Render ---
  return (
    <div className="min-h-screen bg-[#FBFBFD] font-['Plus_Jakarta_Sans'] text-slate-900 pb-40">
      
      {/* Supreme Unified Header */}
      <header className="bg-white/90 backdrop-blur-2xl sticky top-0 z-50 border-b border-slate-100/50">
        <div className="max-w-2xl mx-auto px-8 h-20 lg:h-28 flex items-center justify-between">
          <div className="flex flex-col flex-1 min-w-0">
             <div className="flex items-center gap-2 mb-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em]">Enterprise Node / Active</p>
             </div>
             <div className="flex items-center gap-3">
                {isEditingRestName ? (
                  <div className="flex items-center gap-2 w-full max-w-[300px]">
                     <input autoFocus value={newRestName} onChange={e => setNewRestName(e.target.value)} className="bg-slate-50 border-none rounded-xl px-4 py-2 text-xl font-black uppercase italic tracking-tighter outline-none ring-2 ring-indigo-500/10 w-full" />
                     <button onClick={handleUpdateRestaurantName} className="text-emerald-500 text-lg active:scale-90 transition-all"><i className="fa-solid fa-check"></i></button>
                     <button onClick={() => setIsEditingRestName(false)} className="text-slate-300 text-lg active:scale-90 transition-all"><i className="fa-solid fa-xmark"></i></button>
                  </div>
                ) : (
                  <>
                     <h1 className="text-xl lg:text-3xl font-black uppercase italic tracking-tighter truncate leading-none">{session.restaurant.name}</h1>
                     <button onClick={() => setIsEditingRestName(true)} className="text-slate-200 hover:text-indigo-500 transition-colors active:scale-90"><i className="fa-solid fa-pen-to-square text-xs"></i></button>
                  </>
                )}
             </div>
             {!isEditingRestName && (
               <div className="flex gap-4 mt-2">
                 <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">RID: {session.restaurant.id.slice(0, 8)}</p>
                 <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">UID: {session.user.id.slice(0, 8)}</p>
               </div>
             )}
          </div>
          <div className="flex items-center gap-4 lg:gap-8">
             <div className="hidden sm:flex flex-col items-end pr-8 border-r border-slate-100">
                <p className="text-[10px] font-black uppercase text-slate-900 leading-none mb-1.5">{session.user.email.split('@')[0]}</p>
                <p className="text-[8px] font-bold text-slate-300 uppercase tracking-[0.2em] leading-none italic">Administrator</p>
             </div>
             <button onClick={logout} className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 hover:text-rose-500 transition-all active:scale-90 border border-slate-100 shadow-sm">
               <i className="fa-solid fa-power-off text-sm"></i>
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-8 py-12 space-y-20 animate-fade-in">
        
        {/* Branch Context Navigation */}
        <section className="space-y-10">
           <div className="flex justify-between items-end px-2">
              <div>
                 <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.5em] mb-3">Context Management</p>
                 <h3 className="text-4xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">Branch Territories</h3>
              </div>
              <button onClick={() => openModal('branch')} className="w-16 h-16 bg-slate-900 text-white rounded-[2rem] shadow-2xl flex items-center justify-center active:scale-95 transition-all hover:bg-indigo-600">
                 <i className="fa-solid fa-plus text-xl"></i>
              </button>
           </div>

           {branches.length === 0 ? (
             <div className="py-24 bg-white border-2 border-dashed border-slate-100 rounded-[4rem] flex flex-col items-center justify-center text-center px-12 group cursor-pointer hover:border-indigo-200 transition-all" onClick={() => openModal('branch')}>
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 text-4xl mb-6 group-hover:scale-110 group-hover:bg-indigo-50 group-hover:text-indigo-400 transition-all">
                   <i className="fa-solid fa-map-location-dot"></i>
                </div>
                <p className="text-[11px] font-black uppercase tracking-[0.6em] text-slate-300 italic mb-2">No active territories</p>
                <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-[200px]">Deploy your first branch territory to initialize management.</p>
             </div>
           ) : (
             <div className="flex overflow-x-auto no-scrollbar gap-6 px-2 pb-8">
                {branches.map(b => (
                  <button 
                    key={b.id} 
                    onClick={() => loadBranchMenu(b.subdomain)}
                    className={`shrink-0 px-10 py-10 rounded-[3.5rem] border transition-all text-left relative min-w-[240px] group ${activeBranch?.id === b.id ? 'bg-slate-900 border-slate-900 text-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)]' : 'bg-white border-slate-100 text-slate-400 hover:shadow-xl hover:-translate-y-1'}`}
                  >
                     <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 mb-4 block">{b.subdomain}</span>
                     <span className="font-black text-2xl uppercase italic leading-none block pr-12">{b.name}</span>
                     <div onClick={(e) => { e.stopPropagation(); if(confirm('Purge context?')) MenuService.deleteBranch(b.id).then(refreshBranches); }} className="absolute right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/5 opacity-0 group-hover:opacity-100 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all">
                        <i className="fa-solid fa-trash-can text-sm"></i>
                     </div>
                  </button>
                ))}
             </div>
           )}
        </section>

        {/* Dynamic Composition Area */}
        {activeBranch && (
          <div className="space-y-12 animate-fade-in-up">
            
            {/* Structure Hierarchy Panel */}
            <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-xl space-y-10 relative overflow-hidden group">
               <div className="relative z-10">
                  <div className="flex justify-between items-start mb-10">
                    <div>
                       <p className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.5em] mb-4 italic">Inventory Deployment / Structure</p>
                       <h4 className="text-slate-900 text-4xl font-black uppercase italic tracking-tighter leading-none">{activeBranch.name}</h4>
                    </div>
                    <button onClick={() => openModal('category')} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 active:scale-95 transition-all">Add Group Identity</button>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {activeBranch.categories?.map((c: any) => (
                      <div key={c.id} className="bg-slate-50 text-slate-900 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-100 flex items-center gap-4 hover:border-indigo-200 hover:bg-white transition-all shadow-sm">
                        {c.name}
                        <button onClick={() => { if(confirm('Delete entire category?')) MenuService.deleteCategory(c.id).then(() => loadBranchMenu(activeBranch.subdomain)); }} className="text-slate-200 hover:text-rose-500 transition-all"><i className="fa-solid fa-circle-xmark"></i></button>
                      </div>
                    ))}
                    {activeBranch.categories?.length === 0 && <p className="text-[11px] text-slate-300 font-black uppercase italic tracking-[0.2em]">Define groups to organize library resources.</p>}
                  </div>

                  {/* Presets - Minimalist Flow */}
                  <div className="pt-10 border-t border-slate-50 flex flex-wrap gap-2">
                    {CATEGORY_PRESETS.filter(p => !activeBranch.categories?.some((c: any) => c.name === p)).map(p => (
                      <button key={p} onClick={() => quickAddCategory(p)} className="px-5 py-3 bg-slate-50/50 text-slate-300 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all border border-slate-100">
                        + {p}
                      </button>
                    ))}
                  </div>
               </div>
               <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-slate-50 rounded-full blur-[80px] pointer-events-none opacity-50"></div>
            </div>

            {/* Entity Listings */}
            <div className="space-y-16">
              {activeBranch.categories?.map((cat: any) => (
                <div key={cat.id} className="space-y-8 animate-fade-in">
                  <div className="flex items-center gap-8 px-4">
                    <h5 className="text-[11px] font-black uppercase text-slate-900 tracking-[0.8em] italic whitespace-nowrap">{cat.name}</h5>
                    <div className="h-px bg-slate-100 flex-1"></div>
                    <button onClick={() => openModal('item', { category_id: cat.id })} className="w-10 h-10 rounded-full bg-slate-50 text-slate-300 hover:text-indigo-600 transition-all flex items-center justify-center border border-slate-100"><i className="fa-solid fa-plus-circle text-lg"></i></button>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    {cat.items?.map((item: any) => (
                      <div key={item.id} className="bg-white p-7 rounded-[3.5rem] border border-slate-50 flex items-center gap-8 shadow-sm group hover:shadow-2xl transition-all duration-700 relative overflow-hidden">
                        <div className="w-24 h-24 rounded-[2.5rem] overflow-hidden bg-slate-50 shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-700 border border-slate-100">
                          <img src={item.image_url} className="w-full h-full object-cover" alt="" />
                        </div>
                        <div className="flex-1 flex flex-col justify-center min-w-0">
                          <div className="flex justify-between items-start mb-2 pr-4">
                            <h6 className="font-black text-slate-800 text-lg uppercase tracking-tight italic leading-none truncate">{item.name}</h6>
                            <span className="font-black text-xl text-indigo-600 tracking-tighter italic">₱{item.price}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 line-clamp-1 mb-4 italic font-medium leading-relaxed">{item.description || 'Resource details pending definition...'}</p>
                          <div className="flex gap-4 items-center">
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl"><i className="fa-solid fa-users text-[8px]"></i> {item.pax}</span>
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl"><i className="fa-solid fa-clock text-[8px]"></i> {item.serving_time}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pr-4">
                           <button onClick={() => openModal('item', { ...item, category_id: cat.id })} className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-300 hover:text-indigo-600 flex items-center justify-center transition-all border border-slate-100 active:scale-90 shadow-sm"><i className="fa-solid fa-pen text-xs"></i></button>
                           <button onClick={() => { if(confirm('Purge entity from library?')) MenuService.deleteMenuItem(item.id).then(() => loadBranchMenu(activeBranch.subdomain)); }} className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-300 hover:text-rose-500 flex items-center justify-center transition-all border border-slate-100 active:scale-90 shadow-sm"><i className="fa-solid fa-trash-can text-xs"></i></button>
                        </div>
                        {item.is_popular && <div className="absolute top-6 right-10 text-orange-500 text-[8px] font-black uppercase tracking-[0.5em] bg-orange-50 px-4 py-1.5 rounded-full border border-orange-100/50 shadow-sm animate-pulse">Trending Entity</div>}
                      </div>
                    ))}
                    
                    {cat.items?.length === 0 && (
                      <button onClick={() => openModal('item', { category_id: cat.id })} className="w-full py-16 border-2 border-dashed border-slate-100 rounded-[3.5rem] text-[10px] font-black uppercase text-slate-200 tracking-[0.6em] flex flex-col items-center justify-center gap-6 hover:border-indigo-100 hover:text-indigo-500 transition-all group bg-white shadow-sm">
                        <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all shadow-inner"><i className="fa-solid fa-plus text-2xl opacity-20 group-hover:opacity-100"></i></div>
                        <span>Commit Resource to {cat.name}</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* System Danger Zone */}
        <div className="pt-20 border-t border-slate-100 text-center">
           <button onClick={() => openModal('delete-account')} className="text-[10px] font-black text-slate-300 hover:text-rose-500 uppercase tracking-[0.6em] transition-colors italic">Enterprise Infrastructure / Danger Zone</button>
        </div>
      </main>

      {/* Unified Supreme Modal Suite */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl flex flex-col animate-fade-in overflow-y-auto">
          <div className="bg-white w-full max-w-sm rounded-[4rem] p-10 lg:p-14 shadow-2xl relative transition-all my-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-12">
               <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.5em] text-indigo-500 mb-3 italic">{session.restaurant.name}</p>
                  <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900 italic leading-none">
                     {modalType === 'branch' && 'Deploy Branch'}
                     {modalType === 'category' && 'Initialize Group'}
                     {modalType === 'item' && 'Define Dish'}
                     {modalType === 'delete-account' && 'Purge Context'}
                  </h2>
               </div>
               <button onClick={closeModal} className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 hover:text-rose-500 transition-all border border-slate-100"><i className="fa-solid fa-xmark text-xl"></i></button>
            </div>

            <form onSubmit={handleModalSubmit} className="space-y-8">
               {modalType === 'item' ? (
                 <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-4 italic">Identity Label</label>
                       <input autoFocus required value={formValues.name} onChange={e => setFormValues({...formValues, name: e.target.value})} className="w-full bg-slate-50 rounded-2xl p-5 text-sm font-bold outline-none shadow-inner italic focus:ring-4 ring-indigo-500/5 transition-all" placeholder="e.g. Ribeye Cut" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-4 italic">Valuation (₱)</label>
                          <input required type="number" value={formValues.price} onChange={e => setFormValues({...formValues, price: e.target.value})} className="w-full bg-slate-50 rounded-2xl p-5 text-sm font-bold outline-none shadow-inner" placeholder="0.00" />
                       </div>
                       <div className="space-y-2 flex flex-col justify-end">
                          <button type="button" onClick={() => setFormValues({...formValues, is_popular: !formValues.is_popular})} className={`w-full py-5 rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-sm transition-all ${formValues.is_popular ? 'bg-orange-500 text-white shadow-orange-100' : 'bg-slate-100 text-slate-400'}`}>{formValues.is_popular ? '★ Trending' : 'Popular?'}</button>
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-4 italic">Resource Description</label>
                       <textarea value={formValues.description} onChange={e => setFormValues({...formValues, description: e.target.value})} className="w-full bg-slate-50 rounded-3xl p-6 text-xs font-medium outline-none shadow-inner italic h-28 resize-none focus:ring-4 ring-indigo-500/5 transition-all" placeholder="Enter ingredients and details..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <input value={formValues.pax} onChange={e => setFormValues({...formValues, pax: e.target.value})} className="bg-slate-50 rounded-xl p-4 text-[10px] font-bold outline-none shadow-inner italic" placeholder="Pax (e.g. 1-2)" />
                       <input value={formValues.serving_time} onChange={e => setFormValues({...formValues, serving_time: e.target.value})} className="bg-slate-50 rounded-xl p-4 text-[10px] font-bold outline-none shadow-inner italic" placeholder="Time (e.g. 15m)" />
                    </div>
                 </div>
               ) : modalType === 'delete-account' ? (
                 <div className="p-10 bg-rose-50 rounded-[3rem] text-center border border-rose-100 shadow-inner">
                    <p className="text-[11px] font-black text-rose-600 uppercase italic tracking-tight leading-relaxed">System Critical: All enterprise data for this project will be purged permanently. Proceed?</p>
                 </div>
               ) : (
                 <div className="space-y-8">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-4 italic">Identity Title</label>
                       <input autoFocus required value={formValues.name} onChange={e => setFormValues({...formValues, name: e.target.value})} className="w-full bg-slate-50 rounded-[2.5rem] p-6 text-sm font-bold outline-none shadow-inner italic focus:ring-4 ring-indigo-500/5 transition-all" placeholder="Enter name label..." />
                    </div>
                    {modalType === 'branch' && (
                      <div className="space-y-2">
                         <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-4 italic">Branch Slug</label>
                         <input required value={formValues.subdomain} onChange={e => setFormValues({...formValues, subdomain: e.target.value.toLowerCase().replace(/\s+/g, '-')})} className="w-full bg-slate-50 rounded-[2.5rem] p-6 text-sm font-bold outline-none shadow-inner italic focus:ring-4 ring-indigo-500/5 transition-all" placeholder="subdomain-slug" />
                      </div>
                    )}
                 </div>
               )}

               <div className="flex gap-4 pt-10">
                  <button type="button" onClick={closeModal} className="flex-1 py-6 text-[10px] font-black uppercase text-slate-300 bg-slate-50 rounded-3xl tracking-widest hover:text-slate-900 transition-colors">Discard</button>
                  <button type="submit" disabled={modalLoading} className={`flex-[2] py-6 text-[10px] font-black uppercase text-white rounded-3xl tracking-[0.4em] shadow-2xl transition-all ${modalType === 'delete-account' ? 'bg-rose-600' : 'bg-slate-900 active:scale-95 hover:bg-indigo-600 shadow-slate-200'}`}>
                    {modalLoading ? <i className="fa-solid fa-sync-alt animate-spin"></i> : 'Commit Entry'}
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}

      <footer className="text-center opacity-10 mt-40 py-16">
        <p className="text-[10px] font-black uppercase tracking-[1.5em] italic">Platinum Zen Ecosystem v7.0</p>
      </footer>
    </div>
  );
};

export { TestSupabaseView as default };
