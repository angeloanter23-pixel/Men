
import React, { useEffect, useRef, useState } from 'react';
import { Feedback } from '../types';

interface FeedbackDataViewProps {
  feedbacks: Feedback[];
  onAddFeedback: () => void;
}

const FeedbackDataView: React.FC<FeedbackDataViewProps> = ({ feedbacks, onAddFeedback }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);
  const categories = ["Cleanliness", "Food Quality", "Speed", "Service", "Value", "Experience"];
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
      const ctx = chartRef.current.getContext('2d');
      chartInstance.current = new (window as any).Chart(ctx, {
        type: 'radar',
        data: {
          labels: categories,
          datasets: [{
            data: getGlobalAvgScores(),
            fill: true,
            backgroundColor: 'rgba(99, 102, 241, 0.05)',
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
    }
  }, [feedbacks]);

  return (
    <div className="p-6 pb-24 animate-fade-in bg-[#fcfdfe] min-h-screen">
      <header className="mb-8">
        <h1 className="text-3xl font-black tracking-tighter text-slate-800">Visualizer</h1>
        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">
          {getGlobalAvg()} AVG SCORE • {feedbacks.length} ENTRIES
        </p>
      </header>

      <div className="bg-white rounded-[3rem] p-6 shadow-xl border border-slate-100 mb-6">
        <div className="h-[40vh] w-full">
          <canvas ref={chartRef}></canvas>
        </div>
        <button onClick={onAddFeedback} className="w-full mt-6 bg-slate-50 hover:bg-indigo-50 text-indigo-600 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest border border-indigo-100 transition-colors">
          + Add New Feedback Entry
        </button>
      </div>

      <div className="space-y-4 mb-10">
        <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest px-4">Live Feedback Feed</h3>
        <div className="grid grid-cols-1 gap-4">
          {feedbacks.slice(0, 5).map(f => {
            // Fix: Cast Object.values result to number array to resolve arithmetic operation error
            const avg = ((Object.values(f.scores) as number[]).reduce((a, b) => a + b, 0) / categories.length).toFixed(1);
            return (
              <div key={f.id} onClick={() => setSelectedReview(f)} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-50 cursor-pointer hover:border-indigo-200 transition-all">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-black text-sm text-slate-800">{f.name}</h4>
                  <span className="text-indigo-600 font-black text-xs">{avg}</span>
                </div>
                <p className="text-[10px] text-slate-400 font-bold line-clamp-1">{f.note}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest px-4">Database</h3>
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="p-5 text-[10px] font-black uppercase text-slate-400">User</th>
                <th className="p-5 text-[10px] font-black uppercase text-slate-400">Avg</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {feedbacks.map(f => {
                // Fix: Cast Object.values result to number array to resolve arithmetic operation error
                const avg = ((Object.values(f.scores) as number[]).reduce((a, b) => a + b, 0) / categories.length).toFixed(1);
                return (
                  <tr key={f.id} className="hover:bg-indigo-50/50 cursor-pointer transition-colors" onClick={() => setSelectedReview(f)}>
                    <td className="p-5">
                      <div className="font-bold text-xs text-slate-800">{f.name}</div>
                      <div className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">{f.date}</div>
                    </td>
                    <td className="p-5 font-black text-indigo-600 text-xs">{avg}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedReview && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6" onClick={() => setSelectedReview(null)}>
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-black text-slate-800 mb-4">{selectedReview.name}</h2>
            <div className="bg-slate-50 p-4 rounded-2xl mb-4 italic text-sm text-slate-600">"{selectedReview.note}"</div>
            <div className="space-y-2">
              {categories.map(cat => (
                <div key={cat} className="flex justify-between border-b border-slate-50 py-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{cat}</span>
                  <span className="text-xs font-black text-slate-800">{selectedReview.scores[cat]?.toFixed(1)}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setSelectedReview(null)} className="w-full mt-6 bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-[10px]">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackDataView;
