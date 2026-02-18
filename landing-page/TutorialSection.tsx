import React from 'react';
import { Reveal } from './Reveal';

const TUTORIALS = [
  {
    title: "Setting up your Floor Map",
    desc: "Learn how to organize your table nodes for maximum guest flow.",
    thumbnail: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800",
    duration: "2:15"
  },
  {
    title: "Mastering the Inventory",
    desc: "Add complex variations and modifiers to your digital dishes.",
    thumbnail: "https://images.unsplash.com/photo-1556742044-3c52d6e88c62?auto=format&fit=crop&q=80&w=800",
    duration: "3:45"
  },
  {
    title: "Understanding Analytics",
    desc: "Decode your sales data to boost revenue per seat effectively.",
    thumbnail: "https://images.unsplash.com/photo-1551288049-bbbda536ad0a?auto=format&fit=crop&q=80&w=800",
    duration: "5:10"
  }
];

export const TutorialSection: React.FC = () => {
  return (
    <section className="py-32 bg-white overflow-hidden border-t border-slate-100 font-jakarta">
      <div className="max-w-[1200px] mx-auto px-6">
        <header className="mb-20 text-center space-y-4">
          <Reveal>
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.5em]">The Academy</h3>
              <h2 className="text-[36px] md:text-[56px] font-bold tracking-tight text-slate-900 leading-none">Watch and Learn.</h2>
              <p className="text-slate-500 text-[17px] md:text-xl font-medium leading-relaxed max-w-xl mx-auto">
                Quick video guides to help you master every corner of the Merchant Console.
              </p>
            </div>
          </Reveal>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {TUTORIALS.map((tutorial, idx) => (
            <Reveal key={idx} delay={idx * 100}>
              <div className="group cursor-pointer">
                <div className="relative aspect-[16/10] rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-100 mb-8 transition-transform duration-500 group-hover:-translate-y-2">
                  <img src={tutorial.thumbnail} className="absolute inset-0 w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110" alt="" />
                  <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-transparent transition-colors"></div>
                  
                  {/* Play Icon Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 bg-white/95 backdrop-blur-md rounded-full flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-all duration-500">
                      <i className="fa-solid fa-play text-slate-900 text-lg ml-1"></i>
                    </div>
                  </div>
                  
                  <div className="absolute bottom-6 right-6 px-4 py-2 bg-slate-900/80 backdrop-blur-md rounded-xl text-[10px] font-black text-white uppercase tracking-widest border border-white/10">
                    {tutorial.duration}
                  </div>
                </div>
                
                <div className="text-center px-4 space-y-3">
                  <h4 className="text-[18px] font-bold text-slate-900 tracking-tight leading-tight uppercase group-hover:text-indigo-600 transition-colors">{tutorial.title}</h4>
                  <p className="text-[14px] text-slate-400 font-medium leading-relaxed">{tutorial.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={400}>
          <div className="mt-20 text-center">
            <button className="text-[#007AFF] font-bold text-[17px] flex items-center justify-center gap-2 mx-auto group hover:underline transition-all">
              See more tutorials
              <i className="fa-solid fa-chevron-right text-[11px] transition-transform group-hover:translate-x-1"></i>
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
};