
import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

const Reveal: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.1 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ transitionDelay: `${delay}ms`, transform: isVisible ? 'translateY(0)' : 'translateY(20px)', opacity: isVisible ? 1 : 0 }} className="transition-all duration-[1000ms] ease-out">
      {children}
    </div>
  );
};

const parseFormattedText = (text: string) => {
  if (!text) return null;
  let content: any[] = [text];
  const applyTag = (parts: any[], regex: RegExp, wrapper: (match: string) => React.ReactNode) => {
    return parts.flatMap(part => {
      if (typeof part !== 'string') return part;
      const split = part.split(regex);
      return split.map((sub, i) => {
        if (sub.match(regex)) return <React.Fragment key={i}>{wrapper(sub)}</React.Fragment>;
        return sub;
      });
    });
  };
  content = applyTag(content, /(\*\*\*.*?\*\*\*)/g, (m) => <strong className="font-black text-slate-900">{m.slice(3, -3)}</strong>);
  content = applyTag(content, /(\/\/\/.*?(\/\/\/))/g, (m) => <em className="italic">{m.slice(3, -3)}</em>);
  content = applyTag(content, /(___.*?___)/g, (m) => <u className="underline">{m.slice(3, -3)}</u>);
  content = content.flatMap(part => {
    if (typeof part !== 'string') return part;
    const split = part.split(/(\[size:.*?\][\s\S]*?\[\/size\])/g);
    return split.map((sub, i) => {
      const match = sub.match(/\[size:(.*?)\](.*?)\[\/size\]/);
      if (match) return <span key={i} className={match[1]}>{match[2]}</span>;
      return sub;
    });
  });
  content = content.flatMap(part => {
    if (typeof part !== 'string') return part;
    const split = part.split(/(\[color:.*?\][\s\S]*?\[\/color\])/g);
    return split.map((sub, i) => {
      const match = sub.match(/\[color:(.*?)\](.*?)\[\/color\]/);
      if (match) return <span key={i} style={{ color: match[1] }}>{match[2]}</span>;
      return sub;
    });
  });
  return <>{content}</>;
};

const AboutView: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      const guestSessionRaw = localStorage.getItem('foodie_active_session');
      const adminSessionRaw = localStorage.getItem('foodie_supabase_session');
      let restaurantId = null;
      if (guestSessionRaw) restaurantId = JSON.parse(guestSessionRaw).restaurant_id;
      else if (adminSessionRaw) restaurantId = JSON.parse(adminSessionRaw).restaurant?.id;
      if (!restaurantId) { setLoading(false); return; }
      try {
        const { data: res, error } = await supabase.from('restaurants').select('about_content').eq('id', restaurantId).single();
        if (!error && res?.about_content) setData(res.about_content);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetchContent();
  }, []);

  if (loading) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center font-jakarta">
        <div className="w-10 h-10 border-4 border-slate-100 border-t-[#FF6B00] rounded-full animate-spin"></div>
      </div>
    );
  }

  const identity = data || {
    title: "Our journey and vision",
    intro: "We provide an unmatched dining experience.",
    story: "Experience a new level of hospitality. We removed the barriers between your hunger and our kitchen.",
    different: "Our platform ensures real-time connection and zero friction.",
    thank_you: "Thank you for visiting us.",
    values: []
  };

  return (
    <div className="animate-fade-in font-jakarta bg-white min-h-screen pb-40">
      <div className="max-w-[800px] mx-auto px-10 py-24 md:py-32 space-y-20">
        
        <header className="space-y-12">
          <Reveal>
            <div className="space-y-8">
               <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B00]"></div>
                  <p className="text-[12px] font-bold text-[#86868B] uppercase tracking-[0.4em]">Our Story</p>
               </div>
               <h1 className="text-[48px] md:text-[84px] font-black text-[#1D1D1F] tracking-tighter leading-[1] uppercase">
                 {parseFormattedText(identity.title)}
               </h1>
               <div className="h-1 w-12 bg-[#FF6B00]"></div>
            </div>
          </Reveal>
        </header>

        <Reveal delay={100}>
          <section className="space-y-8">
            <p className="text-[22px] md:text-[28px] text-slate-800 font-bold leading-tight uppercase">
              {parseFormattedText(identity.intro)}
            </p>
          </section>
        </Reveal>

        <Reveal delay={200}>
          <section className="space-y-8">
            <div className="text-[18px] text-slate-600 font-medium leading-relaxed">
              {parseFormattedText(identity.story)}
            </div>
          </section>
        </Reveal>

        {identity.values?.length > 0 && (
          <section className="space-y-12">
             <Reveal>
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Core Values</h3>
             </Reveal>
             <div className="space-y-12">
                {identity.values.map((v: any, i: number) => (
                  <Reveal key={i} delay={i * 50}>
                    <div className="flex gap-8 items-start">
                       <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 shrink-0">
                          <i className={`fa-solid ${v.icon} text-lg`}></i>
                       </div>
                       <div className="space-y-2">
                          <h4 className="text-[17px] font-bold text-[#1D1D1F] uppercase tracking-tight leading-none">{v.label}</h4>
                          <p className="text-[16px] text-slate-500 font-medium leading-relaxed">{v.description}</p>
                       </div>
                    </div>
                  </Reveal>
                ))}
             </div>
          </section>
        )}

        <Reveal>
           <section className="space-y-8 pt-12 border-t border-slate-50">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">What makes us difference</h3>
              <div className="text-[18px] text-slate-600 font-medium leading-relaxed">
                {parseFormattedText(identity.different)}
              </div>
           </section>
        </Reveal>

        <Reveal delay={200}>
           <div className="text-center pt-24 border-t border-slate-100">
              <p className="text-[12px] font-bold text-slate-300 uppercase tracking-[0.8em]">{identity.thank_you}</p>
              <div className="w-2 h-2 bg-[#FF6B00] rounded-full mx-auto mt-10 animate-pulse"></div>
           </div>
        </Reveal>
      </div>
    </div>
  );
};

export default AboutView;
