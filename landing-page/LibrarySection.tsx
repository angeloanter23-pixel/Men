import React, { useState } from 'react';
import { Reveal } from './Reveal';

const VIDEOS = [
  {
    id: "v1",
    title: "Floor Map Setup",
    tag: "Tutorial",
    duration: "2:15",
    img: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800",
    color: "from-blue-600/80"
  },
  {
    id: "v2",
    title: "Inventory Master",
    tag: "Tutorial",
    duration: "3:45",
    img: "https://images.unsplash.com/photo-1556742044-3c52d6e88c62?auto=format&fit=crop&q=80&w=800",
    color: "from-purple-600/80"
  },
  {
    id: "v3",
    title: "Analytics Decoding",
    tag: "Tutorial",
    duration: "5:10",
    img: "https://images.unsplash.com/photo-1551288049-bbbda536ad0a?auto=format&fit=crop&q=80&w=800",
    color: "from-amber-600/80"
  }
];

const ARTICLES = [
  {
    id: "speed",
    title: "Mastering Speed",
    tag: "Operations",
    readTime: "4 min read",
    img: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=400",
    color: "from-orange-500/80"
  },
  {
    id: "design",
    title: "Menu Design Secrets",
    tag: "Marketing",
    readTime: "6 min read",
    img: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=400",
    color: "from-indigo-500/80"
  },
  {
    id: "guests",
    title: "Happy Guests Guide",
    tag: "Service",
    readTime: "5 min read",
    img: "https://images.unsplash.com/photo-1550966841-3ee7adac1661?auto=format&fit=crop&q=80&w=800",
    color: "from-emerald-500/80"
  },
  {
    id: "trends",
    title: "Digital Trends 2025",
    tag: "Future",
    readTime: "3 min read",
    img: "https://images.unsplash.com/photo-1590650516494-23253a08051b?auto=format&fit=crop&q=80&w=400",
    color: "from-slate-800/80"
  }
];

export const LibrarySection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'video' | 'article'>('video');

  const content = activeTab === 'video' ? VIDEOS : ARTICLES;

  return (
    <section className="py-32 bg-white font-jakarta overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="space-y-16">
          
          {/* Header Area */}
          <div className="text-center space-y-8">
            <Reveal>
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-orange-500 uppercase tracking-[0.5em]">The Academy</h3>
                <h2 className="text-[36px] md:text-[56px] font-bold tracking-tight text-slate-900 leading-none">
                  Watch and Learn.
                </h2>
                <p className="text-slate-500 text-lg font-medium leading-relaxed max-w-xl mx-auto">
                  Master the merchant dashboard with quick guides and industry insights.
                </p>
              </div>
            </Reveal>

            {/* Apple Style Segmented Control */}
            <Reveal delay={100}>
              <div className="inline-flex bg-[#F2F2F7] p-1 rounded-2xl w-full max-w-[320px] shadow-inner relative">
                <div 
                  className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-[14px] shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${activeTab === 'article' ? 'translate-x-full' : 'translate-x-0'}`}
                />
                <button 
                  onClick={() => setActiveTab('video')}
                  className={`flex-1 py-3 text-[13px] font-bold uppercase tracking-widest relative z-10 transition-colors duration-300 ${activeTab === 'video' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Video
                </button>
                <button 
                  onClick={() => setActiveTab('article')}
                  className={`flex-1 py-3 text-[13px] font-bold uppercase tracking-widest relative z-10 transition-colors duration-300 ${activeTab === 'article' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Articles
                </button>
              </div>
            </Reveal>
          </div>

          {/* Horizontal Scroll Area */}
          <div className="relative -mx-6 px-6 lg:mx-0 lg:px-0">
            <div className="flex overflow-x-auto no-scrollbar gap-6 pb-10 snap-x" key={activeTab}>
              {content.map((item, idx) => (
                <Reveal key={item.id} delay={idx * 100}>
                  <div 
                    onClick={() => {
                      if (activeTab === 'article') window.location.hash = `#/article/${item.id}`;
                    }}
                    className="flex-shrink-0 w-[260px] md:w-[320px] aspect-[3/4] rounded-[2.5rem] overflow-hidden shadow-2xl relative group cursor-pointer hover:-translate-y-2 transition-all duration-500 border border-slate-100 snap-center"
                  >
                    <img 
                      src={item.img} 
                      className="absolute inset-0 w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110" 
                      alt={item.title}
                    />
                    <div className={`absolute inset-0 bg-gradient-to-t ${item.color} to-transparent opacity-60 group-hover:opacity-80 transition-opacity`}></div>
                    
                    {/* Video Play Overlay */}
                    {activeTab === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white scale-90 group-hover:scale-100 transition-transform duration-500">
                          <i className="fa-solid fa-play text-lg ml-1"></i>
                        </div>
                      </div>
                    )}

                    <div className="absolute inset-0 p-8 flex flex-col justify-end text-white">
                      <div className="flex items-center justify-between mb-2 opacity-80">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em]">{item.tag}</span>
                        <span className="text-[8px] font-bold uppercase tracking-widest">
                          {activeTab === 'video' ? (item as any).duration : (item as any).readTime}
                        </span>
                      </div>
                      <h4 className="text-[18px] md:text-2xl font-bold leading-tight tracking-tight uppercase">{item.title}</h4>
                    </div>
                  </div>
                </Reveal>
              ))}
              <div className="flex-shrink-0 w-4 lg:hidden"></div>
            </div>
          </div>
        </div>

        {/* CTA Link */}
        <Reveal delay={400}>
          <div className="mt-16 text-center">
            <button 
              onClick={() => window.location.hash = activeTab === 'video' ? '#/tutorials' : '#/articles'}
              className="text-[#007AFF] font-semibold text-[17px] flex items-center justify-center gap-2 mx-auto group hover:underline transition-all"
            >
              {activeTab === 'video' ? 'Explore tutorials' : 'Show more articles'}
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