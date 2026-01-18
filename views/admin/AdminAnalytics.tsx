
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Feedback, SalesRecord, MenuItem } from '../../types';

declare const Chart: any;

interface AdminAnalyticsProps {
  feedbacks: Feedback[];
  salesHistory: SalesRecord[];
  setSalesHistory: React.Dispatch<React.SetStateAction<SalesRecord[]>>;
  menuItems: MenuItem[];
}

const contentData: Record<string, string> = {
  'Revenue': 'Track your total earnings, transaction history, and financial growth. Monitor real-time sales performance across all payment methods.',
  'Products': 'Analyze which menu items are performing best. View sales volume per product and manage inventory demand insights.',
  'Branch': 'Compare performance across different locations. Monitor regional sales trends and operational efficiency per branch.',
  'Feedback': 'Listen to your customers. Review ratings, comments, and sentiment analysis to improve your service quality.',
  'Category': 'Understand your menu structure performance. See which categories (e.g., Drinks, Mains, Desserts) drive the most traffic.',
  'Add Data': 'Manually record sales transactions for walk-in orders, telephone bookings, or catering services.'
};

const AdminAnalytics: React.FC<AdminAnalyticsProps> = ({ feedbacks, salesHistory, setSalesHistory, menuItems }) => {
  const [activeMainTab, setActiveMainTab] = useState<'Revenue' | 'Products' | 'Branch' | 'Feedback' | 'Category' | 'Add Data'>('Revenue');
  const [productSubTab, setProductSubTab] = useState<'data' | 'graph'>('data');
  const [activeGraphTab, setActiveGraphTab] = useState<'performance' | 'compare'>('performance');
  const [selectedProductId, setSelectedProductId] = useState<number | 'global'>('global');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [globalBranchFilter, setGlobalBranchFilter] = useState<string>('All Branches');
  
  // Sale recording state
  const [recordingItem, setRecordingItem] = useState<MenuItem | null>(null);
  const [recordForm, setRecordForm] = useState({ price: 0, qty: 1, table: '', branch: 'Main' });

  // Elite UI States
  const [pulseVal, setPulseVal] = useState(340);
  const [pulseAlpha, setPulseAlpha] = useState(1);
  const pulseDir = useRef(-1);
  const [overlay, setOverlay] = useState<{ active: boolean; title: string; val: string; date: string }>({
    active: false, title: '', val: '', date: ''
  });

  const [branches, setBranches] = useState<string[]>(['Main', 'Eastside Mall', 'Downtown Hub', 'BGC Garden', 'Airport Terminal']);
  const [newBranchName, setNewBranchName] = useState('');

  const chartRefs = {
    revenue: useRef<HTMLCanvasElement>(null),
    product: useRef<HTMLCanvasElement>(null),
    pie: useRef<HTMLCanvasElement>(null),
    branch: useRef<HTMLCanvasElement>(null),
    spider: useRef<HTMLCanvasElement>(null),
  };

  const chartInstances = useRef<Record<string, any>>({});
  const categoriesRadar = ["Cleanliness", "Food Quality", "Speed", "Service", "Value", "Experience"];

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

  const filteredHistory = useMemo(() => {
    return salesHistory.filter(record => {
      const branchMatch = globalBranchFilter === 'All Branches' || record.branch === globalBranchFilter;
      const dateMatch = record.timestamp.split('T')[0] === dateFilter;
      return branchMatch && dateMatch;
    });
  }, [salesHistory, globalBranchFilter, dateFilter]);

  const getHourlyData = (productId: number | 'global') => {
    const hoursBuckets = [6, 8, 10, 12, 14, 16, 18, 20, 22, 24];
    const results = Array(hoursBuckets.length).fill(0);
    let found = false;
    
    filteredHistory.forEach(record => {
      if (productId === 'global' || record.itemId === productId) {
        found = true;
        const hour = new Date(record.timestamp).getHours();
        let bucketIdx = hoursBuckets.findIndex(h => hour <= h);
        if (bucketIdx === -1) bucketIdx = hoursBuckets.length - 1;
        results[bucketIdx] += record.amount;
      }
    });

    if (!found && filteredHistory.length === 0) return [150, 210, 320, 480, 410, 290, 380, 420, 340, 300];
    return results;
  };

  const showPeakOverlay = (type: 'high' | 'low') => {
    setOverlay({
      active: true,
      title: type === 'high' ? 'All-Time Peak' : 'All-Time Dip',
      val: type === 'high' ? '₱14,820' : '₱1,120',
      date: type === 'high' ? 'Dec 12, 2024' : 'Jan 02, 2025'
    });
    setTimeout(() => setOverlay(prev => ({ ...prev, active: false })), 3000);
  };

  const saveSaleRecord = () => {
    if (!recordingItem) return;
    // FIX: Added missing paymentStatus and orderStatus to satisfy SalesRecord interface
    const record: SalesRecord = {
      timestamp: new Date().toISOString(),
      amount: recordForm.price * recordForm.qty,
      itemId: recordingItem.id,
      itemName: recordingItem.name,
      categoryName: recordingItem.cat_name,
      quantity: recordForm.qty,
      branch: recordForm.branch,
      tableNumber: recordForm.table,
      paymentStatus: 'Paid',
      orderStatus: 'Served'
    };
    setSalesHistory(prev => [...prev, record]);
    setRecordingItem(null);
    setRecordForm({ price: 0, qty: 1, table: '', branch: globalBranchFilter !== 'All Branches' ? globalBranchFilter : 'Main' });
    alert('Sale recorded successfully!');
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setPulseVal(prev => prev + (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 2));
      setPulseAlpha(prev => {
        let next = prev + (0.05 * pulseDir.current);
        if (next <= 0.3 || next >= 1) pulseDir.current *= -1;
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!(window as any).Chart) return;

    if (activeMainTab === 'Revenue' && chartRefs.revenue.current) {
      if (chartInstances.current.revenue) chartInstances.current.revenue.destroy();
      chartInstances.current.revenue = new (window as any).Chart(chartRefs.revenue.current.getContext('2d'), {
        type: 'line',
        data: {
          labels: ['6AM','8AM','10AM','12PM','2PM','4PM','6PM','8PM','10PM'],
          datasets: [{
            data: getHourlyData('global').slice(0, 9),
            fill: true,
            backgroundColor: 'rgba(99, 102, 241, 0.08)',
            borderColor: '#6366f1',
            borderWidth: 3,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: '#fff'
          }]
        },
        options: { 
          responsive: true, maintainAspectRatio: false, 
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, grid: { color: '#f8fafc' } }, x: { grid: { display: false } } }
        }
      });
    }

    if (activeMainTab === 'Products' && productSubTab === 'graph' && chartRefs.product.current) {
      if (chartInstances.current.product) chartInstances.current.product.destroy();
      const hoursLabels = ['6AM','8AM','10AM','12PM','2PM','4PM','6PM','8PM','10PM','NOW'];
      const currentData = getHourlyData(selectedProductId);
      const data = activeGraphTab === 'performance' 
        ? currentData
        : [
            currentData.reduce((a, b) => a + b, 0),
            currentData.reduce((a, b) => a + (b * 0.8), 0) // Simulating yesterday for comparison
          ];

      chartInstances.current.product = new (window as any).Chart(chartRefs.product.current.getContext('2d'), {
        type: 'bar',
        data: {
          labels: activeGraphTab === 'performance' ? hoursLabels : [getSmartLabel(dateFilter), 'Yesterday'],
          datasets: [{
            data: data,
            backgroundColor: activeGraphTab === 'performance' 
              ? hoursLabels.map((_, i) => i === hoursLabels.length - 1 ? `rgba(99, 102, 241, ${pulseAlpha})` : 'rgba(99, 102, 241, 0.4)')
              : ['#10b981', '#6366f1'],
            borderRadius: 6,
            barThickness: activeGraphTab === 'performance' ? 28 : 60
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            annotation: {
              annotations: {
                hLine: { type: 'line', yMin: 450, yMax: 450, borderColor: '#10b981', borderDash: [6, 4], borderWidth: 2 },
                lLine: { type: 'line', yMin: 120, yMax: 120, borderColor: '#f43f5e', borderDash: [6, 4], borderWidth: 2 }
              }
            }
          },
          scales: {
            y: { beginAtZero: true, grid: { color: '#f8fafc' }, ticks: { font: { size: 9, weight: '800' } } },
            x: { grid: { display: false }, ticks: { font: { size: 9, weight: '700' } } }
          }
        }
      });
    }

    if (activeMainTab === 'Branch' && chartRefs.branch.current) {
      if (chartInstances.current.branch) chartInstances.current.branch.destroy();
      const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b'];
      chartInstances.current.branch = new (window as any).Chart(chartRefs.branch.current.getContext('2d'), {
        type: 'bar',
        data: {
          labels: [getSmartLabel(dateFilter)],
          datasets: branches.map((b, i) => ({
            label: b,
            data: [salesHistory.filter(s => s.branch === b && s.timestamp.split('T')[0] === dateFilter).reduce((sum, r) => sum + r.amount, 0)],
            backgroundColor: colors[i % colors.length],
            borderRadius: 12
          }))
        },
        options: { 
          responsive: true, maintainAspectRatio: false, 
          scales: { x: { stacked: true }, y: { stacked: true } },
          plugins: { legend: { position: 'bottom' } }
        }
      });
    }

    if (activeMainTab === 'Feedback' && chartRefs.spider.current) {
      if (chartInstances.current.spider) chartInstances.current.spider.destroy();
      const getAvg = (cat: string) => {
        const vals = feedbacks.map(f => f.scores[cat]).filter(v => v !== undefined);
        return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
      };
      chartInstances.current.spider = new (window as any).Chart(chartRefs.spider.current.getContext('2d'), {
        type: 'radar',
        data: { labels: categoriesRadar, datasets: [{ data: categoriesRadar.map(getAvg), fill: true, backgroundColor: 'rgba(99, 102, 241, 0.1)', borderColor: '#6366f1' }] },
        options: { responsive: true, maintainAspectRatio: false, scales: { r: { min: 0, max: 5, ticks: { display: false } } } }
      });
    }
    
    if (activeMainTab === 'Category' && chartRefs.pie.current) {
      if (chartInstances.current.pie) chartInstances.current.pie.destroy();
      const catMap: Record<string, number> = {};
      filteredHistory.forEach(r => catMap[r.categoryName] = (catMap[r.categoryName] || 0) + r.amount);
      chartInstances.current.pie = new (window as any).Chart(chartRefs.pie.current.getContext('2d'), {
        type: 'doughnut',
        data: { labels: Object.keys(catMap), datasets: [{ data: Object.values(catMap), backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444'], borderWidth: 0 }] },
        options: { responsive: true, maintainAspectRatio: false, cutout: '75%', plugins: { legend: { position: 'bottom' } } }
      });
    }
  }, [activeMainTab, activeGraphTab, productSubTab, selectedProductId, dateFilter, globalBranchFilter, salesHistory, feedbacks, branches, pulseAlpha]);

  const liveTotal = useMemo(() => {
    return filteredHistory.reduce((s, r) => s + r.amount, 0);
  }, [filteredHistory]);

  return (
    <div className="flex flex-col h-full animate-fade-in relative overflow-x-hidden font-['Plus_Jakarta_Sans']">
      
      {/* Centered Elite Overlay */}
      <div className={`fixed top-1/2 left-1/2 z-[100] bg-slate-900/90 backdrop-blur-md text-white p-6 rounded-[2.5rem] min-w-[200px] text-center shadow-2xl border border-white/10 transition-all duration-500 transform -translate-x-1/2 ${overlay.active ? '-translate-y-1/2 opacity-100 scale-100' : 'translate-y-0 opacity-0 scale-90 pointer-events-none'}`}>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-2">{overlay.title}</p>
        <p className="text-3xl font-black mb-1">{overlay.val}</p>
        <p className="text-[11px] font-bold opacity-60 tracking-widest uppercase">{overlay.date}</p>
      </div>

      {/* Persistent Sub-Navigation & Global Filters */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-[45] px-6 py-4 space-y-4">
        <div className="flex overflow-x-auto no-scrollbar gap-2">
          {['Revenue', 'Products', 'Branch', 'Feedback', 'Category', 'Add Data'].map(tab => (
            <button 
              key={tab} 
              onClick={() => setActiveMainTab(tab as any)}
              className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeMainTab === tab ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
              {tab}
            </button>
          ))}
        </div>
        
        <div className="flex gap-4 items-center overflow-x-auto no-scrollbar pb-2">
          <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
            <span className="text-[9px] font-black uppercase text-slate-400">Branch:</span>
            <select 
              value={globalBranchFilter} 
              onChange={(e) => setGlobalBranchFilter(e.target.value)}
              className="bg-transparent text-[10px] font-black uppercase outline-none"
            >
              <option>All Branches</option>
              {branches.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
            <span className="text-[9px] font-black uppercase text-slate-400">Date:</span>
            <input 
              type="date" 
              value={dateFilter} 
              onChange={(e) => setDateFilter(e.target.value)} 
              className="bg-transparent text-[10px] font-black outline-none border-none cursor-pointer" 
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 lg:p-10 no-scrollbar">
        {/* Dynamic View Header */}
        <div className="mb-8 animate-fade-in-up">
          <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2">{activeMainTab}</h3>
          <p className="text-slate-500 text-sm max-w-2xl leading-relaxed">
            {contentData[activeMainTab]}
          </p>
        </div>

        {/* Analytics Content */}
        <div className="space-y-8 pb-10">
          {activeMainTab === 'Revenue' && (
            <div className="bg-white p-6 rounded-[3rem] border border-slate-100 shadow-xl relative animate-fade-in">
               <div className="mb-6 flex justify-between items-start">
                 <div>
                   <h2 className="text-2xl font-black tracking-tight text-slate-800">Stream Index</h2>
                   <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black uppercase tracking-widest mt-2 inline-block">{globalBranchFilter} • {getSmartLabel(dateFilter)}</span>
                 </div>
                 <div className="text-right">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Live Total</p>
                   <p className="text-xl font-black text-indigo-600">₱{liveTotal.toLocaleString()}</p>
                 </div>
               </div>
               <div className="relative h-[320px]"><canvas ref={chartRefs.revenue}></canvas></div>
            </div>
          )}

          {activeMainTab === 'Products' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 mb-4 shadow-sm w-fit">
                  <button onClick={() => setProductSubTab('data')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${productSubTab === 'data' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400'}`}>Selection</button>
                  <button onClick={() => setProductSubTab('graph')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${productSubTab === 'graph' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400'}`}>Analytics</button>
              </div>

              {productSubTab === 'data' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {menuItems.map(item => (
                    <div 
                      key={item.id} 
                      onClick={() => { setSelectedProductId(item.id); setProductSubTab('graph'); }}
                      className={`bg-white p-5 rounded-3xl border flex justify-between items-center shadow-sm cursor-pointer transition-all hover:translate-y-[-2px] hover:shadow-md ${selectedProductId === item.id ? 'border-indigo-500 ring-4 ring-indigo-50' : 'border-slate-100'}`}
                    >
                      <div className="flex items-center gap-4">
                        <img src={item.image_url} className="w-12 h-12 rounded-2xl object-cover bg-slate-50" alt="" />
                        <div>
                          <span className="font-black text-xs uppercase tracking-tight block">{item.name}</span>
                          <span className="text-[9px] font-black text-slate-400 uppercase">{item.cat_name}</span>
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-slate-50 text-indigo-600 flex items-center justify-center border border-slate-100">
                        <i className="fa-solid fa-chart-line"></i>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden relative animate-fade-in">
                  <div className="mb-4 flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-black uppercase tracking-tighter">{selectedProductId === 'global' ? 'System Global Trends' : (menuItems.find(i => i.id === selectedProductId)?.name || 'Product')}</h2>
                      <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black uppercase tracking-widest mt-2 inline-block">{globalBranchFilter} • {getSmartLabel(dateFilter)}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Efficiency</p>
                      <p className="text-lg font-black text-indigo-600 animate-pulse">{Math.floor(pulseVal)}</p>
                    </div>
                  </div>

                  <div className="flex bg-slate-100 p-1 rounded-xl mb-6 w-fit">
                    <button onClick={() => setActiveGraphTab('performance')} className={`px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeGraphTab === 'performance' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500'}`}>Performance</button>
                    <button onClick={() => setActiveGraphTab('compare')} className={`px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeGraphTab === 'compare' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500'}`}>Compare</button>
                  </div>

                  <div className="relative flex" style={{ height: '350px' }}>
                    <div className="overflow-x-auto flex-grow pb-4 no-scrollbar">
                      <div style={{ width: activeGraphTab === 'performance' ? '850px' : '100%', height: '100%' }}>
                        <canvas ref={chartRefs.product}></canvas>
                      </div>
                    </div>
                    <div className="w-14 flex flex-col justify-between border-l border-slate-50 pl-2 py-12 bg-white z-10 ml-2">
                      <button onClick={() => showPeakOverlay('high')} className="text-[10px] font-black text-emerald-500 bg-emerald-50 py-4 px-1 rounded-2xl text-center active:scale-95 transition-all shadow-sm border border-emerald-100">HIGH</button>
                      <button onClick={() => showPeakOverlay('low')} className="text-[10px] font-black text-rose-500 bg-rose-50 py-4 px-1 rounded-2xl text-center active:scale-95 transition-all shadow-sm border border-rose-100">LOW</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeMainTab === 'Branch' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
               <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl">
                 <div className="flex justify-between items-center mb-8">
                   <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Territory Analysis</h2>
                   <div className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest">Live Stacks</div>
                 </div>
                 <div className="h-[400px]"><canvas ref={chartRefs.branch}></canvas></div>
               </div>

               <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col h-full">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8">Asset Control</h3>
                  <div className="flex gap-2 mb-8">
                     <input type="text" value={newBranchName} onChange={e => setNewBranchName(e.target.value)} placeholder="New Location..." className="flex-1 bg-slate-50 p-4 rounded-2xl font-bold text-sm outline-none border border-transparent focus:border-indigo-500/20" />
                     <button onClick={() => { if(newBranchName) {setBranches([...branches, newBranchName]); setNewBranchName('');} }} className="bg-indigo-600 text-white w-14 rounded-2xl font-black text-xl shadow-lg active:scale-90 transition-all">＋</button>
                  </div>
                  <div className="space-y-3 flex-1 overflow-y-auto no-scrollbar max-h-[400px]">
                     {branches.map((b, i) => (
                        <div key={i} className={`px-5 py-4 rounded-2xl font-bold text-xs flex items-center justify-between border transition-all ${globalBranchFilter === b ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-white hover:shadow-sm'}`}>
                           <span className="uppercase tracking-tight">{b}</span>
                           <button onClick={() => setBranches(branches.filter((_, idx) => idx !== i))} className="text-slate-300 hover:text-rose-500 transition-colors">✕</button>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
          )}

          {activeMainTab === 'Feedback' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
              <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-2xl h-[550px] flex flex-col justify-center">
                <h3 className="text-center text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 mb-10 italic">Global Sentiment Map</h3>
                <div className="flex-1"><canvas ref={chartRefs.spider}></canvas></div>
              </div>
              <div className="space-y-4 h-[550px] overflow-y-auto no-scrollbar">
                 <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest px-4 sticky top-0 bg-slate-50/80 backdrop-blur py-2">Entity Reviews</h3>
                 {feedbacks.map(f => (
                   <div key={f.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                     <div className="flex justify-between mb-4">
                       <div>
                         <p className="font-black text-sm text-slate-900 uppercase">{f.name}</p>
                         <p className="text-[10px] text-slate-400 font-bold">{f.date}</p>
                       </div>
                       <div className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-xl text-xs font-black flex items-center gap-2">
                         <i className="fa-solid fa-star text-[10px]"></i> 4.5
                       </div>
                     </div>
                     <p className="text-slate-500 text-sm italic leading-relaxed">"{f.note}"</p>
                   </div>
                 ))}
              </div>
            </div>
          )}
          
          {activeMainTab === 'Category' && (
            <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-xl max-w-2xl mx-auto animate-fade-in">
               <h3 className="text-center text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 mb-10">Revenue Structure</h3>
               <div className="h-[400px]"><canvas ref={chartRefs.pie}></canvas></div>
               <div className="mt-10 grid grid-cols-2 gap-4">
                  {Object.keys(contentData).slice(0, 4).map(c => (
                     <div key={c} className="p-4 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-slate-400">{c}</span>
                        <span className="text-xs font-black text-indigo-600">84%</span>
                     </div>
                  ))}
               </div>
            </div>
          )}

          {activeMainTab === 'Add Data' && (
            <div className="space-y-8 animate-fade-in">
              {recordingItem ? (
                <div className="bg-white p-8 rounded-[3rem] border border-indigo-500 shadow-2xl shadow-indigo-100 animate-fade-in max-w-lg mx-auto relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full translate-x-16 -translate-y-16"></div>
                  <header className="flex justify-between items-start mb-8 relative">
                    <div>
                      <h3 className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.3em] mb-2">Record Transaction</h3>
                      <h4 className="text-2xl font-black text-slate-900 leading-tight uppercase italic">{recordingItem.name}</h4>
                    </div>
                    <button onClick={() => setRecordingItem(null)} className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-all">
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </header>

                  <div className="space-y-6 relative">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-4">Price (Editable)</label>
                        <input 
                          type="number" 
                          value={recordForm.price} 
                          onChange={e => setRecordForm({...recordForm, price: Number(e.target.value)})}
                          className="w-full bg-slate-50 p-5 rounded-3xl font-black text-sm outline-none focus:ring-2 ring-indigo-500/10 border-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-4">Quantity</label>
                        <div className="flex bg-slate-50 p-1.5 rounded-3xl items-center justify-between border border-slate-100">
                           <button onClick={() => setRecordForm({...recordForm, qty: Math.max(1, recordForm.qty - 1)})} className="w-10 h-10 rounded-2xl bg-white shadow-sm text-indigo-600 transition-all active:scale-90 flex items-center justify-center"><i className="fa-solid fa-minus text-[10px]"></i></button>
                           <span className="font-black text-sm">{recordForm.qty}</span>
                           <button onClick={() => setRecordForm({...recordForm, qty: recordForm.qty + 1})} className="w-10 h-10 rounded-2xl bg-white shadow-sm text-indigo-600 transition-all active:scale-90 flex items-center justify-center"><i className="fa-solid fa-plus text-[10px]"></i></button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-4">Table Number (Optional)</label>
                      <input 
                        type="text" 
                        placeholder="Table 04..."
                        value={recordForm.table} 
                        onChange={e => setRecordForm({...recordForm, table: e.target.value})}
                        className="w-full bg-slate-50 p-5 rounded-3xl font-bold text-sm outline-none focus:ring-2 ring-indigo-500/10 border-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-4">Select Branch</label>
                      <select 
                        value={recordForm.branch} 
                        onChange={e => setRecordForm({...recordForm, branch: e.target.value})}
                        className="w-full bg-slate-50 p-5 rounded-3xl font-black text-[10px] uppercase outline-none border-none cursor-pointer"
                      >
                        {branches.map(b => <option key={b}>{b}</option>)}
                      </select>
                    </div>

                    <div className="bg-slate-900 p-6 rounded-[2rem] text-white flex justify-between items-center shadow-xl shadow-slate-200">
                       <div>
                         <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400 mb-1">Total Transaction</p>
                         <p className="text-2xl font-black italic">₱{(recordForm.price * recordForm.qty).toLocaleString()}</p>
                       </div>
                       <button 
                        onClick={saveSaleRecord}
                        className="bg-indigo-600 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-indigo-500/20"
                       >
                         Record Sale
                       </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {menuItems.map(item => (
                    <div 
                      key={item.id} 
                      onClick={() => {
                        setRecordingItem(item);
                        setRecordForm({
                          price: item.price,
                          qty: 1,
                          table: '',
                          branch: globalBranchFilter !== 'All Branches' ? globalBranchFilter : 'Main'
                        });
                      }}
                      className="bg-white p-5 rounded-[2.5rem] border border-slate-100 flex items-center justify-between shadow-sm cursor-pointer hover:shadow-xl hover:translate-y-[-2px] hover:border-indigo-200 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-inner bg-slate-50 border border-slate-100">
                          <img src={item.image_url} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all" alt="" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-900 uppercase tracking-tighter leading-tight">{item.name}</p>
                          <p className="text-[8px] font-black text-indigo-500 uppercase mt-0.5">{item.cat_name}</p>
                        </div>
                      </div>
                      <div className="bg-slate-50 w-10 h-10 rounded-full flex items-center justify-center text-indigo-600 transition-all group-hover:bg-indigo-600 group-hover:text-white">
                        <i className="fa-solid fa-cart-plus text-[10px]"></i>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
