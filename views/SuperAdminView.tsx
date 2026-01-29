import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';

type TableName = 'restaurants' | 'menus' | 'categories' | 'items' | 'users' | 'qr_codes' | 'orders' | 'login_attempts';

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
    { id: 'menus', label: 'Menus', icon: 'fa-book-open' },
    { id: 'categories', label: 'Categories', icon: 'fa-tags' },
    { id: 'items', label: 'Menu Items', icon: 'fa-utensils' },
    { id: 'users', label: 'Users', icon: 'fa-users' },
    { id: 'qr_codes', label: 'QR Codes', icon: 'fa-qrcode' },
    { id: 'orders', label: 'Live Orders', icon: 'fa-receipt' },
    { id: 'login_attempts', label: 'Security Logs', icon: 'fa-shield-halved' }
  ];

  const columns = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return [];
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

      const filterableTables: TableName[] = ['menus', 'users', 'qr_codes', 'orders'];
      
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

      const { data: result, error: fetchError } = await query.order('created_at', { ascending: false }).limit(100);
      
      if (fetchError) {
        const { data: fallbackData, error: fallbackError } = await query.limit(100);
        if (fallbackError) throw fallbackError;
        setData(fallbackData || []);
      } else {
        setData(result || []);
      }
    } catch (err: any) {
      setError(err.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (row: any) => {
    const targetId = row.id;
    if (!targetId) return alert("Standard ID required.");
    if (!confirm(`Purge record ${targetId}?`)) return;
    
    setLoading(true);
    try {
      const { error: delError } = await supabase.from(activeTable).delete().eq('id', targetId);
      if (delError) throw delError;
      await fetchTableData();
    } catch (err: any) {
      alert("Failed: " + err.message);
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
        .select(`*, restaurants ( id, name )`)
        .eq('code', seekInput.trim())
        .maybeSingle();

      if (seekError) throw seekError;
      if (!qrData) return alert("Discovery Failure.");

      setSeekResult({
        ...qrData,
        restaurant_name: qrData.restaurants?.name || 'Unknown'
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
    if (typeof val === 'object') return <span className="text-indigo-400">JSON Object</span>;
    return String(val);
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-200 p-6 md:p-10 font-jakarta overflow-x-hidden">
      <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 mb-12">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="w-14 h-14 bg-white/5 rounded-3xl flex items-center justify-center text-slate-400 hover:text-white transition-all border border-white/10 shadow-xl">
            <i className="fa-solid fa-arrow-left"></i>
          </button>
          <div>
            <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase leading-none text-white">ROOT<span className="text-indigo-500">ACCESS</span></h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-2.5 flex items-center gap-3 shadow-inner">
            <input 
              type="text"
              value={seekInput}
              onChange={e => setSeekInput(e.target.value)}
              placeholder="Search Token..."
              className="bg-slate-900 border border-white/5 rounded-2xl px-5 py-3 text-[10px] font-bold outline-none text-indigo-400 w-56 h-12"
            />
            <button onClick={handleSeek} className="h-12 px-6 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">SEEK</button>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-3xl px-6 py-3 flex items-center gap-4 h-[68px] shadow-inner">
            <select value={selectedRestId} onChange={e => setSelectedRestId(e.target.value)} className="bg-transparent text-xs font-black outline-none text-indigo-400 cursor-pointer min-w-[180px] uppercase italic">
                <option value="all" className="bg-slate-900">GLOBAL SCOPE</option>
                {restaurants.map(r => <option key={r.id} value={r.id} className="bg-slate-900">{r.name}</option>)}
            </select>
          </div>
          <button onClick={fetchTableData} className="w-14 h-14 bg-indigo-600 text-white rounded-3xl active:scale-90 transition-all flex items-center justify-center border border-white/10"><i className={`fa-solid fa-arrows-rotate ${loading ? 'animate-spin' : ''}`}></i></button>
        </div>
      </header>

      <div className="flex overflow-x-auto no-scrollbar gap-3 mb-10 pb-4">
        {tables.map(table => (
          <button key={table.id} onClick={() => setActiveTable(table.id)} className={`px-8 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all flex items-center gap-4 ${activeTable === table.id ? 'bg-indigo-600 text-white shadow-2xl' : 'bg-white/5 text-slate-500 border border-white/5'}`}>
            <i className={`fa-solid ${table.icon}`}></i> {table.label}
          </button>
        ))}
      </div>

      <div className="bg-white/[0.02] border border-white/10 rounded-[4rem] overflow-hidden shadow-2xl animate-fade-in relative">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                {columns.map((key) => <th key={key} className="px-10 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-indigo-400 italic whitespace-nowrap">{key}</th>)}
                <th className="px-10 py-6 text-right sticky right-0 bg-[#070b14]/90 backdrop-blur-md">OPS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.map((row, idx) => (
                <tr key={idx} className="hover:bg-white/5 transition-all group">
                  {columns.map((colKey) => <td key={colKey} className="px-10 py-6 text-[11px] font-bold text-slate-400 truncate max-w-[300px] italic">{formatCellValue(row[colKey])}</td>)}
                  <td className="px-10 py-6 text-right sticky right-0 bg-[#070b14]/90 backdrop-blur-md">
                     <button onClick={() => handleDelete(row)} className="w-10 h-10 rounded-2xl bg-rose-500/5 text-rose-500/20 group-hover:text-rose-500 group-hover:bg-rose-500/10 transition-all flex items-center justify-center"><i className="fa-solid fa-trash-can text-sm"></i></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showSeekModal && seekResult && (
        <div className="fixed inset-0 z-[1000] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-6 animate-fade-in" onClick={() => setShowSeekModal(false)}>
          <div className="bg-[#0f172a] border border-white/10 w-full max-w-md rounded-[4rem] p-12 shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-12">
               <h2 className="text-4xl font-black uppercase tracking-tighter text-white italic">Entity Identity</h2>
               <button onClick={() => setShowSeekModal(false)} className="text-slate-500 hover:text-rose-500 text-xl"><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div className="space-y-8">
               <div className="bg-white/5 p-6 rounded-3xl border border-white/5 flex items-center justify-between">
                  <p className="font-mono text-[10px] text-indigo-300 truncate">{seekResult.id}</p>
               </div>
               <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                  <p className="font-black text-white uppercase italic">{seekResult.label} @ {seekResult.restaurant_name}</p>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminView;