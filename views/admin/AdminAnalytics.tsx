
import React from 'react';

const AdminAnalytics: React.FC = () => {
  return (
    <div className="p-5 space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm text-center">
          <p className="text-[9px] font-black uppercase text-slate-400 mb-2">Total Sales</p>
          <p className="text-2xl font-black text-slate-800">₱42.5k</p>
          <span className="text-[8px] font-bold text-green-500">+12% vs last week</span>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm text-center">
          <p className="text-[9px] font-black uppercase text-slate-400 mb-2">Total Orders</p>
          <p className="text-2xl font-black text-slate-800">1,204</p>
          <span className="text-[8px] font-bold text-indigo-500">Normal traffic</span>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Sales Performance</h3>
        <div className="h-40 flex items-end justify-between gap-2">
          {[40, 60, 30, 80, 50, 90, 70].map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full bg-slate-100 rounded-lg relative overflow-hidden h-32">
                <div style={{ height: `${h}%` }} className="absolute bottom-0 w-full bg-indigo-500 rounded-t-lg transition-all duration-1000"></div>
              </div>
              <span className="text-[8px] font-black text-slate-300 uppercase">Day {i+1}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-900 p-8 rounded-[3rem] text-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xs font-black uppercase tracking-widest opacity-50">Top Products</h3>
          <i className="fa-solid fa-crown text-amber-400"></i>
        </div>
        <div className="space-y-4">
          {['Chicken Adobo', 'Wagyu Burger', 'Spanish Latte'].map((item, i) => (
            <div key={i} className="flex justify-between items-center">
              <span className="text-xs font-bold">{item}</span>
              <span className="text-[10px] font-black text-indigo-400">{(100 - i * 15)}% Popularity</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
