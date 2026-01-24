
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';

type TableName = 'restaurants' | 'branches' | 'menus' | 'categories' | 'items' | 'users' | 'qr_codes' | 'orders' | 'login_attempts';

const SuperAdminView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [activeTable, setActiveTable] = useState<TableName>('restaurants');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filtering states
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [selectedRestId, setSelectedRestId] = useState<string>('all');

  // Seek states
  const [seekInput, setSeekInput] = useState('');
  const [seekResult, setSeekResult] = useState<any>(null);
  const [showSeekModal, setShowSeekModal] = useState(false);

  const tables: { id: TableName; label: string; icon: string }[] = [
    { id: 'restaurants', label: 'Restaurants', icon: 'fa-building' },
    { id: 'branches', label: 'Branches', icon: 'fa-sitemap' },
    { id: 'menus', label: 'Menus', icon: 'fa-book-open' },
    { id: 'categories', label: 'Categories', icon: 'fa-tags' },
    { id: 'items', label: 'Menu Items', icon: 'fa-utensils' },
    { id: 'users', label: 'Users', icon: 'fa-users' },
    { id: 'qr_codes', label: 'QR Codes', icon: 'fa-qrcode' },
    { id: 'orders', label: 'Live Orders', icon: 'fa-receipt' },
    { id: 'login_attempts', label: 'Security Logs', icon: 'fa-shield-halved' }
  ];

  // Derive dynamic columns from the data
  const columns = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return [];
    // We get all unique keys from all rows to handle sparse data
    const keys = new Set<string>();
    data.forEach(row => {
        if (row && typeof row === 'object') {
            Object.keys(row).forEach(k => keys.add(k));
        }
    });
    return Array.from(keys);
  }, [data]);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  useEffect(() => {
    fetchTableData();
  }, [activeTable, selectedRestId]);

  const fetchRestaurants = async () => {
    try {
        const { data: res } = await supabase.from('restaurants').select('id, name').order('name');
        if (res && Array.isArray(res)) setRestaurants(res);
    } catch (e) {
        console.error("Master list fetch failed");
    }
  };

  const fetchTableData = async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from(activeTable).select('*');

      // Check if filter is applicable for this table
      const filterableTables: TableName[] = ['branches', 'menus', 'users', 'qr_codes', 'orders'];
      
      if (selectedRestId !== 'all') {
        if (filterableTables.includes(activeTable)) {
          query = query.eq('restaurant_id', selectedRestId);
        } else if (activeTable === 'restaurants') {
          query = query.eq('id', selectedRestId);
        } else if (activeTable === 'categories') {
          query = supabase.from('categories').select('*, menus!inner(*)').eq('menus.restaurant_id', selectedRestId);
        } else if (activeTable === 'items') {
          query = supabase.from('items').select('*, categories!inner(*, menus!inner(*))').eq('categories.menus.restaurant_id', selectedRestId);
        }
      }

      // We attempt to sort by created_at. If it fails (column doesn't exist), we fall back to a simple fetch.
      const { data: result, error: fetchError } = await query.order('created_at', { ascending: false }).limit(100);
      
      if (fetchError) {
        // Fallback for tables without created_at column
        const { data: fallbackData, error: fallbackError } = await query.limit(100);
        if (fallbackError) throw fallbackError;
        setData(fallbackData || []);
      } else {
        setData(result || []);
      }
    } catch (err: any) {
      console.error("SuperAdmin Fetch Error:", err);
      setError(err.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (row: any) => {
    const targetId = row.id;
    if (!targetId) {
        alert("This record lacks a standard 'id' column and cannot be purged via this interface.");
        return;
    }
    if (!confirm(`Permanently purge record ${targetId} from ${activeTable}?`)) return;
    
    setLoading(true);
    try {
      const { error: delError } = await supabase.from(activeTable).delete().eq('id', targetId);
      if (delError) throw delError;
      await fetchTableData();
    } catch (err: any) {
      alert("Deletion failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSeek = async () => {
    if (!seekInput.trim()) return;
    setLoading(true);
    try {
      const { data: qrData, error: seekError } = await supabase
        .from('qr_codes')
        .select(`
          *,
          restaurants ( id, name )
        `)
        .eq('code', seekInput.trim())
        .maybeSingle();

      if (seekError) throw seekError;
      if (!qrData) {
        alert("Discovery Failure: No QR entity found matching this identifier.");
        return;
      }

      const { data: branchesData } = await supabase
        .from('branches')
        .select('name, subdomain')
        .eq('restaurant_id', qrData.restaurant_id);

      setSeekResult({
        ...qrData,
        restaurant_name: qrData.restaurants?.name || 'Unknown Restaurant',
        branches: branchesData || []
      });
      setShowSeekModal(true);
    } catch (err: any) {
      alert("Seek Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCellValue = (val: any) => {
    if (val === null) return <span className="text-slate-600 opacity-30 italic">null</span>;
    if (typeof val === 'boolean') return val ? <span className="text-emerald-400">TRUE</span> : <span className="text-rose-400">FALSE</span>;
    if (typeof val === 'object') return (
        <span className="flex items-center gap-2 text-indigo-400">
            <i className="fa-solid fa-brackets-curly text-[8px]"></i>
            JSON Object
        </span>
    );
    return String(val);
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-200 p-6 md:p-10 font-['Plus_Jakarta_Sans'] overflow-x-hidden">
      <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 mb-12">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="w-14 h-14 bg-white/5 rounded-3xl flex items-center justify-center text-slate-400 hover:text-white transition-all border border-white/10 shadow-xl">
            <i className="fa-solid fa-arrow-left"></i>
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
                <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">Global Control Layer</p>
            </div>
            <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase leading-none text-white">ROOT<span className="text-indigo-500">ACCESS</span></h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
          {/* Seeker Tool */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-2.5 flex items-center gap-3 shadow-inner">
            <input 
              type="text"
              value={seekInput}
              onChange={e => setSeekInput(e.target.value)}
              placeholder="Search Token (e.g. A7B2X9)..."
              className="bg-slate-900 border border-white/5 rounded-2xl px-5 py-3 text-[10px] font-bold outline-none text-indigo-400 focus:ring-2 ring-indigo-500/20 w-56 h-12"
            />
            <button 
              onClick={handleSeek}
              className="h-12 px-6 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 active:scale-95 transition-all flex items-center gap-3"
            >
              <i className="fa-solid fa-magnifying-glass-plus"></i> SEEK
            </button>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl px-6 py-3 flex items-center gap-4 h-[68px] shadow-inner">
             <div className="flex flex-col">
                <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Active Scope</span>
                <select 
                  value={selectedRestId} 
                  onChange={e => setSelectedRestId(e.target.value)}
                  className="bg-transparent text-xs font-black outline-none text-indigo-400 cursor-pointer min-w-[180px] uppercase italic"
                >
                    <option value="all" className="bg-slate-900">SYSTEM GLOBAL</option>
                    {restaurants.map(r => <option key={r.id} value={r.id} className="bg-slate-900">{r.name}</option>)}
                </select>
             </div>
          </div>
          
          <button onClick={fetchTableData} className="w-14 h-14 bg-indigo-600 text-white rounded-3xl shadow-xl shadow-indigo-600/20 active:scale-90 transition-all flex items-center justify-center border border-white/10">
            <i className={`fa-solid fa-arrows-rotate ${loading ? 'animate-spin' : ''}`}></i>
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto no-scrollbar gap-3 mb-10 pb-4">
        {tables.map(table => (
          <button 
            key={table.id}
            onClick={() => setActiveTable(table.id)}
            className={`px-8 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all flex items-center gap-4 ${activeTable === table.id ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-600/30' : 'bg-white/5 text-slate-500 hover:text-slate-300 border border-white/5'}`}
          >
            <i className={`fa-solid ${table.icon} ${activeTable === table.id ? 'text-white' : 'text-slate-600'}`}></i> 
            {table.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-10 bg-rose-500/10 border border-rose-500/20 p-8 rounded-[2.5rem] text-rose-500 text-xs font-bold uppercase tracking-widest flex items-center gap-4 animate-fade-in shadow-xl">
          <i className="fa-solid fa-triangle-exclamation text-xl"></i> 
          <div>
            <p className="font-black mb-1">DATA PIPELINE ERROR</p>
            <p className="opacity-70">{error}</p>
          </div>
        </div>
      )}

      {/* Dynamic Data Table */}
      <div className="bg-white/[0.02] border border-white/10 rounded-[4rem] overflow-hidden shadow-2xl animate-fade-in relative">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                {columns.map((key) => (
                  <th key={key} className="px-10 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-indigo-400 italic whitespace-nowrap bg-white/5">
                    {key}
                  </th>
                ))}
                <th className="px-10 py-6 text-[9px] font-black uppercase tracking-widest text-slate-600 text-right sticky right-0 bg-[#070b14]/90 backdrop-blur-md">OPS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.map((row, idx) => (
                <tr key={idx} className="hover:bg-white/5 transition-all group">
                  {columns.map((colKey) => (
                    <td key={colKey} className="px-10 py-6 text-[11px] font-bold text-slate-400 truncate max-w-[300px] italic" title={String(row[colKey])}>
                      {formatCellValue(row[colKey])}
                    </td>
                  ))}
                  <td className="px-10 py-6 text-right sticky right-0 bg-[#070b14]/90 backdrop-blur-md">
                     <button 
                      onClick={() => handleDelete(row)} 
                      className="w-10 h-10 rounded-2xl bg-rose-500/5 text-rose-500/20 group-hover:text-rose-500 group-hover:bg-rose-500/10 transition-all flex items-center justify-center hover:scale-110 active:scale-90"
                      title="Purge Object"
                     >
                       <i className="fa-solid fa-trash-can text-sm"></i>
                     </button>
                  </td>
                </tr>
              ))}
              {data.length === 0 && !loading && (
                <tr>
                  <td colSpan={100} className="py-40 text-center">
                     <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                        <i className="fa-solid fa-database text-3xl text-white/5"></i>
                     </div>
                     <p className="text-[11px] font-black uppercase tracking-[1em] text-slate-700 ml-[1em]">VOID SPACE</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {loading && (
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] flex items-center justify-center z-20">
             <div className="flex flex-col items-center gap-6">
                <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] animate-pulse">Syncing Engine...</p>
             </div>
          </div>
        )}
      </div>

      <footer className="mt-16 text-center border-t border-white/5 pt-12 opacity-30">
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[1.5em] italic">PLATINUM CORE v9.2.0 • SCHEMA EXPLORER</p>
      </footer>
      
      {/* Seek Modal (Simplified diagnostic) */}
      {showSeekModal && seekResult && (
        <div className="fixed inset-0 z-[1000] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-6 animate-fade-in" onClick={() => setShowSeekModal(false)}>
          <div className="bg-[#0f172a] border border-white/10 w-full max-w-md rounded-[4rem] p-12 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] relative transition-all" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-12">
               <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.5em] text-indigo-500 mb-3 italic">Discovery Diagnostic</p>
                  <h2 className="text-4xl font-black uppercase tracking-tighter text-white italic leading-none">Entity Identity</h2>
               </div>
               <button onClick={() => setShowSeekModal(false)} className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-slate-500 hover:text-rose-500 transition-all border border-white/5 shadow-xl"><i className="fa-solid fa-xmark"></i></button>
            </div>

            <div className="space-y-8">
               {/* Raw ID Field */}
               <div className="space-y-3">
                  <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest italic ml-2">Global UID</label>
                  <div className="bg-white/5 p-6 rounded-3xl border border-white/5 flex items-center justify-between">
                     <p className="font-mono text-[10px] text-indigo-300 truncate max-w-[240px]">{seekResult.id}</p>
                     <i className="fa-solid fa-fingerprint text-indigo-500/40"></i>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                     <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest italic ml-2">Designation</label>
                     <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                        <p className="font-black text-white uppercase italic">{seekResult.label}</p>
                     </div>
                  </div>
                  <div className="space-y-3">
                     <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest italic ml-2">Status</label>
                     <div className="bg-emerald-500/5 p-6 rounded-3xl border border-emerald-500/20">
                        <p className="font-black text-emerald-500 uppercase tracking-widest text-[10px]">ACTIVE NODE</p>
                     </div>
                  </div>
               </div>

               <div className="space-y-3">
                  <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest italic ml-2">Master Context</label>
                  <div className="bg-white/5 p-6 rounded-3xl border border-white/5 flex items-center gap-4">
                     <i className="fa-solid fa-building text-indigo-500/60"></i>
                     <p className="font-bold text-sm text-slate-200">{seekResult.restaurant_name}</p>
                  </div>
               </div>
            </div>

            <button 
              onClick={() => setShowSeekModal(false)}
              className="w-full mt-12 py-7 bg-indigo-600 text-white rounded-[2.5rem] font-black uppercase text-[11px] tracking-[0.4em] shadow-2xl active:scale-95 transition-all shadow-indigo-600/30"
            >
              Terminate Diagnostic
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminView;
