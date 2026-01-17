import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface AdminSettingsProps {
  onLogout: () => void;
  adminCreds: any;
  setAdminCreds: React.Dispatch<React.SetStateAction<any>>;
}

const AdminSettings: React.FC<AdminSettingsProps> = ({ onLogout, adminCreds, setAdminCreds }) => {
  const [email, setEmail] = useState(adminCreds.email);
  const [password, setPassword] = useState(adminCreds.password);
  const [isEditing, setIsEditing] = useState(false);
  const [isBiometricEnrolling, setIsBiometricEnrolling] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(
    localStorage.getItem('foodie_biometric_enrolled') === 'true'
  );
  
  // Merchant Data States
  const [merchantData, setMerchantData] = useState<any>(null);
  const [isLoadingMerchant, setIsLoadingMerchant] = useState(false);
  const [isEditingMerchant, setIsEditingMerchant] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get Restaurant ID from Session
  const sessionRaw = localStorage.getItem('foodie_supabase_session');
  const session = sessionRaw ? JSON.parse(sessionRaw) : null;
  const restaurantId = session?.restaurant?.id;

  useEffect(() => {
    // Robust check for valid UUID format. 
    // Specifically preventing the "undefined" string error.
    if (restaurantId && typeof restaurantId === 'string' && restaurantId !== "undefined" && restaurantId !== "null" && restaurantId.length > 5) {
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
      console.error("Settings: Failed to fetch merchant data:", err.message);
    } finally {
      setIsLoadingMerchant(false);
    }
  };

  const handleUpdateMerchant = async () => {
    if (!merchantData?.name) return alert("Business Name is required.");
    if (!restaurantId || restaurantId === "undefined") return;
    setIsLoadingMerchant(true);
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({ name: merchantData.name })
        .eq('id', restaurantId);

      if (error) throw error;
      setIsEditingMerchant(false);
      alert("Business profile synced successfully.");
      
      // Update local session to reflect change in header
      if (session) {
        const updatedSession = { ...session, restaurant: { ...session.restaurant, name: merchantData.name } };
        localStorage.setItem('foodie_supabase_session', JSON.stringify(updatedSession));
      }
    } catch (err: any) {
      alert("Sync failed: " + err.message);
    } finally {
      setIsLoadingMerchant(false);
    }
  };

  const handleSaveAuth = () => {
    if (!email || !password) return alert("Fields cannot be empty.");
    setAdminCreds({ email, password });
    setIsEditing(false);
    alert('Credentials updated successfully!');
  };

  const handleExportAll = () => {
    const backup = {
      menu: JSON.parse(localStorage.getItem('foodie_menu_items') || '[]'),
      categories: JSON.parse(localStorage.getItem('foodie_categories') || '[]'),
      feedbacks: JSON.parse(localStorage.getItem('foodie_feedbacks') || '[]'),
      sales: JSON.parse(localStorage.getItem('foodie_sales_history') || '[]'),
      admin: JSON.parse(localStorage.getItem('foodie_admin_creds') || '{}'),
      businessName: localStorage.getItem('foodie_business_name') || ''
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `foodie_full_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleImportAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const backup = JSON.parse(event.target?.result as string);
        if (confirm("This will overwrite your current local data. Continue?")) {
          if (backup.menu) localStorage.setItem('foodie_menu_items', JSON.stringify(backup.menu));
          if (backup.categories) localStorage.setItem('foodie_categories', JSON.stringify(backup.categories));
          if (backup.feedbacks) localStorage.setItem('foodie_feedbacks', JSON.stringify(backup.feedbacks));
          if (backup.sales) localStorage.setItem('foodie_sales_history', JSON.stringify(backup.sales));
          if (backup.admin) localStorage.setItem('foodie_admin_creds', JSON.stringify(backup.admin));
          if (backup.businessName) localStorage.setItem('foodie_business_name', backup.businessName);
          alert("Restore successful! Reloading application...");
          window.location.reload();
        }
      } catch (err) {
        alert("Invalid backup file.");
      }
    };
    reader.readAsText(file);
  };

  const enrollBiometric = () => {
    setIsBiometricEnrolling(true);
    setTimeout(() => {
      localStorage.setItem('foodie_biometric_enrolled', 'true');
      setIsBiometricEnabled(true);
      setIsBiometricEnrolling(false);
      alert('Biometric Identity Secured. You can now login with fingerprint.');
    }, 1500);
  };

  const removeBiometric = () => {
    if (confirm('Remove biometric access for this device?')) {
      localStorage.removeItem('foodie_biometric_enrolled');
      setIsBiometricEnabled(false);
    }
  };

  return (
    <div className="p-6 space-y-8 animate-fade-in pb-32 max-w-4xl mx-auto">
      <header className="px-2 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-tight">SYSTEM<span className="text-indigo-600">CONFIG</span></h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 opacity-70">Access & Enterprise Management</p>
        </div>
        <button onClick={fetchMerchantData} className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all border border-slate-200">
          <i className={`fa-solid fa-rotate ${isLoadingMerchant ? 'animate-spin' : ''}`}></i>
        </button>
      </header>

      {/* Merchant Data Terminal Section */}
      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl relative overflow-hidden group">
        <div className="flex justify-between items-center mb-10">
          <div className="space-y-1">
             <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Business Identity</h3>
             <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Database Node: {restaurantId?.slice(0,8) || 'N/A'}</p>
          </div>
          <button 
            onClick={() => isEditingMerchant ? handleUpdateMerchant() : setIsEditingMerchant(true)} 
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg active:scale-90 ${isEditingMerchant ? 'bg-emerald-500 text-white shadow-emerald-100' : 'bg-slate-900 text-white shadow-slate-200'}`}
          >
            {isLoadingMerchant ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className={`fa-solid ${isEditingMerchant ? 'fa-check' : 'fa-pen-to-square'}`}></i>}
          </button>
        </div>

        {merchantData ? (
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-3">
              <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-4 italic">Merchant Designation (Entity Name)</label>
              {isEditingMerchant ? (
                <input 
                  type="text" 
                  value={merchantData.name} 
                  onChange={e => setMerchantData({...merchantData, name: e.target.value})} 
                  className="w-full bg-slate-50 p-5 rounded-[2rem] font-black text-lg italic outline-none ring-2 ring-indigo-500/5 focus:ring-indigo-500/20 transition-all border-none" 
                />
              ) : (
                <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 flex items-center gap-4">
                  <i className="fa-solid fa-building-circle-check text-indigo-400"></i>
                  <p className="font-black text-lg text-slate-800 uppercase italic tracking-tighter">{merchantData.name}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div className="space-y-3">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-4 italic">Global Resource UUID</label>
                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                     <p className="font-mono text-[10px] text-slate-400 truncate">{merchantData.id}</p>
                  </div>
               </div>
               <div className="space-y-3">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-4 italic">Operational Status</label>
                  <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex items-center gap-3">
                     <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                     <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Active Node</p>
                  </div>
               </div>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center">
             <i className="fa-solid fa-database text-slate-100 text-4xl mb-4"></i>
             <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Syncing with remote context...</p>
          </div>
        )}
        
        {isEditingMerchant && (
          <button onClick={() => { setIsEditingMerchant(false); fetchMerchantData(); }} className="w-full mt-6 py-4 text-[10px] font-black uppercase text-slate-400 hover:text-rose-500 transition-colors">Discard Sync</button>
        )}
      </div>

      {/* Database Storage Section */}
      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Local Cache Management</h3>
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={handleExportAll}
            className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl flex flex-col items-center gap-2 border border-indigo-100 hover:bg-indigo-100 transition-colors"
          >
            <i className="fa-solid fa-download text-lg"></i>
            <span className="text-[9px] font-black uppercase tracking-widest">Export Backup</span>
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-4 bg-slate-50 text-slate-600 rounded-2xl flex flex-col items-center gap-2 border border-slate-100 hover:bg-slate-100 transition-colors"
          >
            <i className="fa-solid fa-upload text-lg"></i>
            <span className="text-[9px] font-black uppercase tracking-widest">Import Cache</span>
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImportAll} 
            className="hidden" 
            accept=".json" 
          />
        </div>
      </div>

      {/* Admin Auth Section */}
      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative">
        <div className="flex justify-between items-center mb-10">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Admin Authentication</h3>
          <button 
            onClick={() => isEditing ? handleSaveAuth() : setIsEditing(true)} 
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg active:scale-90 ${isEditing ? 'bg-emerald-500 text-white shadow-emerald-100' : 'bg-slate-900 text-white shadow-slate-200'}`}
          >
            <i className={`fa-solid ${isEditing ? 'fa-check' : 'fa-pen-to-square'}`}></i>
          </button>
        </div>

        <div className="space-y-8">
          <div className="space-y-3">
            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-4 italic">Login Identifier</label>
            {isEditing ? (
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                className="w-full bg-slate-50 p-5 rounded-[2rem] font-bold text-sm outline-none ring-2 ring-indigo-500/5 focus:ring-indigo-500/20 transition-all border-none" 
              />
            ) : (
              <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 flex items-center gap-4">
                <i className="fa-solid fa-envelope text-indigo-400"></i>
                <p className="font-bold text-sm text-slate-700">{email}</p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-4 italic">Security Key</label>
            {isEditing ? (
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className="w-full bg-slate-50 p-5 rounded-[2rem] font-bold text-sm outline-none ring-2 ring-indigo-500/5 focus:ring-indigo-500/20 transition-all border-none" 
                placeholder="New Password"
              />
            ) : (
              <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 flex items-center gap-4">
                <i className="fa-solid fa-lock text-indigo-400"></i>
                <p className="font-bold text-sm text-slate-400 tracking-[0.3em]">••••••••••••</p>
              </div>
            )}
          </div>
        </div>

        {isEditing && (
          <button onClick={() => { setEmail(adminCreds.email); setPassword(adminCreds.password); setIsEditing(false); }} className="w-full mt-6 py-4 text-[10px] font-black uppercase text-slate-400 hover:text-rose-500 transition-colors">Discard Credentials Update</button>
        )}
      </div>

      {/* Biometric Enrollment Section */}
      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 mb-8">Security & Biometrics</h3>
        <div className="space-y-6">
          <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 group">
            <div className="flex items-center gap-4">
               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isBiometricEnabled ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-500'}`}>
                 <i className="fa-solid fa-fingerprint text-sm"></i>
               </div>
               <div>
                  <p className="text-xs font-black text-slate-800 uppercase tracking-widest">Fingerprint ID</p>
                  <p className="text-[9px] font-bold text-slate-400 mt-0.5">{isBiometricEnabled ? 'Linked to this hardware' : 'Hardware ID Enrollment'}</p>
               </div>
            </div>
            {isBiometricEnabled ? (
              <button onClick={removeBiometric} className="text-[9px] font-black uppercase text-rose-500 hover:underline">Revoke Access</button>
            ) : (
              <button 
                onClick={enrollBiometric} 
                disabled={isBiometricEnrolling}
                className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-[9px] font-black uppercase shadow-lg shadow-indigo-100 active:scale-95 transition-all"
              >
                {isBiometricEnrolling ? <i className="fa-solid fa-circle-notch animate-spin"></i> : 'Enroll Device'}
              </button>
            )}
          </div>
        </div>
      </div>

      <button onClick={onLogout} className="w-full mt-4 p-6 bg-rose-50 text-rose-500 font-black text-[11px] uppercase tracking-[0.3em] rounded-[2.5rem] border border-rose-100 active:scale-95 transition-all shadow-sm hover:bg-rose-500 hover:text-white group">
        Terminate Admin Session
        <i className="fa-solid fa-right-from-bracket ml-3 transition-transform group-hover:translate-x-1"></i>
      </button>
    </div>
  );
};

export default AdminSettings;