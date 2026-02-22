import React from 'react';
import { Reveal } from './Reveal';

export const NodeRegistrySection: React.FC = () => {
  return (
    <section id="node-registry" className="py-24 bg-white font-jakarta">
      <div className="max-w-2xl mx-auto px-6">
        <Reveal>
          <header className="mb-16">
            <div className="flex items-center gap-3 mb-6">
               <div className="w-2 h-2 rounded-full bg-slate-900"></div>
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">Infrastructure</p>
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-slate-900 uppercase leading-none">
              Node Registry
            </h1>
            <div className="h-1 w-12 bg-[#FF6B00] mt-6"></div>
          </header>
        </Reveal>

        <div className="space-y-12">
          <Reveal delay={100}>
            <p className="text-slate-500 text-[15px] leading-relaxed font-medium">
              The Node Registry is a decentralized ledger of all active QR nodes within the mymenu.asia ecosystem.
            </p>
          </Reveal>
          
          <Reveal delay={200}>
            <div className="bg-slate-900 p-8 rounded-2xl text-white">
              <div className="font-mono text-xs text-slate-400 mb-4">REGISTRY STATUS</div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="font-bold tracking-widest uppercase text-sm">Operational</span>
              </div>
              <div className="space-y-2 font-mono text-xs text-slate-500">
                <div className="flex justify-between">
                  <span>Active Nodes</span>
                  <span className="text-white">14,203</span>
                </div>
                <div className="flex justify-between">
                  <span>Transactions (24h)</span>
                  <span className="text-white">89,442</span>
                </div>
                <div className="flex justify-between">
                  <span>Block Height</span>
                  <span className="text-white">#99201</span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};
