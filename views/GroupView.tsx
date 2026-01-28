
import React, { useState } from 'react';

const GroupView: React.FC = () => {
  const [isHosting, setIsHosting] = useState(false);
  const [sessionCode, setSessionCode] = useState('');
  const [joinCode, setJoinCode] = useState('');

  const startSession = () => {
    const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    setSessionCode(randomCode);
    setIsHosting(true);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Join my food order!',
        text: `Enter code ${sessionCode} to join my table and order together.`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(sessionCode);
      alert('Code copied to clipboard!');
    }
  };

  const notifyWaiter = () => {
    alert("Notification sent! A waiter will be with you shortly to provide your table PIN.");
  };

  return (
    <div className="animate-fade-in font-jakarta bg-white min-h-screen">
      <div className="max-w-[1000px] mx-auto px-6 py-12 md:py-24">
        
        {/* Simplified Header */}
        <header className="mb-16">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Social Dining</p>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter uppercase leading-tight mb-6">
            Group <span className="text-brand-primary">Ordering.</span>
          </h1>
          <p className="text-slate-500 text-base md:text-lg font-medium leading-relaxed max-w-xl">
            Order together in real-time. Share one basket with everyone at your table for a faster, simpler dining experience.
          </p>
        </header>

        {!isHosting ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            
            {/* Action 1: Join */}
            <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100 flex flex-col justify-between space-y-10">
              <div className="space-y-4">
                <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
                  <i className="fa-solid fa-right-to-bracket text-xl"></i>
                </div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Join a Table</h3>
                <p className="text-slate-500 text-sm font-medium">Enter the 6-digit access code provided by your host or server.</p>
              </div>

              <div className="space-y-4">
                <input 
                  type="text" 
                  maxLength={6}
                  placeholder="ENTER PIN"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="w-full bg-white border border-slate-200 rounded-2xl p-5 text-center font-black tracking-[0.4em] uppercase text-slate-800 outline-none focus:ring-4 ring-slate-100 transition-all text-xl shadow-sm"
                />
                <button 
                  disabled={joinCode.length < 4}
                  className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] shadow-xl active:scale-95 transition-all disabled:opacity-30"
                >
                  Join Group
                </button>
                
                <div className="pt-4 text-center border-t border-slate-200/50">
                   <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3">No pin yet?</p>
                   <button 
                    onClick={notifyWaiter}
                    className="flex items-center justify-center gap-3 w-full py-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase text-indigo-600 tracking-widest hover:bg-slate-50 transition-all"
                   >
                     <i className="fa-solid fa-bell"></i> Notify a Waiter
                   </button>
                </div>
              </div>
            </div>

            {/* Action 2: Host */}
            <div className="bg-slate-900 p-10 rounded-[3rem] text-white flex flex-col justify-between space-y-10 relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
              
              <div className="space-y-4 relative z-10">
                <div className="w-14 h-14 bg-brand-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-brand-primary/20">
                  <i className="fa-solid fa-crown text-xl"></i>
                </div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Host a Group</h3>
                <p className="text-slate-400 text-sm font-medium">Create a new cloud session and invite others to join your order.</p>
              </div>

              <div className="space-y-4 relative z-10">
                <button 
                  onClick={startSession}
                  className="w-full bg-white text-slate-900 py-6 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all hover:bg-slate-100"
                >
                  Start New Session
                </button>
                <div className="flex items-center gap-3 justify-center pt-2">
                   <i className="fa-solid fa-shield-halved text-slate-600 text-[10px]"></i>
                   <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">End-to-End Secure Connection</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-fade-in items-start">
            
            {/* Session ID Card */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-indigo-600 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden text-center">
                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                 <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/50 mb-4">Table Access Code</p>
                 <h2 className="text-7xl font-black tracking-tighter mb-10 leading-none">{sessionCode}</h2>
                 
                 <div className="flex justify-center -space-x-3 mb-10">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-14 h-14 rounded-2xl border-4 border-indigo-600 bg-slate-100 overflow-hidden shadow-xl">
                         <img src={`https://i.pravatar.cc/100?u=${i + 20}`} className="w-full h-full object-cover" alt="Member" />
                      </div>
                    ))}
                    <div className="w-14 h-14 rounded-2xl border-4 border-indigo-600 bg-white flex items-center justify-center text-indigo-600 text-xs font-black shadow-xl">
                       +1
                    </div>
                 </div>
                 
                 <button 
                   onClick={handleShare}
                   className="w-full bg-white text-indigo-600 py-6 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl active:scale-95 transition-all hover:bg-slate-50"
                 >
                   Share Invitation
                 </button>
              </div>
              <p className="text-center text-[9px] font-black uppercase tracking-[0.4em] text-slate-300">Invite guests to scan and enter this PIN</p>
            </div>

            {/* Member List */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl space-y-8">
                <div className="flex justify-between items-center border-b border-slate-50 pb-6">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Active Members</h4>
                  <span className="flex items-center gap-2 text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live Sync
                  </span>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl border border-slate-100">
                     <div className="flex items-center gap-4">
                        <img src="https://i.pravatar.cc/100?u=21" className="w-10 h-10 rounded-xl border border-white" alt="Self" />
                        <div>
                          <p className="text-sm font-black text-slate-800 uppercase tracking-tight leading-none mb-1">You (Host)</p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Primary User</p>
                        </div>
                     </div>
                     <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Browsing</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl border border-slate-100 opacity-60">
                     <div className="flex items-center gap-4">
                        <img src="https://i.pravatar.cc/100?u=22" className="w-10 h-10 rounded-xl border border-white" alt="Guest" />
                        <div>
                          <p className="text-sm font-black text-slate-800 uppercase tracking-tight leading-none mb-1">Alex Morgan</p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Guest Member</p>
                        </div>
                     </div>
                     <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Connected</span>
                  </div>
                </div>

                <div className="pt-6">
                   <button 
                    onClick={() => window.location.hash = '#/menu'}
                    className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] shadow-xl active:scale-95 transition-all"
                   >
                     Return to Menu
                   </button>
                </div>
              </div>

              <button 
                onClick={() => setIsHosting(false)}
                className="w-full py-4 text-[10px] font-black uppercase text-slate-300 hover:text-rose-500 transition-all tracking-[0.2em]"
              >
                End Session and Leave
              </button>
            </div>
          </div>
        )}
      </div>
      
      <footer className="py-20 border-t border-slate-50 text-center opacity-20">
         <p className="text-[10px] font-black uppercase tracking-[1em]">Secure Group Node</p>
      </footer>
    </div>
  );
};

export default GroupView;
