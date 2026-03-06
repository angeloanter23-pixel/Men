import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import * as MenuService from '../services/menuService';

interface DebugAccountViewProps {
  onContinue: () => void;
}

export const DebugAccountView: React.FC<DebugAccountViewProps> = ({ onContinue }) => {
  const [user, setUser] = useState<any>(null);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // Try fetching by owner_id first
        let rest = await MenuService.getRestaurantByOwnerId(user.id);
        
        // Fallback to public users table link if not found (legacy/staff)
        if (!rest && user.email) {
             const { data: publicUsers } = await supabase.from('users').select('restaurant_id').eq('email', user.email).limit(1);
             if (publicUsers?.[0]?.restaurant_id) {
                 const { data: restData } = await supabase.from('restaurants').select('*').eq('id', publicUsers[0].restaurant_id).single();
                 rest = restData;
             }
        }
        setRestaurant(rest);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-slate-50 text-slate-500 font-mono">Loading debug info...</div>;

  const isDemo = user?.email === 'demo1@mymenu';
  const accountType = isDemo ? 'Demo' : (restaurant?.account_type || 'Standard');

  return (
    <div className="min-h-screen bg-[#F2F2F7] p-6 md:p-12 font-jakarta">
      <div className="max-w-3xl mx-auto space-y-8">
        <header className="flex justify-between items-center bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic">Account Diagnostics</h1>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">System Status & Configuration</p>
            </div>
            <div className="px-4 py-2 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">Dev Mode</div>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6">
              <h2 className="font-black text-slate-900 uppercase tracking-wider text-xs flex items-center gap-3">
                <i className="fa-solid fa-user text-indigo-500"></i> User Details
              </h2>
              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">User ID</span> 
                    <span className="text-slate-900 font-mono text-xs bg-slate-50 p-3 rounded-xl border border-slate-100 break-all">{user?.id}</span>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</span> 
                    <span className="text-slate-900 font-bold text-sm">{user?.email}</span>
                </div>
              </div>
            </section>

            <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6">
              <h2 className="font-black text-slate-900 uppercase tracking-wider text-xs flex items-center gap-3">
                <i className="fa-solid fa-shop text-indigo-500"></i> Restaurant Details
              </h2>
              {restaurant ? (
                <div className="space-y-4">
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</span> 
                        <span className="text-slate-900 font-black text-lg uppercase italic">{restaurant.name}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Slug</span> 
                        <span className="text-slate-900 font-mono text-xs">{restaurant.slug}</span>
                    </div>
                </div>
              ) : (
                <div className="bg-rose-50 text-rose-600 p-5 rounded-xl border border-rose-100 flex items-center gap-3 text-xs font-bold">
                  <i className="fa-solid fa-triangle-exclamation"></i>
                  No restaurant linked.
                </div>
              )}
            </section>
        </div>

        <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6">
          <h2 className="font-black text-slate-900 uppercase tracking-wider text-xs flex items-center gap-3">
            <i className="fa-solid fa-id-badge text-indigo-500"></i> Subscription Status
          </h2>
          {restaurant || isDemo ? (
            <div className="flex items-center justify-between bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-4">
                  <span className={`inline-flex items-center px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest ${
                      accountType === 'trial' ? 'bg-amber-100 text-amber-800' : 
                      accountType === 'Demo' ? 'bg-blue-100 text-blue-800' : 
                      'bg-green-100 text-green-800'
                  }`}>
                      {accountType}
                  </span>
                  {accountType === 'trial' && (
                      <span className="text-xs font-bold text-slate-500">
                        Ends: {restaurant.trial_end_at ? new Date(restaurant.trial_end_at).toLocaleDateString() : 'N/A'}
                      </span>
                  )}
              </div>
              {accountType === 'trial' && (
                  <span className={`font-black text-sm ${calculateRemainingTime(restaurant.trial_end_at).includes('Expired') ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {restaurant.trial_end_at ? calculateRemainingTime(restaurant.trial_end_at) : 'N/A'}
                  </span>
              )}
            </div>
          ) : (
            <div className="text-slate-400 italic px-5 text-sm">N/A</div>
          )}
        </section>

        <div className="flex flex-col gap-4">
            <button 
              onClick={onContinue}
              className="w-full py-6 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all shadow-lg active:scale-[0.99] uppercase tracking-[0.2em] text-xs"
            >
              Continue to Dashboard
            </button>
            <button 
              onClick={() => {
                  localStorage.clear();
                  sessionStorage.clear();
                  window.location.reload();
              }}
              className="w-full py-4 bg-white border border-slate-200 text-slate-400 font-bold rounded-2xl hover:bg-slate-50 transition-all uppercase tracking-widest text-[10px]"
            >
              Clear Cache & Reload
            </button>
        </div>
      </div>
    </div>
  );
};

function calculateRemainingTime(dateString: string) {
    if (!dateString) return "N/A";
    const end = new Date(dateString).getTime();
    const now = new Date().getTime();
    const diff = end - now;
    
    if (diff <= 0) return "Expired";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
}
