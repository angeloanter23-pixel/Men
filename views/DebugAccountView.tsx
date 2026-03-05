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
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-mono text-sm overflow-y-auto">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-xl space-y-8 border border-slate-200">
        <header className="border-b border-slate-100 pb-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Debug: Account Status</h1>
            <div className="px-3 py-1 bg-slate-100 rounded text-xs font-bold text-slate-500">DEV MODE</div>
        </header>
        
        <section className="space-y-3">
          <h2 className="font-bold text-indigo-600 uppercase tracking-wider text-xs flex items-center gap-2">
            <i className="fa-solid fa-user"></i> User Details
          </h2>
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 space-y-2">
            <div className="grid grid-cols-[120px_1fr] gap-2">
                <span className="font-semibold text-slate-500">ID:</span> 
                <span className="text-slate-900 break-all">{user?.id}</span>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-2">
                <span className="font-semibold text-slate-500">Email:</span> 
                <span className="text-slate-900">{user?.email}</span>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-2">
                <span className="font-semibold text-slate-500">Last Sign In:</span> 
                <span className="text-slate-900">{user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'N/A'}</span>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-bold text-indigo-600 uppercase tracking-wider text-xs flex items-center gap-2">
            <i className="fa-solid fa-shop"></i> Restaurant Details
          </h2>
          {restaurant ? (
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 space-y-2">
                <div className="grid grid-cols-[120px_1fr] gap-2">
                    <span className="font-semibold text-slate-500">Name:</span> 
                    <span className="text-slate-900 font-bold">{restaurant.name}</span>
                </div>
                <div className="grid grid-cols-[120px_1fr] gap-2">
                    <span className="font-semibold text-slate-500">ID:</span> 
                    <span className="text-slate-900 font-mono text-xs">{restaurant.id}</span>
                </div>
                <div className="grid grid-cols-[120px_1fr] gap-2">
                    <span className="font-semibold text-slate-500">Slug:</span> 
                    <span className="text-slate-900">{restaurant.slug}</span>
                </div>
                <div className="grid grid-cols-[120px_1fr] gap-2">
                    <span className="font-semibold text-slate-500">Owner ID:</span> 
                    <span className="text-slate-900 font-mono text-xs">{restaurant.owner_user_id || 'N/A (Legacy)'}</span>
                </div>
            </div>
          ) : (
            <div className="bg-rose-50 text-rose-600 p-5 rounded-xl border border-rose-100 flex items-center gap-3">
              <i className="fa-solid fa-triangle-exclamation"></i>
              No restaurant linked to this account.
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="font-bold text-indigo-600 uppercase tracking-wider text-xs flex items-center gap-2">
            <i className="fa-solid fa-id-badge"></i> Subscription Status
          </h2>
          {restaurant || isDemo ? (
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 space-y-2">
              <div className="grid grid-cols-[120px_1fr] gap-2 items-center">
                  <span className="font-semibold text-slate-500">Type:</span> 
                  <div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wide ${
                        accountType === 'trial' ? 'bg-amber-100 text-amber-800' : 
                        accountType === 'Demo' ? 'bg-blue-100 text-blue-800' : 
                        'bg-green-100 text-green-800'
                    }`}>
                        {accountType}
                    </span>
                  </div>
              </div>
              
              {accountType === 'trial' && (
                <>
                  <div className="grid grid-cols-[120px_1fr] gap-2">
                      <span className="font-semibold text-slate-500">Trial Ends:</span> 
                      <span className="text-slate-900">{restaurant.trial_ends_at ? new Date(restaurant.trial_ends_at).toLocaleString() : 'N/A'}</span>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] gap-2">
                      <span className="font-semibold text-slate-500">Remaining:</span> 
                      <span className={`font-bold ${calculateRemainingTime(restaurant.trial_ends_at).includes('Expired') ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {restaurant.trial_ends_at ? calculateRemainingTime(restaurant.trial_ends_at) : 'N/A'}
                      </span>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="text-slate-400 italic px-5">N/A</div>
          )}
        </section>

        <div className="flex flex-col gap-3">
            <button 
              onClick={onContinue}
              className="w-full py-5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg active:scale-[0.99] uppercase tracking-widest text-xs"
            >
              Continue to Dashboard
            </button>
            <button 
              onClick={() => {
                  localStorage.clear();
                  sessionStorage.clear();
                  window.location.reload();
              }}
              className="w-full py-3 bg-white border border-slate-200 text-slate-500 font-bold rounded-xl hover:bg-slate-50 transition-all uppercase tracking-widest text-[10px]"
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
