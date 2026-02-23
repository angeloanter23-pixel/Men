
import React, { useMemo } from 'react';
import { MenuItem, SalesRecord } from '../../../types';

interface DishesViewProps {
  menuItems: MenuItem[];
  selectedProductId: number | 'global';
  setSelectedProductId: (id: number | 'global') => void;
  chartRef: React.RefObject<HTMLCanvasElement | null>;
  filteredHistory: SalesRecord[];
}

const ListRow: React.FC<{ 
  icon: string; 
  color: string; 
  label: string; 
  value: string; 
  subValue?: string;
  isLast?: boolean 
}> = ({ icon, color, label, value, subValue, isLast }) => (
  <div className={`flex items-center justify-between py-4 px-6 ${!isLast ? 'border-b border-slate-100' : ''}`}>
    <div className="flex items-center gap-4 min-w-0">
      <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center text-white shadow-sm shrink-0`}>
        <i className={`fa-solid ${icon} text-[14px]`}></i>
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-[15px] font-semibold text-slate-800 tracking-tight truncate">{label}</span>
        {subValue && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{subValue}</span>}
      </div>
    </div>
    <div className="flex items-center gap-3 shrink-0 ml-4">
      <span className="text-[15px] font-black text-slate-900 tabular-nums">{value}</span>
    </div>
  </div>
);

const DishesView: React.FC<DishesViewProps> = ({ 
  menuItems, 
  selectedProductId, 
  setSelectedProductId, 
  chartRef,
  filteredHistory 
}) => {
  const selectedItemName = selectedProductId === 'global' ? 'Full Catalog' : menuItems.find(i => i.id === selectedProductId)?.name || 'Unknown Item';

  const topSellers = useMemo(() => {
    const map: Record<string, { name: string; qty: number; rev: number; paidQty: number; servedQty: number }> = {};
    filteredHistory.forEach(r => {
        if (!map[r.itemId]) map[r.itemId] = { name: r.itemName, qty: 0, rev: 0, paidQty: 0, servedQty: 0 };
        map[r.itemId].qty += r.quantity;
        map[r.itemId].rev += r.amount;
        if (r.paymentStatus === 'Paid') map[r.itemId].paidQty += r.quantity;
        if (r.orderStatus === 'Served') map[r.itemId].servedQty += r.quantity;
    });
    return Object.values(map).sort((a, b) => b.qty - a.qty).slice(0, 10);
  }, [filteredHistory]);

  return (
    <div className="space-y-10 animate-fade-in max-w-lg mx-auto w-full">
      <div className="space-y-6">
        <div className="flex overflow-x-auto no-scrollbar gap-2 py-2">
          <button 
            onClick={() => setSelectedProductId('global')} 
            className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase border transition-all whitespace-nowrap ${selectedProductId === 'global' ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm' : 'bg-white text-slate-400 border-slate-200'}`}
          >
            All Items
          </button>
          {menuItems.map(item => ( 
            <button 
              key={item.id} 
              onClick={() => setSelectedProductId(item.id as number)} 
              className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase border transition-all whitespace-nowrap ${selectedProductId === item.id ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm' : 'bg-white text-slate-400 border-slate-200'}`}
            >
              {item.name}
            </button> 
          ))}
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <header className="mb-8 px-2">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Item Trend</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Earnings for {selectedItemName}</p>
          </header>
          
          <div className="overflow-x-auto no-scrollbar cursor-grab active:cursor-grabbing">
            <div className="h-[320px] min-w-[800px] w-full relative pr-4">
              <canvas ref={chartRef}></canvas>
            </div>
          </div>
        </div>
      </div>

      {selectedProductId === 'global' && topSellers.length > 0 && (
        <div className="space-y-4">
            <h3 className="px-6 text-[11px] font-black uppercase text-slate-400 tracking-widest">Top Sellers</h3>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {topSellers.map((item, idx) => (
                    <ListRow 
                        key={idx}
                        icon="fa-utensils"
                        color={idx === 0 ? "bg-amber-400" : idx === 1 ? "bg-slate-400" : idx === 2 ? "bg-orange-700" : "bg-indigo-500"}
                        label={item.name}
                        value={`${item.qty} orders`}
                        subValue={`₱${item.rev.toLocaleString()}`}
                        isLast={idx === topSellers.length - 1}
                    />
                ))}
            </div>
        </div>
      )}
    </div>
  );
};

export default DishesView;
