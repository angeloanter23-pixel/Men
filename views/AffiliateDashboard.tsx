import React, { useState, useEffect } from 'react';

const AffiliateDashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [isCopied, setIsCopied] = useState(false);
  const referralLink = "https://mymenu.asia/ref/p992x";

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] font-jakarta animate-fade-in flex flex-col">
      {/* Dashboard Nav */}
      <header className="bg-white/80 backdrop-blur-2xl sticky top-0 z-50 border-b border-slate-200/50 px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
            <span className="text-xs font-bold">M</span>
          </div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900 uppercase">Partner Hub</h2>
        </div>
        <button onClick={onLogout} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all border border-slate-100 shadow-sm">
          <i className="fa-solid fa-power-off text-sm"></i>
        </button>
      </header>

      <main className="flex-1 max-w-[1200px] w-full mx-auto p-6 md:p-10 space-y-8 pb-32">
        
        {/* WELCOME SECTION */}
        <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-1">
             <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-[0.4em]">Active Partner Status</p>
             <h1 className="text-3xl font-bold text-slate-900 uppercase">Partner Console</h1>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-full">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Network Active</span>
          </div>
        </section>

        {/* CRM STATS GRID */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <div className="bg-white p-8 rounded-[2.5rem] border border-white shadow-sm flex flex-col justify-between h-44 group hover:shadow-xl transition-all">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Earnings</p>
              <div>
                <p className="text-4xl font-black text-slate-900 tracking-tighter tabular-nums">₱12,450.00</p>
                <div className="flex items-center gap-1.5 mt-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                   <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Cleared for payout</span>
                </div>
              </div>
           </div>
           
           <div className="bg-white p-8 rounded-[2.5rem] border border-white shadow-sm flex flex-col justify-between h-44 group hover:shadow-xl transition-all">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Number of Sales</p>
              <div>
                <p className="text-4xl font-black text-slate-900 tracking-tighter tabular-nums">18</p>
                <div className="flex items-center gap-1.5 mt-2">
                   <i className="fa-solid fa-store text-[9px] text-slate-200"></i>
                   <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Unique venues</span>
                </div>
              </div>
           </div>

           <div className="bg-white p-8 rounded-[2.5rem] border border-white shadow-sm flex flex-col justify-between h-44 group hover:shadow-xl transition-all">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Commission Rate</p>
              <div>
                <p className="text-4xl font-black text-indigo-600 tracking-tighter tabular-nums">20.0%</p>
                <div className="flex items-center gap-1.5 mt-2">
                   <i className="fa-solid fa-gem text-[9px] text-indigo-100"></i>
                   <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Platinum tier</span>
                </div>
              </div>
           </div>

           <div className="bg-white p-8 rounded-[2.5rem] border border-white shadow-sm flex flex-col justify-between h-44 group hover:shadow-xl transition-all">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Withdrawals</p>
              <div>
                <p className="text-4xl font-black text-slate-900 tracking-tighter tabular-nums">₱4,500</p>
                <div className="flex items-center gap-1.5 mt-2">
                   <i className="fa-solid fa-clock-rotate-left text-[9px] text-slate-200"></i>
                   <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Last: 2 days ago</span>
                </div>
              </div>
           </div>
        </section>

        {/* MY REFERRAL LINK */}
        <section className="bg-white p-8 md:p-12 rounded-[3rem] border border-white shadow-sm space-y-8">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-1">
                 <h3 className="text-xl font-bold text-slate-900 uppercase">My Referral Link</h3>
                 <p className="text-slate-400 text-sm font-medium">Use this link to refer restaurants and earn 20% commission.</p>
              </div>
              <button 
                onClick={() => alert("Withdrawal request sent. We will verify your available balance of ₱12,450.00.")}
                className="px-8 py-4 bg-slate-900 text-white rounded-full font-bold uppercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all w-full md:w-auto"
              >
                Withdraw Earnings
              </button>
           </div>
           
           <div className="relative group max-w-2xl">
              <input 
                readOnly 
                value={referralLink} 
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-6 text-indigo-600 font-bold outline-none shadow-inner"
              />
              <button 
                onClick={copyLink}
                className={`absolute right-3 top-1/2 -translate-y-1/2 px-6 py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all ${isCopied ? 'bg-emerald-500 text-white' : 'bg-white text-slate-900 border border-slate-200 shadow-sm'}`}
              >
                {isCopied ? 'Copied' : 'Copy Link'}
              </button>
           </div>
        </section>

        {/* RECENT COMMISSIONS */}
        <section className="space-y-4">
           <h3 className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em]">Sales Performance</h3>
           <div className="bg-white rounded-[2.5rem] border border-white overflow-hidden shadow-sm divide-y divide-slate-50">
              {[
                { name: "Coffee Loft Uptown", status: "Active", earned: "₱259.80", date: "Today" },
                { name: "Blue Steakhouse", status: "Processing", earned: "₱259.80", date: "Yesterday" },
                { name: "Pasta Express HQ", status: "Active", earned: "₱259.80", date: "2 days ago" },
                { name: "Zest Juice Bar", status: "Active", earned: "₱259.80", date: "Jan 12" }
              ].map((sale, i) => (
                <div key={i} className="flex items-center justify-between p-6 hover:bg-slate-50 transition-colors">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400"><i className="fa-solid fa-store text-xs"></i></div>
                      <div>
                        <p className="text-[15px] font-bold text-slate-900 uppercase tracking-tight">{sale.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">{sale.date}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-[14px] font-bold text-slate-900 tabular-nums">+{sale.earned}</p>
                      <p className={`text-[9px] font-bold uppercase tracking-widest ${sale.status === 'Active' ? 'text-emerald-500' : 'text-amber-500'}`}>{sale.status}</p>
                   </div>
                </div>
              ))}
           </div>
        </section>

      </main>

      <footer className="p-10 text-center opacity-30 mt-auto">
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.5em]">CRM Console Partner Branch v2.0</p>
      </footer>
    </div>
  );
};

export default AffiliateDashboard;