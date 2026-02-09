import React, { useState, useEffect, useRef } from 'react';

// --- Scroll Reveal Animation Wrapper (Localized for consistency) ---
const Reveal: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ 
        transitionDelay: `${delay}ms`,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        opacity: isVisible ? 1 : 0
      }}
      className="transition-all duration-[1000ms] cubic-bezier(0.23, 1, 0.32, 1)"
    >
      {children}
    </div>
  );
};

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
    <div className="animate-fade-in font-jakarta bg-[#FBFBFD] min-h-screen pb-40">
      <div className="max-w-[1024px] mx-auto px-6 py-16 md:py-24">
        
        {/* Apple Style Header */}
        <header className="mb-20 text-center md:text-left">
          <Reveal>
            <div className="flex items-center justify-center md:justify-start gap-3 mb-6">
               <div className="w-1.5 h-1.5 rounded-full bg-[#007AFF]"></div>
               <p className="text-[12px] font-bold text-[#86868B] uppercase tracking-[0.2em]">Connected Dining</p>
            </div>
            <h1 className="text-[48px] md:text-[80px] font-bold text-[#1D1D1F] tracking-[-0.04em] leading-[1.05] mb-8">
              Dining. <br className="md:hidden" /> Together.
            </h1>
            <p className="text-[19px] md:text-[24px] text-[#86868B] font-medium leading-snug max-w-2xl">
              One table. One order. Share a real-time basket with everyone in your group for a seamless, unified experience.
            </p>
          </Reveal>
        </header>

        {!isHosting ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
            
            {/* Join Bento Card */}
            <div className="md:col-span-7 bg-white rounded-[2.5rem] p-10 md:p-14 border border-slate-200/60 shadow-[0_20px_40px_rgba(0,0,0,0.02)] flex flex-col justify-between space-y-12">
              <Reveal delay={100}>
                <div className="space-y-4">
                  <div className="w-14 h-14 bg-[#F5F5F7] rounded-2xl flex items-center justify-center text-[#1D1D1F]">
                    <i className="fa-solid fa-right-to-bracket text-xl"></i>
                  </div>
                  <h3 className="text-[28px] md:text-[32px] font-bold text-[#1D1D1F] tracking-tight">Join a Table.</h3>
                  <p className="text-[17px] text-[#86868B] font-medium leading-tight">Enter the 6-digit access code displayed on the host's screen or provided by your server.</p>
                </div>
              </Reveal>

              <Reveal delay={200}>
                <div className="space-y-6">
                  <div className="relative group">
                    <input 
                      type="text" 
                      maxLength={6}
                      placeholder="ENTER CODE"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      className="w-full bg-[#F5F5F7] border border-transparent rounded-[1.5rem] p-6 text-center font-bold tracking-[0.4em] uppercase text-[#1D1D1F] outline-none focus:bg-white focus:ring-4 ring-[#007AFF]/5 transition-all text-2xl shadow-inner"
                    />
                  </div>
                  <button 
                    disabled={joinCode.length < 4}
                    className="w-full bg-[#1D1D1F] text-white py-6 rounded-full font-bold text-[17px] transition-all hover:bg-black active:scale-95 disabled:opacity-30 shadow-lg"
                  >
                    Connect to Group
                  </button>
                  
                  <div className="pt-8 text-center border-t border-slate-100/80">
                     <button 
                      onClick={notifyWaiter}
                      className="group flex items-center justify-center gap-3 w-full py-4 text-[14px] font-semibold text-[#007AFF] hover:underline transition-all"
                     >
                       <i className="fa-solid fa-bell text-[12px] opacity-70 group-hover:animate-bounce"></i> Notify Table Server
                     </button>
                  </div>
                </div>
              </Reveal>
            </div>

            {/* Host Bento Card */}
            <div className="md:col-span-5 bg-[#5856D6] text-white rounded-[2.5rem] p-10 md:p-14 flex flex-col justify-between space-y-12 relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 w-64 h-64 bg-white/10 rounded-full blur-[80px] group-hover:scale-125 transition-transform duration-[3s]"></div>
              
              <Reveal delay={300}>
                <div className="space-y-4 relative z-10">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center text-white border border-white/10">
                    <i className="fa-solid fa-crown text-xl"></i>
                  </div>
                  <h3 className="text-[28px] md:text-[32px] font-bold text-white tracking-tight leading-tight">Start a <br/> New Group.</h3>
                  <p className="text-[17px] text-white/70 font-medium leading-snug">Create a cloud-synced ordering node and invite others to join your basket instantly.</p>
                </div>
              </Reveal>

              <Reveal delay={400}>
                <div className="space-y-6 relative z-10">
                  <button 
                    onClick={startSession}
                    className="w-full bg-white text-[#5856D6] py-6 rounded-full font-bold text-[17px] transition-all hover:bg-[#FBFBFD] active:scale-95 shadow-xl"
                  >
                    Generate Session
                  </button>
                  <div className="flex items-center gap-2.5 justify-center opacity-60">
                     <i className="fa-solid fa-shield-halved text-[10px]"></i>
                     <p className="text-[11px] font-bold uppercase tracking-widest leading-none">Encrypted Persistence</p>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-fade-in items-start">
            
            {/* Session ID Card */}
            <div className="lg:col-span-5 space-y-6">
              <Reveal>
                <div className="bg-[#5856D6] p-12 md:p-16 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden text-center border border-white/10">
                   <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
                   <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-white/50 mb-6">Group Access Code</p>
                   <h2 className="text-[64px] md:text-[80px] font-black tracking-[-0.04em] mb-10 leading-none">{sessionCode}</h2>
                   
                   <div className="flex justify-center -space-x-3 mb-12">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="w-14 h-14 rounded-2xl border-[3px] border-[#5856D6] bg-[#F5F5F7] overflow-hidden shadow-xl">
                           <img src={`https://i.pravatar.cc/100?u=${i + 40}`} className="w-full h-full object-cover" alt="Member" />
                        </div>
                      ))}
                      <div className="w-14 h-14 rounded-2xl border-[3px] border-[#5856D6] bg-white flex items-center justify-center text-[#5856D6] text-[13px] font-black shadow-xl">
                         +1
                      </div>
                   </div>
                   
                   <button 
                     onClick={handleShare}
                     className="w-full bg-white text-[#5856D6] py-6 rounded-full font-bold text-[16px] transition-all hover:bg-[#FBFBFD] active:scale-95 shadow-xl"
                   >
                     Invite Guests
                   </button>
                </div>
                <p className="text-center text-[12px] font-bold text-[#86868B] uppercase tracking-widest mt-8">Guests can scan and enter this code to join</p>
              </Reveal>
            </div>

            {/* Member List */}
            <div className="lg:col-span-7 space-y-8">
              <Reveal delay={200}>
                <div className="bg-white p-10 md:p-12 rounded-[2.5rem] border border-slate-200/60 shadow-[0_20px_60px_rgba(0,0,0,0.02)] space-y-10">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-8">
                    <h4 className="text-[14px] font-bold text-[#1D1D1F] uppercase tracking-wider">Session Members</h4>
                    <span className="flex items-center gap-2 text-[11px] font-bold text-[#34C759] uppercase tracking-widest">
                      <span className="w-2 h-2 rounded-full bg-[#34C759] animate-pulse"></span>
                      Active Sync
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-6 bg-[#F5F5F7] rounded-[1.5rem] border border-transparent hover:bg-white hover:border-slate-200 transition-all group">
                       <div className="flex items-center gap-5">
                          <img src="https://i.pravatar.cc/100?u=41" className="w-12 h-12 rounded-xl border border-white shadow-sm" alt="Self" />
                          <div>
                            <p className="text-[16px] font-bold text-[#1D1D1F] tracking-tight mb-1">You (Host)</p>
                            <p className="text-[11px] text-[#86868B] font-semibold uppercase tracking-widest">Owner Account</p>
                          </div>
                       </div>
                       <span className="text-[11px] font-bold text-[#5856D6] uppercase tracking-widest bg-white px-3 py-1.5 rounded-lg shadow-sm">Browsing</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-6 bg-[#F5F5F7] rounded-[1.5rem] border border-transparent opacity-60">
                       <div className="flex items-center gap-5">
                          <img src="https://i.pravatar.cc/100?u=42" className="w-12 h-12 rounded-xl border border-white shadow-sm" alt="Guest" />
                          <div>
                            <p className="text-[16px] font-bold text-[#1D1D1F] tracking-tight mb-1">Alex Morgan</p>
                            <p className="text-[11px] text-[#86868B] font-semibold uppercase tracking-widest">Guest Member</p>
                          </div>
                       </div>
                       <span className="text-[11px] font-bold text-[#86868B] uppercase tracking-widest">Connected</span>
                    </div>
                  </div>

                  <div className="pt-6">
                     <button 
                      onClick={() => window.location.hash = '#/menu'}
                      className="w-full bg-[#1D1D1F] text-white py-6 rounded-full font-bold text-[17px] transition-all hover:bg-black active:scale-95 shadow-lg"
                     >
                       Return to Menu
                     </button>
                  </div>
                </div>
              </Reveal>

              <Reveal delay={400}>
                <button 
                  onClick={() => setIsHosting(false)}
                  className="w-full py-4 text-[13px] font-bold uppercase text-[#FF3B30] hover:underline transition-all tracking-wider"
                >
                  Terminate Session and Leave
                </button>
              </Reveal>
            </div>
          </div>
        )}
      </div>
      
      <footer className="py-24 border-t border-slate-100 text-center opacity-40">
         <p className="text-[10px] font-bold text-[#86868B] uppercase tracking-[0.8em]">PLATINUM CORE v4.5 GROUP NODE</p>
      </footer>
    </div>
  );
};

export default GroupView;