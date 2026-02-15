
import React, { useState, useEffect } from 'react';
import { Reveal } from './Reveal';

const FEEDBACKS = [
  { 
    name: "Akira Tanaka", 
    rest: "Sora Omakase", 
    loc: "TOKYO", 
    feedback: "The transition to digital improved our server workflow immensely. Guests love the high-res visuals.", 
    img: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&q=80&w=800" 
  },
  { 
    name: "Min-ji Kim", 
    rest: "Han Cafe", 
    loc: "SEOUL", 
    feedback: "Setup took 15 minutes. Our younger guests love the digital experience and the AI Concierge.", 
    img: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=800" 
  },
  { 
    name: "Rafael Santos", 
    rest: "Manila Loft", 
    loc: "MANILA", 
    feedback: "Finally, a menu system that matches our premium brand aesthetic without hardware costs.", 
    img: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=800" 
  }
];

export const FeedbackSection: React.FC = () => {
  const [activeFeedback, setActiveFeedback] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setActiveFeedback((curr) => (curr + 1) % FEEDBACKS.length);
          return 0;
        }
        return prev + 1; 
      });
    }, 80);
    return () => clearInterval(interval);
  }, [activeFeedback]);

  const handleNext = () => {
    setActiveFeedback((curr) => (curr + 1) % FEEDBACKS.length);
    setProgress(0);
  };

  const handlePrev = () => {
    setActiveFeedback((curr) => (curr === 0 ? FEEDBACKS.length - 1 : curr - 1));
    setProgress(0);
  };

  return (
    <section className="py-20 bg-white relative overflow-hidden">
      <div className="max-w-[1100px] mx-auto px-6">
        <header className="mb-8">
           <Reveal>
              <div className="space-y-1">
                  <h3 className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.4em]">Trust Network</h3>
                  <h2 className="text-[32px] md:text-[42px] font-bold tracking-tight text-slate-900 leading-none">Merchant Voices.</h2>
              </div>
           </Reveal>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="relative aspect-video md:aspect-[4/3] rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-200/40 group">
               <img key={FEEDBACKS[activeFeedback].img} src={FEEDBACKS[activeFeedback].img} className="w-full h-full object-cover transition-opacity duration-700 animate-fade-in" alt="" />
               <div className="absolute top-6 left-6 bg-black/80 backdrop-blur-lg px-4 py-2 rounded-xl text-[9px] font-bold text-white uppercase tracking-widest">{FEEDBACKS[activeFeedback].loc}</div>
          </div>

          <div className="animate-fade-in flex flex-col justify-center" key={activeFeedback}>
               <div className="space-y-4">
                  <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(5)].map((_, i) => <i key={i} className="fa-solid fa-star text-[10px]"></i>)}
                  </div>
                  
                  <blockquote className="text-[22px] md:text-[32px] font-bold leading-[1.25] tracking-tight text-slate-900 pr-2">
                      “{FEEDBACKS[activeFeedback].feedback}”
                  </blockquote>
                  
                  <div className="flex items-center gap-5 pt-1">
                    {/* Orange Vertical Bar */}
                    <div className="w-1 h-12 bg-orange-50 rounded-full"></div>
                    <div>
                        <p className="text-xl font-bold tracking-tight text-slate-900 leading-none">{FEEDBACKS[activeFeedback].name}</p>
                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-1.5">{FEEDBACKS[activeFeedback].rest}</p>
                    </div>
                  </div>

                  <div className="pt-6 mt-2 border-t border-slate-50 space-y-8">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                          {FEEDBACKS.map((_, i) => (
                              <div key={i} className="relative w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                                  {activeFeedback === i && (
                                      <div 
                                        className="absolute inset-y-0 left-0 bg-slate-900 transition-all duration-100"
                                        style={{ width: `${progress}%` }}
                                      />
                                  )}
                              </div>
                          ))}
                      </div>
                      
                      <div className="flex gap-1.5 shrink-0">
                        <button onClick={handlePrev} className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all active:scale-90 shadow-sm"><i className="fa-solid fa-chevron-left text-[10px]"></i></button>
                        <button onClick={handleNext} className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all active:scale-90 shadow-sm"><i className="fa-solid fa-chevron-right text-[10px]"></i></button>
                      </div>
                    </div>

                    {/* CENTERED CTA TEXT BELOW LOADING AND BUTTONS */}
                    <div className="flex justify-center">
                      <button className="text-[#007AFF] font-semibold text-[17px] flex items-center gap-1.5 hover:underline transition-all group/cta">
                        Give Feedback
                        <i className="fa-solid fa-chevron-right text-[11px] mt-0.5 transition-transform group-hover/cta:translate-x-1"></i>
                      </button>
                    </div>
                  </div>
               </div>
          </div>
        </div>
      </div>
    </section>
  );
};
