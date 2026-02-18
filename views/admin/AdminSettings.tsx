import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import * as MenuService from '../../services/menuService';

interface AdminSettingsProps {
  onLogout: () => void;
  adminCreds: any;
  setAdminCreds: React.Dispatch<React.SetStateAction<any>>;
  onImportClick?: () => void;
  onThemeUpdate: (theme: any) => void;
  onSubTabChange?: (sub: string) => void;
}

const AdminSettings: React.FC<AdminSettingsProps> = ({ onLogout, onThemeUpdate, onSubTabChange }) => {
  const [merchantData, setMerchantData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [payFirst, setPayFirst] = useState(false);
  
  // Theme Local State
  const [themeForm, setThemeForm] = useState({
    primary_color: '#FF6B00',
    secondary_color: '#FFF3E0',
    template: 'classic' as 'classic' | 'premium' | 'modern'
  });

  const sessionRaw = localStorage.getItem('foodie_supabase_session');
  const session = sessionRaw ? JSON.parse(sessionRaw) : null;
  const restaurantId = session?.restaurant?.id;

  useEffect(() => {
    if (restaurantId) fetchMerchantData();
  }, [restaurantId]);

  const fetchMerchantData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('restaurants').select('*').eq('id', restaurantId).single();
      if (!error && data) {
        setMerchantData(data);
        setPayFirst(!!data.pay_first_enabled);
        if (data.theme) {
            setThemeForm({
                primary_color: data.theme.primary_color || '#FF6B00',
                secondary_color: data.theme.secondary_color || '#FFF3E0',
                template: data.theme.template || 'classic'
            });
        }
      }
    } catch (e) {} finally { setLoading(false); }
  };

  const handleTogglePayFirst = async () => {
    const nextVal = !payFirst;
    setPayFirst(nextVal);
    try {
      // 1. Update Global Restaurant Policy
      await supabase.from('restaurants').update({ pay_first_enabled: nextVal }).eq('id', restaurantId);
      
      // 2. Synchronize "Activate all dish" logic
      // This bulk updates every item's specific payment flag to match the master switch
      await MenuService.bulkUpdateItemPayment(restaurantId, nextVal);

      setToast(nextVal ? "Enforced: All Dishes Pay First" : "Standard: Pay Later Mode");
      setTimeout(() => setToast(null), 3000);
    } catch (e) {
      setPayFirst(!nextVal);
    }
  };

  const handleThemeChange = async (key: string, value: string) => {
    const nextTheme = { ...themeForm, [key]: value };
    setThemeForm(nextTheme);
    try {
        await MenuService.updateRestaurantTheme(restaurantId, { 
            ...merchantData.theme, 
            ...nextTheme 
        });
        onThemeUpdate(nextTheme);
        setToast("Interface Synchronized");
        setTimeout(() => setToast(null), 2000);
    } catch (e) {
        console.error("Theme sync error");
    }
  };

  const SettingRow: React.FC<{ icon: string; color: string; label: string; sub?: string; children: React.ReactNode; last?: boolean; onClick?: () => void }> = ({ icon, color, label, sub, children, last, onClick }) => (
    <div onClick={onClick} className={`flex items-center justify-between py-4 ${!last ? 'border-b border-slate-100' : ''} ${onClick ? 'cursor-pointer hover:bg-slate-50 transition-all rounded-xl -mx-2 px-2' : ''}`}>
      <div className="flex items-center gap-4">
        <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center text-white shadow-sm`}><i className={`fa-solid ${icon} text-[14px]`}></i></div>
        <div>
            <span className="text-[15px] font-semibold text-slate-800 tracking-tight block leading-none">{label}</span>
            {sub && <span className="text-[10px] font-medium text-slate-400 uppercase mt-1 tracking-widest block">{sub}</span>}
        </div>
      </div>
      <div className="flex items-center gap-3">{children}</div>
    </div>
  );

  return (
    <div className="min-h-screen font-jakarta pb-60 px-4 md:px-0 bg-[#F2F2F7]">
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[4500] animate-fade-in w-full max-w-sm px-6">
            <div className="p-4 rounded-full shadow-2xl flex items-center gap-3 bg-slate-900 text-white border border-white/10">
                <p className="text-[11px] font-black uppercase tracking-widest flex-1 text-center">{toast}</p>
            </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto space-y-12 pt-12">
        <header className="px-2 text-center">
          <p className="text-[10px] font-bold uppercase text-orange-500 tracking-[0.4em] mb-2">Platform Control</p>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-none uppercase">Site Settings</h1>
        </header>

        {/* TRANSACTION PROTOCOL */}
        <section className="space-y-4">
          <h3 className="px-4 text-[11px] font-black uppercase text-slate-400 tracking-[0.1em]">Transaction Protocol</h3>
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200/50 space-y-2">
            <SettingRow 
                icon="fa-credit-card" 
                color="bg-indigo-600" 
                label="Pay First Policy" 
                sub={payFirst ? "Active: All dishes enforced" : "Off: Pay later or at counter"}
                last
            >
              <div 
                onClick={handleTogglePayFirst}
                className={`w-12 h-6 rounded-full transition-all flex items-center p-1 cursor-pointer shadow-inner ${payFirst ? 'bg-indigo-600' : 'bg-slate-200'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow-lg transform transition-all ${payFirst ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </div>
            </SettingRow>
          </div>
        </section>

        {/* VISUAL IDENTITY (THEME EDITOR) */}
        <section className="space-y-4">
          <h3 className="px-4 text-[11px] font-black uppercase text-slate-400 tracking-[0.1em]">Visual Identity</h3>
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200/50">
            <SettingRow icon="fa-palette" color="bg-rose-500" label="Primary Accent">
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono font-bold text-slate-300 uppercase">{themeForm.primary_color}</span>
                    <input 
                        type="color" 
                        value={themeForm.primary_color} 
                        onChange={(e) => handleThemeChange('primary_color', e.target.value)}
                        className="w-8 h-8 rounded-lg overflow-hidden border-none p-0 cursor-pointer bg-transparent"
                    />
                </div>
            </SettingRow>
            <SettingRow icon="fa-fill-drip" color="bg-amber-400" label="Secondary Accent">
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono font-bold text-slate-300 uppercase">{themeForm.secondary_color}</span>
                    <input 
                        type="color" 
                        value={themeForm.secondary_color} 
                        onChange={(e) => handleThemeChange('secondary_color', e.target.value)}
                        className="w-8 h-8 rounded-lg overflow-hidden border-none p-0 cursor-pointer bg-transparent"
                    />
                </div>
            </SettingRow>
            <SettingRow icon="fa-wand-magic-sparkles" color="bg-purple-600" label="Menu Template" last>
                <select 
                    value={themeForm.template} 
                    onChange={(e) => handleThemeChange('template', e.target.value)}
                    className="bg-transparent text-[11px] font-black text-indigo-600 uppercase tracking-widest outline-none appearance-none cursor-pointer text-right pr-4"
                >
                    <option value="classic">Classic Minimal</option>
                    <option value="premium">Elite Premium</option>
                    <option value="modern">Modern Bold</option>
                </select>
            </SettingRow>
          </div>
        </section>

        {/* IDENTITY RECORD */}
        <section className="space-y-4">
          <h3 className="px-4 text-[11px] font-black uppercase text-slate-400 tracking-[0.1em]">Identity Record</h3>
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200/50">
            <SettingRow icon="fa-store" color="bg-slate-900" label="Store Name"><span className="text-slate-400 font-bold text-sm uppercase">{merchantData?.name || '...'}</span></SettingRow>
            <SettingRow icon="fa-envelope" color="bg-sky-500" label="Owner Contact"><span className="text-slate-400 font-medium text-sm">{session?.user?.email}</span></SettingRow>
            <SettingRow icon="fa-fingerprint" color="bg-indigo-400" label="Restaurant ID" last>
                <div 
                    onClick={() => { navigator.clipboard.writeText(restaurantId); setToast("ID Copied"); setTimeout(() => setToast(null), 2000); }}
                    className="flex items-center gap-2 cursor-pointer group"
                >
                    <span className="text-[10px] font-mono font-bold text-slate-300 uppercase group-hover:text-indigo-400 transition-colors">{restaurantId?.slice(0, 12)}...</span>
                    <i className="fa-solid fa-copy text-[10px] text-slate-200 group-hover:text-indigo-400"></i>
                </div>
            </SettingRow>
          </div>
        </section>

        {/* INFRASTRUCTURE (DATABASE) */}
        <section className="space-y-4">
          <h3 className="px-4 text-[11px] font-black uppercase text-slate-400 tracking-[0.1em]">Infrastructure</h3>
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200/50">
            <SettingRow icon="fa-database" color="bg-emerald-600" label="Database Explorer" sub="Manage raw server records" last onClick={() => { window.location.hash = '#/super-admin'; }}>
                <i className="fa-solid fa-chevron-right text-slate-200 text-xs"></i>
            </SettingRow>
          </div>
        </section>

        {/* CONTENT MANAGEMENT */}
        <section className="space-y-4">
          <h3 className="px-4 text-[11px] font-black uppercase text-slate-400 tracking-[0.1em]">Content Management</h3>
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200/50">
            <SettingRow icon="fa-circle-info" color="bg-orange-500" label="About Us Content" onClick={() => onSubTabChange?.('about')}><i className="fa-solid fa-chevron-right text-slate-200 text-xs"></i></SettingRow>
            <SettingRow icon="fa-file-contract" color="bg-slate-400" label="Terms of Service" onClick={() => onSubTabChange?.('terms')}><i className="fa-solid fa-chevron-right text-slate-200 text-xs"></i></SettingRow>
            <SettingRow icon="fa-shield-halved" color="bg-blue-500" label="Privacy Policy" last onClick={() => onSubTabChange?.('privacy')}><i className="fa-solid fa-chevron-right text-slate-200 text-xs"></i></SettingRow>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminSettings;