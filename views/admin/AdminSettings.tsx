
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import * as MenuService from '../../services/menuService';

interface AdminSettingsProps {
  onLogout: () => void;
  adminCreds: any;
  setAdminCreds: React.Dispatch<React.SetStateAction<any>>;
  onImportClick?: () => void;
  onThemeUpdate: (theme: any) => void;
}

const FONTS = [
  { id: 'Plus Jakarta Sans', name: 'Modern Sans' },
  { id: 'Playfair Display', name: 'Elegant Serif' },
  { id: 'Outfit', name: 'Luxury Outfit' },
  { id: 'Montserrat', name: 'Clean Montserrat' },
  { id: 'Poppins', name: 'Poppins Classic' }
];

const TEMPLATES = [
    { 
      id: 'classic', 
      name: 'Classic Elite', 
      desc: 'Apple-style light aesthetic.', 
      icon: 'fa-apple-whole',
      bg: 'bg-[#FBFBFD]',
      accent: 'bg-[#FF6B00]',
      textColor: 'text-slate-900'
    },
    { 
      id: 'modern', 
      name: 'Modern Pulse', 
      desc: 'Vibrant pink delivery vibe.', 
      icon: 'fa-mobile-screen',
      bg: 'bg-[#F8F8F8]',
      accent: 'bg-[#D81B60]',
      textColor: 'text-slate-900'
    },
    { 
      id: 'premium', 
      name: 'Black Reserve', 
      desc: 'High-end dark mode luxury.', 
      icon: 'fa-crown',
      bg: 'bg-[#0A0A0B]',
      accent: 'bg-indigo-600',
      textColor: 'text-white'
    }
];

const AdminSettings: React.FC<AdminSettingsProps> = ({ onLogout, onThemeUpdate }) => {
  const [merchantData, setMerchantData] = useState<any>(null);
  const [isLoadingMerchant, setIsLoadingMerchant] = useState(false);
  const [isEditingMerchant, setIsEditingMerchant] = useState(false);
  const [isEditingTheme, setIsEditingTheme] = useState(false);
  
  const [theme, setTheme] = useState({
    primary_color: '#FF6B00',
    secondary_color: '#FFF3E0',
    font_family: 'Plus Jakarta Sans',
    template: 'classic',
    logo_url: ''
  });

  const sessionRaw = localStorage.getItem('foodie_supabase_session');
  const session = sessionRaw ? JSON.parse(sessionRaw) : null;
  const restaurantId = session?.restaurant?.id;
  const currentEmail = session?.user?.email || 'Not logged in';

  useEffect(() => {
    if (restaurantId && restaurantId !== "undefined") {
      fetchMerchantData();
    }
  }, [restaurantId]);

  const fetchMerchantData = async () => {
    if (!restaurantId || restaurantId === "undefined") return;
    setIsLoadingMerchant(true);
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', restaurantId)
        .single();
      if (error) throw error;
      setMerchantData(data);
      if (data.theme) setTheme({ ...theme, ...data.theme });
    } catch (err: any) {
      console.error("Settings error:", err.message);
    } finally {
      setIsLoadingMerchant(false);
    }
  };

  const handleUpdateTheme = async () => {
    setIsLoadingMerchant(true);
    try {
      await MenuService.updateRestaurantTheme(restaurantId, theme);
      setIsEditingTheme(false);
      
      const sessionData = JSON.parse(localStorage.getItem('foodie_supabase_session') || '{}');
      if (sessionData.restaurant) {
        sessionData.restaurant.theme = theme;
        localStorage.setItem('foodie_supabase_session', JSON.stringify(sessionData));
      }

      const activeDinSession = JSON.parse(localStorage.getItem('foodie_active_session') || '{}');
      if (activeDinSession.id) {
          activeDinSession.theme = theme;
          localStorage.setItem('foodie_active_session', JSON.stringify(activeDinSession));
      }

      onThemeUpdate(theme);
    } catch (err: any) {
      alert("Could not save style: " + err.message);
    } finally {
      setIsLoadingMerchant(false);
    }
  };

  const SettingRow: React.FC<{ icon: string; color: string; label: string; children: React.ReactNode; last?: boolean }> = ({ icon, color, label, children, last }) => (
    <div className={`flex items-center justify-between py-4 ${!last ? 'border-b border-slate-100' : ''}`}>
      <div className="flex items-center gap-4">
        <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center text-white shadow-sm`}>
          <i className={`fa-solid ${icon} text-[14px]`}></i>
        </div>
        <span className="text-[15px] font-semibold text-slate-800 tracking-tight">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        {children}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen font-jakarta pb-40">
      <div className="max-w-2xl mx-auto space-y-10">
        
        <header className="flex items-end justify-between px-2">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight italic uppercase">Identity</h1>
            <p className="text-slate-500 text-sm font-medium mt-1">Design the digital experience.</p>
          </div>
          <button onClick={onLogout} className="px-5 py-2.5 bg-white text-rose-500 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm border border-slate-200 hover:bg-rose-50 transition-all">Logout</button>
        </header>

        <section className="space-y-4">
          <div className="flex justify-between items-center px-4">
            <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.1em]">Experience Profile</h3>
            {!isEditingTheme && <button onClick={() => setIsEditingTheme(true)} className="text-[10px] font-black text-indigo-600 uppercase bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">Modify Style</button>}
          </div>
          
          <div className="relative -mx-6 px-6 overflow-hidden">
            <div className="flex overflow-x-auto gap-6 pb-8 snap-x no-scrollbar scroll-smooth">
                {TEMPLATES.map(t => (
                    <button 
                        key={t.id}
                        disabled={!isEditingTheme}
                        onClick={() => setTheme({...theme, template: t.id as any, primary_color: t.accent === 'bg-[#D81B60]' ? '#D81B60' : theme.primary_color})}
                        className={`flex-shrink-0 w-[260px] snap-center transition-all duration-500 outline-none ${!isEditingTheme && theme.template !== t.id ? 'opacity-40 grayscale' : ''}`}
                    >
                        <div className={`relative aspect-[9/16] w-full rounded-[3rem] p-3 border-[6px] transition-all duration-500 ${theme.template === t.id ? 'border-indigo-600 scale-100 shadow-2xl' : 'border-white scale-[0.94] shadow-md opacity-60'}`}>
                            <div className={`w-full h-full rounded-[2.4rem] overflow-hidden flex flex-col shadow-inner ${t.bg}`}>
                                <div className="h-6 flex items-center justify-between px-7 pt-3 opacity-20"><span className={`text-[8px] font-bold ${t.textColor}`}>9:41</span></div>
                                <div className="px-6 pt-10 space-y-4">
                                    <div className={`w-14 h-1 rounded-full ${t.accent} opacity-40`}></div>
                                    <div className={`text-[22px] font-black leading-[1.1] tracking-tight ${t.textColor}`}>Brand <br/> Selection.</div>
                                    <div className="space-y-2.5 pt-4">
                                        <div className="h-28 bg-slate-400/5 rounded-3xl border border-slate-500/10 flex items-center p-4 gap-3">
                                            <div className="w-16 h-16 bg-slate-400/10 rounded-2xl"></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-auto h-14 border-t border-slate-500/10 flex items-center justify-around px-6">
                                    <div className={`w-5 h-5 rounded-full ${t.accent}`}></div>
                                    <div className="w-5 h-5 rounded-full bg-slate-400/10"></div>
                                </div>
                            </div>
                            {theme.template === t.id && (
                                <div className="absolute -top-3 -right-3 w-9 h-9 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg ring-[6px] ring-[#F2F2F7]"><i className="fa-solid fa-check text-xs"></i></div>
                            )}
                        </div>
                        <div className="mt-6 text-center">
                            <h4 className={`text-[15px] font-black uppercase tracking-tight ${theme.template === t.id ? 'text-indigo-600' : 'text-slate-400'}`}>{t.name}</h4>
                            <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-1.5">{t.desc}</p>
                        </div>
                    </button>
                ))}
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200/50 space-y-4">
            <SettingRow icon="fa-palette" color="bg-orange-500" label="Primary Brand Color">
              <input type="color" disabled={!isEditingTheme} value={theme.primary_color} onChange={e => setTheme({...theme, primary_color: e.target.value})} className="w-8 h-8 rounded-full border-none cursor-pointer overflow-hidden bg-transparent" />
            </SettingRow>
            <SettingRow icon="fa-font" color="bg-emerald-500" label="Brand Typography" last>
              <select disabled={!isEditingTheme} value={theme.font_family} onChange={e => setTheme({...theme, font_family: e.target.value})} className="bg-transparent text-sm font-black text-slate-600 outline-none cursor-pointer text-right appearance-none">
                  {FONTS.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </SettingRow>

            {isEditingTheme && (
              <div className="mt-6 pt-6 border-t border-slate-100 flex gap-4">
                <button onClick={handleUpdateTheme} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">Confirm Style</button>
                <button onClick={() => setIsEditingTheme(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest">Cancel</button>
              </div>
            )}
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="px-4 text-[11px] font-black uppercase text-slate-400 tracking-[0.1em]">Identity Record</h3>
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200/50">
            <SettingRow icon="fa-store" color="bg-indigo-500" label="Merchant Name">
              <span className="text-slate-400 font-bold text-sm uppercase italic">{merchantData?.name || '...'}</span>
            </SettingRow>
            <SettingRow icon="fa-envelope" color="bg-sky-500" label="Authorized Email" last>
              <span className="text-slate-400 font-medium text-sm">{currentEmail}</span>
            </SettingRow>
          </div>
        </section>
      </div>

      {isLoadingMerchant && (
        <div className="fixed inset-0 bg-white/70 backdrop-blur-sm z-[2000] flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-slate-50 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-[10px] font-black uppercase text-indigo-600 tracking-[0.3em] animate-pulse">Syncing Engine...</p>
        </div>
      )}
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
};

export default AdminSettings;
