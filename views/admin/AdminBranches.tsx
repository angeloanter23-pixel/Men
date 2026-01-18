
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

type BranchSubView = 'list' | 'create';

const AdminBranches: React.FC = () => {
  const [subView, setSubView] = useState<BranchSubView>('list');
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sessionRaw = localStorage.getItem('foodie_supabase_session');
  const session = sessionRaw ? JSON.parse(sessionRaw) : null;
  const restaurantId = session?.restaurant?.id;

  useEffect(() => {
    if (restaurantId) fetchBranches();
  }, [restaurantId]);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('branches')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('name', { ascending: true });
      if (fetchError) throw fetchError;
      setBranches(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this branch?')) return;
    setLoading(true);
    try {
      const { error: delError } = await supabase.from('branches').delete().eq('id', id);
      if (delError) throw delError;
      await fetchBranches();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...editingBranch, restaurant_id: restaurantId };
      if (!payload.id) delete payload.id;
      const { error: saveError } = await supabase.from('branches').upsert(payload);
      if (saveError) throw saveError;
      setEditingBranch(null);
      setSubView('list');
      await fetchBranches();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-10 space-y-8 animate-fade-in">
      <div className="flex bg-white p-1.5 rounded-2xl w-full sm:w-fit border border-slate-200 shadow-sm">
        <button 
          onClick={() => setSubView('list')}
          className={`flex-1 sm:flex-none px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${subView === 'list' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-slate-900'}`}
        >
          Branch List
        </button>
        <button 
          onClick={() => { setEditingBranch({}); setSubView('create'); }}
          className={`flex-1 sm:flex-none px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${subView === 'create' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-slate-900'}`}
        >
          Create Branch
        </button>
      </div>

      {subView === 'create' ? (
        <div className="max-w-xl bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl animate-fade-in">
          <h3 className="text-xl font-black italic uppercase tracking-tighter mb-8">Branch Configuration</h3>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-4 italic">Branch Name</label>
              <input required type="text" value={editingBranch?.name || ''} onChange={e => setEditingBranch({...editingBranch, name: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-sm font-bold outline-none focus:ring-4 ring-indigo-500/5 transition-all" placeholder="e.g. Uptown HQ" />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-4 italic">Image URL</label>
              <input type="text" value={editingBranch?.image_url || ''} onChange={e => setEditingBranch({...editingBranch, image_url: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-sm font-bold outline-none focus:ring-4 ring-indigo-500/5 transition-all" placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-4 italic">Subdomain / Slug</label>
              <input required type="text" value={editingBranch?.subdomain || ''} onChange={e => setEditingBranch({...editingBranch, subdomain: e.target.value.toLowerCase().replace(/\s+/g, '-')})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-sm font-bold outline-none focus:ring-4 ring-indigo-500/5 transition-all" placeholder="e.g. uptown-branch" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black uppercase text-[10px] tracking-[0.4em] shadow-2xl active:scale-95 transition-all">
              {loading ? <i className="fa-solid fa-spinner animate-spin"></i> : 'Deploy Context'}
            </button>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {branches.map((branch) => (
            <div key={branch.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm group hover:shadow-xl transition-all duration-500">
              <div className="h-40 bg-slate-50 rounded-2xl mb-6 overflow-hidden relative">
                <img src={branch.image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=400'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">ID: {branch.id.slice(0, 8)}</div>
              </div>
              <h4 className="text-lg font-black uppercase italic tracking-tighter mb-1">{branch.name}</h4>
              <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-6">URL: men-m53q.vercel.app/{branch.subdomain}</p>
              <div className="flex gap-2">
                <button onClick={() => { setEditingBranch(branch); setSubView('create'); }} className="flex-1 bg-slate-50 hover:bg-indigo-600 hover:text-white text-indigo-600 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Edit Context</button>
                <button onClick={() => handleDelete(branch.id)} className="w-12 h-12 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all"><i className="fa-solid fa-trash-can"></i></button>
              </div>
            </div>
          ))}
          {branches.length === 0 && !loading && (
            <div className="col-span-full py-24 text-center border-2 border-dashed border-slate-200 rounded-[3rem] bg-white">
              <i className="fa-solid fa-map-location-dot text-3xl text-slate-100 mb-4"></i>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">No branch entities found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminBranches;
