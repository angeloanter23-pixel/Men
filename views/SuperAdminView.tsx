import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase';

type TableName = 
  | 'restaurants' 
  | 'menus' 
  | 'categories' 
  | 'items' 
  | 'item_option_groups'
  | 'item_options'
  | 'users' 
  | 'staff_invites'
  | 'qr_codes' 
  | 'orders' 
  | 'login_attempts' 
  | 'table_sessions' 
  | 'branches' 
  | 'messages'
  | 'feedbacks';

const TABLES_REGISTRY: { id: TableName; label: string; icon: string; color: string; group: string }[] = [
  { id: 'restaurants', label: 'Restaurants', icon: 'fa-building', color: 'bg-blue-500', group: 'IDENTITY' },
  { id: 'users', label: 'Users', icon: 'fa-users', color: 'bg-emerald-500', group: 'IDENTITY' },
  { id: 'staff_invites', label: 'Staff Invites', icon: 'fa-envelope-open-text', color: 'bg-violet-500', group: 'IDENTITY' },
  
  { id: 'menus', label: 'Menus', icon: 'fa-book-open', color: 'bg-indigo-500', group: 'INVENTORY' },
  { id: 'categories', label: 'Categories', icon: 'fa-tags', color: 'bg-purple-500', group: 'INVENTORY' },
  { id: 'items', label: 'Menu Items', icon: 'fa-utensils', color: 'bg-orange-500', group: 'INVENTORY' },
  { id: 'item_option_groups', label: 'Option Groups', icon: 'fa-layer-group', color: 'bg-indigo-400', group: 'INVENTORY' },
  { id: 'item_options', label: 'Item Options', icon: 'fa-check-double', color: 'bg-sky-400', group: 'INVENTORY' },
  
  { id: 'qr_codes', label: 'QR Tokens', icon: 'fa-qrcode', color: 'bg-slate-800', group: 'OPERATIONS' },
  { id: 'orders', label: 'Live Orders', icon: 'fa-receipt', color: 'bg-rose-500', group: 'OPERATIONS' },
  { id: 'table_sessions', label: 'Sessions', icon: 'fa-clock-rotate-left', color: 'bg-sky-500', group: 'OPERATIONS' },
  { id: 'branches', label: 'Branches', icon: 'fa-map-location-dot', color: 'bg-teal-500', group: 'OPERATIONS' },
  
  { id: 'feedbacks', label: 'Guest Feedbacks', icon: 'fa-star-half-stroke', color: 'bg-amber-600', group: 'RECORDS' },
  { id: 'login_attempts', label: 'Security Logs', icon: 'fa-shield-halved', color: 'bg-amber-500', group: 'RECORDS' },
  { id: 'messages', label: 'Messages', icon: 'fa-message', color: 'bg-pink-500', group: 'RECORDS' }
];

const SuperAdminView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [tableCounts, setTableCounts] = useState<Record<string, number>>({});
  const [selectedTable, setSelectedTable] = useState<TableName | null>(null);
  const [tableData, setTableData] = useState<any[]>([]);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<any>>(new Set());
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingCell, setEditingCell] = useState<{ id: any; field: string } | null>(null);
  
  const [recordToPurge, setRecordToPurge] = useState<any | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [purgeLoading, setPurgeLoading] = useState(false);
  
  // New Record Creator
  const [isAddingRecord, setIsAddingRecord] = useState(false);
  const [newRecordForm, setNewRecordForm] = useState<Record<string, any>>({});
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetchSystemOverview();
  }, []);

  const showToast = (msg: string) => {
      setToast(msg);
      setTimeout(() => setToast(null), 3000);
  };

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
    setSelectedRowIds(new Set());
    try {
      const { data, error } = await supabase.from(tableName).select('*').order('created_at', { ascending: false }).limit(200);
      if (error) throw error;
      setTableData(data || []);
      
      // Prep new record form
      if (data && data.length > 0) {
          const schema = Object.keys(data[0]).reduce((acc, key) => {
              if (['id', 'created_at', 'updated_at'].includes(key)) return acc;
              acc[key] = '';
              return acc;
          }, {} as any);
          setNewRecordForm(schema);
      }
    } catch (err: any) {
      alert("Schema Fetch Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleRowSelection = (id: any) => {
    const next = new Set(selectedRowIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedRowIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedRowIds.size === tableData.length) {
      setSelectedRowIds(new Set());
    } else {
      setSelectedRowIds(new Set(tableData.map(r => r.id)));
    }
  };

  const handleUpdate = async (id: any, field: string, value: any) => {
    if (!selectedTable) return;
    try {
      const { error } = await supabase.from(selectedTable).update({ [field]: value }).eq('id', id);
      if (error) throw error;
      setTableData(prev => prev.map(row => row.id === id ? { ...row, [field]: value } : row));
      setEditingCell(null);
      showToast("Cell updated");
    } catch (err: any) {
      alert("Update Failed: " + err.message);
    }
  };

  const handleCreateRecord = async () => {
      if (!selectedTable) return;
      setLoading(true);
      try {
          const { data, error } = await supabase.from(selectedTable).insert([newRecordForm]).select();
          if (error) throw error;
          if (data) {
              setTableData([data[0], ...tableData]);
              setIsAddingRecord(false);
              showToast("Record committed");
          }
      } catch (err: any) {
          alert("Commit failed: " + err.message);
      } finally {
          setLoading(false);
      }
  };

  const executeBulkDelete = async () => {
    if (!selectedTable || selectedRowIds.size === 0) return;
    if (!confirm(`Permanently purge ${selectedRowIds.size} records from ${selectedTable}?`)) return;

    setPurgeLoading(true);
    try {
      const ids = Array.from(selectedRowIds);
      const { error } = await supabase.from(selectedTable).delete().in('id', ids);
      if (error) throw error;
      setTableData(prev => prev.filter(row => !selectedRowIds.has(row.id)));
      setTableCounts(prev => ({ ...prev, [selectedTable]: Math.max(0, (prev[selectedTable] || 0) - selectedRowIds.size) }));
      setSelectedRowIds(new Set());
    } catch (err: any) {
      alert("Bulk Purge Failed: " + err.message);
    } finally {
      setPurgeLoading(false);
    }
  };

  const executeTableReset = async () => {
    if (!selectedTable) return;
    setPurgeLoading(true);
    try {
      const { error } = await supabase.from(selectedTable).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      setTableData([]);
      setTableCounts(prev => ({ ...prev, [selectedTable]: 0 }));
      setIsResetConfirmOpen(false);
      showToast("Table wiped");
    } catch (err: any) {
      alert("Table Reset Failed: " + err.message);
    } finally {
      setPurgeLoading(false);
    }
  };

  const bulkClearField = async () => {
    if (!selectedTable || selectedRowIds.size === 0) return;
    const field = prompt("Enter field name to set to NULL for selection:");
    if (!field) return;

    setPurgeLoading(true);
    try {
      const ids = Array.from(selectedRowIds);
      const { error } = await supabase.from(selectedTable).update({ [field]: null }).in('id', ids);
      if (error) throw error;
      setTableData(prev => prev.map(row => selectedRowIds.has(row.id) ? { ...row, [field]: null } : row));
    } catch (err: any) {
      alert("Bulk Clear Failed: " + err.message);
    } finally {
      setPurgeLoading(false);
    }
  };

  const executePurge = async () => {
    if (!selectedTable || !recordToPurge) return;
    setPurgeLoading(true);
    try {
      const { error } = await supabase.from(selectedTable).delete().eq('id', recordToPurge);
      if (error) throw error;
      setTableData(prev => prev.filter(row => row.id !== recordToPurge));
      setTableCounts(prev => ({ ...prev, [selectedTable]: Math.max(0, (prev[selectedTable] || 1) - 1) }));
      setRecordToPurge(null);
    } catch (err: any) {
      alert("Purge Failed: " + err.message);
    } finally {
      setPurgeLoading(false);
    }
  };

  const copyToClipboard = (val: string) => {
      navigator.clipboard.writeText(val);
      showToast("Copied to clipboard");
  };

  // Added comment above fix
  // Fixed: Added explicit type annotation to tableColumns useMemo return value to resolve 'unknown' type errors during mapping
  const tableColumns = useMemo<string[]>(() => {
    if (tableData.length === 0) return [];
    return Object.keys(tableData[0]);
  }, [tableData]);

  // Added comment above fix
  // Fixed: Explicitly typed the groups Record to ensure TS correctly identifies the values as arrays, resolving the 'map does not exist on unknown' error
  const groupedTables = useMemo<Record<string, (typeof TABLES_REGISTRY[number])[]>>(() => {
      const groups: Record<string, (typeof TABLES_REGISTRY[number])[]> = {};
      TABLES_REGISTRY.forEach(t => {
          if (!groups[t.group]) groups[t.group] = [];
          groups[t.group].push(t);
      });
      return groups;
  }, []);

  return (
    <div className="min-h-screen bg-[#F2F2F7] font-jakarta pb-20 overflow-x-hidden">
      {toast && (
          <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[9999] bg-slate-900 text-white px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest animate-fade-in shadow-2xl">
              {toast}
          </div>
      )}

      <header className="sticky top-0 z-[100] bg-white/70 backdrop-blur-2xl border-b border-slate-200/50 px-6 py-6 md:px-12 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-all active:scale-90">
            <i className="fa-solid fa-chevron-left"></i>
          </button>
          <div>
            <h1 className="text-[22px] font-bold tracking-tight text-slate-900 leading-none">Supreme Admin</h1>
            <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest mt-1.5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Infrastructure Control
            </p>
          </div>
        </div>
        <button onClick={fetchSystemOverview} className={`w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-300 hover:text-indigo-600 shadow-sm border border-slate-200 ${loading ? 'animate-spin' : ''}`}>
          <i className="fa-solid fa-arrows-rotate"></i>
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-16">
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

        {Object.entries(groupedTables).map(([groupName, tables]) => (
            <section key={groupName} className="space-y-4">
                <h3 className="px-4 text-[11px] font-black uppercase text-slate-400 tracking-[0.4em] italic">{groupName}</h3>
                <div className="bg-white rounded-[2.5rem] border border-white overflow-hidden shadow-sm divide-y divide-slate-100">
                    {tables.map(table => (
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
        ))}

        <footer className="text-center pt-10 opacity-30">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.5em]">Supreme Data Node v2025.1</p>
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
                      <div className="flex items-center gap-3 mt-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">Data Registry / {tableData.length} Records</p>
                        <button onClick={() => setIsResetConfirmOpen(true)} className="text-[9px] font-black text-rose-500 uppercase tracking-widest bg-rose-50 px-2 py-0.5 rounded border border-rose-100 hover:bg-rose-500 hover:text-white transition-all leading-none italic">Reset Table</button>
                      </div>
                   </div>
                </div>

                <div className="flex items-center gap-4">
                   <button 
                     onClick={() => setIsAddingRecord(true)}
                     className="px-6 py-3.5 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center gap-2 active:scale-95"
                   >
                     <i className="fa-solid fa-plus-circle"></i>
                     New Record
                   </button>
                   {selectedRowIds.size > 0 && (
                     <div className="flex items-center gap-2 animate-fade-in pr-4 border-r border-slate-200">
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{selectedRowIds.size} SELECTED</span>
                        <button onClick={bulkClearField} className="w-10 h-10 bg-white text-slate-400 hover:text-indigo-600 rounded-xl flex items-center justify-center border border-slate-200 shadow-sm" title="Clear Field Value"><i className="fa-solid fa-eraser text-xs"></i></button>
                        <button onClick={executeBulkDelete} className="w-10 h-10 bg-rose-500 text-white rounded-xl flex items-center justify-center shadow-lg active:scale-95" title="Purge Selection"><i className="fa-solid fa-trash-can text-xs"></i></button>
                     </div>
                   )}
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

             <div className="flex-1 overflow-auto bg-white m-6 rounded-[2.5rem] border border-slate-200 shadow-inner relative no-scrollbar">
                {loading && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4">
                     <div className="w-12 h-12 border-4 border-slate-50 border-t-indigo-600 rounded-full animate-spin"></div>
                     <p className="text-[10px] font-black uppercase text-indigo-600 tracking-[0.3em]">Querying Engine...</p>
                  </div>
                )}
                
                <table className="w-full text-left border-collapse min-w-[1200px]">
                   <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10">
                      <tr>
                        <th className="px-6 py-5 w-14">
                           <input 
                              type="checkbox" 
                              className="w-5 h-5 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              checked={tableData.length > 0 && selectedRowIds.size === tableData.length}
                              onChange={toggleSelectAll}
                           />
                        </th>
                        {tableColumns.map(col => (
                          <th key={col} className={`px-6 py-5 text-[9px] font-black uppercase tracking-widest italic ${col.endsWith('_id') || col === 'id' ? 'text-indigo-600' : 'text-slate-400'}`}>
                            {col}
                          </th>
                        ))}
                        <th className="px-6 py-5 text-right sticky right-0 bg-slate-50 border-l border-slate-200 shadow-[-10px_0_10px_rgba(0,0,0,0.02)]"></th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {tableData.map((row) => (
                        <tr key={row.id} className={`group transition-all ${selectedRowIds.has(row.id) ? 'bg-indigo-50/50' : 'hover:bg-slate-50/50'}`}>
                           <td className="px-6 py-5">
                              <input 
                                type="checkbox" 
                                className="w-5 h-5 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                checked={selectedRowIds.has(row.id)}
                                onChange={() => toggleRowSelection(row.id)}
                              />
                           </td>
                           {tableColumns.map(col => (
                             <td 
                               key={`${row.id}-${col}`} 
                               className={`px-6 py-5 text-xs font-medium relative group/cell ${selectedRowIds.has(row.id) ? 'text-indigo-900 font-bold' : 'text-slate-600'}`}
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
                                 <div 
                                    className={`truncate max-w-[250px] group-hover/cell:text-indigo-600 transition-colors ${col.endsWith('_id') || col === 'id' ? 'cursor-pointer hover:underline' : ''}`}
                                    onClick={() => (col.endsWith('_id') || col === 'id') && row[col] && copyToClipboard(String(row[col]))}
                                 >
                                    {row[col] === null ? (
                                      <span className="opacity-20 italic">null</span>
                                    ) : typeof row[col] === 'boolean' ? (
                                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${row[col] ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{String(row[col])}</span>
                                    ) : typeof row[col] === 'object' ? (
                                      <span className="text-[9px] bg-slate-100 px-2 py-0.5 rounded font-mono">Object</span>
                                    ) : String(row[col])}
                                 </div>
                               )}
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
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Edit Cell</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <kbd className="px-2 py-1 bg-indigo-50 rounded text-[9px] font-bold text-indigo-500 border border-indigo-100">CLICK UUID</kbd>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Copy Reference</span>
                   </div>
                </div>
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] italic">Platinum Data Node v4.0.2</p>
             </footer>
          </div>
        </div>
      )}

      {/* NEW RECORD CREATOR MODAL */}
      {isAddingRecord && selectedTable && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-xl animate-fade-in overflow-y-auto">
              <div className="bg-white w-full max-w-lg rounded-[3.5rem] p-10 lg:p-14 shadow-2xl relative animate-scale border border-emerald-100 my-auto flex flex-col gap-10">
                  <header className="flex justify-between items-start">
                    <div>
                        <p className="text-[10px] font-black uppercase text-emerald-600 tracking-[0.5em] mb-2">New Row</p>
                        <h3 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">Insert Registry</h3>
                    </div>
                    <button onClick={() => setIsAddingRecord(false)} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 hover:text-rose-500 transition-all border border-slate-100"><i className="fa-solid fa-xmark text-lg"></i></button>
                  </header>

                  <div className="space-y-6 max-h-[60vh] overflow-y-auto no-scrollbar pr-2">
                      {Object.keys(newRecordForm).map(field => (
                          <div key={field} className="space-y-2">
                              <label className={`text-[9px] font-black uppercase tracking-widest ml-4 italic ${field.endsWith('_id') ? 'text-indigo-500' : 'text-slate-400'}`}>
                                {field}
                              </label>
                              <input 
                                value={newRecordForm[field]} 
                                onChange={e => setNewRecordForm({...newRecordForm, [field]: e.target.value})}
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-sm font-bold outline-none focus:bg-white focus:ring-4 ring-emerald-500/5 transition-all shadow-inner" 
                                placeholder={`Enter ${field}...`}
                              />
                          </div>
                      ))}
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                      <button 
                        onClick={handleCreateRecord}
                        disabled={loading}
                        className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-[0.4em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                      >
                        {loading ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-cloud-arrow-up"></i>}
                        Commit Record
                      </button>
                      <button 
                        onClick={() => setIsAddingRecord(false)}
                        className="w-full py-5 text-slate-300 font-bold uppercase text-[10px] tracking-widest active:opacity-50"
                      >
                        Abort
                      </button>
                  </div>
              </div>
          </div>
      )}

      {recordToPurge && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-xl animate-fade-in">
              <div className="bg-white w-full max-sm rounded-[3.5rem] p-10 shadow-2xl space-y-8 animate-scale border border-rose-100 flex flex-col items-center text-center">
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

      {isResetConfirmOpen && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-rose-900/90 backdrop-blur-2xl animate-fade-in">
              <div className="bg-white w-full max-sm rounded-[3.5rem] p-12 shadow-2xl space-y-10 animate-scale border border-rose-200 flex flex-col items-center text-center">
                  <div className="w-24 h-24 bg-rose-100 text-rose-600 rounded-[3rem] flex items-center justify-center text-4xl shadow-inner animate-pulse">
                      <i className="fa-solid fa-radiation"></i>
                  </div>
                  
                  <div className="space-y-4">
                      <h3 className="text-3xl font-black uppercase tracking-tighter italic text-slate-900 leading-none">Table Reset</h3>
                      <p className="text-slate-500 text-sm font-bold leading-relaxed px-4">
                          You are about to <span className="text-rose-600 font-black">DELETE ALL ROWS</span> in the <span className="text-slate-900 font-black">{selectedTable}</span> table. This action is irreversible.
                      </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 w-full">
                      <button 
                        onClick={executeTableReset}
                        disabled={purgeLoading}
                        className="w-full py-6 bg-rose-600 text-white rounded-[2.2rem] font-black uppercase text-[11px] tracking-[0.2em] shadow-2xl shadow-rose-300 active:scale-95 transition-all flex items-center justify-center gap-3 hover:bg-rose-700"
                      >
                        {purgeLoading ? <i className="fa-solid fa-spinner animate-spin"></i> : 'Purge All Records'}
                      </button>
                      <button 
                        onClick={() => setIsResetConfirmOpen(false)}
                        className="w-full py-6 bg-slate-100 text-slate-500 rounded-[2.2rem] font-black uppercase text-[11px] tracking-widest active:scale-95 transition-all"
                      >
                        Abort Operation
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
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default SuperAdminView;