
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
    <div className="p-6 pb-32 animate-fade-in font-jakarta">
      {/* Header Section */}
      <header className="mb-10 pt-4">
        <p className="text-[10px] font-black text-brand-primary uppercase tracking-[0.4em] mb-2 italic">Collective Dining</p>
        <h1 className="text-4xl font-black text-slate-900 italic tracking-tighter uppercase leading-none">
          Group <span className="text-brand-primary">Hub.</span>
        </h1>
        <div className="mt-4 bg-brand-secondary/30 p-4 rounded-2xl border border-brand-primary/10">
           <p className="text-brand-primary text-[11px] font-black uppercase tracking-widest leading-relaxed italic">
              Share your menu in a group view <br/>
              <span className="text-slate-900">group session.</span>
           </p>
        </div>
      </header>

      {!isHosting ? (
        <div className="space-y-10">
          {/* Intro Text */}
          <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100">
            <h4 className="text-[10px] font-black uppercase text-brand-primary tracking-widest mb-2">Social Ordering</h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Dining is better together. Our Group Hub allows everyone at the table to contribute to a single cart. 
              One person hosts, everyone joins, and the kitchen gets one organized order.
            </p>
          </div>

          {/* Main Action Cards */}
          <div className="grid grid-cols-1 gap-6">
            <button 
              onClick={startSession}
              className="bg-slate-900 p-8 rounded-[3rem] text-left relative overflow-hidden group shadow-2xl active:scale-[0.98] transition-all"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform duration-700"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-brand-primary text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <i className="fa-solid fa-crown text-lg"></i>
                </div>
                <h3 className="text-2xl font-black text-white uppercase italic tracking-tight mb-2">Host a Table</h3>
                <p className="text-slate-400 text-xs font-medium leading-relaxed max-w-[200px]">Create a new session and invite others to order with you.</p>
              </div>
              <i className="fa-solid fa-plus absolute bottom-8 right-8 text-white/10 text-4xl group-hover:text-white/20 transition-colors"></i>
            </button>

            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl space-y-6">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 bg-brand-secondary text-brand-primary rounded-2xl flex items-center justify-center shadow-sm">
                  <i className="fa-solid fa-users-viewfinder text-lg"></i>
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 uppercase italic leading-none">Join Session</h3>
                  <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-1">Enter Invite Code</p>
                </div>
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  maxLength={6}
                  placeholder="EX: A7B2X9"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center font-black tracking-[0.4em] uppercase text-slate-800 outline-none focus:ring-4 ring-brand-primary/5 focus:border-brand-primary/20 transition-all placeholder:text-slate-200 placeholder:tracking-normal"
                />
                <button 
                  disabled={joinCode.length < 4}
                  className="bg-brand-primary text-white px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand-primary/20 active:scale-95 transition-all disabled:opacity-30 disabled:grayscale"
                >
                  Join
                </button>
              </div>
            </div>
          </div>

          {/* Detailed Instructions Section */}
          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] ml-4">How it Works</h4>
            <div className="space-y-4">
              {[
                { step: '01', title: 'Start Hosting', text: 'Tap "Host a Table" to generate your unique 6-digit access code.' },
                { step: '02', title: 'Share the Code', text: 'Tell your friends the code or tap "Share Invite" to send a link.' },
                { step: '03', title: 'Everyone Selects', text: 'Everyone browses the menu and adds their favorite dishes to the group cart.' },
                { step: '04', title: 'Review & Order', text: 'The host does a final review of the group order and sends it to the kitchen.' }
              ].map((item) => (
                <div key={item.step} className="flex gap-4 items-start bg-white p-5 rounded-3xl border border-slate-50 shadow-sm">
                  <span className="text-[10px] font-black text-brand-primary bg-brand-secondary w-8 h-8 flex items-center justify-center rounded-xl shrink-0 italic">{item.step}</span>
                  <div>
                    <h5 className="text-[11px] font-black text-slate-800 uppercase tracking-tight mb-1">{item.title}</h5>
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Benefits Section */}
          <div className="space-y-4">
             <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] ml-4">Why Order Together?</h4>
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100/50">
                   <i className="fa-solid fa-bolt text-amber-500 mb-3 block"></i>
                   <h5 className="text-[10px] font-black text-slate-800 uppercase mb-1">Live Sync</h5>
                   <p className="text-[9px] text-slate-400 font-medium leading-relaxed">See everyone's items in the cart instantly.</p>
                </div>
                <div className="bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100/50">
                   <i className="fa-solid fa-receipt text-indigo-500 mb-3 block"></i>
                   <h5 className="text-[10px] font-black text-slate-800 uppercase mb-1">Split Bill</h5>
                   <p className="text-[9px] text-slate-400 font-medium leading-relaxed">Pre-calculate who owes what automatically.</p>
                </div>
             </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-fade-in">
          {/* Active Session View */}
          <div className="bg-brand-primary p-10 rounded-[4rem] text-white shadow-2xl relative overflow-hidden">
             <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
             <div className="text-center relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/60 mb-2 italic">Session ID</p>
                <h2 className="text-5xl font-black italic tracking-tighter mb-8 leading-none">{sessionCode}</h2>
                <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest mb-8 leading-relaxed max-w-[200px] mx-auto">
                  Ask your friends to enter this code in their Group Hub to join your table.
                </p>
                <div className="flex justify-center -space-x-3 mb-10">
                   {[1, 2, 3].map(i => (
                     <div key={i} className="w-12 h-12 rounded-full border-4 border-brand-primary bg-slate-100 overflow-hidden shadow-xl">
                        <img src={`https://i.pravatar.cc/100?u=${i + 10}`} className="w-full h-full object-cover" />
                     </div>
                   ))}
                   <div className="w-12 h-12 rounded-full border-4 border-brand-primary bg-white flex items-center justify-center text-brand-primary text-xs font-black shadow-xl">
                      +1
                   </div>
                </div>
                <button 
                  onClick={handleShare}
                  className="bg-white text-brand-primary px-10 py-4 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 mx-auto"
                >
                  <i className="fa-solid fa-share-nodes"></i> Share Invite
                </button>
             </div>
          </div>

          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Active Table Members</h4>
              <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest animate-pulse">Live</span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                 <div className="flex items-center gap-3">
                    <img src="https://i.pravatar.cc/100?u=11" className="w-8 h-8 rounded-full border-2 border-white shadow-sm" />
                    <span className="text-xs font-bold text-slate-700">You (Host)</span>
                 </div>
                 <span className="text-[10px] font-black text-brand-primary uppercase">Ordering...</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl opacity-60">
                 <div className="flex items-center gap-3">
                    <img src="https://i.pravatar.cc/100?u=12" className="w-8 h-8 rounded-full border-2 border-white shadow-sm" />
                    <span className="text-xs font-bold text-slate-700">Sarah</span>
                 </div>
                 <span className="text-[10px] font-bold text-slate-400 uppercase">Choosing</span>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setIsHosting(false)}
            className="w-full py-4 text-[10px] font-black uppercase text-slate-300 hover:text-rose-500 tracking-[0.3em] transition-colors"
          >
            Terminate Session
          </button>
        </div>
      )}

      {/* Group Info Footer */}
      <div className="mt-12 p-8 bg-slate-50 rounded-[3rem] border border-slate-100 text-center">
        <i className="fa-solid fa-circle-info text-slate-200 text-2xl mb-4"></i>
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 italic">Did you know?</p>
        <p className="text-xs text-slate-500 font-medium leading-relaxed italic">
          Invite up to 10 friends to order simultaneously. Everyone can add dishes, but only the host can finalize the checkout and send the order to the kitchen terminal.
        </p>
      </div>
    </div>
  );
};

export default GroupView;
