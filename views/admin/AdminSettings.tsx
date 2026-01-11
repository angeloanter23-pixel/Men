
import React, { useState, useRef } from 'react';

interface AdminSettingsProps {
  onLogout: () => void;
  adminCreds: any;
  setAdminCreds: React.Dispatch<React.SetStateAction<any>>;
}

const AdminSettings: React.FC<AdminSettingsProps> = ({ onLogout, adminCreds, setAdminCreds }) => {
  const [email, setEmail] = useState(adminCreds.email);
  const [password, setPassword] = useState(adminCreds.password);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
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

  return (
    <div className="p-6 space-y-8 animate-fade-in pb-32">
      <header className="px-2">
        <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-tight">SYSTEM<span className="text-indigo-600">CONFIG</span></h2>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 opacity-70">Access & Security Management</p>
      </header>

      {/* Database Management Section */}
      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Storage Management</h3>
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={handleExportAll}
            className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl flex flex-col items-center gap-2 border border-indigo-100 hover:bg-indigo-100 transition-colors"
          >
            <i className="fa-solid fa-download text-lg"></i>
            <span className="text-[9px] font-black uppercase tracking-widest">Backup All</span>
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-4 bg-slate-50 text-slate-600 rounded-2xl flex flex-col items-center gap-2 border border-slate-100 hover:bg-slate-100 transition-colors"
          >
            <i className="fa-solid fa-upload text-lg"></i>
            <span className="text-[9px] font-black uppercase tracking-widest">Restore</span>
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

      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative">
        <div className="flex justify-between items-center mb-10">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Admin Authentication</h3>
          <button 
            onClick={() => isEditing ? handleSave() : setIsEditing(true)} 
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg active:scale-90 ${isEditing ? 'bg-emerald-500 text-white shadow-emerald-100' : 'bg-slate-900 text-white shadow-slate-200'}`}
          >
            <i className={`fa-solid ${isEditing ? 'fa-check' : 'fa-pen-to-square'}`}></i>
          </button>
        </div>

        <div className="space-y-8">
          <div className="space-y-3">
            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-4">Login Identifier</label>
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
            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-4">Security Key</label>
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
          <button onClick={() => { setEmail(adminCreds.email); setPassword(adminCreds.password); setIsEditing(false); }} className="w-full mt-6 py-4 text-[10px] font-black uppercase text-slate-400 hover:text-rose-500 transition-colors">Discard Changes</button>
        )}
      </div>

      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 mb-8">Service Parameters</h3>
        <div className="space-y-8">
          <div className="flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 transition-all group-hover:bg-indigo-600 group-hover:text-white">
                <i className="fa-solid fa-wifi text-sm"></i>
              </div>
              <div><p className="text-xs font-black text-slate-800 uppercase tracking-widest">Local-Only Sync</p><p className="text-[9px] font-bold text-slate-400 mt-0.5">Strictly offline mode</p></div>
            </div>
            <div className="w-14 h-8 bg-emerald-500 rounded-full relative shadow-inner"><span className="absolute right-1 top-1 w-6 h-6 bg-white rounded-full shadow-md"></span></div>
          </div>
          
          <div className="flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 transition-all group-hover:bg-orange-600 group-hover:text-white">
                <i className="fa-solid fa-fire-burner text-sm"></i>
              </div>
              <div><p className="text-xs font-black text-slate-800 uppercase tracking-widest">Smart Kitchen</p><p className="text-[9px] font-bold text-slate-400 mt-0.5">Auto-routing active</p></div>
            </div>
            <div className="w-14 h-8 bg-slate-200 rounded-full relative shadow-inner"><span className="absolute left-1 top-1 w-6 h-6 bg-white rounded-full shadow-md"></span></div>
          </div>
        </div>
      </div>

      <button onClick={onLogout} className="w-full mt-4 p-6 bg-rose-50 text-rose-500 font-black text-[11px] uppercase tracking-[0.3em] rounded-[2.5rem] border border-rose-100 active:scale-95 transition-all shadow-sm hover:bg-rose-500 hover:text-white group">
        Terminate Session
        <i className="fa-solid fa-right-from-bracket ml-3 transition-transform group-hover:translate-x-1"></i>
      </button>
    </div>
  );
};

export default AdminSettings;
