
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
  'Money Made': 'See how much you earned today and over time.',
  'Popular Food': 'See which dishes are selling the most.',
  'Branches': 'Check how each of your locations is doing.',
  'Reviews': 'Read what your customers are saying about you.',
  'Groups': 'See which food groups (like Drinks or Mains) make the most money.',
  'Manual Entry': 'Add a sale manually if someone paid in cash offline.'
};

const AdminAnalytics: React.FC<AdminAnalyticsProps> = ({ feedbacks, salesHistory, setSalesHistory, menuItems }) => {
  const [activeMainTab, setActiveMainTab] = useState<'Money Made' | 'Popular Food' | 'Branches' | 'Reviews' | 'Groups' | 'Manual Entry'>('Money Made');
  const [productSubTab, setProductSubTab] = useState<'data' | 'graph'>('graph');
  const [selectedProductId, setSelectedProductId] = useState<number | 'global'>('global');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [globalBranchFilter, setGlobalBranchFilter] = useState<string>('All Branches');
  
  const [recordingItem, setRecordingItem] = useState<MenuItem | null>(null);
  const [recordForm, setRecordForm] = useState({ price: 0, qty: 1, table: '', branch: 'Main' });

  const [branches, setBranches] = useState<string[]>(['Main', 'Branch 1', 'Branch 2']);

  const chartRefs = {
    revenue: useRef<HTMLCanvasElement>(null),
    product: useRef<HTMLCanvasElement>(null),
    pie: useRef<HTMLCanvasElement>(null),
    branch: useRef<HTMLCanvasElement>(null),
    spider: useRef<HTMLCanvasElement>(null),
  };

  const chartInstances = useRef<Record<string, any>>({});
  const categoriesRadar = ["Cleanliness", "Food", "Speed", "Service", "Value", "Feel"];

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
    
    filteredHistory.forEach(record => {
      if (productId === 'global' || record.itemId === productId) {
        const hour = new Date(record.timestamp).getHours();
        let bucketIdx = hoursBuckets.findIndex(h => hour <= h);
        if (bucketIdx === -1) bucketIdx = hoursBuckets.length - 1;
        results[bucketIdx] += record.amount;
      }
    });

    if (filteredHistory.length === 0 && productId === 'global') return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    return results;
  };

  const saveManualSale = () => {
    if (!recordingItem) return;
    const record: SalesRecord = {
      timestamp: new Date().toISOString(),
      amount: recordForm.price * recordForm.qty,
      itemId: recordingItem.id,
      itemName: recordingItem.name,
      categoryName: recordingItem.cat_name,
      quantity: recordForm.qty,
      branch: recordForm.branch,
      paymentStatus: 'Paid',
      orderStatus: 'Served'
    };
    setSalesHistory(prev => [...prev, record]);
    setRecordingItem(null);
    alert('Sale added!');
  };

  useEffect(() => {
    if (!(window as any).Chart) return;

    // Money Made Chart
    if (activeMainTab === 'Money Made' && chartRefs.revenue.current) {
      if (chartInstances.current.revenue) chartInstances.current.revenue.destroy();
      chartInstances.current.revenue = new (window as any).Chart(chartRefs.revenue.current.getContext('2d'), {
        type: 'line',
        data: {
          labels: ['6am','8am','10am','12pm','2pm','4pm','6pm','8pm','10pm'],
          datasets: [{
            label: 'Total Sales (₱)',
            data: getHourlyData('global').slice(0, 9),
            fill: true,
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            borderColor: '#6366f1',
            tension: 0.4
          }]
        },
        options: { responsive: true, maintainAspectRatio: false }
      });
    }

    // Popular Food Chart
    if (activeMainTab === 'Popular Food' && chartRefs.product.current) {
      if (chartInstances.current.product) chartInstances.current.product.destroy();
      const currentData = getHourlyData(selectedProductId);
      chartInstances.current.product = new (window as any).Chart(chartRefs.product.current.getContext('2d'), {
        type: 'bar',
        data: {
          labels: ['6am','8am','10am','12pm','2pm','4pm','6pm','8pm','10pm','12am'],
          datasets: [{
            label: 'Sales for Selected Item (₱)',
            data: currentData,
            backgroundColor: '#6366f1',
            borderRadius: 8
          }]
        },
        options: { responsive: true, maintainAspectRatio: false }
      });
    }

    // Groups Pie Chart
    if (activeMainTab === 'Groups' && chartRefs.pie.current) {
      if (chartInstances.current.pie) chartInstances.current.pie.destroy();
      const catMap: Record<string, number> = {};
      filteredHistory.forEach(r => catMap[r.categoryName] = (catMap[r.categoryName] || 0) + r.amount);
      chartInstances.current.pie = new (window as any).Chart(chartRefs.pie.current.getContext('2d'), {
        type: 'doughnut',
        data: {
          labels: Object.keys(catMap).length ? Object.keys(catMap) : ['No Data'],
          datasets: [{
            data: Object.values(catMap).length ? Object.values(catMap) : [1],
            backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#f43f5e'],
            borderWidth: 0
          }]
        },
        options: { responsive: true, maintainAspectRatio: false, cutout: '70%' }
      });
    }
  }, [activeMainTab, selectedProductId, dateFilter, globalBranchFilter, salesHistory]);

  const liveTotal = useMemo(() => filteredHistory.reduce((s, r) => s + r.amount, 0), [filteredHistory]);

  return (
    <div className="flex flex-col h-full animate-fade-in relative bg-white font-['Plus_Jakarta_Sans']">
      
      {/* Filters */}
      <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 space-y-4 sticky top-0 z-[45]">
        <div className="flex overflow-x-auto no-scrollbar gap-2">
          {['Money Made', 'Popular Food', 'Branches', 'Reviews', 'Groups', 'Manual Entry'].map(tab => (
            <button 
              key={tab} 
              onClick={() => setActiveMainTab(tab as any)}
              className={`px-6 py-2 rounded-full text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeMainTab === tab ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-400'}`}
            >
              {tab}
            </button>
          ))}
        </div>
        
        <div className="flex gap-4 items-center">
          <input 
            type="date" 
            value={dateFilter} 
            onChange={(e) => setDateFilter(e.target.value)} 
            className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-[10px] font-bold outline-none" 
          />
          <select 
            value={globalBranchFilter} 
            onChange={(e) => setGlobalBranchFilter(e.target.value)}
            className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-[10px] font-bold outline-none"
          >
            <option>All Branches</option>
            {branches.map(b => <option key={b}>{b}</option>)}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 lg:p-10">
        <div className="mb-8">
          <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2 italic">{activeMainTab}</h3>
          <p className="text-slate-500 text-sm">{contentData[activeMainTab]}</p>
        </div>

        {activeMainTab === 'Money Made' && (
          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl space-y-6">
             <div className="flex justify-between items-end">
               <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total for this day</p>
                 <h2 className="text-4xl font-black text-indigo-600">₱{liveTotal.toLocaleString()}</h2>
               </div>
             </div>
             <div className="h-[350px]"><canvas ref={chartRefs.revenue}></canvas></div>
          </div>
        )}

        {activeMainTab === 'Popular Food' && (
          <div className="space-y-6">
             <div className="flex overflow-x-auto no-scrollbar gap-2 pb-2">
               <button onClick={() => setSelectedProductId('global')} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase border transition-all ${selectedProductId === 'global' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400 border-slate-100'}`}>All Items</button>
               {menuItems.map(item => (
                 <button key={item.id} onClick={() => setSelectedProductId(item.id)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase border transition-all whitespace-nowrap ${selectedProductId === item.id ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400 border-slate-100'}`}>{item.name}</button>
               ))}
             </div>
             <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl h-[400px]">
               <canvas ref={chartRefs.product}></canvas>
             </div>
          </div>
        )}

        {activeMainTab === 'Groups' && (
          <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-xl max-w-xl mx-auto h-[450px]">
             <canvas ref={chartRefs.pie}></canvas>
          </div>
        )}

        {activeMainTab === 'Manual Entry' && (
          <div className="max-w-md mx-auto bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl space-y-6">
             <h4 className="font-black text-lg uppercase italic text-slate-800">Record a Sale</h4>
             <select onChange={e => {
               const item = menuItems.find(i => i.id === parseInt(e.target.value));
               if (item) { setRecordingItem(item); setRecordForm({...recordForm, price: item.price}); }
             }} className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none border border-slate-100">
                <option value="">Pick a Dish</option>
                {menuItems.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
             </select>
             {recordingItem && (
               <div className="space-y-4 animate-fade-in">
                  <input type="number" value={recordForm.qty} onChange={e => setRecordForm({...recordForm, qty: parseInt(e.target.value)})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" placeholder="How many?" />
                  <button onClick={saveManualSale} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg">Save Sale</button>
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAnalytics;
