
import React, { useState } from 'react';

const GroupView: React.FC = () => {
  const [isHosting, setIsHosting] = useState(false);
  const [sessionCode, setSessionCode] = useState('');
  const [joinCode, setJoinCode] = useState('');

  const startSession = () => {
    // Mock generating a unique session ID
    const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    setSessionCode(randomCode);
    setIsHosting(true);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Join my Foodie Group Order!',
        text: `Let's order together! Use code ${sessionCode} to join my table.`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(sessionCode);
      alert('Code copied to clipboard!');
    }
  };

  return (
    <div className="animate-fade-in font-jakarta bg-slate-50/30 min-h-screen">
      <div className="max-w-[1200px] mx-auto px-6 py-10 md:py-20">
        
        {/* Responsive Header */}
        <header className="mb-12 md:mb-20">
          <p className="text-[10px] md:text-[12px] font-black text-brand-primary uppercase tracking-[0.5em] mb-3 italic">Collective Dining Ecosystem</p>
          <h1 className="text-5xl md:text-8xl font-black text-slate-900 italic tracking-tighter uppercase leading-none mb-6">
            Group <span className="text-brand-primary">Hub.</span>
          </h1>
          <div className="max-w-2xl bg-brand-secondary/30 p-6 rounded-[2.5rem] border border-brand-primary/10">
             <p className="text-brand-primary text-sm md:text-base font-black uppercase tracking-widest leading-relaxed italic">
                Synchronized ordering for the modern table. <br className="hidden md:block"/>
                <span className="text-slate-900 opacity-60">Join forces to curate the ultimate feast.</span>
             </p>
          </div>
        </header>

        {!isHosting ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
            
            {/* Left Column: Actions */}
            <div className="space-y-8">
              <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm md:p-10">
                <h4 className="text-[11px] font-black uppercase text-brand-primary tracking-[0.3em] mb-4 italic">Session Protocol</h4>
                <p className="text-sm md:text-lg text-slate-600 leading-relaxed font-medium">
                  Dining is better together. Our Group Hub allows everyone at the table to contribute to a single cart in real-time.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <button 
                  onClick={startSession}
                  className="bg-slate-900 p-10 md:p-14 rounded-[4rem] text-left relative overflow-hidden group shadow-2xl active:scale-[0.98] transition-all"
                >
                  <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full translate-x-12 -translate-y-12 group-hover:scale-110 transition-transform duration-1000"></div>
                  <div className="relative z-10">
                    <div className="w-14 h-14 md:w-16 md:h-16 bg-brand-primary text-white rounded-3xl flex items-center justify-center mb-8 shadow-2xl shadow-brand-primary/20">
                      <i className="fa-solid fa-crown text-xl"></i>
                    </div>
                    <h3 className="text-3xl md:text-4xl font-black text-white uppercase italic tracking-tight mb-3">Host a Table</h3>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-[240px]">Initialize a new cloud session and invite your entourage.</p>
                  </div>
                  <i className="fa-solid fa-arrow-right absolute bottom-10 right-10 text-white/10 text-4xl group-hover:text-white/40 group-hover:translate-x-2 transition-all"></i>
                </button>

                <div className="bg-white p-10 md:p-14 rounded-[4rem] border border-slate-100 shadow-xl space-y-10">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-brand-secondary text-brand-primary rounded-3xl flex items-center justify-center shadow-inner">
                      <i className="fa-solid fa-users-viewfinder text-xl"></i>
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-black text-slate-900 uppercase italic leading-none">Join Session</h3>
                      <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-2">Remote Access Token</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input 
                      type="text" 
                      maxLength={6}
                      placeholder="EX: A7B2X9"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      className="flex-1 bg-slate-50 border border-slate-100 rounded-3xl p-6 text-center font-black tracking-[0.5em] uppercase text-slate-800 outline-none focus:ring-8 ring-brand-primary/5 focus:border-brand-primary/20 transition-all placeholder:text-slate-200 placeholder:tracking-normal text-xl"
                    />
                    <button 
                      disabled={joinCode.length < 4}
                      className="bg-brand-primary text-white px-10 py-6 rounded-3xl font-black text-[12px] uppercase tracking-widest shadow-xl shadow-brand-primary/30 active:scale-95 transition-all disabled:opacity-20 disabled:grayscale"
                    >
                      Authenticate
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Intel & Features */}
            <div className="space-y-12">
              <div className="space-y-8">
                <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.4em] ml-6 italic">The Workflow</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6">
                  {[
                    { step: '01', title: 'Start Hosting', text: 'Generate your unique 6-digit access code for the current table.' },
                    { step: '02', title: 'Share Token', text: 'Invite others by displaying the code or sharing a direct deep link.' },
                    { step: '03', title: 'Group Sync', text: 'All members browse and add dishes to the shared cloud basket.' },
                    { step: '04', title: 'Review & Commit', text: 'Finalize the collective selection and transmit the order to the terminal.' }
                  ].map((item) => (
                    <div key={item.step} className="flex gap-6 items-start bg-white p-8 rounded-[3rem] border border-slate-50 shadow-sm hover:shadow-md transition-all group">
                      <span className="text-[12px] font-black text-brand-primary bg-brand-secondary w-10 h-10 flex items-center justify-center rounded-2xl shrink-0 italic group-hover:bg-brand-primary group-hover:text-white transition-colors">{item.step}</span>
                      <div>
                        <h5 className="text-[14px] font-black text-slate-800 uppercase tracking-tight mb-2 italic">{item.title}</h5>
                        <p className="text-xs text-slate-400 font-medium leading-relaxed italic">{item.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                 <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.4em] ml-6 italic">Hub Advantage</h4>
                 <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm group hover:border-brand-primary/20 transition-all">
                       <i className="fa-solid fa-bolt text-amber-500 mb-6 text-2xl block group-hover:scale-110 transition-transform"></i>
                       <h5 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-2 italic">Instant Pulse</h5>
                       <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic">Live WebSocket synchronization ensures no double-orders.</p>
                    </div>
                    <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm group hover:border-brand-primary/20 transition-all">
                       <i className="fa-solid fa-receipt text-indigo-500 mb-6 text-2xl block group-hover:scale-110 transition-transform"></i>
                       <h5 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-2 italic">Smart Split</h5>
                       <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic">Individual tallies tracked per guest automatically.</p>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 animate-fade-in items-start">
            
            {/* Left Column: ID Card (Desktop Sidebar) */}
            <div className="lg:col-span-5 space-y-10">
              <div className="bg-brand-primary p-12 md:p-16 rounded-[4rem] text-white shadow-2xl relative overflow-hidden group">
                 <div className="absolute -top-10 -left-10 w-64 h-64 bg-white/10 rounded-full blur-[80px] group-hover:scale-150 transition-transform duration-1000"></div>
                 <div className="text-center relative z-10">
                    <p className="text-[12px] font-black uppercase tracking-[0.6em] text-white/60 mb-4 italic">Active Session Identifier</p>
                    <h2 className="text-7xl md:text-8xl font-black italic tracking-tighter mb-10 leading-none">{sessionCode}</h2>
                    <p className="text-sm font-bold text-white/80 uppercase tracking-widest mb-12 leading-relaxed max-w-[280px] mx-auto italic">
                      Share this alphanumeric token with your entourage to grant access to this session.
                    </p>
                    
                    <div className="flex justify-center -space-x-4 mb-12">
                       {[1, 2, 3].map(i => (
                         <div key={i} className="w-16 h-16 rounded-[2rem] border-4 border-brand-primary bg-slate-100 overflow-hidden shadow-2xl">
                            <img src={`https://i.pravatar.cc/100?u=${i + 10}`} className="w-full h-full object-cover" alt="Member" />
                         </div>
                       ))}
                       <div className="w-16 h-16 rounded-[2rem] border-4 border-brand-primary bg-white flex items-center justify-center text-brand-primary text-sm font-black shadow-2xl italic">
                          +1
                       </div>
                    </div>
                    
                    <button 
                      onClick={handleShare}
                      className="bg-white text-brand-primary px-12 py-6 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4 mx-auto border-4 border-transparent hover:border-brand-secondary/30"
                    >
                      <i className="fa-solid fa-share-nodes"></i> Share Invite
                    </button>
                 </div>
              </div>

              <div className="p-8 text-center opacity-40">
                <i className="fa-solid fa-shield-halved text-slate-300 text-3xl mb-4"></i>
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 italic leading-relaxed">
                  Enterprise Grade SSL Secured <br/> Group Ordering Protocol
                </p>
              </div>
            </div>

            {/* Right Column: Member Feed (Desktop Content) */}
            <div className="lg:col-span-7 space-y-8">
              <div className="bg-white p-10 md:p-14 rounded-[4rem] border border-slate-100 shadow-xl space-y-10">
                <div className="flex justify-between items-center pb-6 border-b border-slate-50">
                  <h4 className="text-xl font-black text-slate-800 uppercase italic tracking-widest">Table Roster</h4>
                  <span className="bg-emerald-50 text-emerald-600 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] animate-pulse italic border border-emerald-100">Live Connection</span>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 group hover:bg-white hover:shadow-lg transition-all duration-500">
                     <div className="flex items-center gap-5">
                        <img src="https://i.pravatar.cc/100?u=11" className="w-12 h-12 rounded-2xl border-2 border-white shadow-md" alt="Self" />
                        <div>
                          <span className="text-sm font-black text-slate-800 uppercase italic tracking-tight">You (Host)</span>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Primary Controller</p>
                        </div>
                     </div>
                     <span className="text-[11px] font-black text-brand-primary uppercase italic tracking-widest">Adding Items...</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 opacity-60 group hover:opacity-100 transition-all duration-500">
                     <div className="flex items-center gap-5">
                        <img src="https://i.pravatar.cc/100?u=12" className="w-12 h-12 rounded-2xl border-2 border-white shadow-md" alt="Guest" />
                        <div>
                          <span className="text-sm font-black text-slate-800 uppercase italic tracking-tight">Sarah Jenkins</span>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Guest Entry</p>
                        </div>
                     </div>
                     <span className="text-[11px] font-bold text-slate-300 uppercase italic tracking-widest">Reviewing Menu</span>
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-50">
                  <div className="bg-brand-secondary/20 p-6 rounded-3xl border border-brand-primary/5">
                    <p className="text-[11px] text-brand-primary font-black uppercase tracking-widest text-center italic">
                      Finalized orders will be processed by the host terminal.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => setIsHosting(false)}
                  className="flex-1 py-6 bg-white border border-rose-100 rounded-3xl font-black uppercase text-[10px] tracking-[0.4em] text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                >
                  Terminate Hub
                </button>
                <button 
                  onClick={() => window.location.hash = '#/menu'}
                  className="flex-[2] py-6 bg-slate-900 text-white rounded-3xl font-black uppercase text-[10px] tracking-[0.4em] shadow-2xl active:scale-95 transition-all hover:bg-brand-primary"
                >
                  Return to Menu
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupView;
