
import React from 'react';

const ARTICLE_DATA: Record<string, any> = {
  speed: {
    title: "Mastering Speed",
    category: "Operations",
    img: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=1200",
    content: `
      <p>In the high-stakes world of modern hospitality, speed isn't just a metric—it's a competitive advantage. When a guest scans a QR code, they aren't just looking for a menu; they're looking for an immediate fulfillment of their needs.</p>
      <h3>The Sub-Second Rule</h3>
      <p>Our research shows that a delay of even three seconds in loading a digital menu can decrease ordering volume by up to 12%. Guests associate a laggy interface with a slow kitchen. Platinum Core v4.5 is built to deliver sub-second interactions, ensuring that the digital experience feels as responsive as a physical menu.</p>
      <p>By removing the friction of app downloads and account creation, you allow the guest to enter the 'ordering flow' instantly. This psychological momentum often leads to higher average basket sizes as guests feel more comfortable exploring add-ons and modifiers.</p>
      <h3>From Phone to Kitchen</h3>
      <p>Speed doesn't stop at the UI. The true bottleneck in many restaurants is the communication between the floor and the pass. Cloud-synced ordering ensures that the moment a guest taps 'Complete Order', the ticket is printing in the kitchen. No more servers walking across the floor to punch in orders.</p>
    `
  },
  design: {
    title: "Menu Design Secrets",
    category: "Marketing",
    img: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=1200",
    content: `
      <p>A digital menu is more than a list of food; it's a sales tool. In a physical environment, your menu real estate is fixed. In the digital space, it's dynamic, interactive, and intelligent.</p>
      <h3>Visual Hierarchy</h3>
      <p>The human eye scans a digital screen differently than a printed page. We follow an 'F-pattern'. Placing your highest-margin items in the top third of the screen with vibrant, high-fidelity imagery can increase their selection rate by 20%.</p>
      <p>Imagery is non-negotiable. In the digital world, we eat with our eyes first. High-resolution photos with consistent lighting create a sense of trust and quality. It bridges the gap between expectation and reality.</p>
      <h3>Smart Modifiers</h3>
      <p>One of the most powerful features of a digital ecosystem is the ability to suggest modifiers. 'Add extra cheese' or 'Pair with our signature wine' is more effective when presented as a simple toggle during the ordering process rather than a verbal question from a server.</p>
    `
  }
};

const ArticleViewer: React.FC<{ id: string | null; onBack: () => void }> = ({ id, onBack }) => {
  const article = id ? (ARTICLE_DATA[id] || ARTICLE_DATA['speed']) : ARTICLE_DATA['speed'];

  return (
    <div className="min-h-screen bg-white font-jakarta animate-fade-in pb-40">
      <header className="bg-white/90 backdrop-blur-2xl sticky top-0 z-[100] border-b border-slate-100 px-6 h-[72px] flex items-center justify-between">
        <div className="max-w-[800px] w-full mx-auto flex items-center justify-between">
          <button onClick={onBack} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all active:scale-90 border border-slate-100">
            <i className="fa-solid fa-chevron-left text-xs"></i>
          </button>
          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em]">{article.category}</span>
          <div className="w-10"></div>
        </div>
      </header>

      <main className="max-w-[800px] mx-auto px-6 py-16 md:py-24">
        <div className="space-y-12">
          <header className="space-y-8">
            <h1 className="text-[44px] md:text-[64px] font-bold tracking-tight text-slate-900 leading-[1.05] uppercase">
              {article.title}
            </h1>
            <div className="flex items-center gap-4 pt-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-100 overflow-hidden">
                <img src="https://i.pravatar.cc/100?u=author" alt="Author" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-[14px] font-bold text-slate-900 uppercase">Editorial Team</p>
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">Published Jan 12, 2025</p>
              </div>
            </div>
          </header>

          <div className="aspect-video w-full rounded-[3.5rem] overflow-hidden shadow-2xl border border-slate-100">
            <img src={article.img} className="w-full h-full object-cover" alt="" />
          </div>

          <div 
            className="prose prose-slate max-w-none prose-lg prose-h3:uppercase prose-h3:tracking-tight prose-h3:font-bold prose-h3:text-slate-900 prose-p:text-slate-600 prose-p:leading-relaxed"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          <div className="pt-20 border-t border-slate-100 flex flex-col items-center">
            <p className="text-[11px] font-bold text-slate-300 uppercase tracking-[0.8em] mb-12">End of Content</p>
            <button 
              onClick={onBack}
              className="px-12 py-6 bg-slate-900 text-white rounded-full font-black uppercase text-[12px] tracking-[0.3em] shadow-xl active:scale-95 transition-all"
            >
              Return to Library
            </button>
          </div>
        </div>
      </main>
      
      <style>{`
        .prose h3 { font-size: 1.75rem; margin-top: 3rem; margin-bottom: 1.5rem; }
        .prose p { font-size: 1.15rem; margin-bottom: 2rem; }
      `}</style>
    </div>
  );
};

export default ArticleViewer;
