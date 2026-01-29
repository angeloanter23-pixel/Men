import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Feedback, SalesRecord, MenuItem } from '../../types';

declare const Chart: any;

const AdminAnalytics: React.FC<{ feedbacks: Feedback[]; salesHistory: SalesRecord[]; setSalesHistory: React.Dispatch<React.SetStateAction<SalesRecord[]>>; menuItems: MenuItem[]; }> = ({ feedbacks, salesHistory, setSalesHistory, menuItems }) => {
  const [activeMainTab, setActiveMainTab] = useState<'Revenue' | 'Dishes' | 'Reviews' | 'Groups' | 'Entry'>('Revenue');
  const [selectedProductId, setSelectedProductId] = useState<number | 'global'>('global');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [recordingItem, setRecordingItem] = useState<MenuItem | null>(null);
  const [recordForm, setRecordForm] = useState({ price: 0, qty: 1 });

  const chartRefs = { revenue: useRef<HTMLCanvasElement>(null), product: useRef<HTMLCanvasElement>(null), pie: useRef<HTMLCanvasElement>(null) };
  const chartInstances = useRef<Record<string, any>>({});

  const filteredHistory = useMemo(() => salesHistory.filter(record => record.timestamp.split('T')[0] === dateFilter), [salesHistory, dateFilter]);

  const getHourlyData = (productId: number | 'global') => {
    const hoursBuckets = [6, 8, 10, 12, 14, 16, 18, 20, 22, 24];
    const results = Array(hoursBuckets.length).fill(0);
    filteredHistory.forEach(record => {
      if (productId === 'global' || record.itemId === productId) {
        const hour = new Date(record.timestamp).getHours();
        let bucketIdx = hoursBuckets.findIndex(h => hour <= h);
        if (bucketIdx === -1) bucketIdx = hoursBuckets.length - 1;
        results[bucketIdx] += record.amount;
      }
    });
    return results;
  };

  useEffect(() => {
    if (!(window as any).Chart) return;
    if (activeMainTab === 'Revenue' && chartRefs.revenue.current) {
      if (chartInstances.current.revenue) chartInstances.current.revenue.destroy();
      chartInstances.current.revenue = new (window as any).Chart(chartRefs.revenue.current.getContext('2d'), {
        type: 'line', data: { labels: ['6am','8am','10am','12pm','2pm','4pm','6pm','8pm','10pm'], datasets: [{ label: 'Sales (₱)', data: getHourlyData('global').slice(0, 9), fill: true, backgroundColor: 'rgba(99, 102, 241, 0.1)', borderColor: '#6366f1', tension: 0.4 }] },
        options: { responsive: true, maintainAspectRatio: false }
      });
    }
    if (activeMainTab === 'Dishes' && chartRefs.product.current) {
      if (chartInstances.current.product) chartInstances.current.product.destroy();
      chartInstances.current.product = new (window as any).Chart(chartRefs.product.current.getContext('2d'), {
        type: 'bar', data: { labels: ['6am','8am','10am','12pm','2pm','4pm','6pm','8pm','10pm','12am'], datasets: [{ label: 'Sales (₱)', data: getHourlyData(selectedProductId), backgroundColor: '#6366f1', borderRadius: 8 }] },
        options: { responsive: true, maintainAspectRatio: false }
      });
    }
    if (activeMainTab === 'Groups' && chartRefs.pie.current) {
      if (chartInstances.current.pie) chartInstances.current.pie.destroy();
      const catMap: Record<string, number> = {};
      filteredHistory.forEach(r => catMap[r.categoryName] = (catMap[r.categoryName] || 0) + r.amount);
      chartInstances.current.pie = new (window as any).Chart(chartRefs.pie.current.getContext('2d'), {
        type: 'doughnut', data: { labels: Object.keys(catMap).length ? Object.keys(catMap) : ['No Data'], datasets: [{ data: Object.values(catMap).length ? Object.values(catMap) : [1], backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#f43f5e'], borderWidth: 0 }] },
        options: { responsive: true, maintainAspectRatio: false, cutout: '70%' }
      });
    }
  }, [activeMainTab, selectedProductId, dateFilter, salesHistory]);

  return (
    <div className="flex flex-col h-full animate-fade-in font-jakarta bg-white">
      <div className="bg-slate-50 border-b border-slate-100 px-6 py-5 space-y-4 sticky top-0 z-[45] backdrop-blur-xl">
        <div className="flex overflow-x-auto no-scrollbar gap-2">
          {['Revenue', 'Dishes', 'Reviews', 'Groups', 'Entry'].map(tab => (
            <button key={tab} onClick={() => setActiveMainTab(tab as any)} className={`px-8 py-2.5 rounded-full text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeMainTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-400'}`}>{tab}</button>
          ))}
        </div>
        <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="bg-white border border-slate-200 px-6 py-2 rounded-xl text-[10px] font-black outline-none" />
      </div>

      <div className="flex-1 overflow-y-auto p-6 lg:p-14">
        {activeMainTab === 'Revenue' && (
          <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-2xl space-y-8">
             <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Daily Intake</p><h2 className="text-5xl font-black text-indigo-600">₱{filteredHistory.reduce((s,r)=>s+r.amount,0).toLocaleString()}</h2></div>
             <div className="h-[350px]"><canvas ref={chartRefs.revenue}></canvas></div>
          </div>
        )}
        {activeMainTab === 'Dishes' && (
          <div className="space-y-8">
             <div className="flex overflow-x-auto no-scrollbar gap-2 pb-2">
               <button onClick={() => setSelectedProductId('global')} className={`px-6 py-3 rounded-2xl text-[9px] font-black uppercase border transition-all ${selectedProductId === 'global' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400 border-slate-100'}`}>All Archive</button>
               {menuItems.map(item => ( <button key={item.id} onClick={() => setSelectedProductId(item.id)} className={`px-6 py-3 rounded-2xl text-[9px] font-black uppercase border transition-all whitespace-nowrap ${selectedProductId === item.id ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400 border-slate-100'}`}>{item.name}</button> ))}
             </div>
             <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-2xl h-[400px]"><canvas ref={chartRefs.product}></canvas></div>
          </div>
        )}
        {activeMainTab === 'Groups' && ( <div className="bg-white p-14 rounded-[5rem] border border-slate-100 shadow-2xl max-w-2xl mx-auto h-[500px]"><canvas ref={chartRefs.pie}></canvas></div> )}
        {activeMainTab === 'Entry' && (
          <div className="max-w-md mx-auto bg-white p-12 rounded-[4rem] border border-slate-100 shadow-2xl space-y-8">
             <h4 className="font-black text-2xl uppercase italic tracking-tighter">Manual Receipt</h4>
             <select onChange={e => { const item = menuItems.find(i => i.id === parseInt(e.target.value)); if (item) { setRecordingItem(item); setRecordForm({...recordForm, price: item.price}); } }} className="w-full p-6 bg-slate-50 rounded-3xl font-black text-sm outline-none shadow-inner italic cursor-pointer"><option value="">Pick Resource...</option>{menuItems.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select>
             {recordingItem && ( <div className="space-y-6 animate-fade-in"><input type="number" value={recordForm.qty} onChange={e => setRecordForm({...recordForm, qty: parseInt(e.target.value)})} className="w-full p-6 bg-slate-50 rounded-3xl font-black text-sm outline-none shadow-inner" placeholder="Quantity" /><button onClick={() => { setSalesHistory(p => [...p, { timestamp: new Date().toISOString(), amount: recordForm.price * recordForm.qty, itemId: recordingItem.id, itemName: recordingItem.name, categoryName: recordingItem.cat_name, quantity: recordForm.qty, paymentStatus: 'Paid', orderStatus: 'Served' }]); setRecordingItem(null); alert('Entry Committed.'); }} className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-xl">Commit Sale</button></div> )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAnalytics;