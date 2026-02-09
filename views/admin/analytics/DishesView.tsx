
import React, { useMemo } from 'react';
import { MenuItem, SalesRecord } from '../../../types';

interface DishesViewProps {
  menuItems: MenuItem[];
  selectedProductId: number | 'global';
  setSelectedProductId: (id: number | 'global') => void;
  chartRef: React.RefObject<HTMLCanvasElement | null>;
  filteredHistory: SalesRecord[];
}

const DishesView: React.FC<DishesViewProps> = ({ 
  menuItems, 
  selectedProductId, 
  setSelectedProductId, 
  chartRef,
  filteredHistory 
}) => {
  const selectedItemName = selectedProductId === 'global' ? 'Full Catalog' : menuItems.find(i => i.id === selectedProductId)?.name || 'Unknown Item';

  const topSellers = useMemo(() => {
    const map: Record<string, { name: string; qty: number; rev: number }> = {};
    filteredHistory.forEach(r => {
        if (!map[r.itemId]) map[r.itemId] = { name: r.itemName, qty: 0, rev: 0 };
        map[r.itemId].qty += r.quantity;
        map[r.itemId].rev += r.amount;
    });
    return Object.values(map).sort((a, b) => b.qty - a.qty).slice(0, 5);
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
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-50">
                {topSellers.map((item, idx) => (
                    <div key={idx} className="px-6 py-5 flex items-center justify-between group hover:bg-slate-50/50 transition-all">
                        <div className="flex items-center gap-4">
                            <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
                                #{idx + 1}
                            </div>
                            <div>
                                <p className="text-[14px] font-black text-slate-800 uppercase leading-none mb-1">{item.name}</p>
                                <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">₱{item.rev.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100">
                            <span className="text-[10px] font-black text-indigo-600 uppercase">{item.qty} sold</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
};

export default DishesView;
