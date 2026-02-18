import React, { useEffect, useState } from 'react';
import { Reveal } from './Reveal';
import { supabase } from '../lib/supabase';

export const TermsSection: React.FC = () => {
  const [content, setContent] = useState<string | null>(null);

  useEffect(() => {
    const fetchLandingTerms = async () => {
      const guestSessionRaw = localStorage.getItem('foodie_active_session');
      const adminSessionRaw = localStorage.getItem('foodie_supabase_session');
      
      let restaurantId = null;
      if (guestSessionRaw) restaurantId = JSON.parse(guestSessionRaw).restaurant_id;
      else if (adminSessionRaw) restaurantId = JSON.parse(adminSessionRaw).restaurant?.id;

      if (!restaurantId) return;
      
      try {
        const { data } = await supabase
          .from('restaurants')
          .select('terms_content')
          .eq('id', restaurantId)
          .single();
        
        if (data?.terms_content && data.terms_content.trim() !== "") {
          setContent(data.terms_content);
        }
      } catch (e) {}
    };

    fetchLandingTerms();
  }, []);

  return (
    <section id="terms" className="py-24 bg-white font-jakarta">
      <div className="max-w-2xl mx-auto px-6">
        <Reveal>
          <header className="mb-16">
            <div className="flex items-center gap-3 mb-6">
               <div className="w-2 h-2 rounded-full bg-slate-900"></div>
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">Official Rules</p>
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-slate-900 uppercase leading-none">
              Terms of Use
            </h1>
            <div className="h-1 w-12 bg-[#FF6B00] mt-6"></div>
          </header>
        </Reveal>

        <div className="prose prose-slate max-w-none">
          {content ? (
            <Reveal delay={100}>
              <div dangerouslySetInnerHTML={{ __html: content }} />
            </Reveal>
          ) : (
            <div className="space-y-12">
              <Reveal delay={100}>
                <section className="space-y-3">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">1. Restaurant Duty</h3>
                  <p className="text-slate-500 text-[13px] leading-relaxed font-medium">
                    The restaurant owner is responsible for the menu items, their prices, and the food information provided in this app.
                  </p>
                </section>
              </Reveal>

              <Reveal delay={200}>
                <section className="space-y-3">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">2. Table Codes</h3>
                  <p className="text-slate-500 text-[13px] leading-relaxed font-medium">
                    Please keep your table QR codes safe. Do not share them with people who are not at your table.
                  </p>
                </section>
              </Reveal>

              <Reveal delay={300}>
                <section className="space-y-3">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">3. Order Fulfillment</h3>
                  <p className="text-slate-500 text-[13px] leading-relaxed font-medium">
                    By placing an order, you agree to pay the restaurant for the items ordered. All orders are sent directly to the kitchen.
                  </p>
                </section>
              </Reveal>
            </div>
          )}
        </div>

        <Reveal delay={500}>
          <div className="mt-24 pt-12 border-t border-slate-100">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] text-center">
              CORE SECURITY • MYMENU.ASIA
            </p>
          </div>
        </Reveal>
      </div>
      <style>{`
        .prose h3 { font-size: 1.1rem; font-weight: 800; text-transform: uppercase; margin-top: 2.5rem; margin-bottom: 1rem; color: #0f172a; }
        .prose p { margin-bottom: 1.25rem; color: #64748b; line-height: 1.6; font-size: 15px; }
        .prose b, .prose strong { color: #0f172a; font-weight: 800; }
      `}</style>
    </section>
  );
};