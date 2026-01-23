import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import * as MenuService from '../../services/menuService';

interface AdminSettingsProps {
  onLogout: () => void;
  adminCreds: any;
  setAdminCreds: React.Dispatch<React.SetStateAction<any>>;
  onImportClick?: () => void;
}

const FONTS = [
  { id: 'Plus Jakarta Sans', name: 'Modern Sans' },
  { id: 'Playfair Display', name: 'Elegant Serif' },
  { id: 'Montserrat', name: 'Clean Montserrat' },
  { id: 'Outfit', name: 'Friendly Round' },
  { id: 'Poppins', name: 'Poppins Classic' }
];

const AdminSettings: React.FC<AdminSettingsProps> = ({ onLogout, onImportClick }) => {
  const [isBiometricEnabled] = useState(
    localStorage.getItem('foodie_biometric_enrolled') === 'true'
  );
  
  const [merchantData, setMerchantData] = useState<any>(null);
  const [isLoadingMerchant, setIsLoadingMerchant] = useState(false);
  const [isEditingMerchant, setIsEditingMerchant] = useState(false);
  const [isEditingTheme, setIsEditingTheme] = useState(false);
  
  const [theme, setTheme] = useState({
    primary_color: '#FF6B00',
    secondary_color: '#FFF3E0',
    font_family: 'Plus Jakarta Sans',
    logo_url: ''
  });

  const sessionRaw = localStorage.getItem('foodie_supabase_session');
  const session = sessionRaw ? JSON.parse(sessionRaw) : null;
  const restaurantId = session?.restaurant?.id;

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

  const handleUpdateMerchant = async () => {
    if (!merchantData?.name) return alert("Please enter a name.");
    setIsLoadingMerchant(true);
    try {
      await MenuService.updateRestaurant(restaurantId, merchantData.name);
      setIsEditingMerchant(false);
      alert("Business info updated.");
    } catch (err: any) {
      alert("Failed: " + err.message);
    } finally {
      setIsLoadingMerchant(false);
    }
  };

  const handleUpdateTheme = async () => {
    setIsLoadingMerchant(true);
    try {
      await MenuService.updateRestaurantTheme(restaurantId, theme);
      setIsEditingTheme(false);
      alert("Theme saved and applied.");
      const sessionData = JSON.parse(localStorage.getItem('foodie_supabase_session') || '{}');
      if (sessionData.restaurant) {
        sessionData.restaurant.theme = theme;
        localStorage.setItem('foodie_supabase_session', JSON.stringify(sessionData));
      }
      window.location.reload();
    } catch (err: any) {
      alert("Theme update failed: " + err.message);
    } finally {
      setIsLoadingMerchant(false);
    }
  };

  return (
    <div className="p-6 space-y-8 animate-fade-in pb-32 max-w-4xl mx-auto font-['Plus_Jakarta_Sans']">
      <header>
        <h2 className="text-3xl font-black italic uppercase tracking-tighter">Site <span className="text-indigo-600">Settings</span></h2>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Customize your digital presence</p>
      </header>

      {/* Business Identity */}
      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xs font-black uppercase text-slate-300 tracking-widest">Identity</h3>
          <button 
            onClick={() => isEditingMerchant ? handleUpdateMerchant() : setIsEditingMerchant(true)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 ${isEditingMerchant ? 'bg-indigo-600' : 'bg-slate-900'} text-white`}
          >
            <i className={`fa-solid ${isEditingMerchant ? 'fa-check' : 'fa-pen'}`}></i>
          </button>
        </div>
        {merchantData && (
          <div className="space-y-4">
            {isEditingMerchant ? (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-2 italic">Official Store Name</label>
                  <input 
                    type="text" 
                    value={merchantData.name} 
                    onChange={e => setMerchantData({...merchantData, name: e.target.value})}
                    className="w-full bg-slate-50 p-5 rounded-2xl font-black text-lg outline-none border-2 border-transparent focus:border-indigo-100" 
                  />
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex items-center gap-4">
                <i className="fa-solid fa-store text-indigo-400"></i>
                <p className="font-black text-lg text-slate-800 uppercase italic">{merchantData.name}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Import/Export Backup */}
      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl flex items-center justify-between gap-6">
         <div className="space-y-1">
            <h3 className="text-xs font-black uppercase text-slate-800 tracking-tight">Data Management</h3>
            <p className="text-[10px] text-slate-400 font-medium italic">Import a .json backup file from the Product Tour wizard.</p>
         </div>
         <button 
          onClick={onImportClick}
          className="bg-indigo-50 text-indigo-600 px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
         >
           Load Configuration
         </button>
      </div>

      {/* Visual Branding Engine */}
      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl space-y-10">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xs font-black uppercase text-slate-300 tracking-widest">Brand Visuals</h3>
          <button 
            onClick={() => isEditingTheme ? handleUpdateTheme() : setIsEditingTheme(true)}
            className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${isEditingTheme ? 'bg-indigo-600 shadow-indigo-100' : 'bg-slate-900 shadow-slate-100'} text-white shadow-xl`}
          >
            {isEditingTheme ? 'Apply Design' : 'Edit Theme'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Color Palette</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[8px] font-black uppercase text-slate-400 ml-2">Primary</label>
                  <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-2xl border border-slate-100">
                    <input 
                      disabled={!isEditingTheme} 
                      type="color" 
                      value={theme.primary_color} 
                      onChange={e => setTheme({...theme, primary_color: e.target.value})}
                      className="w-10 h-10 border-none rounded-xl cursor-pointer bg-transparent" 
                    />
                    <span className="text-[10px] font-mono font-bold text-slate-600">{theme.primary_color}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[8px] font-black uppercase text-slate-400 ml-2">Secondary</label>
                  <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-2xl border border-slate-100">
                    <input 
                      disabled={!isEditingTheme} 
                      type="color" 
                      value={theme.secondary_color} 
                      onChange={e => setTheme({...theme, secondary_color: e.target.value})}
                      className="w-10 h-10 border-none rounded-xl cursor-pointer bg-transparent" 
                    />
                    <span className="text-[10px] font-mono font-bold text-slate-600">{theme.secondary_color}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2 italic">Typography</label>
              <select 
                disabled={!isEditingTheme}
                value={theme.font_family}
                onChange={e => setTheme({...theme, font_family: e.target.value})}
                className="w-full bg-slate-50 p-4 rounded-2xl font-bold text-sm outline-none border-2 border-transparent focus:border-indigo-100 cursor-pointer"
              >
                {FONTS.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2 italic">Direct Logo URL</label>
              <input 
                disabled={!isEditingTheme}
                type="text" 
                placeholder="https://your-logo-path.png"
                value={theme.logo_url}
                onChange={e => setTheme({...theme, logo_url: e.target.value})}
                className="w-full bg-slate-50 p-4 rounded-2xl text-xs font-bold outline-none border-2 border-transparent focus:border-indigo-100"
              />
            </div>
          </div>

          <div className="bg-slate-50 rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center border border-slate-100 shadow-inner group">
             <div 
               className="w-16 h-16 rounded-full flex items-center justify-center text-white mb-4 shadow-xl transition-all group-hover:scale-110"
               style={{ backgroundColor: theme.primary_color }}
             >
                <i className="fa-solid fa-magic-wand-sparkles text-xl"></i>
             </div>
             <h4 className="text-xl font-black uppercase italic tracking-tighter mb-2" style={{ fontFamily: theme.font_family }}>Preview Header</h4>
             <p className="text-xs text-slate-500 font-medium mb-6 italic">Visual harmony check.</p>
             <div 
               className="px-6 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest border transition-all"
               style={{ borderColor: theme.primary_color, color: theme.primary_color, backgroundColor: theme.secondary_color }}
             >
                Sample Button
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
          <h3 className="text-xs font-black uppercase text-slate-300 tracking-widest">Login Security</h3>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-3">
              <i className="fa-solid fa-fingerprint text-indigo-600"></i>
              <span className="text-[10px] font-black uppercase text-slate-700">Biometrics</span>
            </div>
            <span className={`text-[8px] font-black px-2 py-1 rounded-lg uppercase ${isBiometricEnabled ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
              {isBiometricEnabled ? 'Active' : 'Offline'}
            </span>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-center">
            <button onClick={onLogout} className="w-full py-4 text-[10px] font-black uppercase text-rose-500 hover:bg-rose-50 rounded-2xl transition-all border border-rose-100">Sign Out of Terminal</button>
        </div>
      </div>

      {isLoadingMerchant && (
        <div className="fixed inset-0 bg-white/50 backdrop-blur-[2px] z-[100] flex items-center justify-center pointer-events-none">
           <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin shadow-xl"></div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;