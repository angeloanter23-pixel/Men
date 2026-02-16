
import React from 'react';
import { Reveal } from '../landing-page/Reveal';

const ALL_ARTICLES = [
  {
    id: "speed",
    title: "Mastering Speed",
    tag: "Operations",
    reads: "2.4k reads",
    readTime: "4 min read",
    desc: "Why sub-second order processing is the hidden secret to guest loyalty and higher table turnover rates.",
    img: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=800",
    category: "MANAGEMENT"
  },
  {
    id: "design",
    title: "Menu Design Secrets",
    tag: "Marketing",
    reads: "1.8k reads",
    readTime: "6 min read",
    desc: "The psychology of layout: How high-fidelity imagery and smart categorization influence ordering decisions.",
    img: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=800",
    category: "DESIGN"
  },
  {
    id: "guests",
    title: "Happy Guests Guide",
    tag: "Service",
    reads: "3.1k reads",
    readTime: "5 min read",
    desc: "Enhancing the human touch with invisible technology. How to bridge the gap between digital and physical service.",
    img: "https://images.unsplash.com/photo-1550966841-3ee7adac1661?auto=format&fit=crop&q=80&w=800",
    category: "SERVICE"
  },
  {
    id: "trends",
    title: "Digital Trends 2025",
    tag: "Future",
    reads: "1.2k reads",
    readTime: "3 min read",
    desc: "AI concierges, predictive inventory, and the rise of the autonomous dining floor. What to expect in the next 24 months.",
    img: "https://images.unsplash.com/photo-1590650516494-23253a08051b?auto=format&fit=crop&q=80&w=400",
    category: "TECH"
  },
  {
    id: "revenue",
    title: "Maximizing Revenue",
    tag: "Finance",
    reads: "4.2k reads",
    readTime: "7 min read",
    desc: "Strategies for upselling with digital modifiers and add-ons without being pushy to your guests.",
    img: "https://images.unsplash.com/photo-1551288049-bbbda536ad0a?auto=format&fit=crop&q=80&w=800",
    category: "FINANCE"
  }
];

const ArticlesView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-white font-jakarta pb-40 animate-fade-in">
      <header className="bg-white/90 backdrop-blur-2xl sticky top-0 z-[100] border-b border-slate-100 px-6 h-[72px] flex items-center justify-between">
        <div className="max-w-[1200px] w-full mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={onBack} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all active:scale-90 border border-slate-100">
                <i className="fa-solid fa-chevron-left text-xs"></i>
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">
                  <span className="text-[10px] font-bold">M</span>
                </div>
                <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-none uppercase">Academy Library</h1>
              </div>
            </div>
        </div>
      </header>

      <main className="max-w-[1000px] mx-auto px-6 py-16 md:py-24">
        <header className="mb-20 space-y-4">
          <Reveal>
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.5em]">The Archive</h3>
              <h2 className="text-[44px] md:text-[76px] font-bold tracking-tight text-slate-900 leading-[1.05] uppercase">
                Insights for <br /> Builders.
              </h2>
              <p className="text-slate-500 text-lg md:text-xl font-medium leading-relaxed max-w-xl">
                Explore our collection of articles designed to help you scale your restaurant with data and design.
              </p>
            </div>
          </Reveal>
        </header>

        <div className="space-y-12">
          {ALL_ARTICLES.map((article, idx) => (
            <Reveal key={article.id} delay={idx * 100}>
              <div 
                onClick={() => window.location.hash = `#/article/${article.id}`}
                className="group flex flex-col md:flex-row gap-8 items-start cursor-pointer hover:bg-slate-50 p-6 md:p-8 rounded-[3rem] transition-all border border-transparent hover:border-slate-100"
              >
                <div className="w-full md:w-80 aspect-video md:aspect-square rounded-[2rem] overflow-hidden shrink-0 shadow-lg">
                  <img src={article.img} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700" alt="" />
                </div>
                
                <div className="flex-1 flex flex-col justify-between h-full py-2">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{article.category}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{article.readTime}</span>
                    </div>
                    <h3 className="text-3xl font-bold text-slate-900 uppercase tracking-tight group-hover:text-[#007AFF] transition-colors">{article.title}</h3>
                    <p className="text-slate-500 text-lg leading-relaxed line-clamp-2">{article.desc}</p>
                  </div>
                  
                  <div className="pt-8 flex items-center justify-between border-t border-slate-100">
                    <div className="flex gap-4 items-center">
                       <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">{article.reads}</span>
                    </div>
                    <i className="fa-solid fa-arrow-right text-slate-200 group-hover:translate-x-1 group-hover:text-[#007AFF] transition-all"></i>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </main>

      <footer className="text-center pt-20 pb-12 opacity-30 border-t border-slate-100 max-w-[1000px] mx-auto mt-20">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.8em]">PLATINUM KNOWLEDGE BASE</p>
      </footer>
    </div>
  );
};

export default ArticlesView;
