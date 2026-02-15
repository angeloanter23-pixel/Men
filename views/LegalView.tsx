
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface LegalViewProps {
  title: string;
}

const LegalView: React.FC<LegalViewProps> = ({ title }) => {
  const isTerms = title.toLowerCase().includes('terms');
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      const guestSessionRaw = localStorage.getItem('foodie_active_session');
      const adminSessionRaw = localStorage.getItem('foodie_supabase_session');
      
      let restaurantId = null;
      if (guestSessionRaw) restaurantId = JSON.parse(guestSessionRaw).restaurant_id;
      else if (adminSessionRaw) restaurantId = JSON.parse(adminSessionRaw).restaurant?.id;

      if (!restaurantId) {
        setLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('restaurants')
          .select('terms_content, privacy_content')
          .eq('id', restaurantId)
          .single();
        
        if (!error && data) {
          const dbValue = isTerms ? data.terms_content : data.privacy_content;
          if (dbValue && dbValue.trim() !== "") {
            setContent(dbValue);
          }
        }
      } catch (e) {
        console.error("Legal fetch error", e);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [isTerms]);

  if (loading) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center font-jakarta">
        <div className="w-10 h-10 border-4 border-slate-100 border-t-orange-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen font-jakarta">
      <div className="max-w-2xl mx-auto px-6 py-16 md:py-24">
        <header className="mb-16">
          <div className="flex items-center gap-3 mb-6">
             <div className="w-2 h-2 rounded-full bg-slate-900"></div>
             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.4em]">Official Record</p>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-slate-900 uppercase leading-none">
            {title}
          </h1>
          <div className="h-1 w-12 bg-orange-500 mt-6"></div>
        </header>

        <div className="prose prose-slate max-w-none">
          {content ? (
            <div dangerouslySetInnerHTML={{ __html: content }} />
          ) : (
            <div className="space-y-12">
               <section className="space-y-3">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Document Pending</h3>
                  <p className="text-slate-500 text-[13px] leading-relaxed font-medium">
                    This document is currently being finalized by the restaurant owner.
                  </p>
               </section>
            </div>
          )}
        </div>

        <div className="mt-24 pt-12 border-t border-slate-100 text-center">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">
            PLATINUM CORE • MYMENU.ASIA
          </p>
        </div>
      </div>
      <style>{`
        .prose h3 { font-size: 1.1rem; font-weight: 800; text-transform: uppercase; margin-top: 2.5rem; margin-bottom: 1rem; color: #0f172a; letter-spacing: 0.05em; }
        .prose p { margin-bottom: 1.25rem; color: #64748b; line-height: 1.6; font-size: 15px; }
        .prose ul { margin-bottom: 1.5rem; padding-left: 1.25rem; list-style-type: none; }
        .prose li { margin-bottom: 0.75rem; color: #64748b; position: relative; padding-left: 1.5rem; font-size: 15px; }
        .prose li::before { content: '•'; position: absolute; left: 0; color: #f97316; font-weight: bold; }
        .prose b, .prose strong { color: #0f172a; font-weight: 800; }
      `}</style>
    </div>
  );
};

export default LegalView;
