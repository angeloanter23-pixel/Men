
import React, { useState, useEffect, useRef } from 'react';
import { Feedback } from '../types';

interface FeedbackFormProps {
  onSubmit: (feedback: Feedback) => void;
  onCancel: () => void;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({ onSubmit, onCancel }) => {
  const categories = ["Cleanliness", "Food Quality", "Speed", "Service", "Value", "Experience"];
  const [scores, setScores] = useState<Record<string, number>>(
    Object.fromEntries(categories.map(c => [c, 3]))
  );
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
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
      chartInstance.current.data.datasets[0].data = categories.map(c => scores[c]);
      chartInstance.current.update();
    }
  }, [scores]);

  const initChart = () => {
    if (!chartRef.current || !(window as any).Chart) return;
    const ctx = chartRef.current.getContext('2d');
    chartInstance.current = new (window as any).Chart(ctx, {
      type: 'radar',
      data: {
        labels: categories,
        datasets: [{
          data: categories.map(c => scores[c]),
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

  const handleSubmit = () => {
    const feedback: Feedback = {
      id: `fb-${Date.now()}`,
      name: name || 'Anonymous',
      scores,
      note,
      date: new Date().toISOString().split('T')[0]
    };
    onSubmit(feedback);
  };

  return (
    <div className="min-h-screen bg-[#FBFBFD] p-6 pb-40 animate-fade-in flex flex-col font-['Plus_Jakarta_Sans']">
      <header className="mb-12 text-center">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl shadow-sm border border-emerald-100">
          <i className="fa-solid fa-check"></i>
        </div>
        <h1 className="text-4xl font-black tracking-tighter text-slate-900 leading-none uppercase">Thanks for <span className="text-brand-primary">dining!</span></h1>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-3">We value your honest feedback</p>
        
        <div className="mt-8 flex flex-col items-center">
           <span className="text-5xl font-black text-brand-primary tracking-tighter leading-none">{calculateAvg()}</span>
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
              className="w-full p-5 rounded-2xl bg-white border border-slate-200 font-bold outline-none focus:ring-4 ring-brand-primary/5 transition-all shadow-sm" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Your Thoughts</label>
            <textarea 
              placeholder="How was the food and service?" 
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full p-6 rounded-[2rem] bg-white border border-slate-200 font-bold text-sm h-32 outline-none resize-none focus:ring-4 ring-brand-primary/5 transition-all shadow-sm"
            ></textarea>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-xl shadow-slate-100 space-y-10">
          <h3 className="text-[10px] font-black uppercase text-slate-900 tracking-[0.3em] text-center mb-4">Rate your experience</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            {categories.map(cat => (
              <div key={cat} className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{cat}</label>
                  <span className="text-brand-primary font-black text-xs bg-brand-secondary px-2 py-0.5 rounded-lg">{scores[cat].toFixed(1)}</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="5" 
                  step="0.5" 
                  value={scores[cat]} 
                  onChange={(e) => setScores(prev => ({...prev, [cat]: parseFloat(e.target.value)}))}
                  className="accent-brand-primary w-full h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer"
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
            className="w-full bg-slate-900 text-white py-6 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl active:scale-95 transition-all hover:bg-black"
          >
            Submit Review
          </button>
          <button 
            onClick={onCancel} 
            className="w-full py-4 rounded-[2rem] font-black uppercase text-[10px] text-slate-300 hover:text-rose-500 tracking-widest transition-all"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackForm;
