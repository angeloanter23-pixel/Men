
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Feedback, SalesRecord, MenuItem } from '../../types';

declare const Chart: any;

interface AdminAnalyticsProps {
  feedbacks: Feedback[];
  salesHistory: SalesRecord[];
  menuItems: MenuItem[];
}

const AdminAnalytics: React.FC<AdminAnalyticsProps> = ({ feedbacks, salesHistory, menuItems }) => {
  const [activeMainTab, setActiveMainTab] = useState<'revenue' | 'product' | 'branch' | 'feedback'>('revenue');
  const [activeSubTab, setActiveSubTab] = useState<'performance' | 'compare'>('performance');
  const [selectedProductId, setSelectedProductId] = useState<number | 'global'>('global');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  
  const spiderChartRef = useRef<HTMLCanvasElement>(null);
  const revenueChartRef = useRef<HTMLCanvasElement>(null);
  const pieChartRef = useRef<HTMLCanvasElement>(null);
  const analyticsChartRef = useRef<HTMLCanvasElement>(null);

  const chartInstance = useRef<any>(null);
  const spiderInstance = useRef<any>(null);
  const pieInstance = useRef<any>(null);
  const revInstance = useRef<any>(null);

  const categories = ["Cleanliness", "Food Quality", "Speed", "Service", "Value", "Experience"];

  // Helper: Format date into readable string like "Today", "Yesterday", etc.
  const getSmartLabel = (dateStr: string) => {
    const selected = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selected.setHours(0, 0, 0, 0);
    const diffDays = Math.round((today.getTime() - selected.getTime()) / 86400000);
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return selected.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Process Sales History into Hourly Buckets for targetDate
  const getHourlyData = (targetDate: string, productId: number | 'global') => {
    const hoursBuckets = [6, 8, 10, 12, 14, 16, 18, 20, 22]; // Buckets
    const results = Array(hoursBuckets.length).fill(0);
    
    salesHistory.forEach(record => {
      const recDate = new Date(record.timestamp);
      const recDateStr = recDate.toISOString().split('T')[0];
      
      if (recDateStr === targetDate) {
        if (productId === 'global' || record.itemId === productId) {
          const hour = recDate.getHours();
          let bucketIdx = hoursBuckets.findIndex(h => hour <= h);
          if (bucketIdx === -1) bucketIdx = hoursBuckets.length - 1;
          results[bucketIdx] += record.amount;
        }
      }
    });
    return results;
  };

  // Pie Chart Data: Revenue by Category
  const getCategoryData = () => {
    const catMap: Record<string, number> = {};
    salesHistory.forEach(r => {
      if (!catMap[r.categoryName]) catMap[r.categoryName] = 0;
      catMap[r.categoryName] += r.amount;
    });
    return {
      labels: Object.keys(catMap),
      data: Object.values(catMap)
    };
  };

  // Main Effect: Revenue and Product Charts
  useEffect(() => {
    if (! (window as any).Chart) return;

    // --- REVENUE AREA CHART ---
    if (activeMainTab === 'revenue' && revenueChartRef.current) {
      if (revInstance.current) revInstance.current.destroy();
      const ctx = revenueChartRef.current.getContext('2d');
      const hoursLabels = ['6AM','8AM','10AM','12PM','2PM','4PM','6PM','8PM','10PM'];
      const data = getHourlyData(dateFilter, 'global');

      revInstance.current = new (window as any).Chart(ctx, {
        type: 'line',
        data: {
          labels: hoursLabels,
          datasets: [{
            label: 'Revenue',
            data: data,
            fill: true,
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            borderColor: '#6366f1',
            borderWidth: 2,
            tension: 0.4,
            pointRadius: 3,
            pointBackgroundColor: '#fff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: '#f8fafc' }, ticks: { font: { size: 9, weight: '800' } } },
            x: { grid: { display: false }, ticks: { font: { size: 9, weight: '700' } } }
          }
        }
      });
    }

    // --- PRODUCT ANALYTICS CHART ---
    if (activeMainTab === 'product' && analyticsChartRef.current) {
      if (chartInstance.current) chartInstance.current.destroy();
      const ctx = analyticsChartRef.current.getContext('2d');
      const hoursLabels = ['6AM','8AM','10AM','12PM','2PM','4PM','6PM','8PM','10PM'];
      
      const data = activeSubTab === 'performance' 
        ? getHourlyData(dateFilter, selectedProductId)
        : [
            getHourlyData(dateFilter, selectedProductId).reduce((a, b) => a + b, 0),
            getHourlyData(new Date(new Date(dateFilter).getTime() - 86400000).toISOString().split('T')[0], selectedProductId).reduce((a, b) => a + b, 0)
          ];

      chartInstance.current = new (window as any).Chart(ctx, {
        type: 'bar',
        data: {
          labels: activeSubTab === 'performance' ? hoursLabels : [getSmartLabel(dateFilter), 'Previous Day'],
          datasets: [{
            data: data,
            backgroundColor: activeSubTab === 'performance' 
              ? hoursLabels.map((_, i) => i === hoursLabels.length - 1 ? 'rgba(99, 102, 241, 0.8)' : 'rgba(99, 102, 241, 0.4)')
              : ['#10b981', '#6366f1'],
            borderRadius: activeSubTab === 'performance' ? 5 : 12,
            barThickness: activeSubTab === 'performance' ? 24 : 60
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: '#f8fafc' }, ticks: { font: { size: 9, weight: '800' } } },
            x: { grid: { display: false }, ticks: { font: { size: 9, weight: '700' } } }
          }
        }
      });
    }

    // --- PIE CHART (CATEGORY SPLIT) ---
    if ((activeMainTab === 'revenue' || activeMainTab === 'product') && pieChartRef.current) {
      if (pieInstance.current) pieInstance.current.destroy();
      const ctx = pieChartRef.current.getContext('2d');
      const { labels, data } = getCategoryData();

      pieInstance.current = new (window as any).Chart(ctx, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{
            data,
            backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
            borderWidth: 0,
            hoverOffset: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { 
            legend: { 
                position: 'bottom',
                labels: { font: { size: 10, weight: '800' }, boxWidth: 10, padding: 10 }
            } 
          },
          cutout: '70%'
        }
      });
    }

  }, [activeMainTab, activeSubTab, selectedProductId, dateFilter, salesHistory, feedbacks]);

  // Feedback Spider Logic
  useEffect(() => {
    if (activeMainTab === 'feedback' && spiderChartRef.current && (window as any).Chart) {
      if (spiderInstance.current) spiderInstance.current.destroy();
      const ctx = spiderChartRef.current.getContext('2d');
      const getAvg = (cat: string) => {
        const vals = feedbacks.map(f => f.scores[cat]).filter(v => v !== undefined);
        return vals.length ? (vals.reduce((a: number, b: number) => a + b, 0) / vals.length) : 0;
      };
      spiderInstance.current = new (window as any).Chart(ctx, {
        type: 'radar',
        data: {
          labels: categories,
          datasets: [{
            data: categories.map(getAvg),
            fill: true,
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            borderColor: '#6366f1',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: { r: { min: 0, max: 5, ticks: { display: false } } },
          plugins: { legend: { display: false } }
        }
      });
    }
  }, [activeMainTab, feedbacks]);

  const liveTotal = useMemo(() => {
    return salesHistory
      .filter(r => r.timestamp.split('T')[0] === dateFilter)
      .reduce((s, r) => s + r.amount, 0);
  }, [salesHistory, dateFilter]);

  return (
    <div className="p-5 space-y-6 animate-fade-in pb-20">
      <header className="px-2">
        <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-tight">SHARP<span className="text-indigo-600">PRO</span></h2>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 opacity-70">Professional Insights Portal</p>
      </header>

      <nav className="flex bg-slate-200/50 p-1.5 rounded-2xl overflow-x-auto no-scrollbar">
        {[
          { id: 'revenue', label: 'Revenue' },
          { id: 'product', label: 'Product' },
          { id: 'branch', label: 'Branch' },
          { id: 'feedback', label: 'Feedback' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveMainTab(tab.id as any)}
            className={`flex-1 min-w-[80px] py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${activeMainTab === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeMainTab === 'revenue' && (
        <div className="space-y-6 animate-fade-in">
           <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
             <div className="mb-4 flex justify-between items-start">
               <div>
                 <h2 className="text-xl font-black">Revenue Trend</h2>
                 <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[9px] font-black uppercase">{getSmartLabel(dateFilter)}</span>
               </div>
               <div className="text-right">
                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Sales</p>
                 <p className="text-sm font-black text-indigo-600">₱{liveTotal.toLocaleString()}</p>
               </div>
             </div>
             <div className="relative h-[240px]">
               <canvas ref={revenueChartRef}></canvas>
             </div>
             <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-4">
                <span className="text-[10px] font-black uppercase text-slate-400">Date Filter:</span>
                <input 
                  type="date" 
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="bg-transparent border-none text-[11px] font-black outline-none" 
                />
             </div>
           </div>

           <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
             <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Revenue by Category</h3>
             <div className="h-[240px]">
               <canvas ref={pieChartRef}></canvas>
             </div>
           </div>
        </div>
      )}

      {activeMainTab === 'product' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="mb-4 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-black truncate max-w-[180px]">{selectedProductId === 'global' ? 'Performance' : menuItems.find(i => i.id === selectedProductId)?.name}</h2>
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[9px] font-black uppercase">{getSmartLabel(dateFilter)}</span>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Current Val</p>
                <p className="text-sm font-black text-indigo-600">₱{getHourlyData(dateFilter, selectedProductId).reduce((a,b)=>a+b,0).toLocaleString()}</p>
              </div>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
                <button onClick={() => setActiveSubTab('performance')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeSubTab === 'performance' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500'}`}>Performance</button>
                <button onClick={() => setActiveSubTab('compare')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeSubTab === 'compare' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500'}`}>Compare</button>
            </div>

            <div className="relative h-[240px]">
              <canvas ref={analyticsChartRef}></canvas>
            </div>
          </div>

          <div className="space-y-3">
             <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-4">Menu Items Feed</h3>
             <div className="grid grid-cols-1 gap-3">
               <button 
                 onClick={() => setSelectedProductId('global')}
                 className={`bg-white p-4 rounded-3xl border flex justify-between items-center shadow-sm transition-all ${selectedProductId === 'global' ? 'border-indigo-500 ring-2 ring-indigo-50' : 'border-slate-100'}`}
               >
                 <span className="font-black text-xs uppercase tracking-tight">Global Summary</span>
                 <i className="fa-solid fa-chart-line text-indigo-600"></i>
               </button>
               {menuItems.map(item => (
                 <div 
                   key={item.id} 
                   onClick={() => setSelectedProductId(item.id)}
                   className={`bg-white p-4 rounded-3xl border flex justify-between items-center shadow-sm cursor-pointer transition-all ${selectedProductId === item.id ? 'border-indigo-500 ring-2 ring-indigo-50' : 'border-slate-100 hover:border-indigo-200'}`}
                 >
                   <div className="flex items-center gap-3">
                     <img src={item.image_url} className="w-8 h-8 rounded-lg object-cover bg-slate-50" />
                     <span className="font-black text-xs uppercase tracking-tight truncate w-32 text-left">{item.name}</span>
                   </div>
                   <div className="text-right">
                     <p className="text-[9px] font-black text-indigo-600">₱{salesHistory.filter(s => s.itemId === item.id).reduce((sum, r) => sum + r.amount, 0).toLocaleString()}</p>
                     <p className="text-[8px] font-black text-slate-300 uppercase">Sales</p>
                   </div>
                 </div>
               ))}
             </div>
          </div>
        </div>
      )}

      {activeMainTab === 'branch' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Revenue by Location</h3>
            <div className="space-y-6">
              {[
                { name: 'Main Branch (BGC)', value: 85, color: 'bg-indigo-600', amt: '₱1.2M' },
                { name: 'Downtown (Makati)', value: 65, color: 'bg-orange-500', amt: '₱890k' },
                { name: 'Express (Pasig)', value: 45, color: 'bg-slate-800', amt: '₱420k' }
              ].map((branch, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <span className="text-slate-500">{branch.name}</span>
                    <span className="text-slate-800">{branch.amt}</span>
                  </div>
                  <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div style={{ width: `${branch.value}%` }} className={`h-full ${branch.color} rounded-full`}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeMainTab === 'feedback' && (
        <div className="space-y-6 animate-fade-in pb-20">
          <div className="bg-white rounded-[3rem] p-6 shadow-xl border border-slate-100">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Experience Sentiment</h3>
            <div className="h-[40vh] w-full">
              <canvas ref={spiderChartRef}></canvas>
            </div>
          </div>
          <div className="space-y-3">
             <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-4">Recent Feedback</h3>
             {feedbacks.slice(0, 5).map(f => (
               <div key={f.id} className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-slate-50">
                 <div className="flex justify-between mb-1">
                   <h4 className="font-black text-sm text-slate-800">{f.name}</h4>
                   <p className="text-[9px] text-slate-300 font-black uppercase">{f.date}</p>
                 </div>
                 <p className="text-[10px] text-slate-400 font-bold line-clamp-2 leading-relaxed italic">"{f.note}"</p>
               </div>
             ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnalytics;
