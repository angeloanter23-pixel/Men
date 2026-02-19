import React from 'react';
import { Reveal } from './Reveal';

const FLAG_IMAGES = [
  "https://flagcdn.com/w160/jp.png",
  "https://flagcdn.com/w160/kr.png",
  "https://flagcdn.com/w160/ph.png",
  "https://flagcdn.com/w160/sg.png"
];

interface HeroSectionProps {
  onStart: () => void;
  onCreateMenu: () => void;
  onAffiliateAuth: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onStart, onCreateMenu, onAffiliateAuth }) => (
  <section className="relative pt-40 pb-20 md:pt-60 md:pb-40 text-center px-6">
    <div className="max-w-3xl mx-auto space-y-12">
      <Reveal>
        <div className="space-y-8">
          <p className="text-orange-500 font-bold uppercase tracking-[0.3em] text-[11px]">Platform Evolution</p>
          <h1 className="text-[44px] md:text-[76px] font-bold tracking-tight text-slate-900 leading-[1.05]">
            The future of <br />
            dining. Simple. Seamless.
          </h1>
          <p className="text-[17px] md:text-[22px] text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
            MyMenu lets your customers scan a QR code at the table, view the menu, and order using their phone—no app needed.
          </p>
        </div>
      </Reveal>

      <Reveal delay={200}>
        <div className="flex flex-col items-center gap-8">
          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
            <button 
              onClick={onStart}
              className="px-12 py-5 bg-orange-500 text-white rounded-full font-bold text-[15px] shadow-2xl shadow-orange-200 transition-all hover:bg-orange-600 active:scale-95"
            >
              Experience Demo
            </button>
          </div>
          
          <div className="flex flex-col items-center gap-12">
            <button 
              onClick={onCreateMenu}
              className="text-[#007AFF] font-semibold text-[17px] flex items-center gap-1.5 hover:underline transition-all group"
            >
              Create your menu 
              <i className="fa-solid fa-chevron-right text-[11px] mt-0.5 transition-transform group-hover:translate-x-1"></i>
            </button>

            {/* Flags Row */}
            <div className="space-y-6">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Top country who use mymenu</p>
              <div className="flex justify-center gap-6">
                {FLAG_IMAGES.map((url, i) => (
                  <div key={i} className="w-10 h-10 rounded-full border border-slate-100 shadow-sm overflow-hidden transition-all hover:scale-110 active:scale-90 cursor-default">
                    <img src={url} className="w-full h-full object-cover" alt="Region" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  </section>
);