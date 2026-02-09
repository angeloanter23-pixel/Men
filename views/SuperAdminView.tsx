import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase';

type TableName = 'restaurants' | 'menus' | 'categories' | 'items' | 'users' | 'qr_codes' | 'orders' | 'login_attempts' | 'table_sessions' | 'branches' | 'messages';

const TABLES_REGISTRY: { id: TableName; label: string; icon: string; color: string }[] = [
  { id: 'restaurants', label: 'Restaurants', icon: 'fa-building', color: 'bg-blue-500' },
  { id: 'menus', label: 'Menus', icon: 'fa-book-open', color: 'bg-indigo-500' },
  { id: 'categories', label: 'Categories', icon: 'fa-tags', color: 'bg-purple-500' },
  { id: 'items', label: 'Menu Items', icon: 'fa-utensils', color: 'bg-orange-500' },
  { id: 'users', label: 'Users', icon: 'fa-users', color: 'bg-emerald-500' },
  { id: 'qr_codes', label: 'QR Tokens', icon: 'fa-qrcode', color: 'bg-slate-800' },
  { id: 'orders', label: 'Live Orders', icon: 'fa-receipt', color: 'bg-rose-500' },
  { id: 'table_sessions', label: 'Sessions', icon: 'fa-clock-rotate-left', color: 'bg-sky-500' },
  { id: 'branches', label: 'Branches', icon: 'fa-map-location-dot', color: 'bg-teal-500' },
  { id: 'login_attempts', label: 'Security Logs', icon: 'fa-shield-halved', color: 'bg-amber-500' },
  { id: 'messages', label: 'Messages', icon: 'fa-message', color: 'bg-pink-500' }
];

const SuperAdminView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [tableCounts, setTableCounts] = useState<Record<string, number>>({});
  const [selectedTable, setSelectedTable] = useState<TableName | null>(null);
  const [tableData, setTableData] = useState<any[]>([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingCell, setEditingCell] = useState<{ id: any; field: string } | null>(null);
  
  const [recordToPurge, setRecordToPurge] = useState<any | null>(null);
  const [purgeLoading, setPurgeLoading] = useState(false);

  useEffect(() => {
    fetchSystemOverview();
  }, []);

  const fetchSystemOverview = async () => {
    setLoading(true);
    const counts: Record<string, number> = {};
    
    try {
      await Promise.all(TABLES_REGISTRY.map(async (table) => {
        const { count, error } = await supabase
          .from(table.id)
          .select('id', { count: 'exact', head: true });
        
        if (!error) {
          counts[table.id] = count || 0;
        }
      }));
      setTableCounts(counts);
    } catch (e) {
      console.error("System pulse failed");
    } finally {
      setLoading(false);
    }
  };

  const openTableEditor = async (tableName: TableName) => {
    setSelectedTable(tableName);
    setIsEditorOpen(true);
    setLoading(true);
    try {
      const { data, error } = await supabase.from(tableName).select('*').order('created_at', { ascending: false }).limit(100);
      if (error) throw error;
      setTableData(data || []);
    } catch (err: any) {
      alert("Schema Fetch Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: any, field: string, value: any) => {
    if (!selectedTable) return;
    try {
      const { error } = await supabase.from(selectedTable).update({ [field]: value }).eq('id', id);
      if (error) throw error;
      setTableData(prev => prev.map(row => row.id === id ? { ...row, [field]: value } : row));
      setEditingCell(null);
    } catch (err: any) {
      alert("Update Failed: " + err.message);
    }
  };

  const executePurge = async () => {
    if (!selectedTable || !recordToPurge) return;
    setPurgeLoading(true);
    try {
      const { error } = await supabase.from(selectedTable).delete().eq('id', recordToPurge);
      if (error) throw error;
      setTableData(prev => prev.filter(row => row.id !== recordToPurge));
      setRecordToPurge(null);
      // Update local count
      setTableCounts(prev => ({ ...prev, [selectedTable]: Math.max(0, (prev[selectedTable] || 1) - 1) }));
    } catch (err: any) {
      alert("Purge Failed: " + err.message);
    } finally {
      setPurgeLoading(false);
    }
  };

  const tableColumns = useMemo(() => {
    if (tableData.length === 0) return [];
    return Object.keys(tableData[0]);
  }, [tableData]);

  return (
    <div className="min-h-screen bg-[#F2F2F7] font-jakarta pb-20 overflow-x-hidden">
      <header className="sticky top-0 z-[100] bg-white/70 backdrop-blur-2xl border-b border-slate-200/50 px-6 py-6 md:px-12 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-all active:scale-90">
            <i className="fa-solid fa-chevron-left"></i>
          </button>
          <div>
            <h1 className="text-[22px] font-bold tracking-tight text-slate-900 leading-none">System Status</h1>
            <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest mt-1.5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Platinum Core V7.2 Online
            </p>
          </div>
        </div>
        <button onClick={fetchSystemOverview} className={`w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-300 hover:text-indigo-600 shadow-sm border border-slate-200 ${loading ? 'animate-spin' : ''}`}>
          <i className="fa-solid fa-arrows-rotate"></i>
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-12">
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-white flex flex-col justify-between h-44">
             <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shadow-sm"><i className="fa-solid fa-server"></i></div>
             <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Endpoints</p>
                <p className="text-3xl font-black text-slate-900 leading-none">{tableCounts.restaurants || 0}</p>
             </div>
          </div>
          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-white flex flex-col justify-between h-44">
             <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600 shadow-sm"><i className="fa-solid fa-receipt"></i></div>
             <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Transactions</p>
                <p className="text-3xl font-black text-slate-900 leading-none">{tableCounts.orders || 0}</p>
             </div>
          </div>
          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-white flex flex-col justify-between h-44">
             <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm"><i className="fa-solid fa-bolt-lightning"></i></div>
             <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Latency</p>
                <p className="text-3xl font-black text-slate-900 leading-none">12ms</p>
             </div>
          </div>
          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-white flex flex-col justify-between h-44">
             <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shadow-sm"><i className="fa-solid fa-shield-check"></i></div>
             <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Security</p>
                <p className="text-3xl font-black text-slate-900 leading-none">A+</p>
             </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex justify-between items-center px-4">
            <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em]">Database Explorer</h3>
            {loading && <span className="text-[9px] font-black text-indigo-600 uppercase animate-pulse">Syncing...</span>}
          </div>
          <div className="bg-white rounded-[2.5rem] border border-white overflow-hidden shadow-sm divide-y divide-slate-100">
            {TABLES_REGISTRY.map((table) => (
              <button 
                key={table.id}
                onClick={() => openTableEditor(table.id)}
                className="w-full flex items-center justify-between p-6 hover:bg-slate-50 transition-all active:bg-slate-100 group"
              >
                <div className="flex items-center gap-5">
                  <div className={`w-12 h-12 ${table.color} rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/10 transition-transform group-active:scale-95`}>
                    <i className={`fa-solid ${table.icon} text-lg`}></i>
                  </div>
                  <div className="text-left">
                    <p className="text-lg font-bold text-slate-900 tracking-tight leading-none mb-1">{table.label}</p>
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">public.{table.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                   <div className="bg-slate-50 border border-slate-100 px-4 py-1.5 rounded-xl flex items-center gap-2">
                      <span className="text-[11px] font-black text-slate-800 tabular-nums">{tableCounts[table.id] ?? '...'}</span>
                      <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Rows</span>
                   </div>
                   <i className="fa-solid fa-chevron-right text-slate-300 text-sm"></i>
                </div>
              </button>
            ))}
          </div>
        </section>

        <footer className="text-center pt-10 opacity-30">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.5em]">System Archive v2025.1</p>
        </footer>
      </main>

      {isEditorOpen && (
        <div className="fixed inset-0 z-[1000] flex items-end justify-center animate-fade-in font-jakarta">
          <div onClick={() => setIsEditorOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" />
          
          <div className="relative bg-[#F2F2F7] w-full h-[95vh] rounded-t-[3.5rem] shadow-2xl flex flex-col overflow-hidden animate-slide-up">
             <div className="w-12 h-1.5 bg-slate-300/50 rounded-full mx-auto my-5 shrink-0" />
             
             <header className="px-10 pb-8 flex justify-between items-center border-b border-slate-200/50">
                <div className="flex items-center gap-6">
                   <div className={`w-14 h-14 ${TABLES_REGISTRY.find(t => t.id === selectedTable)?.color} rounded-[1.6rem] flex items-center justify-center text-white shadow-xl`}>
                      <i className={`fa-solid ${TABLES_REGISTRY.find(t => t.id === selectedTable)?.icon} text-xl`}></i>
                   </div>
                   <div>
                      <h2 className="text-3xl font-black text-slate-900 italic tracking-tighter uppercase leading-none">{selectedTable}</h2>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Data Registry / {tableData.length} Records</p>
                   </div>
                </div>
                <div className="flex items-center gap-4">
                   <button 
                     onClick={() => selectedTable && openTableEditor(selectedTable)} 
                     className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all border border-slate-200 shadow-sm"
                   >
                     <i className={`fa-solid fa-arrows-rotate ${loading ? 'animate-spin' : ''}`}></i>
                   </button>
                   <button 
                     onClick={() => setIsEditorOpen(false)} 
                     className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center active:scale-90 transition-all"
                   >
                     <i className="fa-solid fa-xmark"></i>
                   </button>
                </div>
             </header>

             <div className="flex-1 overflow-auto bg-white m-6 rounded-[2.5rem] border border-slate-200 shadow-inner relative">
                {loading && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4">
                     <div className="w-12 h-12 border-4 border-slate-50 border-t-indigo-600 rounded-full animate-spin"></div>
                     <p className="text-[10px] font-black uppercase text-indigo-600 tracking-[0.3em]">Querying Engine...</p>
                  </div>
                )}
                
                <table className="w-full text-left border-collapse min-w-[1200px]">
                   <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10">
                      <tr>
                        {tableColumns.map(col => (
                          <th key={col} className="px-6 py-5 text-[9px] font-black uppercase text-slate-400 tracking-widest italic">{col}</th>
                        ))}
                        <th className="px-6 py-5 text-right sticky right-0 bg-slate-50 border-l border-slate-200 shadow-[-10px_0_10px_rgba(0,0,0,0.02)]"></th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {tableData.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50/50 group transition-all">
                           {tableColumns.map(col => (
                             <td 
                               key={`${row.id}-${col}`} 
                               className="px-6 py-5 text-xs font-medium text-slate-600 relative group/cell"
                               onDoubleClick={() => setEditingCell({ id: row.id, field: col })}
                             >
                               {editingCell?.id === row.id && editingCell.field === col ? (
                                 <input 
                                   autoFocus
                                   className="absolute inset-0 w-full h-full px-6 py-5 bg-indigo-50 border-2 border-indigo-600 text-indigo-900 outline-none z-20 font-bold"
                                   defaultValue={typeof row[col] === 'object' ? JSON.stringify(row[col]) : row[col]}
                                   onBlur={(e) => handleUpdate(row.id, col, e.target.value)}
                                   onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleUpdate(row.id, col, (e.target as HTMLInputElement).value);
                                      if (e.key === 'Escape') setEditingCell(null);
                                   }}
                                 />
                               ) : (
                                 <div className="truncate max-w-[250px] group-hover/cell:text-indigo-600 transition-colors">
                                    {row[col] === null ? (
                                      <span className="opacity-20 italic">null</span>
                                    ) : typeof row[col] === 'boolean' ? (
                                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${row[col] ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{String(row[col])}</span>
                                    ) : typeof row[col] === 'object' ? (
                                      <span className="text-[9px] bg-slate-100 px-2 py-0.5 rounded font-mono">Object</span>
                                    ) : String(row[col])}
                                 </div>
                               )}
                               <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/cell:opacity-40 pointer-events-none">
                                  <i className="fa-solid fa-pen text-[8px]"></i>
                               </div>
                             </td>
                           ))}
                           <td className="px-6 py-5 text-right sticky right-0 bg-white group-hover:bg-slate-50 border-l border-slate-50 shadow-[-10px_0_10px_rgba(0,0,0,0.02)]">
                              <button 
                                onClick={() => setRecordToPurge(row.id)}
                                className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500/20 group-hover:text-rose-500 transition-all flex items-center justify-center hover:bg-rose-500 hover:text-white shadow-sm"
                              >
                                 <i className="fa-solid fa-trash-can text-[10px]"></i>
                              </button>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>

             <footer className="px-10 py-6 bg-white border-t border-slate-200 flex items-center justify-between">
                <div className="flex gap-8 items-center">
                   <div className="flex items-center gap-2">
                      <kbd className="px-2 py-1 bg-slate-100 rounded text-[9px] font-bold text-slate-500 border border-slate-200">DBL CLICK</kbd>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Edit Entry</span>
                   </div>
                </div>
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] italic">Platinum Data Node v4.0.2</p>
             </footer>
          </div>
        </div>
      )}

      {recordToPurge && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-xl animate-fade-in">
              <div className="bg-white w-full max-w-sm rounded-[3.5rem] p-10 shadow-2xl space-y-8 animate-scale border border-rose-100 flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-[2.5rem] flex items-center justify-center text-3xl shadow-inner">
                      <i className="fa-solid fa-triangle-exclamation"></i>
                  </div>
                  
                  <div className="space-y-4">
                      <h3 className="text-2xl font-black uppercase tracking-tighter italic text-slate-900 leading-none">Confirm Purge</h3>
                      <p className="text-slate-500 text-xs font-bold leading-relaxed px-4">
                          Execute permanent deletion of record from <span className="text-slate-900 font-black italic">{selectedTable}</span> registry.
                      </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 w-full">
                      <button 
                        onClick={executePurge}
                        disabled={purgeLoading}
                        className="w-full py-5 bg-rose-600 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-xl shadow-rose-200 active:scale-95 transition-all flex items-center justify-center gap-3 hover:bg-rose-700"
                      >
                        {purgeLoading ? <i className="fa-solid fa-spinner animate-spin"></i> : 'Purge Entry'}
                      </button>
                      <button 
                        onClick={() => setRecordToPurge(null)}
                        className="w-full py-5 bg-slate-50 text-slate-400 rounded-[2rem] font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all"
                      >
                        Cancel
                      </button>
                  </div>
              </div>
          </div>
      )}

      <style>{`
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.23, 1, 0.32, 1) forwards; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        @keyframes scale { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-scale { animation: scale 0.3s cubic-bezier(0.23, 1, 0.32, 1) forwards; }
      `}</style>
    </div>
  );
};

export default SuperAdminView;