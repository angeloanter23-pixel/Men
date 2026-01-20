
import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface AdminSettingsProps {
  onLogout: () => void;
  adminCreds: any;
  setAdminCreds: React.Dispatch<React.SetStateAction<any>>;
}

const THEMES = [
  { id: 'classic', name: 'Sharp Orange', color: 'bg-orange-500' },
  { id: 'midnight', name: 'Deep Indigo', color: 'bg-indigo-600' },
  { id: 'forest', name: 'Sage Green', color: 'bg-emerald-600' },
  { id: 'velvet', name: 'Ruby Wine', color: 'bg-rose-600' },
  { id: 'noir', name: 'Minimalist', color: 'bg-slate-900' }
];

const FONTS = [
  { id: 'font-jakarta', name: 'Modern Sans', family: "'Plus Jakarta Sans', sans-serif" },
  { id: 'font-playfair', name: 'Elegant Serif', family: "'Playfair Display', serif" },
  { id: 'font-montserrat', name: 'Clean Montserrat', family: "'Montserrat', sans-serif" },
  { id: 'font-outfit', name: 'Friendly Round', family: "'Outfit', sans-serif" }
];

const AdminSettings: React.FC<AdminSettingsProps> = ({ onLogout, adminCreds, setAdminCreds }) => {
  const [email, setEmail] = useState(adminCreds.email);
  const [password, setPassword] = useState(adminCreds.password);
  const [isEditing, setIsEditing] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(
    localStorage.getItem('foodie_biometric_enrolled') === 'true'
  );
  
  // Design States
  const [selectedTheme, setSelectedTheme] = useState(localStorage.getItem('foodie_theme') || 'classic');
  const [selectedFont, setSelectedFont] = useState(localStorage.getItem('foodie_font') || 'font-jakarta');

  // Merchant Data States
  const [merchantData, setMerchantData] = useState<any>(null);
  const [isLoadingMerchant, setIsLoadingMerchant] = useState(false);
  const [isEditingMerchant, setIsEditingMerchant] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    } catch (err: any) {
      console.error("Settings error:", err.message);
    } finally {
      setIsLoadingMerchant(false);
    }
  };

  const handleUpdateTheme = (themeId: string) => {
    setSelectedTheme(themeId);
    localStorage.setItem('foodie_theme', themeId);
  };

  const handleUpdateFont = (fontId: string) => {
    setSelectedFont(fontId);
    localStorage.setItem('foodie_font', fontId);
  };

  const handleUpdateMerchant = async () => {
    if (!merchantData?.name) return alert("Please enter a name.");
    setIsLoadingMerchant(true);
    try {
      await supabase.from('restaurants').update({ name: merchantData.name }).eq('id', restaurantId);
      setIsEditingMerchant(false);
      alert("Updated successfully.");
    } catch (err: any) {
      alert("Failed: " + err.message);
    } finally {
      setIsLoadingMerchant(false);
    }
  };

  const handleExportAll = () => {
    const backup = {
      menu: JSON.parse(localStorage.getItem('foodie_menu_items') || '[]'),
      design: { theme: selectedTheme, font: selectedFont }
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup.json`;
    a.click();
  };

  return (
    <div className="p-6 space-y-8 animate-fade-in pb-32 max-w-4xl mx-auto font-['Plus_Jakarta_Sans']">
      <header>
        <h2 className="text-3xl font-black italic uppercase tracking-tighter">Site <span className="text-indigo-600">Settings</span></h2>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Manage your look and access</p>
      </header>

      {/* Business Name Section */}
      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xs font-black uppercase text-slate-300 tracking-widest">Business Name</h3>
          <button 
            onClick={() => isEditingMerchant ? handleUpdateMerchant() : setIsEditingMerchant(true)}
            className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center transition-all active:scale-90"
          >
            <i className={`fa-solid ${isEditingMerchant ? 'fa-check' : 'fa-pen'}`}></i>
          </button>
        </div>
        {merchantData && (
          <div className="space-y-4">
            {isEditingMerchant ? (
              <input 
                type="text" 
                value={merchantData.name} 
                onChange={e => setMerchantData({...merchantData, name: e.target.value})}
                className="w-full bg-slate-50 p-5 rounded-2xl font-black text-lg outline-none" 
              />
            ) : (
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex items-center gap-4">
                <i className="fa-solid fa-store text-indigo-400"></i>
                <p className="font-black text-lg text-slate-800 uppercase italic">{merchantData.name}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* NEW: Design & Branding Section */}
      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl space-y-10">
        <div>
          <h3 className="text-xs font-black uppercase text-slate-300 tracking-widest mb-6">App Colors</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {THEMES.map(theme => (
              <button 
                key={theme.id}
                onClick={() => handleUpdateTheme(theme.id)}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${selectedTheme === theme.id ? 'bg-indigo-50 border-indigo-600 ring-2 ring-indigo-50' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full ${theme.color} border-2 border-white shadow-sm`}></div>
                  <span className="text-xs font-black text-slate-700 uppercase italic">{theme.name}</span>
                </div>
                {selectedTheme === theme.id && <i className="fa-solid fa-check text-indigo-600 text-xs"></i>}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-black uppercase text-slate-300 tracking-widest mb-6">Text Style (Fonts)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FONTS.map(font => (
              <button 
                key={font.id}
                onClick={() => handleUpdateFont(font.id)}
                className={`p-5 rounded-2xl border text-left transition-all ${selectedFont === font.id ? 'bg-indigo-50 border-indigo-600' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}
                style={{ fontFamily: font.family }}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-black text-slate-800">{font.name}</span>
                  {selectedFont === font.id && <i className="fa-solid fa-check text-indigo-600 text-xs"></i>}
                </div>
                <p className="text-[10px] text-slate-400">Quick brown fox jumps over the lazy dog.</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cache & Security */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
          <h3 className="text-xs font-black uppercase text-slate-300 tracking-widest">Backups</h3>
          <button onClick={handleExportAll} className="w-full p-4 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest transition-all">
            <i className="fa-solid fa-download"></i> Save Data to Phone
          </button>
        </div>

        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
          <h3 className="text-xs font-black uppercase text-slate-300 tracking-widest">Login Security</h3>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-3">
              <i className="fa-solid fa-fingerprint text-indigo-600"></i>
              <span className="text-[10px] font-black uppercase text-slate-700">Fingerprint</span>
            </div>
            <span className={`text-[8px] font-black px-2 py-1 rounded-lg uppercase ${isBiometricEnabled ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
              {isBiometricEnabled ? 'Enabled' : 'Not Set'}
            </span>
          </div>
        </div>
      </div>

      <button onClick={onLogout} className="w-full p-6 bg-rose-50 text-rose-500 font-black text-[10px] uppercase tracking-[0.3em] rounded-[2.5rem] border border-rose-100 active:scale-95 transition-all hover:bg-rose-500 hover:text-white">
        Logout from Admin Panel
      </button>
    </div>
  );
};

export default AdminSettings;
