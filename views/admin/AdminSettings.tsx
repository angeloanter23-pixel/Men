
import React from 'react';

interface AdminSettingsProps {
  onLogout: () => void;
}

const AdminSettings: React.FC<AdminSettingsProps> = ({ onLogout }) => {
  return (
    <div className="p-5 space-y-4 animate-fade-in">
      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-8">Store Config</h3>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-800">Online Ordering</p>
              <p className="text-[10px] text-slate-400">Accept orders through the app</p>
            </div>
            <div className="w-10 h-6 bg-green-500 rounded-full relative"><span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></span></div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-800">Auto-Cooking</p>
              <p className="text-[10px] text-slate-400">Instantly move orders to kitchen</p>
            </div>
            <div className="w-10 h-6 bg-slate-200 rounded-full relative"><span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"></span></div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-800">Push Notifications</p>
              <p className="text-[10px] text-slate-400">Alert kitchen on new orders</p>
            </div>
            <div className="w-10 h-6 bg-green-500 rounded-full relative"><span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></span></div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-2">
        <button className="w-full text-left p-4 hover:bg-slate-50 rounded-2xl transition flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">Printer Settings</span>
          <i className="fa-solid fa-chevron-right text-slate-300"></i>
        </button>
        <button className="w-full text-left p-4 hover:bg-slate-50 rounded-2xl transition flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">Payment Gateway</span>
          <i className="fa-solid fa-chevron-right text-slate-300"></i>
        </button>
        <button className="w-full text-left p-4 hover:bg-slate-50 rounded-2xl transition flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">Backup Data</span>
          <i className="fa-solid fa-chevron-right text-slate-300"></i>
        </button>
      </div>

      <button onClick={onLogout} className="w-full mt-8 p-5 text-rose-500 font-black text-[10px] uppercase tracking-[0.2em] bg-rose-50 rounded-3xl active:scale-95 transition-all">
        Logout Account
      </button>
    </div>
  );
};

export default AdminSettings;
