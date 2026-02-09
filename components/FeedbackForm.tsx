
import React, { useState, useEffect, useRef } from 'react';
import { Feedback } from '../types';
import * as MenuService from '../services/menuService';

interface FeedbackFormProps {
  restaurantId?: string;
  onSubmit: (feedback: Feedback) => void;
  onCancel: () => void;
  appTheme: any;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({ restaurantId, onSubmit, onCancel, appTheme }) => {
  const categories = appTheme.feedback_metrics || ["Cleanliness", "Food Quality", "Speed", "Service", "Value", "Experience"];
  const [scores, setScores] = useState<Record<string, number>>(
    Object.fromEntries(categories.map((c: string) => [c, 3]))
  );
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dbError, setDbError] = useState<any>(null);
  
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);

  const calculateAvg = () => {
    const vals = Object.values(scores);
    const sum = (vals as number[]).reduce((a, b) => a + b, 0);
    return (sum / vals.length).toFixed(1);
  };

  useEffect(() => {
    if (typeof (window as any).Chart === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
      script.async = true;
      script.onload = () => initChart();
      document.head.appendChild(script);
    } else {
      initChart();
    }
  }, []);

  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.data.labels = categories;
      chartInstance.current.data.datasets[0].data = categories.map((c: string) => scores[c]);
      chartInstance.current.update();
    }
  }, [scores, categories]);

  const initChart = () => {
    if (!chartRef.current || !(window as any).Chart) return;
    const ctx = chartRef.current.getContext('2d');
    chartInstance.current = new (window as any).Chart(ctx, {
      type: 'radar',
      data: {
        labels: categories,
        datasets: [{
          data: categories.map((c: string) => scores[c]),
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
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setDbError(null);
    
    if (!restaurantId) {
        setDbError({ message: "MISSING_RESTAURANT_ID", details: "No active session found. Please scan a table QR first." });
        setIsSubmitting(false);
        return;
    }

    const feedbackData: any = {
      name: name.trim() || 'Guest',
      scores,
      note: note.trim(),
      restaurant_id: restaurantId,
      status: 'published',
      date: new Date().toISOString().split('T')[0]
    };

    try {
        console.log("Submitting feedback:", feedbackData);
        const { data, error } = await MenuService.upsertFeedback(feedbackData);
        
        if (error) {
            console.error("Database Error:", error);
            setDbError(error);
        } else if (data) {
            onSubmit(data);
        }
    } catch (e: any) {
        console.error("Connection error:", e);
        setDbError({ message: "CONNECTION_FAILED", details: e.message });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFD] p-6 pb-40 animate-fade-in flex flex-col font-jakarta">
      <header className="mb-12 text-center">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl shadow-sm border border-emerald-100">
          <i className="fa-solid fa-check"></i>
        </div>
        <h1 className="text-4xl font-black tracking-tighter text-slate-900 leading-none uppercase">Thanks for <span className="text-[#FF6B00]">dining!</span></h1>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-3">We value your honest feedback</p>
        
        <div className="mt-8 flex flex-col items-center">
           <span className="text-5xl font-black text-[#FF6B00] tracking-tighter leading-none">{calculateAvg()}</span>
           <div className="mt-2 text-amber-400 flex text-xl gap-0.5">
             {'★'.repeat(Math.round(Number(calculateAvg()))).padEnd(5, '☆')}
           </div>
        </div>
      </header>

      <div className="max-w-xl mx-auto w-full space-y-12">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Full Name (Optional)</label>
            <input 
              type="text" 
              placeholder="e.g. John Doe" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-5 rounded-2xl bg-white border border-slate-200 font-bold outline-none focus:ring-4 ring-[#FF6B00]/5 transition-all shadow-sm" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Your Thoughts</label>
            <textarea 
              placeholder="How was the food and service?" 
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full p-6 rounded-[2rem] bg-white border border-slate-200 font-bold text-sm h-32 outline-none resize-none focus:ring-4 ring-[#FF6B00]/5 transition-all shadow-sm"
            ></textarea>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-xl shadow-slate-100 space-y-10">
          <h3 className="text-[10px] font-black uppercase text-slate-900 tracking-[0.3em] text-center mb-4">Rate your experience</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            {categories.map((cat: string) => (
              <div key={cat} className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{cat}</label>
                  <span className="text-[#FF6B00] font-black text-xs bg-[#FFF3E0] px-2 py-0.5 rounded-lg">{scores[cat].toFixed(1)}</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="5" 
                  step="0.5" 
                  value={scores[cat]} 
                  onChange={(e) => setScores(prev => ({...prev, [cat]: parseFloat(e.target.value)}))}
                  className="accent-[#FF6B00] w-full h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-[3.5rem] p-8 h-[40vh] border border-slate-100 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-full bg-slate-50/10 pointer-events-none group-hover:bg-slate-50/20 transition-all"></div>
          <canvas ref={chartRef}></canvas>
        </div>

        <div className="space-y-4 pt-4">
          <button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="w-full bg-slate-900 text-white py-6 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl active:scale-95 transition-all hover:bg-black disabled:opacity-50"
          >
            {isSubmitting ? <i className="fa-solid fa-spinner animate-spin"></i> : 'Submit Review'}
          </button>
          <button 
            onClick={onCancel} 
            className="w-full py-4 rounded-[2rem] font-black uppercase text-[10px] text-slate-300 hover:text-rose-500 tracking-widest transition-all"
          >
            Skip for now
          </button>

          {/* DATABASE ERROR LOGS */}
          {dbError && (
            <div className="mt-12 p-8 bg-rose-50 border border-rose-100 rounded-[2.5rem] animate-fade-in shadow-inner">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center text-white text-xs shadow-lg">
                  <i className="fa-solid fa-terminal"></i>
                </div>
                <h4 className="text-[10px] font-black uppercase text-rose-600 tracking-[0.2em]">Database Debug Log</h4>
              </div>
              <div className="bg-rose-900/5 p-5 rounded-2xl font-mono text-[10px] text-rose-700 overflow-x-auto whitespace-pre-wrap leading-relaxed border border-rose-200/20">
                {JSON.stringify(dbError, null, 2)}
              </div>
              <div className="mt-6 flex items-start gap-3">
                 <i className="fa-solid fa-circle-info text-rose-400 text-xs mt-0.5"></i>
                 <p className="text-[10px] font-bold text-rose-500 leading-relaxed italic">
                   Note: If you see "403" or "RLS Policy", please check your Supabase Row Level Security settings for the "feedbacks" table.
                 </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackForm;
