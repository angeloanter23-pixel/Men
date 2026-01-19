
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

type TableName = 'restaurants' | 'branches' | 'menus' | 'categories' | 'items' | 'users' | 'qr_codes';

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
    { id: 'qr_codes', label: 'QR Codes', icon: 'fa-qrcode' }
  ];

  useEffect(() => {
    fetchRestaurants();
  }, []);

  useEffect(() => {
    fetchTableData();
  }, [activeTable, selectedRestId]);

  const fetchRestaurants = async () => {
    const { data: res } = await supabase.from('restaurants').select('id, name').order('name');
    if (res) setRestaurants(res);
  };

  const fetchTableData = async () => {
    setLoading(true);
    setError(null);
    try {
      let query;

      if (activeTable === 'categories') {
        query = supabase.from('categories').select(`
          id, 
          name, 
          menu_id,
          menus(name, restaurant_id)
        `);
        if (selectedRestId !== 'all') {
          query = query.eq('menus.restaurant_id', selectedRestId);
        }
      } else if (activeTable === 'qr_codes') {
        query = supabase.from('qr_codes').select(`
          id, 
          label, 
          code, 
          type, 
          restaurant_id,
          restaurants(name)
        `);
        if (selectedRestId !== 'all') {
          query = query.eq('restaurant_id', selectedRestId);
        }
      } else if (activeTable === 'items') {
        query = supabase.from('items').select(`
          id,
          name,
          price,
          description,
          category_id,
          categories(
            name, 
            menus(name, restaurant_id)
          )
        `);
        if (selectedRestId !== 'all') {
          query = query.eq('categories.menus.restaurant_id', selectedRestId);
        }
      } else if (activeTable === 'menus') {
        query = supabase.from('menus').select(`
          *,
          restaurants(name)
        `);
        if (selectedRestId !== 'all') {
          query = query.eq('restaurant_id', selectedRestId);
        }
      } else if (activeTable === 'branches') {
        query = supabase.from('branches').select(`
          *,
          restaurants(name)
        `);
        if (selectedRestId !== 'all') {
          query = query.eq('restaurant_id', selectedRestId);
        }
      } else {
        query = supabase.from(activeTable).select('*');
        if (selectedRestId !== 'all' && (activeTable === 'users')) {
          query = query.eq('restaurant_id', selectedRestId);
        }
      }

      const { data: result, error: fetchError } = await query.limit(100);
      
      if (fetchError) throw fetchError;

      const processed = (result || []).map(row => {
        if (activeTable === 'categories') {
          return {
            category_id: row.id,
            category_name: row.name,
            parent_menu: row.menus?.name || 'Isolated',
            menu_id: row.menu_id
          };
        }
        if (activeTable === 'qr_codes') {
          return {
            qr_id: row.id,
            qr_label: row.label,
            qr_code: row.code,
            qr_type: row.type,
            owner_restaurant: row.restaurants?.name || 'Orphan',
            restaurant_id: row.restaurant_id
          };
        }
        if (activeTable === 'items') {
          return {
            item_id: row.id,
            item_name: row.name,
            price: `₱${row.price}`,
            category_name: row.categories?.name || 'Uncategorized',
            menu_context: row.categories?.menus?.name || 'Standalone',
            restaurant_id: row.categories?.menus?.restaurant_id
          };
        }
        if (activeTable === 'menus' || activeTable === 'branches') {
          return {
            ...row,
            restaurant_name: row.restaurants?.name || 'N/A',
            restaurants: undefined 
          };
        }
        return row;
      });

      setData(processed);
    } catch (err: any) {
      console.error("SuperAdmin Fetch Error:", err);
      setError(err.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (row: any) => {
    const targetId = row.id || row.qr_id || row.category_id || row.item_id;
    if (!confirm(`Confirm deletion of record ID: ${targetId}?`)) return;
    
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

      // Fetch branches for this restaurant for context
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

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 p-8 font-['Plus_Jakarta_Sans'] overflow-x-hidden">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-400 hover:text-white transition-all border border-white/10">
            <i className="fa-solid fa-arrow-left"></i>
          </button>
          <div>
            <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none text-white">SUPER<span className="text-indigo-500">ADMIN</span></h1>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2">Enterprise Infrastructure Control</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          {/* Seeker Tool */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-2 flex items-center gap-2">
            <textarea 
              value={seekInput}
              onChange={e => setSeekInput(e.target.value)}
              placeholder="Paste QR Code Token..."
              className="bg-slate-900 border border-white/5 rounded-xl px-4 py-2 text-[10px] font-bold outline-none text-indigo-400 focus:ring-2 ring-indigo-500/20 w-48 h-10 resize-none no-scrollbar"
            />
            <button 
              onClick={handleSeek}
              className="h-10 px-4 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-magnifying-glass"></i> SEEK
            </button>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2 flex items-center gap-3 h-[52px]">
             <span className="text-[9px] font-black uppercase text-slate-500">Master Account:</span>
             <select 
               value={selectedRestId} 
               onChange={e => setSelectedRestId(e.target.value)}
               className="bg-transparent text-xs font-bold outline-none text-indigo-400 cursor-pointer min-w-[150px]"
             >
                <option value="all" className="bg-slate-900">Show All Entities</option>
                {restaurants.map(r => <option key={r.id} value={r.id} className="bg-slate-900">{r.name}</option>)}
             </select>
          </div>
          <button onClick={fetchTableData} className="w-12 h-12 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-500/20 active:scale-90 transition-all flex items-center justify-center">
            <i className={`fa-solid fa-rotate ${loading ? 'animate-spin' : ''}`}></i>
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 mb-10 pb-2">
        {tables.map(table => (
          <button 
            key={table.id}
            onClick={() => setActiveTable(table.id)}
            className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all flex items-center gap-3 ${activeTable === table.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'}`}
          >
            <i className={`fa-solid ${table.icon}`}></i> {table.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-8 bg-rose-500/10 border border-rose-500/20 p-6 rounded-3xl text-rose-500 text-xs font-bold uppercase tracking-widest flex items-center gap-3">
          <i className="fa-solid fa-circle-exclamation"></i> {error}
        </div>
      )}

      <div className="bg-white/5 border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl animate-fade-in">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                {data.length > 0 && Object.keys(data[0]).map((key) => (
                  <th key={key} className="px-10 py-5 text-[9px] font-black uppercase tracking-widest text-slate-500 italic whitespace-nowrap">
                    {key.replace('_', ' ')}
                  </th>
                ))}
                <th className="px-10 py-5 text-[9px] font-black uppercase tracking-widest text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.map((row, idx) => (
                <tr key={idx} className="hover:bg-white/5 transition-colors">
                  {Object.values(row).map((val: any, i) => (
                    <td key={i} className="px-10 py-5 text-xs font-bold text-slate-300 truncate max-w-[250px] italic">
                      {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                    </td>
                  ))}
                  <td className="px-10 py-5 text-right">
                     <button 
                      onClick={() => handleDelete(row)} 
                      className="text-rose-500/40 hover:text-rose-500 transition-all p-2"
                      title="Purge Record"
                     >
                       <i className="fa-solid fa-trash-can"></i>
                     </button>
                  </td>
                </tr>
              ))}
              {data.length === 0 && !loading && (
                <tr>
                  <td colSpan={100} className="py-24 text-center">
                     <i className="fa-solid fa-database text-4xl text-white/5 mb-4"></i>
                     <p className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-600">No matching records found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Seek Modal */}
      {showSeekModal && seekResult && (
        <div className="fixed inset-0 z-[1000] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-6 animate-fade-in" onClick={() => setShowSeekModal(false)}>
          <div className="bg-[#0f172a] border border-white/10 w-full max-w-sm rounded-[3rem] p-10 lg:p-12 shadow-2xl relative transition-all" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-10">
               <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-500 mb-3 italic">Discovery Diagnostic</p>
                  <h2 className="text-3xl font-black uppercase tracking-tighter text-white italic leading-none">Entity Identity</h2>
               </div>
               <button onClick={() => setShowSeekModal(false)} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-500 hover:text-rose-500 transition-all border border-white/5"><i className="fa-solid fa-xmark"></i></button>
            </div>

            <div className="space-y-8">
               <div className="space-y-3">
                  <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest italic ml-2">QR Designation (Label)</label>
                  <div className="bg-white/5 p-5 rounded-[2rem] border border-white/5 flex items-center gap-4">
                     <i className="fa-solid fa-tag text-indigo-400"></i>
                     <p className="font-black text-lg text-white uppercase italic tracking-tighter">{seekResult.label}</p>
                  </div>
               </div>

               <div className="space-y-3">
                  <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest italic ml-2">Master Business Name</label>
                  <div className="bg-white/5 p-5 rounded-[2rem] border border-white/5 flex items-center gap-4">
                     <i className="fa-solid fa-building text-indigo-400"></i>
                     <p className="font-bold text-sm text-slate-200">{seekResult.restaurant_name}</p>
                  </div>
               </div>

               <div className="space-y-3">
                  <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest italic ml-2">Associated Branch Territories</label>
                  <div className="space-y-2">
                     {seekResult.branches.length > 0 ? seekResult.branches.map((b: any, i: number) => (
                       <div key={i} className="bg-white/5 p-4 rounded-2xl border border-white/5 flex justify-between items-center group">
                          <div>
                            <p className="text-xs font-black text-white uppercase tracking-tight">{b.name}</p>
                            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest italic">{b.subdomain}</p>
                          </div>
                          <i className="fa-solid fa-circle-nodes text-[10px] text-indigo-500/20 group-hover:text-indigo-500 transition-colors"></i>
                       </div>
                     )) : (
                       <p className="text-[9px] text-slate-600 font-bold italic py-2 ml-2">No branch context defined for this entity.</p>
                     )}
                  </div>
               </div>

               <div className="pt-6 border-t border-white/5">
                  <div className="flex justify-between items-center px-2">
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Global UID</span>
                    <span className="text-[8px] font-mono text-slate-400 opacity-50">{seekResult.id}</span>
                  </div>
               </div>
            </div>

            <button 
              onClick={() => setShowSeekModal(false)}
              className="w-full mt-10 py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase text-[10px] tracking-[0.4em] shadow-xl active:scale-95 transition-all"
            >
              Close Diagnostic
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] flex items-center justify-center z-[100]">
           <i className="fa-solid fa-spinner animate-spin text-4xl text-indigo-500"></i>
        </div>
      )}
    </div>
  );
};

export default SuperAdminView;
