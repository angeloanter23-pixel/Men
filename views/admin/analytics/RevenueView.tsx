
import React from 'react';

interface RevenueViewProps {
  filteredHistory: any[];
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

const RevenueView: React.FC<RevenueViewProps> = ({ filteredHistory, chartRef }) => {
  const total = filteredHistory.reduce((s, r) => s + r.amount, 0);
  const count = filteredHistory.length;
  const avg = count > 0 ? total / count : 0;

  return (
    <div className="space-y-10 animate-fade-in max-w-lg mx-auto w-full">
      {/* Hourly Sales Graph */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-10">
         <header className="flex justify-between items-center px-2">
            <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Hourly Sales</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Earnings from 1:00 AM onwards</p>
            </div>
         </header>
         
         <div className="overflow-x-auto no-scrollbar cursor-grab active:cursor-grabbing">
             <div className="h-[320px] min-w-[800px] w-full relative pr-4">
                <canvas ref={chartRef}></canvas>
             </div>
         </div>
         
         <div className="flex justify-center gap-6 border-t border-slate-50 pt-8">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Revenue</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-100 border border-slate-200"></div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Projection</span>
            </div>
         </div>
      </div>

      {/* Metrics List - Apple UI Style */}
      <div className="space-y-4">
        <h3 className="px-6 text-[11px] font-black uppercase text-slate-400 tracking-widest">Performance Metrics</h3>
        
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <ListRow 
            icon="fa-wallet" 
            color="bg-slate-900" 
            label="Total Revenue" 
            value={`₱${total.toLocaleString()}`} 
          />
          <ListRow 
            icon="fa-receipt" 
            color="bg-indigo-500" 
            label="Transaction Volume" 
            value={String(count)} 
          />
          <ListRow 
            icon="fa-chart-line" 
            color="bg-emerald-500" 
            label="Average Sale" 
            value={`₱${avg.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            isLast 
          />
        </div>
      </div>
    </div>
  );
};

export default RevenueView;
