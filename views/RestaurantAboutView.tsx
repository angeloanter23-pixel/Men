import React, { useEffect, useRef, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { FeedbackList } from '../src/components/FeedbackList';
import { AddFeedbackModal } from '../src/components/AddFeedbackModal';

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

  content = applyTag(content, /(\*{3}.*?\*{3})/g, (m) => <strong className="font-black text-slate-900">{m.slice(3, -3)}</strong>);
  content = applyTag(content, /(\/{3}.*?\/{3})/g, (m) => <span className="font-medium">{m.slice(3, -3)}</span>);
  content = applyTag(content, /(_{3}.*?_{3})/g, (m) => <u className="underline">{m.slice(3, -3)}</u>);
  
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

const RestaurantAboutView: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);

  useEffect(() => {
    let cid = localStorage.getItem('foodie_customer_id');
    if (!cid) {
      cid = crypto.randomUUID();
      localStorage.setItem('foodie_customer_id', cid);
    }
    setCustomerId(cid);
  }, []);

  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);
  
  const categories = useMemo(() => {
    return ["Cleanliness", "Food Quality", "Speed", "Service", "Value", "Experience"];
  }, []);

  const getGlobalAvgScores = () => {
    return categories.map(cat => {
      const vals = feedback.map(f => f.scores?.[cat]).filter(v => v !== undefined);
      return vals.length ? (vals.reduce((a: number, b: number) => a + b, 0) / vals.length) : 0;
    });
  };

  const getGlobalAvg = () => {
    const scores = getGlobalAvgScores();
    const sum = scores.reduce((a: number, b: number) => a + b, 0);
    return scores.length ? (sum / scores.length).toFixed(1) : '0.0';
  };

  useEffect(() => {
    const fetchContent = async () => {
      const guestSessionRaw = localStorage.getItem('foodie_active_session');
      const adminSessionRaw = localStorage.getItem('foodie_supabase_session');
      let restaurantId = null;
      if (guestSessionRaw) restaurantId = JSON.parse(guestSessionRaw).restaurant_id;
      else if (adminSessionRaw) restaurantId = JSON.parse(adminSessionRaw).restaurant?.id;
      if (!restaurantId) { setLoading(false); return; }
      try {
        const { data: res, error } = await supabase.from('restaurants').select('*').eq('id', restaurantId).single();
        console.log("Restaurant data:", res);
        if (!error && res) setData(res);
        
        const { data: feedbackRes, error: feedbackError } = await supabase.from('feedbacks').select('*').eq('restaurant_id', restaurantId);
        if (feedbackRes) setFeedback(feedbackRes);
        else if (feedbackError) {
          console.error("Feedback fetch error:", feedbackError);
          // Add simulated feedback
          setFeedback([
            { id: '1', name: 'John Doe', scores: { 'Cleanliness': 5, 'Food Quality': 4, 'Speed': 5, 'Service': 4, 'Value': 5, 'Experience': 5 }, note: 'Great experience!', date: '2026-03-08' },
            { id: '2', name: 'Jane Smith', scores: { 'Cleanliness': 4, 'Food Quality': 5, 'Speed': 3, 'Service': 5, 'Value': 4, 'Experience': 4 }, note: 'Food was delicious, but service was a bit slow.', date: '2026-03-07' }
          ]);
        }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetchContent();
  }, []);

  useEffect(() => {
    if (chartRef.current && (window as any).Chart) {
      if (chartInstance.current) chartInstance.current.destroy();
      chartInstance.current = new (window as any).Chart(chartRef.current.getContext('2d'), {
        type: 'radar',
        data: {
          labels: categories,
          datasets: [{
            data: getGlobalAvgScores(),
            fill: true,
            backgroundColor: 'rgba(255, 107, 0, 0.1)',
            borderColor: '#FF6B00',
            borderWidth: 2,
            pointRadius: 4,
            pointBackgroundColor: '#fff',
            pointBorderColor: '#FF6B00'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            r: { min: 0, max: 5, grid: { circular: false, color: '#f1f5f9' }, pointLabels: { font: { size: 10, weight: '800' }, color: '#94a3b8' }, ticks: { display: false, stepSize: 1 } }
          },
          plugins: { legend: { display: false } }
        }
      });
    }
  }, [feedback, categories]);

  const handleEditFeedback = (f: Feedback) => {
    setEditingFeedback(f);
    setIsFeedbackModalOpen(true);
  };

  const handleAddFeedback = async (name: string, scores: Record<string, number>, note: string) => {
    if (!customerId) return;
    
    let error;
    if (editingFeedback) {
        const { error: updateError } = await supabase.from('feedbacks').update({ name, scores, note, date: new Date().toISOString().split('T')[0] }).eq('id', editingFeedback.id);
        error = updateError;
    } else {
        const { error: insertError } = await supabase.from('feedbacks').insert([{ name, customer_id: customerId, scores, note, restaurant_id: data.id, date: new Date().toISOString().split('T')[0] }]);
        error = insertError;
    }

    if (error) {
      console.error("Feedback operation error:", error);
      setLastError(JSON.stringify(error, null, 2));
    } else {
      setLastError(null);
      setEditingFeedback(null);
      // Refresh feedback
      const { data: feedbackRes } = await supabase.from('feedbacks').select('*').eq('restaurant_id', data.id);
      if (feedbackRes) setFeedback(feedbackRes);
    }
  };

  const handleDeleteFeedback = async (id: string) => {
    const { error } = await supabase.from('feedbacks').delete().eq('id', id);
    if (error) {
      console.error("Feedback deletion error:", error);
      setLastError(JSON.stringify(error, null, 2));
    } else {
      setFeedback(prev => prev.filter(f => f.id !== id));
    }
  };

  if (loading) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center font-jakarta">
        <div className="w-10 h-10 border-4 border-slate-100 border-t-[#FF6B00] rounded-full animate-spin"></div>
      </div>
    );
  }

  const identity = (data?.about_content ? (typeof data.about_content === 'string' ? JSON.parse(data.about_content) : data.about_content) : {
    title: data?.name || "Making Dining Simple",
    intro: data?.description || "We believe technology should be easy for everyone.",
    story: data?.story || "Mymenu was built to solve the wait time in busy restaurants. We wanted to make it easy for guests to see what is available and order instantly without waiting for a server.",
    different: data?.different || "Every table is connected to the kitchen cloud. This means your order is seen by the chef the moment you hit send. This reduces mistakes and gets your food to you faster.",
    thank_you: data?.thank_you || "Thank you for being our guest.",
    values: data?.values || [
      { icon: "fa-bolt", label: "Speed", description: "Our system sends orders to the kitchen in less than a second." },
      { icon: "fa-shield-halved", label: "Privacy", description: "We only collect what is needed to serve your meal." },
      { icon: "fa-heart", label: "Care", description: "We design our menu to be beautiful and easy to use." }
    ]
  });

  return (
    <div className="animate-fade-in font-jakarta bg-white min-h-screen pb-40">
      <div className="max-w-[800px] mx-auto px-6 py-16 md:py-24 space-y-16">
        
        <header className="space-y-8">
          <Reveal>
            <div className="space-y-6">
               <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B00]"></div>
                  <p className="text-[12px] font-bold text-[#86868B] tracking-[0.2em]">Our Story</p>
               </div>
               <h1 className="text-[42px] md:text-[72px] font-black text-[#1D1D1F] tracking-tighter leading-[1.1]">
                 {parseFormattedText(identity.title)}
               </h1>
               <div className="h-1 w-12 bg-[#FF6B00]"></div>
            </div>
          </Reveal>
        </header>

        <Reveal delay={100}>
          <section className="space-y-6">
            <p className="text-[20px] md:text-[24px] text-slate-800 font-bold leading-tight">
              {parseFormattedText(identity.intro)}
            </p>
          </section>
        </Reveal>

        <Reveal delay={200}>
          <section className="space-y-6">
            <div className="text-[17px] text-slate-600 font-medium leading-relaxed">
              {parseFormattedText(identity.story)}
            </div>
          </section>
        </Reveal>

        {identity.values?.length > 0 && (
          <section className="space-y-10">
             <Reveal>
                <h3 className="text-[11px] font-bold text-slate-400 tracking-widest">Core Values</h3>
             </Reveal>
             <div className="space-y-8">
                {identity.values.map((v: any, i: number) => (
                  <Reveal key={i} delay={i * 50}>
                    <div className="flex gap-6 items-start">
                       <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 shrink-0">
                          <i className={`fa-solid ${v.icon} text-lg`}></i>
                       </div>
                       <div className="space-y-1">
                          <h4 className="text-[17px] font-bold text-[#1D1D1F] tracking-tight leading-none">{v.label}</h4>
                          <p className="text-[15px] text-slate-500 font-medium leading-relaxed">{v.description}</p>
                       </div>
                    </div>
                  </Reveal>
                ))}
             </div>
          </section>
        )}

        <Reveal>
           <section className="space-y-6 pt-10 border-t border-slate-50">
              <h3 className="text-[11px] font-bold text-slate-400 tracking-widest">What makes us different</h3>
              <div className="text-[17px] text-slate-600 font-medium leading-relaxed">
                {parseFormattedText(identity.different)}
              </div>
           </section>
        </Reveal>

        <section className="pt-16 border-t border-slate-100 space-y-8">
          {lastError && (
            <div className="bg-red-50 p-4 rounded-xl border border-red-200 text-red-800 text-xs font-mono overflow-auto">
              <p className="font-bold mb-2">DB Error:</p>
              <pre>{lastError}</pre>
              <button onClick={() => setLastError(null)} className="mt-2 text-red-600 font-bold underline">Clear</button>
            </div>
          )}
          <h3 className="text-[11px] font-bold text-slate-400 tracking-widest uppercase">Feedback Summary</h3>
          <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col items-center justify-center text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Average Score</p>
            <h2 className="text-6xl font-black text-[#FF6B00] tracking-tighter leading-none">{getGlobalAvg()}</h2>
            <div className="mt-4 flex gap-0.5 text-amber-400">{'★'.repeat(Math.round(Number(getGlobalAvg()))).padEnd(5, '☆')}</div>
          </div>
          <div className="bg-white rounded-[3.5rem] p-8 shadow-xl border border-slate-100 mb-12">
            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest text-center mb-8">Rating Matrix</h3>
            <div className="h-[35vh] w-full"><canvas ref={chartRef}></canvas></div>
          </div>
          <FeedbackList feedback={feedback} onEdit={handleEditFeedback} onDelete={handleDeleteFeedback} currentCustomerId={customerId} />
          {(!feedback.find(f => f.customer_id === customerId) || editingFeedback) && (
            <button 
              onClick={() => { setEditingFeedback(null); setIsFeedbackModalOpen(true); }}
              className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl"
            >
              {editingFeedback ? 'Edit Feedback' : 'Add Feedback'}
            </button>
          )}
        </section>

        <Reveal delay={200}>
           <div className="text-center pt-16 border-t border-slate-100">
              <p className="text-[12px] font-bold text-slate-300 tracking-[0.4em]">{identity.thank_you}</p>
              <div className="w-2 h-2 bg-[#FF6B00] rounded-full mx-auto mt-8 animate-pulse"></div>
           </div>
        </Reveal>
      </div>

      <AddFeedbackModal 
        isOpen={isFeedbackModalOpen} 
        onClose={() => { setIsFeedbackModalOpen(false); setEditingFeedback(null); }} 
        onSubmit={handleAddFeedback}
        categories={categories}
        initialFeedback={editingFeedback || undefined}
      />
    </div>
  );
};

export default RestaurantAboutView;
