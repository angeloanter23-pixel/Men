
import React from 'react';

interface PortfolioViewProps {
  onBack: () => void;
}

const PortfolioView: React.FC<PortfolioViewProps> = ({ onBack }) => {
  const projects = [
    {
      title: "Digital Menu Ecosystem",
      desc: "High-fidelity digital menus with smart categories and instant ordering. Optimized for mobile precision.",
      icon: "fa-utensils",
      color: "bg-indigo-600"
    },
    {
      title: "Admin Command Center",
      desc: "Real-time sales analytics, branch management, and inventory control for modern hospitality.",
      icon: "fa-chart-line",
      color: "bg-slate-900"
    },
    {
      title: "Cloud Sync Engine",
      desc: "Sub-second database updates for table ordering and kitchen ticket management.",
      icon: "fa-cloud-arrow-up",
      color: "bg-brand-primary"
    },
    {
      title: "AI Gourmet Assistant",
      desc: "Intelligent concierge powered by Gemini for personalized food recommendations.",
      icon: "fa-wand-magic-sparkles",
      color: "bg-emerald-600"
    }
  ];

  return (
    <div className="min-h-screen bg-white animate-fade-in font-jakarta">
      <div className="max-w-[1000px] mx-auto px-6 py-12 md:py-24">
        
        {/* Simplified Header */}
        <header className="mb-20">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Our Work</p>
          </div>
          <h1 className="text-5xl md:text-8xl font-black text-slate-900 tracking-tighter uppercase leading-[0.85] mb-8">
            Digital <br /><span className="text-brand-primary">Portfolio.</span>
          </h1>
          <p className="text-slate-500 text-lg md:text-xl font-medium leading-relaxed max-w-xl">
            Showcasing the core technologies and design principles behind the Foodie Premium single-page application.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {projects.map((p, i) => (
            <div key={i} className="bg-slate-50 p-10 rounded-[3.5rem] border border-slate-100 group hover:bg-white hover:shadow-2xl hover:border-slate-50 transition-all duration-500 flex flex-col justify-between h-full">
              <div>
                <div className={`w-14 h-14 ${p.color} text-white rounded-2xl flex items-center justify-center mb-10 shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                  <i className={`fa-solid ${p.icon} text-xl`}></i>
                </div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-4">{p.title}</h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">{p.desc}</p>
              </div>
              
              <div className="pt-10 flex items-center gap-4">
                 <div className="h-px bg-slate-200 flex-1"></div>
                 <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none">Module {i + 1}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 pt-20 border-t border-slate-100 flex flex-col items-center text-center">
           <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] mb-10">End of Showcase</p>
           <button 
            onClick={onBack}
            className="px-12 py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-[0.3em] shadow-2xl active:scale-95 transition-all hover:bg-indigo-600"
           >
             Return to Menu
           </button>
        </div>
      </div>

      <footer className="py-20 text-center opacity-10">
         <p className="text-[10px] font-black uppercase tracking-[1em]">PLATINUM CORE ARCHITECTURE</p>
      </footer>
    </div>
  );
};

export default PortfolioView;
