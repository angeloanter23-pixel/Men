
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Feedback } from '../types';

interface FeedbackDataViewProps {
  feedbacks: Feedback[];
  onAddFeedback: () => void;
  appTheme: any;
}

const FeedbackDataView: React.FC<FeedbackDataViewProps> = ({ feedbacks, onAddFeedback, appTheme }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);
  
  const categories = useMemo(() => {
    return appTheme.feedback_metrics || ["Cleanliness", "Food Quality", "Speed", "Service", "Value", "Experience"];
  }, [appTheme.feedback_metrics]);

  const [selectedReview, setSelectedReview] = useState<Feedback | null>(null);

  const getGlobalAvgScores = () => {
    return categories.map(cat => {
      const vals = feedbacks.map(f => f.scores[cat]).filter(v => v !== undefined);
      return vals.length ? (vals.reduce((a: number, b: number) => a + b, 0) / vals.length) : 0;
    });
  };

  const getGlobalAvg = () => {
    const scores = getGlobalAvgScores();
    const sum = scores.reduce((a: number, b: number) => a + b, 0);
    return scores.length ? (sum / scores.length).toFixed(1) : '0.0';
  };

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
  }, [feedbacks, categories]);

  return (
    <div className="p-6 pb-32 animate-fade-in bg-[#FBFBFD] min-h-screen font-jakarta">
      <header className="mb-10 max-w-2xl mx-auto">
        <p className="text-[10px] font-black text-[#FF6B00] uppercase tracking-[0.4em] mb-2">Guest Feedback</p>
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-slate-900 uppercase">Reviews</h1>
      </header>

      <div className="max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
         <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col items-center justify-center text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Average Score</p>
            <h2 className="text-6xl font-black text-[#FF6B00] tracking-tighter leading-none">{getGlobalAvg()}</h2>
            <div className="mt-4 flex gap-0.5 text-amber-400">{'★'.repeat(Math.round(Number(getGlobalAvg()))).padEnd(5, '☆')}</div>
         </div>
         <div className="bg-slate-900 p-8 rounded-[3rem] shadow-xl text-white flex flex-col items-center justify-center text-center">
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Total Reviews</p>
            <h2 className="text-6xl font-black tracking-tighter leading-none">{feedbacks.length}</h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase mt-4">Verified Transactions</p>
         </div>
      </div>

      <div className="bg-white rounded-[3.5rem] p-8 shadow-xl border border-slate-100 mb-12 max-w-2xl mx-auto">
        <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest text-center mb-8">Rating Matrix</h3>
        <div className="h-[40vh] w-full"><canvas ref={chartRef}></canvas></div>
        <button onClick={onAddFeedback} className="w-full mt-10 bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all">Write a Review</button>
      </div>

      <div className="space-y-6 mb-20 max-w-2xl mx-auto">
        <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest px-4">Recent Feedback</h3>
        <div className="grid grid-cols-1 gap-4">
          {feedbacks.map(f => {
            const activeScores = categories.map(cat => f.scores[cat]).filter(s => s !== undefined) as number[];
            const avg = activeScores.length > 0 ? (activeScores.reduce((a, b) => a + b, 0) / activeScores.length).toFixed(1) : '0.0';
            return (
              <div key={f.id} onClick={() => setSelectedReview(f)} className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-50 cursor-pointer hover:shadow-xl transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-black text-base text-slate-800 uppercase tracking-tight">{f.name}</h4>
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-1">{f.date}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[#FF6B00] font-black text-lg tracking-tighter leading-none">{avg}</span>
                    <div className="text-[8px] flex text-amber-400 mt-1">{'★'.repeat(Math.round(Number(avg)))}</div>
                  </div>
                </div>
                <p className="text-sm text-slate-500 font-medium line-clamp-2 leading-relaxed">"{f.note}"</p>
              </div>
            );
          })}
        </div>
      </div>

      {selectedReview && (
        <div className="fixed inset-0 z-[500] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6" onClick={() => setSelectedReview(null)}>
          <div className="bg-white w-full max-w-md rounded-[3.5rem] p-10 lg:p-12 shadow-2xl relative animate-scale" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-8">
               <div><h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2">{selectedReview.name}</h2><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedReview.date}</p></div>
               <button onClick={() => setSelectedReview(null)} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300"><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div className="bg-[#FFF3E0]/30 p-8 rounded-[2.5rem] mb-10 border border-[#FF6B00]/5"><p className="text-slate-700 text-lg leading-relaxed font-medium">"{selectedReview.note}"</p></div>
            <div className="space-y-3 px-2">
              {categories.map(cat => (
                <div key={cat} className="flex justify-between items-center border-b border-slate-50 py-2.5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{cat}</span>
                  <span className="text-sm font-black text-[#FF6B00] tabular-nums">{(selectedReview.scores[cat] || 0).toFixed(1)}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setSelectedReview(null)} className="w-full mt-12 bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl">Close Review</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackDataView;
