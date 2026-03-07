import React, { useState, useEffect } from 'react';
import * as MenuService from '../../services/menuService';
import { supabase } from '../../lib/supabase';

interface DebugDataViewProps {
  restaurantId: string | null;
  userId: string | null;
}

export const DebugDataView: React.FC<DebugDataViewProps> = ({ restaurantId, userId }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [activeRestaurantId, setActiveRestaurantId] = useState(restaurantId);

  const addLog = (msg: string) => {
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  useEffect(() => {
    const init = async () => {
        let rid = restaurantId;
        if (!rid && userId) {
            addLog(`No restaurant ID provided. Fetching for user: ${userId}`);
            const restaurant = await MenuService.getRestaurantByOwnerId(userId);
            if (restaurant) {
                rid = restaurant.id;
                setActiveRestaurantId(rid);
                addLog(`Found restaurant ID: ${rid}`);
            } else {
                // Try checking public users table
                const { data: publicUsers } = await supabase
                  .from('users')
                  .select('restaurant_id')
                  .eq('id', userId)
                  .limit(1);
                
                if (publicUsers && publicUsers.length > 0) {
                    rid = publicUsers[0].restaurant_id;
                    setActiveRestaurantId(rid);
                    addLog(`Found restaurant ID from users table: ${rid}`);
                }
            }
        }
        if (rid) {
            fetchData(rid);
        } else {
            addLog(`ERROR: Could not find restaurant ID.`);
            setError("Could not find restaurant ID.");
            setLoading(false);
        }
    };
    init();
  }, [restaurantId, userId]);

  const fetchData = async (rid: string) => {
    setLoading(true);
    setError(null);
    
    addLog(`Initializing debug fetch for restaurant: ${rid}`);

    try {
      addLog(`Fetching restaurant details from Supabase...`);
      const restaurantRes = await supabase.from('restaurants').select('*').eq('id', rid).single();
      
      if (restaurantRes.error) {
          addLog(`SUPABASE ERROR (restaurants): ${JSON.stringify(restaurantRes.error, null, 2)}`);
          throw new Error("Failed to fetch restaurant: " + restaurantRes.error.message);
      }
      addLog(`Restaurant details fetched successfully.`);

      addLog(`Fetching QR codes...`);
      const qrCodes = await MenuService.getQRCodes(rid);
      addLog(`Fetched ${qrCodes?.length || 0} QR codes.`);

      addLog(`Fetching Menu...`);
      const menu = await MenuService.getMenuByRestaurantId(rid);
      addLog(`Fetched ${menu?.items?.length || 0} menu items.`);

      addLog(`Fetching Live Messages...`);
      const messages = await MenuService.getLiveMessages(rid);
      addLog(`Fetched ${messages?.length || 0} messages.`);

      setData({
        restaurant: restaurantRes.data,
        qrCodes,
        menuItems: menu?.items || [],
        messages: messages || []
      });
      addLog(`All data successfully loaded into state.`);
    } catch (e: any) {
      const errMsg = e.message || (typeof e === 'object' ? JSON.stringify(e) : String(e));
      addLog(`EXCEPTION CAUGHT: ${errMsg}`);
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 overflow-y-auto max-h-[70vh] pb-8">
      <section>
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex justify-between items-center">
            <span>Execution Logs</span>
            {loading && <i className="fa-solid fa-spinner animate-spin text-indigo-500"></i>}
        </h4>
        <pre className="bg-slate-900 text-emerald-400 p-4 rounded-lg text-[10px] overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
            {logs.join('\n')}
        </pre>
      </section>

      {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-sm font-bold">
              Error: {error}
          </div>
      )}

      <section>
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Restaurant ID</h4>
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 break-all font-mono text-sm text-slate-600">
            {activeRestaurantId || 'No Restaurant ID'}
        </div>
      </section>

      {data && (
          <>
            <section>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Restaurant Details</h4>
                <pre className="bg-slate-900 text-emerald-400 p-4 rounded-lg text-[10px] overflow-x-auto">{JSON.stringify(data.restaurant, null, 2)}</pre>
            </section>
            <section>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">QR Codes ({data.qrCodes?.length})</h4>
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-[10px] text-left">
                        <thead className="bg-slate-50"><tr className="border-b border-slate-200"><th className="p-3 font-bold text-slate-500">Label</th><th className="p-3 font-bold text-slate-500">Code</th></tr></thead>
                        <tbody>
                            {data.qrCodes?.map((q: any) => <tr key={q.id} className="border-b border-slate-100 last:border-0"><td className="p-3">{q.label}</td><td className="p-3 font-mono text-slate-500">{q.code}</td></tr>)}
                            {!data.qrCodes?.length && <tr><td colSpan={2} className="p-4 text-center text-slate-400 italic">No QR codes found</td></tr>}
                        </tbody>
                    </table>
                </div>
            </section>
            <section>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Menu Items ({data.menuItems?.length})</h4>
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-[10px] text-left">
                        <thead className="bg-slate-50"><tr className="border-b border-slate-200"><th className="p-3 font-bold text-slate-500">Name</th><th className="p-3 font-bold text-slate-500">Price</th></tr></thead>
                        <tbody>
                            {data.menuItems?.slice(0, 10).map((i: any) => <tr key={i.id} className="border-b border-slate-100 last:border-0"><td className="p-3">{i.name}</td><td className="p-3 font-mono text-slate-500">₱{i.price}</td></tr>)}
                            {!data.menuItems?.length && <tr><td colSpan={2} className="p-4 text-center text-slate-400 italic">No menu items found</td></tr>}
                        </tbody>
                    </table>
                </div>
            </section>
            <section>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Messages ({data.messages?.length})</h4>
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-[10px] text-left">
                        <thead className="bg-slate-50"><tr className="border-b border-slate-200"><th className="p-3 font-bold text-slate-500">From</th><th className="p-3 font-bold text-slate-500">Text</th></tr></thead>
                        <tbody>
                            {data.messages?.slice(0, 10).map((m: any) => <tr key={m.id} className="border-b border-slate-100 last:border-0"><td className="p-3">{m.sender}</td><td className="p-3">{m.text}</td></tr>)}
                            {!data.messages?.length && <tr><td colSpan={2} className="p-4 text-center text-slate-400 italic">No messages found</td></tr>}
                        </tbody>
                    </table>
                </div>
            </section>
          </>
      )}
    </div>
  );
};

export default DebugDataView;
