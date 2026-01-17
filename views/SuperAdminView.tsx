
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
    // Map the aliased ID back to 'id' for the EQ filter
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
          <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2 flex items-center gap-3">
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
      
      {loading && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] flex items-center justify-center z-[100]">
           <i className="fa-solid fa-spinner animate-spin text-4xl text-indigo-500"></i>
        </div>
      )}
    </div>
  );
};

export default SuperAdminView;
