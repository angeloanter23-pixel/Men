
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
    // Fix: Explicitly cast values to number array to resolve arithmetic operation type error
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
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          borderColor: '#6366f1',
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: '#fff',
          pointBorderColor: '#6366f1'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: { min: 0, max: 5, grid: { circular: false, color: '#f1f5f9' }, pointLabels: { font: { size: 10, weight: '900' }, color: '#94a3b8' }, ticks: { display: false, stepSize: 1 } }
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
    <div className="min-h-screen bg-white p-6 pb-20 animate-fade-in flex flex-col">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-800">EXPERIENCE</h1>
          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">Submit your rating</p>
        </div>
        <div className="text-right">
          <span className="text-3xl font-black text-indigo-600">{calculateAvg()}</span>
          <div className="text-amber-400 flex text-[10px] justify-end">
            {'★'.repeat(Math.round(Number(calculateAvg()))).padEnd(5, '☆')}
          </div>
        </div>
      </header>

      <div className="flex-1 space-y-8 overflow-y-auto no-scrollbar">
        <div className="bg-slate-50 rounded-[2.5rem] p-6 h-[40vh] border border-slate-100 relative">
          <canvas ref={chartRef}></canvas>
        </div>

        <div className="space-y-4">
          <input 
            type="text" 
            placeholder="Name (Optional)" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-5 rounded-2xl bg-slate-50 border-none font-bold outline-none focus:ring-2 focus:ring-indigo-100" 
          />
          <textarea 
            placeholder="Feedback thoughts..." 
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full p-5 rounded-2xl bg-slate-50 border-none font-bold text-sm h-24 outline-none resize-none focus:ring-2 focus:ring-indigo-100"
          ></textarea>
        </div>

        <div className="grid grid-cols-1 gap-6 pb-12">
          {categories.map(cat => (
            <div key={cat} className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{cat}</label>
                <span className="text-indigo-600 font-black text-xs">{scores[cat].toFixed(1)}</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="5" 
                step="0.5" 
                value={scores[cat]} 
                onChange={(e) => setScores(prev => ({...prev, [cat]: parseFloat(e.target.value)}))}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-md flex gap-4 max-w-xl mx-auto border-t border-slate-100 z-50">
        <button onClick={onCancel} className="flex-1 py-5 rounded-3xl font-black uppercase text-xs text-slate-400 hover:bg-slate-50 transition-all">Cancel</button>
        <button onClick={handleSubmit} className="flex-[2] bg-indigo-600 text-white py-5 rounded-3xl font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-100 active:scale-95 transition-all">Submit Feedback</button>
      </div>
    </div>
  );
};

export default FeedbackForm;
