
import React from 'react';
import { Reveal } from './Reveal';

const TUTORIALS = [
  {
    title: "Setting up your Floor Map",
    desc: "Learn how to organize your table nodes for maximum flow.",
    thumbnail: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800",
    duration: "2:15"
  },
  {
    title: "Mastering the Inventory",
    desc: "Add complex variations and modifiers to your dishes.",
    thumbnail: "https://images.unsplash.com/photo-1556742044-3c52d6e88c62?auto=format&fit=crop&q=80&w=800",
    duration: "3:45"
  },
  {
    title: "Understanding Analytics",
    desc: "Decode your sales data to boost revenue per seat.",
    thumbnail: "https://images.unsplash.com/photo-1551288049-bbbda536ad0a?auto=format&fit=crop&q=80&w=800",
    duration: "5:10"
  }
];

export const TutorialSection: React.FC = () => {
  return (
    <section className="py-32 bg-[#FBFBFD] overflow-hidden border-t border-slate-100">
      <div className="max-w-[1200px] mx-auto px-6">
        <header className="mb-20 text-center lg:text-left">
          <Reveal>
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.5em]">The Academy</h3>
              <h2 className="text-[36px] md:text-[52px] font-bold tracking-tight text-slate-900 leading-none">Watch and Learn.</h2>
              <p className="text-slate-500 text-lg font-medium leading-relaxed max-w-xl">
                Quick video guides to help you master every corner of the Merchant Console.
              </p>
            </div>
          </Reveal>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TUTORIALS.map((tutorial, idx) => (
            <Reveal key={idx} delay={idx * 100}>
              <div className="group cursor-pointer">
                <div className="relative aspect-video rounded-[2.5rem] overflow-hidden shadow-xl border border-slate-100 mb-6">
                  <img src={tutorial.thumbnail} className="absolute inset-0 w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700" alt="" />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                  
                  {/* Play Icon Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-all duration-500">
                      <i className="fa-solid fa-play text-slate-900 text-lg ml-1"></i>
                    </div>
                  </div>
                  
                  <div className="absolute bottom-6 right-6 px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[10px] font-black text-white uppercase tracking-widest">
                    {tutorial.duration}
                  </div>
                </div>
                
                <div className="px-2 space-y-2">
                  <h4 className="text-lg font-bold text-slate-900 tracking-tight leading-tight uppercase group-hover:text-indigo-600 transition-colors">{tutorial.title}</h4>
                  <p className="text-sm font-medium text-slate-400 leading-relaxed">{tutorial.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={400}>
          <div className="mt-16 text-center lg:text-left">
            <button className="text-[#007AFF] font-semibold text-[17px] flex items-center justify-center lg:justify-start gap-2 group hover:underline transition-all">
              See more tutorials
              <i className="fa-solid fa-chevron-right text-[11px] transition-transform group-hover:translate-x-1"></i>
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
};
