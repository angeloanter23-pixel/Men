
import React from 'react';

const GroupView = () => (
  <div className="p-6 animate-fade-in">
    <div className="bg-orange-500 rounded-[2.5rem] p-8 text-white mb-8 shadow-xl relative overflow-hidden">
      <h2 className="text-3xl font-black mb-2">Group Ordering</h2>
      <p className="opacity-90 text-sm mb-6 max-w-[200px]">Synchronize your meal with friends. Share a link or scan to join.</p>
      <button className="bg-white text-orange-600 px-6 py-3 rounded-2xl font-black text-sm active:scale-95 transition-all">START SESSION</button>
      <i className="fa-solid fa-users absolute -bottom-4 -right-4 text-8xl opacity-10"></i>
    </div>
    <div className="bg-white p-6 rounded-3xl border border-slate-100 flex gap-4 items-center">
      <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 font-black text-xl">1</div>
      <p className="text-sm font-bold text-slate-600">Invite friends via private link.</p>
    </div>
  </div>
);

export default GroupView;
