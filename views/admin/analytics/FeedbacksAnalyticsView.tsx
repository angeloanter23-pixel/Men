
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Feedback } from '../../../types';
import * as MenuService from '../../../services/menuService';

interface FeedbacksAnalyticsViewProps {
  feedbacks: Feedback[];
  chartRef: React.RefObject<HTMLCanvasElement | null>;
  appTheme: any;
  onThemeUpdate: (theme: any) => void;
}

const FeedbacksAnalyticsView: React.FC<FeedbacksAnalyticsViewProps> = ({ feedbacks, chartRef, appTheme, onThemeUpdate }) => {
  const [editingFeedback, setEditingFeedback] = useState<Feedback | null>(null);
  const [isManagingMetrics, setIsManagingMetrics] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newMetricName, setNewMetricName] = useState('');
  
  const editChartRef = useRef<HTMLCanvasElement>(null);
  const editChartInstance = useRef<any>(null);

  const categories = useMemo(() => {
    return appTheme?.feedback_metrics || ["Cleanliness", "Food Quality", "Speed", "Service", "Value", "Experience"];
  }, [appTheme?.feedback_metrics]);

  const getGlobalAvg = () => {
    if (!feedbacks || feedbacks.length === 0) return '0.0';
    let totalScore = 0;
    let totalCount = 0;
    feedbacks.forEach(f => {
      categories.forEach(cat => {
        if (f.scores && f.scores[cat] !== undefined) {
          totalScore += (f.scores[cat] as number);
          totalCount++;
        }
      });
    });
    return totalCount > 0 ? (totalScore / totalCount).toFixed(1) : '0.0';
  };

  const handleSaveFeedback = async () => {
    if (!editingFeedback || isSaving) return;
    setIsSaving(true);
    try {
        const sessionRaw = localStorage.getItem('foodie_supabase_session');
        const session = sessionRaw ? JSON.parse(sessionRaw) : null;
        await MenuService.upsertFeedback({ ...editingFeedback, restaurant_id: session?.restaurant?.id });
        setEditingFeedback(null);
    } catch (e) { 
        console.error("Save error"); 
    } finally { 
        setIsSaving(false); 
    }
  };

  const handleAddMetric = async () => {
    const name = newMetricName.trim();
    if (!name) return;
    if (categories.some(c => c.toLowerCase() === name.toLowerCase())) {
        alert("Already exists.");
        return;
    }
    const updatedMetrics = [...categories, name];
    await persistMetrics(updatedMetrics);
    setNewMetricName('');
  };

  const handleRemoveMetric = async (name: string) => {
    if (!confirm(`Remove "${name}"?`)) return;
    const updatedMetrics = categories.filter(c => c !== name);
    await persistMetrics(updatedMetrics);
  };

  const persistMetrics = async (newMetrics: string[]) => {
    setIsSaving(true);
    try {
        const sessionRaw = localStorage.getItem('foodie_supabase_session');
        const session = sessionRaw ? JSON.parse(sessionRaw) : null;
        const updatedTheme = { ...appTheme, feedback_metrics: newMetrics };
        await MenuService.updateRestaurantTheme(session?.restaurant?.id, updatedTheme);
        onThemeUpdate(updatedTheme);
    } catch (e) { 
        console.error("Sync error"); 
    } finally { 
        setIsSaving(false); 
    }
  };

  useEffect(() => {
    if (editingFeedback && editChartRef.current && (window as any).Chart) {
      if (editChartInstance.current) editChartInstance.current.destroy();
      editChartInstance.current = new (window as any).Chart(editChartRef.current.getContext('2d'), {
        type: 'radar',
        data: {
          labels: categories,
          datasets: [{
            data: categories.map(cat => editingFeedback.scores[cat] || 0),
            fill: true,
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            borderColor: '#6366f1',
            borderWidth: 2
          }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            scales: { r: { min: 0, max: 5, ticks: { display: false }, pointLabels: { font: { weight: '700', size: 11, family: 'Plus Jakarta Sans' } } } }, 
            plugins: { legend: { display: false } } 
        }
      });
    }
  }, [editingFeedback, categories]);

  const ListRow: React.FC<{ icon: string; color: string; label: string; value?: string; onClick?: () => void; isLast?: boolean; trailingIcon?: string }> = ({ icon, color, label, value, onClick, isLast, trailingIcon }) => (
    <button 
      onClick={onClick}
      disabled={!onClick}
      className={`w-full flex items-center justify-between py-5 px-6 transition-all active:bg-slate-50 ${!isLast ? 'border-b border-slate-50' : ''}`}
    >
      <div className="flex items-center gap-4">
        <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center text-white shadow-sm shrink-0`}>
          <i className={`fa-solid ${icon} text-[15px]`}></i>
        </div>
        <span className="text-[16px] font-bold text-slate-800 tracking-tight">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        {value && <span className="text-[16px] font-black text-indigo-600 tabular-nums">{value}</span>}
        {trailingIcon && <i className="fa-solid fa-chevron-right text-slate-200 text-xs"></i>}
      </div>
    </button>
  );

  return (
    <div className="space-y-12 animate-fade-in pb-48 font-jakarta max-w-lg mx-auto w-full">
      
      {/* Overview Chart */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <header className="mb-10 text-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Feedback overview</p>
          <h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-none uppercase">Rating graph</h3>
        </header>

        <div className="h-[320px] w-full relative">
          <canvas ref={chartRef}></canvas>
        </div>
      </div>

      {/* Stats List */}
      <section className="space-y-4">
        <div className="px-6 flex items-center gap-3">
          <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest">General stats</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <ListRow icon="fa-star" color="bg-indigo-600" label="Average score" value={`★ ${getGlobalAvg()}`} />
          <ListRow icon="fa-message" color="bg-slate-900" label="Total reviews" value={String(feedbacks?.length || 0)} isLast />
        </div>
      </section>

      {/* Settings List */}
      <section className="space-y-4">
        <div className="px-6 flex items-center gap-3">
          <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Configuration</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <ListRow 
            icon="fa-list-check" 
            color="bg-emerald-500" 
            label="Rating categories" 
            onClick={() => setIsManagingMetrics(true)} 
            trailingIcon="fa-chevron-right"
            isLast 
          />
        </div>
      </section>

      {/* Feed List */}
      <section className="space-y-4 pt-4">
        <div className="px-6 flex items-center gap-3">
          <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Guest reviews</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-50">
          {feedbacks?.length > 0 ? feedbacks.map((f, idx) => {
            const activeScores = categories.map(cat => f.scores[cat]).filter(s => s !== undefined) as number[];
            const avg = activeScores.length > 0 ? (activeScores.reduce((a, b) => a + b, 0) / activeScores.length).toFixed(1) : '0.0';
            return (
              <div key={f.id} className="p-7 flex flex-col gap-6 hover:bg-slate-50 transition-colors group text-left">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-black text-base shrink-0 uppercase border border-slate-50">
                      {f.name.charAt(0) || 'G'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[17px] font-black text-slate-900 tracking-tight leading-none mb-1.5 truncate uppercase">{f.name || 'Guest'}</p>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-indigo-600 tabular-nums bg-indigo-50 px-2 py-0.5 rounded-md">★ {avg}</span>
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{f.date}</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setEditingFeedback(f)} 
                    className="w-11 h-11 rounded-xl bg-white border border-slate-100 text-slate-300 hover:text-indigo-600 transition-all flex items-center justify-center shrink-0 active:scale-90 shadow-sm"
                  >
                    <i className="fa-solid fa-pen-to-square text-base"></i>
                  </button>
                </div>
                <div className="pl-14">
                  <p className="text-[15px] font-medium text-slate-600 leading-relaxed border-l-2 border-slate-100 pl-6">
                    {f.note || 'No specific comments provided.'}
                  </p>
                </div>
              </div>
            );
          }) : (
            <div className="py-24 text-center space-y-6 px-10">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto text-3xl shadow-inner">
                <i className="fa-solid fa-inbox"></i>
              </div>
              <p className="text-[11px] font-black uppercase text-slate-300 tracking-widest leading-relaxed">No reviews yet</p>
            </div>
          )}
        </div>
      </section>

      {/* CATEGORY MODAL */}
      {isManagingMetrics && (
          <div className="fixed inset-0 z-[2000] flex items-end justify-center p-0 sm:p-6">
              {/* Clean Transparent Invisible Backdrop */}
              <div onClick={() => !isSaving && setIsManagingMetrics(false)} className="absolute inset-0 transition-opacity duration-500" />
              
              <div className="relative bg-white w-full max-w-lg rounded-t-[2.5rem] sm:rounded-2xl shadow-[0_0_100px_rgba(0,0,0,0.18)] flex flex-col h-[85vh] md:h-auto overflow-hidden animate-slide-up">
                  <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto my-5 shrink-0 opacity-50" />
                  
                  <header className="px-8 pb-6 shrink-0 flex justify-between items-center border-b border-slate-50">
                      <div>
                        <h3 className="text-2xl font-black uppercase text-slate-900 tracking-tighter leading-none">Categories</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Edit items guests score</p>
                      </div>
                      <button onClick={() => setIsManagingMetrics(false)} className="w-10 h-10 rounded-full bg-slate-50 text-slate-300 hover:text-slate-900 transition-all flex items-center justify-center active:scale-90 border border-slate-100"><i className="fa-solid fa-xmark"></i></button>
                  </header>

                  <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-10">
                      <div className="space-y-6">
                         <div className="flex gap-3">
                            <input 
                              type="text" 
                              value={newMetricName} 
                              onChange={e => setNewMetricName(e.target.value)} 
                              placeholder="Add category..." 
                              className="flex-1 bg-white border border-slate-200 p-5 rounded-xl font-bold text-base outline-none focus:border-indigo-600 transition-all shadow-sm" 
                            />
                            <button 
                              onClick={handleAddMetric} 
                              disabled={!newMetricName.trim() || isSaving} 
                              className="px-8 bg-indigo-600 text-white rounded-xl font-black uppercase text-[11px] tracking-widest shadow-xl active:scale-95 disabled:opacity-50 transition-all"
                            >
                              Add
                            </button>
                         </div>
                         
                         <div className="space-y-3">
                            {categories.map((cat, idx) => (
                                <div key={idx} className="bg-white border border-slate-100 px-6 py-4 rounded-xl flex items-center justify-between transition-all hover:border-indigo-200 shadow-sm">
                                  <span className="text-[15px] font-bold text-slate-800 uppercase tracking-tight">{cat}</span>
                                  <button onClick={() => handleRemoveMetric(cat)} className="text-slate-200 hover:text-rose-500 transition-colors active:scale-90">
                                    <i className="fa-solid fa-circle-minus text-xl"></i>
                                  </button>
                                </div>
                            ))}
                         </div>
                      </div>
                  </div>

                  <div className="p-8 bg-white border-t border-slate-50 shrink-0">
                      <button 
                        onClick={() => setIsManagingMetrics(false)}
                        className="w-full py-6 bg-slate-900 text-white rounded-xl font-black uppercase text-[13px] tracking-widest shadow-2xl active:scale-95 transition-all"
                      >
                        Done
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* REVIEW EDITOR MODAL */}
      {editingFeedback && (
          <div className="fixed inset-0 z-[2000] flex items-end justify-center p-0 sm:p-6">
              {/* Clean Transparent Invisible Backdrop */}
              <div onClick={() => !isSaving && setEditingFeedback(null)} className="absolute inset-0 transition-opacity duration-500" />
              
              <div className="relative bg-white w-full max-w-lg rounded-t-[2.5rem] sm:rounded-2xl shadow-[0_0_100px_rgba(0,0,0,0.18)] flex flex-col h-[90vh] md:h-auto overflow-hidden animate-slide-up">
                  <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto my-5 shrink-0 opacity-50" />
                  
                  <header className="px-8 pb-6 shrink-0 flex justify-between items-center border-b border-slate-50">
                      <div>
                        <h3 className="text-2xl font-black uppercase text-slate-900 tracking-tighter leading-none">Edit Review</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Adjust scores manually</p>
                      </div>
                      <button onClick={() => setEditingFeedback(null)} className="w-10 h-10 rounded-full bg-slate-50 text-slate-300 hover:text-slate-900 transition-all flex items-center justify-center active:scale-90 border border-slate-100"><i className="fa-solid fa-xmark"></i></button>
                  </header>

                  <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-12 pb-32">
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Name</label>
                          <input 
                            value={editingFeedback.name} 
                            onChange={e => setEditingFeedback({...editingFeedback, name: e.target.value})} 
                            className="w-full bg-white p-5 rounded-xl font-bold text-base text-slate-900 outline-none shadow-sm border border-slate-200 focus:border-indigo-600 transition-all" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Comments</label>
                          <textarea 
                            value={editingFeedback.note} 
                            onChange={e => setEditingFeedback({...editingFeedback, note: e.target.value})} 
                            className="w-full bg-white p-5 rounded-xl font-medium text-base text-slate-600 outline-none h-32 resize-none shadow-sm border border-slate-200 focus:border-indigo-600 transition-all leading-relaxed" 
                          />
                        </div>
                      </div>

                      <div className="space-y-10 pt-10 border-t border-slate-50">
                         <div className="h-[260px] w-full relative bg-white rounded-2xl p-6 border border-slate-100 shadow-inner">
                            <canvas ref={editChartRef}></canvas>
                         </div>
                         
                         <div className="grid grid-cols-1 gap-8">
                            {categories.map(cat => (
                                <div key={cat} className="space-y-4 bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[12px] font-black uppercase text-slate-400 tracking-widest">{cat}</span>
                                        <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100 shadow-sm">{ (editingFeedback.scores[cat] || 3).toFixed(1) }</span>
                                    </div>
                                    <input 
                                      type="range" 
                                      min="1" 
                                      max="5" 
                                      step="0.5" 
                                      value={editingFeedback.scores[cat] || 3} 
                                      onChange={e => setEditingFeedback({ ...editingFeedback, scores: { ...editingFeedback.scores, [cat]: parseFloat(e.target.value) } })} 
                                      className="w-full accent-indigo-600 h-1.5 rounded-full bg-slate-100 cursor-pointer" 
                                    />
                                </div>
                            ))}
                         </div>
                      </div>
                  </div>

                  <div className="p-8 bg-white border-t border-slate-100 shrink-0">
                      <button 
                        onClick={handleSaveFeedback} 
                        disabled={isSaving} 
                        className="w-full py-6 bg-slate-900 text-white rounded-xl font-black uppercase text-[13px] tracking-widest shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4"
                      >
                         {isSaving ? <i className="fa-solid fa-spinner animate-spin"></i> : 'Confirm Changes'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      <style>{`
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.23, 1, 0.32, 1) forwards; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        input[type=range] { -webkit-appearance: none; appearance: none; background: transparent; }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 28px;
          width: 28px;
          border-radius: 50%;
          background: #ffffff;
          box-shadow: 0 4px 12px rgba(0,0,0,0.12);
          border: 1px solid #E2E8F0;
          margin-top: -13px;
          cursor: pointer;
        }
        input[type=range]::-webkit-slider-runnable-track {
          width: 100%;
          height: 3px;
          cursor: pointer;
          background: #E2E8F0;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default FeedbacksAnalyticsView;
