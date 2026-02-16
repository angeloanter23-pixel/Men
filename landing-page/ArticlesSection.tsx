
import React from 'react';
import { Reveal } from './Reveal';

const ARTICLES = [
  {
    id: "speed",
    title: "Mastering Speed",
    tag: "Operations",
    reads: "2.4k reads",
    readTime: "4 min read",
    img: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=400",
    color: "from-orange-500/80"
  },
  {
    id: "design",
    title: "Menu Design Secrets",
    tag: "Marketing",
    reads: "1.8k reads",
    readTime: "6 min read",
    img: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=400",
    color: "from-indigo-500/80"
  },
  {
    id: "guests",
    title: "Happy Guests Guide",
    tag: "Service",
    reads: "3.1k reads",
    readTime: "5 min read",
    img: "https://images.unsplash.com/photo-1550966841-3ee7adac1661?auto=format&fit=crop&q=80&w=800",
    color: "from-emerald-500/80"
  },
  {
    id: "trends",
    title: "Digital Trends 2025",
    tag: "Future",
    reads: "1.2k reads",
    readTime: "3 min read",
    img: "https://images.unsplash.com/photo-1590650516494-23253a08051b?auto=format&fit=crop&q=80&w=400",
    color: "from-slate-800/80"
  }
];

export const ArticlesSection: React.FC = () => {
  return (
    <section className="py-32 bg-white font-jakarta overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="space-y-16">
          
          {/* Header Area */}
          <div className="text-center lg:text-left space-y-4">
            <Reveal>
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-orange-500 uppercase tracking-[0.5em]">The Library</h3>
                <h2 className="text-[36px] md:text-[52px] font-bold tracking-tight text-slate-900 leading-none">
                  Learn how to <br/> run a better restaurant.
                </h2>
                <p className="text-slate-500 text-lg font-medium leading-relaxed max-w-xl">
                  Read simple tips from world-class chefs and owners to grow your food business.
                </p>
              </div>
            </Reveal>
          </div>

          {/* Horizontal Scroll Area */}
          <div className="relative -mx-6 px-6 lg:mx-0 lg:px-0">
            <Reveal delay={200}>
              <div className="flex overflow-x-auto no-scrollbar gap-6 pb-10 no-scrollbar snap-x">
                {ARTICLES.map((article, idx) => (
                  <div 
                    key={idx}
                    onClick={() => window.location.hash = `#/article/${article.id}`}
                    className="flex-shrink-0 w-[240px] md:w-[300px] aspect-[3/4] rounded-[2.5rem] overflow-hidden shadow-2xl relative group cursor-pointer hover:-translate-y-2 transition-all duration-500 border border-slate-100 snap-center"
                  >
                    <img 
                      src={article.img} 
                      className="absolute inset-0 w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110" 
                      alt={article.title}
                    />
                    <div className={`absolute inset-0 bg-gradient-to-t ${article.color} to-transparent opacity-60 group-hover:opacity-80 transition-opacity`}></div>
                    
                    <div className="absolute inset-0 p-8 flex flex-col justify-end text-white">
                      <div className="flex items-center justify-between mb-2 opacity-80">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em]">{article.tag}</span>
                        <div className="flex gap-3">
                           <span className="text-[8px] font-bold uppercase tracking-widest">{article.reads}</span>
                           <span className="text-[8px] font-bold uppercase tracking-widest">{article.readTime}</span>
                        </div>
                      </div>
                      <h4 className="text-[18px] md:text-2xl font-bold leading-tight tracking-tight uppercase">{article.title}</h4>
                    </div>
                  </div>
                ))}
                {/* Spacer for horizontal scroll padding */}
                <div className="flex-shrink-0 w-4 lg:hidden"></div>
              </div>
            </Reveal>
          </div>
        </div>

        {/* CTA Link - Blue Text Style */}
        <Reveal delay={400}>
          <div className="mt-16 text-center">
            <button 
              onClick={() => window.location.hash = '#/articles'}
              className="text-[#007AFF] font-semibold text-[17px] flex items-center justify-center gap-2 mx-auto group hover:underline transition-all"
            >
              Show more articles
              <i className="fa-solid fa-chevron-right text-[11px] transition-transform group-hover:translate-x-1"></i>
            </button>
          </div>
        </Reveal>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </section>
  );
};
