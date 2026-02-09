
import React, { useMemo } from 'react';
import { SalesRecord } from '../../../types';

interface SectionsViewProps {
  filteredHistory: SalesRecord[];
  chartRef: React.RefObject<HTMLCanvasElement | null>;
}

const ListRow: React.FC<{ 
  icon: string; 
  color: string; 
  label: string; 
  value: string; 
  isLast?: boolean 
}> = ({ icon, color, label, value, isLast }) => (
  <div className={`flex items-center justify-between py-4 px-6 ${!isLast ? 'border-b border-slate-100' : ''}`}>
    <div className="flex items-center gap-4 min-w-0">
      <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center text-white shadow-sm shrink-0`}>
        <i className={`fa-solid ${icon} text-[14px]`}></i>
      </div>
      <span className="text-[15px] font-semibold text-slate-800 tracking-tight truncate">{label}</span>
    </div>
    <div className="flex items-center gap-3 shrink-0 ml-4">
      <span className="text-[15px] font-black text-slate-900 tabular-nums">{value}</span>
    </div>
  </div>
);

const SectionsView: React.FC<SectionsViewProps> = ({ filteredHistory, chartRef }) => {
  const { totalRevenue, totalQty, topCategory } = useMemo(() => {
    const revenue = filteredHistory.reduce((s, r) => s + r.amount, 0);
    const qty = filteredHistory.reduce((s, r) => s + r.quantity, 0);
    
    const catMap: Record<string, number> = {};
    filteredHistory.forEach(r => {
      catMap[r.categoryName] = (catMap[r.categoryName] || 0) + r.amount;
    });
    
    let topCat = 'None';
    let maxRev = 0;
    Object.entries(catMap).forEach(([name, rev]) => {
      if (rev > maxRev) {
        maxRev = rev;
        topCat = name;
      }
    });

    return { totalRevenue: revenue, totalQty: qty, topCategory: topCat };
  }, [filteredHistory]);

  return (
    <div className="space-y-10 animate-fade-in max-w-lg mx-auto w-full">
      {/* Category Distribution Chart */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-10 text-center">
        <header>
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-none">Category Sales</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 leading-none">Revenue split by menu section</p>
        </header>
        
        <div className="h-[320px] relative">
          <canvas ref={chartRef}></canvas>
        </div>
      </div>

      {/* Breakdown List - Apple UI Style */}
      <div className="space-y-4">
        <h3 className="px-6 text-[11px] font-black uppercase text-slate-400 tracking-widest">Section Breakdown</h3>
        
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <ListRow 
            icon="fa-wallet" 
            color="bg-slate-900" 
            label="Gross Revenue" 
            value={`₱${totalRevenue.toLocaleString()}`} 
          />
          <ListRow 
            icon="fa-truck-ramp-box" 
            color="bg-indigo-500" 
            label="Units Dispatched" 
            value={String(totalQty)} 
          />
          <ListRow 
            icon="fa-award" 
            color="bg-amber-500" 
            label="Top Section" 
            value={topCategory} 
            isLast 
          />
        </div>
      </div>
    </div>
  );
};

export default SectionsView;
