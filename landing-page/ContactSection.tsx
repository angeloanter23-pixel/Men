
import React from 'react';
import { Reveal } from './Reveal';

export const ContactSection: React.FC = () => (
  <section id="contact" className="py-32 bg-white">
    <div className="max-w-[1100px] mx-auto px-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
        <Reveal>
          <div className="space-y-10">
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-orange-500 uppercase tracking-[0.5em]">Direct Access</h3>
              <h2 className="text-[44px] md:text-[56px] font-bold tracking-tight text-slate-900 leading-none uppercase">Let's talk.</h2>
            </div>
            <p className="text-[18px] text-slate-500 font-medium leading-relaxed">Have questions about the platform or need a custom solution? Reach out to our specialist team.</p>
            
            <div className="space-y-8 pt-6">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm"><i className="fa-solid fa-envelope"></i></div>
                <div>
                   <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Email Support</p>
                   <p className="text-lg font-bold text-slate-900">hello@mymenu.asia</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm"><i className="fa-solid fa-location-dot"></i></div>
                <div>
                   <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Global HQ</p>
                   <p className="text-lg font-bold text-slate-900">High Street South, BGC, PH</p>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={200}>
          <div className="bg-slate-50 p-10 md:p-14 rounded-[3.5rem] border border-slate-100 shadow-inner space-y-8">
             <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Full Name</label>
                  <input type="text" className="w-full bg-white border border-slate-200 p-5 rounded-2xl text-sm font-bold outline-none focus:ring-4 ring-indigo-500/5 transition-all" placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Work Email</label>
                  <input type="email" className="w-full bg-white border border-slate-200 p-5 rounded-2xl text-sm font-bold outline-none focus:ring-4 ring-indigo-500/5 transition-all" placeholder="john@restaurant.com" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Message</label>
                  <textarea className="w-full bg-white border border-slate-200 p-5 rounded-2xl text-sm font-medium outline-none focus:ring-4 ring-indigo-500/5 transition-all h-32 resize-none" placeholder="How can we help?" />
                </div>
             </div>
             <button className="w-full py-5 bg-slate-900 text-white rounded-full font-black uppercase text-[11px] tracking-widest shadow-xl shadow-slate-200 active:scale-95 transition-all">Send Inquiry</button>
          </div>
        </Reveal>
      </div>
    </div>
  </section>
);
