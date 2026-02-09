
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Feedback, SalesRecord, MenuItem } from '../../types';
import { supabase } from '../../lib/supabase';
import RevenueView from './analytics/RevenueView';
import DishesView from './analytics/DishesView';
import SectionsView from './analytics/SectionsView';
import FeedbacksAnalyticsView from './analytics/FeedbacksAnalyticsView';

declare const Chart: any;

type AnalyticsTab = 'Revenue' | 'Dishes' | 'Sections' | 'Feedbacks' | 'Record Sale';

export default function AdminAnalytics({ 
  feedbacks, 
  salesHistory, 
  setSalesHistory, 
  menuItems,
  appTheme,
  onThemeUpdate
}: { 
  feedbacks: Feedback[]; 
  salesHistory: SalesRecord[]; 
  setSalesHistory: React.Dispatch<React.SetStateAction<SalesRecord[]>>; 
  menuItems: MenuItem[]; 
  appTheme: any;
  onThemeUpdate: (theme: any) => void;
}) {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('Revenue');
  const [selectedProductId, setSelectedProductId] = useState<number | 'global'>('global');
  
  const [dateFilter, setDateFilter] = useState(new Date().toLocaleDateString('en-CA'));
  const [dbSales, setDbSales] = useState<SalesRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const navContainerRef = useRef<HTMLDivElement>(null);
  const chartRefs = { 
    revenue: useRef<HTMLCanvasElement>(null), 
    product: useRef<HTMLCanvasElement>(null), 
    pie: useRef<HTMLCanvasElement>(null),
    feedback: useRef<HTMLCanvasElement>(null)
  };
  const chartInstances = useRef<Record<string, any>>({});

  const sessionRaw = localStorage.getItem('foodie_supabase_session');
  const session = sessionRaw ? JSON.parse(sessionRaw) : null;
  const restaurantId = session?.restaurant?.id;

  const syncPaidTransactions = async () => {
    if (!restaurantId || restaurantId === "undefined") return;
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('payment_status', 'Paid');

      if (error) throw error;

      if (data) {
        const mappedSales: SalesRecord[] = data.map(o => ({
          timestamp: o.paid_at || o.created_at,
          amount: o.amount,
          itemId: o.item_id,
          itemName: o.item_name,
          categoryName: o.category_name || 'Uncategorized',
          quantity: o.quantity,
          paymentStatus: 'Paid',
          orderStatus: o.order_status
        }));
        setDbSales(mappedSales);
      }
    } catch (err: any) {
      console.error("Analytics Sync failure", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!restaurantId) return;
    syncPaidTransactions();

    const channel = supabase.channel(`analytics-v13-${restaurantId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'orders', 
        filter: `restaurant_id=eq.${restaurantId}` 
      }, () => syncPaidTransactions())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [restaurantId]);

  const filteredHistory = useMemo(() => {
    const combined = [...dbSales, ...salesHistory];
    return combined.filter(record => {
        if (!record.timestamp) return false;
        const recordDateStr = new Date(record.timestamp).toLocaleDateString('en-CA');
        return recordDateStr === dateFilter;
    });
  }, [dbSales, salesHistory, dateFilter]);

  const dailyTotal = useMemo(() => {
    return filteredHistory.reduce((s, r) => s + r.amount, 0);
  }, [filteredHistory]);

  const handleTabClick = (tab: AnalyticsTab, e: React.MouseEvent<HTMLButtonElement>) => {
    setActiveTab(tab);
    e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  };

  const getHourlyData = (productId: number | 'global') => {
    const labels = [];
    const results = [];
    
    for (let i = 1; i <= 24; i++) {
        const h = i % 24;
        const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
        const ampm = h >= 12 ? 'PM' : 'AM';
        labels.push(`${displayHour}${ampm}`);
        results.push(0);
    }

    filteredHistory.forEach(record => {
      if (productId === 'global' || record.itemId === productId) {
        const recordDate = new Date(record.timestamp);
        const hour = recordDate.getHours();
        const idx = (hour === 0) ? 23 : hour - 1;
        if (idx >= 0 && idx < 24) {
            results[idx] += record.amount;
        }
      }
    });

    return { results, labels };
  };

  useEffect(() => {
    if (!(window as any).Chart) return;
    
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 1000, easing: 'easeOutQuart' },
        scales: {
          y: { 
            beginAtZero: true, 
            min: 0,
            grid: { color: 'rgba(0,0,0,0.02)', drawBorder: false }, 
            ticks: { 
              font: { weight: '600', size: 10 }, 
              color: '#94a3b8',
              callback: (val: any) => '₱' + val.toLocaleString()
            } 
          },
          x: { 
            grid: { display: false }, 
            ticks: { font: { weight: '700', size: 10 }, color: '#cbd5e1' } 
          }
        },
        plugins: { 
          legend: { display: false }, 
          tooltip: { 
            backgroundColor: '#1e293b',
            titleFont: { size: 12, weight: 'bold' },
            bodyFont: { size: 11 },
            padding: 12,
            cornerRadius: 12,
            displayColors: false,
            callbacks: {
              label: (ctx: any) => `Revenue: ₱${ctx.raw.toLocaleString()}`
            }
          } 
        }
    };

    if (activeTab === 'Revenue' && chartRefs.revenue.current) {
      if (chartInstances.current.revenue) chartInstances.current.revenue.destroy();
      const { results, labels } = getHourlyData('global');
      const ctx = chartRefs.revenue.current.getContext('2d');
      const gradient = ctx.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, 'rgba(99, 102, 241, 0.25)');
      gradient.addColorStop(1, 'rgba(99, 102, 241, 0)');

      chartInstances.current.revenue = new (window as any).Chart(ctx, {
        type: 'line', 
        data: { 
          labels: labels, 
          datasets: [{ 
            data: results, 
            fill: true, 
            backgroundColor: gradient, 
            borderColor: '#6366f1', 
            borderWidth: 4,
            pointRadius: 4,
            pointBackgroundColor: '#fff',
            pointBorderWidth: 3,
            pointBorderColor: '#6366f1',
            tension: 0.45 
          }] 
        },
        options: { ...commonOptions, scales: { ...commonOptions.scales, y: { ...commonOptions.scales.y, suggestedMax: Math.max(...results) * 1.3 } } }
      });
    }

    if (activeTab === 'Dishes' && chartRefs.product.current) {
      if (chartInstances.current.product) chartInstances.current.product.destroy();
      const { results, labels } = getHourlyData(selectedProductId);
      const ctx = chartRefs.product.current.getContext('2d');
      chartInstances.current.product = new (window as any).Chart(ctx, {
        type: 'bar', 
        data: { 
            labels: labels, 
            datasets: [{ 
                data: results, 
                backgroundColor: '#6366f1', 
                borderRadius: 8, 
                maxBarThickness: 40 
            }] 
        },
        options: { ...commonOptions, scales: { ...commonOptions.scales, y: { ...commonOptions.scales.y, suggestedMax: Math.max(...results) * 1.3 } } }
      });
    }

    if (activeTab === 'Sections' && chartRefs.pie.current) {
      if (chartInstances.current.pie) chartInstances.current.pie.destroy();
      const catMap: Record<string, number> = {};
      filteredHistory.forEach(r => catMap[r.categoryName] = (catMap[r.categoryName] || 0) + r.amount);
      chartInstances.current.pie = new (window as any).Chart(chartRefs.pie.current.getContext('2d'), {
        type: 'doughnut', 
        data: { 
          labels: Object.keys(catMap).length ? Object.keys(catMap) : ['No Data'], 
          datasets: [{ 
            data: Object.values(catMap).length ? Object.values(catMap) : [1], 
            backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6'], 
            borderWidth: 8,
            borderColor: '#fff',
            hoverOffset: 15
          }] 
        },
        options: { ...commonOptions, scales: undefined, cutout: '82%', plugins: { legend: { display: true, position: 'bottom', labels: { usePointStyle: true, padding: 30, font: { weight: '800', size: 10 }, color: '#64748b' } } } }
      });
    }

    if (activeTab === 'Feedbacks' && chartRefs.feedback.current) {
      if (chartInstances.current.feedback) chartInstances.current.feedback.destroy();
      const categories = appTheme?.feedback_metrics || ["Cleanliness", "Food Quality", "Speed", "Service", "Value", "Experience"];
      const avgScores = categories.map((cat: string) => {
        const vals = feedbacks.map(f => f.scores[cat]).filter(v => v !== undefined);
        return vals.length ? (vals.reduce((a, b) => (a as number) + (b as number), 0) / vals.length) : 0;
      });

      chartInstances.current.feedback = new (window as any).Chart(chartRefs.feedback.current.getContext('2d'), {
        type: 'radar',
        data: {
          labels: categories,
          datasets: [{
            data: avgScores,
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
            r: { min: 0, max: 5, grid: { circular: false, color: '#f1f5f9' }, pointLabels: { font: { size: 10, weight: '800' }, color: '#94a3b8' }, ticks: { display: false, stepSize: 1 } }
          },
          plugins: { legend: { display: false } }
        }
      });
    }
  }, [activeTab, selectedProductId, dateFilter, dbSales, salesHistory, filteredHistory, feedbacks, appTheme]);

  const formattedDate = useMemo(() => {
    const d = new Date(dateFilter);
    return {
        month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
        day: d.getDate(),
        full: d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    };
  }, [dateFilter]);

  return (
    <div className="min-h-screen bg-[#F2F2F7] font-jakarta pb-40">
      <header className="px-6 pt-12 pb-8 max-w-lg mx-auto flex flex-col items-center space-y-10">
        <div className="text-center">
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none uppercase">Analytics</h1>
            <p className="text-slate-400 text-sm font-medium mt-3">Business overview</p>
        </div>

        {/* Tab Switcher - Strictly max-w-lg and rounded-2xl */}
        <div 
          ref={navContainerRef}
          className="bg-slate-200/50 p-1.5 rounded-2xl flex border border-slate-200 shadow-inner overflow-x-auto no-scrollbar gap-1 w-full"
        >
          {(['Revenue', 'Dishes', 'Sections', 'Feedbacks', 'Record Sale'] as AnalyticsTab[]).map(tab => (
            <button 
                key={tab} 
                onClick={(e) => handleTabClick(tab, e)}
                className={`flex-1 min-w-[110px] py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all relative ${activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
            >
                {tab}
            </button>
          ))}
        </div>

        {/* Calendar Selection Card - Same roundness and width as nav bar */}
        <div className="w-full">
            <div className="relative group cursor-pointer w-full">
                <div className={`bg-white p-5 rounded-2xl shadow-sm border border-slate-200/50 flex items-center gap-6 transition-all active:scale-[0.98]`}>
                    <div className="flex flex-col items-center justify-center bg-slate-900 text-white w-14 h-14 rounded-xl shadow-lg">
                        <span className="text-[9px] font-black uppercase opacity-60 leading-none mb-1">{formattedDate.month}</span>
                        <span className="text-xl font-black leading-none">{formattedDate.day}</span>
                    </div>
                    <div className="flex-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Selected Date</p>
                        <p className="text-[15px] font-bold text-slate-900 leading-none mb-1.5">{formattedDate.full}</p>
                        <p className="text-[12px] font-black text-emerald-600 uppercase tracking-widest">₱{dailyTotal.toLocaleString()}</p>
                    </div>
                    <i className="fa-solid fa-calendar-alt text-slate-200 mr-4"></i>
                    <input 
                        type="date" 
                        value={dateFilter} 
                        onChange={(e) => setDateFilter(e.target.value)} 
                        className="absolute inset-0 opacity-0 cursor-pointer w-full"
                    />
                </div>
            </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4">
        {activeTab === 'Revenue' && <RevenueView filteredHistory={filteredHistory} chartRef={chartRefs.revenue} />}

        {activeTab === 'Dishes' && (
          <DishesView 
            menuItems={menuItems}
            selectedProductId={selectedProductId}
            setSelectedProductId={setSelectedProductId}
            chartRef={chartRefs.product}
            filteredHistory={filteredHistory}
          />
        )}

        {activeTab === 'Sections' && ( 
          <SectionsView filteredHistory={filteredHistory} chartRef={chartRefs.pie} />
        )}

        {activeTab === 'Feedbacks' && (
          <FeedbacksAnalyticsView 
            feedbacks={feedbacks} 
            chartRef={chartRefs.feedback} 
            appTheme={appTheme}
            onThemeUpdate={onThemeUpdate}
          />
        )}

        {activeTab === 'Record Sale' && (
          <div className="w-full bg-white p-12 rounded-2xl border border-slate-200/60 shadow-xl space-y-10 animate-fade-in">
             <div className="text-center">
                <h4 className="font-black text-3xl uppercase tracking-tighter text-slate-900">Add Sale</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Manual entry</p>
             </div>
             
             <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Select Dish</label>
                    <select 
                        onChange={e => { const item = menuItems.find(i => i.id.toString() === e.target.value); if (item) { setDbSales(prev => [...prev, { timestamp: new Date().toISOString(), amount: item.price, itemId: item.id, itemName: item.name, categoryName: item.cat_name, quantity: 1, paymentStatus: 'Paid', orderStatus: 'Served' }]); } }} 
                        className="w-full p-6 bg-slate-50 rounded-xl font-black text-sm outline-none shadow-inner border border-slate-100"
                    >
                        <option value="">Choose item...</option>
                        {menuItems.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                    </select>
                </div>
             </div>
          </div>
        )}

        {filteredHistory.length === 0 && !isLoading && activeTab !== 'Record Sale' && activeTab !== 'Feedbacks' && (
            <div className="py-24 text-center space-y-6">
                <div className="w-24 h-24 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-center text-slate-200 mx-auto text-3xl">
                    <i className="fa-solid fa-cloud-moon"></i>
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-400 uppercase">No Data</h3>
                  <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-2">No records found</p>
                </div>
            </div>
        )}

        {isLoading && (
            <div className="py-24 text-center space-y-4">
                <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Refreshing...</p>
            </div>
        )}
      </div>
      
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
