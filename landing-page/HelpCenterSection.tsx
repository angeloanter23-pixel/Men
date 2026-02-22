import React from 'react';
import { Reveal } from './Reveal';

export const HelpCenterSection: React.FC = () => {
  return (
    <section id="help-center" className="py-24 bg-white font-jakarta">
      <div className="max-w-2xl mx-auto px-6">
        <Reveal>
          <header className="mb-16">
            <div className="flex items-center gap-3 mb-6">
               <div className="w-2 h-2 rounded-full bg-slate-900"></div>
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">Support</p>
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-slate-900 uppercase leading-none">
              Help Center
            </h1>
            <div className="h-1 w-12 bg-[#FF6B00] mt-6"></div>
          </header>
        </Reveal>

        <div className="space-y-12">
          <Reveal delay={100}>
            <div className="bg-slate-50 p-6 rounded-2xl">
              <input 
                type="text" 
                placeholder="Search for help..." 
                className="w-full bg-white border-none rounded-xl p-4 text-sm font-medium shadow-sm focus:ring-2 ring-slate-900/5 outline-none"
              />
            </div>
          </Reveal>
          
          <Reveal delay={200}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 border border-slate-100 rounded-xl">
                <h3 className="text-sm font-bold text-slate-900 mb-2">Account & Billing</h3>
                <p className="text-xs text-slate-500">Manage your subscription and payment methods.</p>
              </div>
              <div className="p-6 border border-slate-100 rounded-xl">
                <h3 className="text-sm font-bold text-slate-900 mb-2">Menu Management</h3>
                <p className="text-xs text-slate-500">How to update items, prices, and categories.</p>
              </div>
              <div className="p-6 border border-slate-100 rounded-xl">
                <h3 className="text-sm font-bold text-slate-900 mb-2">Orders & Payments</h3>
                <p className="text-xs text-slate-500">Processing orders and handling refunds.</p>
              </div>
              <div className="p-6 border border-slate-100 rounded-xl">
                <h3 className="text-sm font-bold text-slate-900 mb-2">Technical Support</h3>
                <p className="text-xs text-slate-500">Troubleshooting and system status.</p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};
