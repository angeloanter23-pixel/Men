
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

type TableName = 'restaurants' | 'branches' | 'menus' | 'categories' | 'items' | 'users';

const SuperAdminView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [activeTable, setActiveTable] = useState<TableName>('restaurants');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingRow, setEditingRow] = useState<any | null>(null);
  const [operationError, setOperationError] = useState<{ message: string; details?: string; hint?: string } | null>(null);

  const tables: TableName[] = ['restaurants', 'branches', 'menus', 'categories', 'items', 'users'];

  useEffect(() => {
    fetchTableData();
  }, [activeTable]);

  const fetchTableData = async () => {
    setLoading(true);
    setError(null);
    setOperationError(null);
    try {
      console.log(`SuperAdmin: Fetching data for table [${activeTable}]...`);
      const { data: result, error: fetchError } = await supabase
        .from(activeTable)
        .select('*')
        .order('id', { ascending: false });
      
      if (fetchError) throw fetchError;
      setData(result || []);
      console.log(`SuperAdmin: Successfully fetched ${result?.length || 0} rows.`);
    } catch (err: any) {
      console.error("SuperAdmin Fetch Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: any) => {
    if (id === undefined || id === null) {
      console.error("SuperAdmin: Attempted delete with null/undefined ID");
      return;
    }

    if (!confirm(`Are you sure you want to delete record ${id} from ${activeTable}? This action is irreversible.`)) return;
    
    setLoading(true);
    setOperationError(null);
    try {
      console.group(`SuperAdmin: Delete Operation [${activeTable}]`);
      console.log("Target ID:", id);

      // Normalize ID: Try Number first, fallback to string (Postgres type strictness)
      const normalizedId = (typeof id === 'string' && !isNaN(Number(id)) && id.trim() !== "") ? Number(id) : id;

      const { data: delResult, error: delError, status } = await supabase
        .from(activeTable)
        .delete()
        .eq('id', normalizedId)
        .select();

      if (delError) {
        setOperationError({
          message: `Database rejected deletion. Check for linked records in other tables.`,
          details: delError.details || delError.message,
          hint: delError.hint
        });
        throw delError;
      }

      if (!delResult || delResult.length === 0) {
        setOperationError({
          message: "No rows affected.",
          details: "The record might have been already deleted, or your access level prevents this specific deletion."
        });
      } else {
        console.log("Delete Result Data:", delResult);
        await fetchTableData();
      }
      console.groupEnd();
    } catch (err: any) {
      console.error("Delete Exception:", err);
      console.groupEnd();
    } finally {
      setLoading(false);
    }
  };

  const handleUpsert = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setOperationError(null);
    try {
      console.log(`SuperAdmin: Upserting to [${activeTable}]`, editingRow);
      
      // Clean up the editingRow to avoid sending empty strings as IDs if adding new
      const payload = { ...editingRow };
      if (!payload.id) delete payload.id;

      const { error: saveError } = await supabase.from(activeTable).upsert(payload);
      
      if (saveError) {
        setOperationError({
          message: "Commit Failed",
          details: saveError.message,
          hint: saveError.hint
        });
        throw saveError;
      }

      setEditingRow(null);
      await fetchTableData();
    } catch (err: any) {
      console.error("SuperAdmin Upsert Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans'] animate-fade-in">
      <header className="p-4 lg:p-6 border-b border-white/5 flex items-center justify-between sticky top-0 bg-slate-900 z-50">
        <div className="flex items-center gap-3 lg:gap-4">
          <button onClick={onBack} className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition">
            <i className="fa-solid fa-arrow-left text-sm"></i>
          </button>
          <h1 className="text-lg lg:text-xl font-black italic uppercase tracking-tighter">SUPER<span className="text-indigo-400">ADMIN</span></h1>
        </div>
        <div className="flex gap-2">
            <button onClick={fetchTableData} className="px-3 py-2 lg:px-4 lg:py-2 bg-white/5 rounded-xl text-[9px] lg:text-[10px] font-black uppercase tracking-widest hover:bg-white/10">
                <i className="fa-solid fa-sync mr-1 lg:mr-2"></i> Sync
            </button>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Navigation Tabs */}
        <aside className="w-full lg:w-64 border-b lg:border-r border-white/5 p-2 lg:p-4 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-y-auto no-scrollbar scroll-smooth whitespace-nowrap lg:whitespace-normal shrink-0">
          {tables.map(t => (
            <button 
              key={t} 
              onClick={() => setActiveTable(t)}
              className={`inline-block lg:w-full text-left px-4 py-2 lg:py-3 rounded-xl text-[10px] lg:text-xs font-bold transition-all ${activeTable === t ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:bg-white/5'}`}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 relative no-scrollbar pb-32">
          {loading && (
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center">
              <i className="fa-solid fa-spinner animate-spin text-3xl text-indigo-400"></i>
            </div>
          )}

          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-xl lg:text-2xl font-black uppercase italic tracking-tighter">Table: {activeTable}</h2>
            <button 
              onClick={() => { setOperationError(null); setEditingRow({}); }}
              className="w-full sm:w-auto bg-emerald-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-500 transition-all flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-plus"></i> Add Entry
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs font-bold">
              <i className="fa-solid fa-triangle-exclamation mr-2"></i> {error}
            </div>
          )}

          {/* Global Operation Error Alert */}
          {operationError && !editingRow && (
            <div className="mb-6 p-6 bg-rose-500/10 border-2 border-rose-500/20 rounded-3xl animate-fade-in">
              <div className="flex items-center gap-3 text-rose-500 mb-2">
                <i className="fa-solid fa-circle-exclamation text-lg"></i>
                <h4 className="font-black uppercase text-[10px] tracking-widest">Operation Failed</h4>
              </div>
              <p className="text-xs font-bold text-white mb-2">{operationError.message}</p>
              {operationError.details && <p className="text-[10px] text-slate-400 leading-relaxed bg-black/20 p-3 rounded-xl font-mono">{operationError.details}</p>}
              <button onClick={() => setOperationError(null)} className="mt-4 text-[9px] font-black uppercase text-rose-400 hover:text-white transition-colors underline">Dismiss Error</button>
            </div>
          )}

          {/* Desktop Table View */}
          <div className="hidden lg:block bg-white/5 rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-white/5 text-slate-400 font-black uppercase tracking-widest">
                    <tr>
                    {data.length > 0 && Object.keys(data[0]).map(key => (
                        <th key={key} className="p-4 border-b border-white/5">{key}</th>
                    ))}
                    <th className="p-4 border-b border-white/5 text-center sticky right-0 bg-slate-800">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {data.map((row, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                        {Object.values(row).map((val: any, i) => (
                        <td key={i} className="p-4 max-w-xs truncate text-slate-300">
                            {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                        </td>
                        ))}
                        <td className="p-4 sticky right-0 bg-slate-800/80 backdrop-blur-sm">
                        <div className="flex justify-center gap-2">
                            <button onClick={() => { setOperationError(null); setEditingRow(row); }} className="p-2 text-indigo-400 hover:text-white transition-colors"><i className="fa-solid fa-pen"></i></button>
                            <button onClick={() => handleDelete(row.id)} className="p-2 text-rose-400 hover:text-white transition-colors"><i className="fa-solid fa-trash"></i></button>
                        </div>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {data.map((row, idx) => (
              <div key={idx} className="bg-white/5 p-5 rounded-3xl border border-white/10 space-y-4 shadow-sm">
                <div className="flex justify-between items-start border-b border-white/5 pb-3">
                  <div className="min-w-0 flex-1 pr-4">
                    <span className="text-[9px] font-black uppercase text-indigo-400 tracking-widest block">ID: {row.id}</span>
                    <h4 className="text-sm font-black text-white truncate">{row.name || row.email || 'Untitled Entry'}</h4>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => { setOperationError(null); setEditingRow(row); }} className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center transition-all"><i className="fa-solid fa-pen text-xs"></i></button>
                    <button onClick={() => handleDelete(row.id)} className="w-9 h-9 rounded-xl bg-rose-600/20 text-rose-400 flex items-center justify-center transition-all"><i className="fa-solid fa-trash text-xs"></i></button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                  {Object.entries(row).slice(0, 6).map(([key, val]) => (
                    <div key={key} className="min-w-0">
                      <p className="text-[8px] font-black uppercase text-slate-500 tracking-widest mb-1 truncate">{key}</p>
                      <p className="text-[10px] text-slate-300 truncate font-bold">{typeof val === 'object' ? 'Object' : String(val)}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {data.length === 0 && !loading && (
            <div className="p-20 text-center text-slate-500 font-bold uppercase tracking-widest text-[10px]">
              No records found in {activeTable}
            </div>
          )}
        </main>
      </div>

      {/* Row Editor Modal */}
      {editingRow && (
        <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 lg:p-6" onClick={() => setEditingRow(null)}>
          <div className="bg-slate-800 w-full max-w-lg rounded-[2.5rem] lg:rounded-[3rem] p-6 lg:p-10 shadow-2xl border border-white/5 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6 lg:mb-8">
                <h3 className="text-lg lg:text-xl font-black italic uppercase">Edit Row: {activeTable}</h3>
                <button onClick={() => setEditingRow(null)} className="text-slate-400 hover:text-white transition-colors"><i className="fa-solid fa-xmark text-xl"></i></button>
            </div>

            {operationError && (
              <div className="mb-6 p-4 bg-rose-500/20 rounded-2xl border border-rose-500/30 animate-shake">
                <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Error Details</p>
                <p className="text-xs font-bold text-white leading-relaxed">{operationError.message}</p>
                {operationError.details && <p className="text-[9px] text-slate-400 mt-2 font-mono bg-black/30 p-2 rounded-lg break-all">{operationError.details}</p>}
              </div>
            )}

            <form onSubmit={handleUpsert} className="space-y-4 overflow-y-auto no-scrollbar pr-2 flex-1">
               {(data.length > 0 ? Object.keys(data[0]) : Object.keys(editingRow)).map(key => (
                 <div key={key} className="space-y-1">
                    <label className="text-[8px] lg:text-[9px] font-black uppercase text-slate-400 tracking-widest ml-2">{key}</label>
                    <input 
                      type="text" 
                      value={editingRow[key] === null || editingRow[key] === undefined ? '' : editingRow[key]} 
                      onChange={e => setEditingRow({...editingRow, [key]: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 lg:p-4 text-xs font-bold text-white outline-none focus:ring-2 ring-indigo-500/20"
                      readOnly={key === 'id' && editingRow.id}
                      placeholder={`Enter ${key}...`}
                    />
                 </div>
               ))}
            </form>

            <div className="pt-6 lg:pt-8 flex gap-3 bg-slate-800">
                <button type="button" onClick={() => setEditingRow(null)} className="flex-1 py-3 lg:py-4 text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-slate-400">Discard</button>
                <button type="submit" disabled={loading} className="flex-[2] py-3 lg:py-4 bg-indigo-600 text-white rounded-2xl text-[9px] lg:text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-50">
                   {loading ? <i className="fa-solid fa-spinner animate-spin"></i> : 'Commit Changes'}
                </button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.3s ease-in-out 0s 2; }
      `}</style>
    </div>
  );
};

export default SuperAdminView;
