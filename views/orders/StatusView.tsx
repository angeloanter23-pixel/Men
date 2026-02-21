import React, { useState, useMemo } from 'react';

interface StatusViewProps {
  orders: any[];
}

const StatusView: React.FC<StatusViewProps> = ({ orders }) => {
  const [activeTrafficTab, setActiveTrafficTab] = useState<'pending' | 'preparing' | 'cooking' | 'serving' | 'served'>('pending');

  const { pending, preparing, cooking, serving, served } = useMemo(() => {
    return {
      pending: orders.filter(o => o.order_status === 'Pending' || o.order_status === 'Confirmed'),
      preparing: orders.filter(o => o.order_status === 'Preparing'),
      cooking: orders.filter(o => o.order_status === 'Cooking'),
      serving: orders.filter(o => o.order_status === 'Serving'),
      served: orders.filter(o => o.order_status === 'Served')
    };
  }, [orders]);

  const tabs = [
    { id: 'pending', label: 'Pending', icon: 'fa-clock', color: 'slate', items: pending },
    { id: 'preparing', label: 'Preparing', icon: 'fa-fire-burner', color: 'orange', items: preparing },
    { id: 'cooking', label: 'Cooking', icon: 'fa-fire', color: 'rose', items: cooking },
    { id: 'serving', label: 'Serving', icon: 'fa-bell-concierge', color: 'emerald', items: serving },
    { id: 'served', label: 'Served', icon: 'fa-check-double', color: 'indigo', items: served }
  ];

  const activeTab = tabs.find(t => t.id === activeTrafficTab)!;

  return (
    <div className="px-6 py-6 space-y-6 animate-fade-in flex flex-col h-full overflow-hidden">
        <div className="bg-slate-100 p-1 rounded-xl flex shrink-0 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => (
                <button 
                    key={tab.id}
                    onClick={() => setActiveTrafficTab(tab.id as any)}
                    className={`flex-1 py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 text-[10px] font-bold transition-all whitespace-nowrap ${activeTrafficTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <i className={`fa-solid ${tab.icon}`}></i>
                    {tab.label}
                </button>
            ))}
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 space-y-3 px-1 pb-10">
            {activeTab.items.map(o => (
                <div key={o.id} className={`bg-${activeTab.color}-50 border border-${activeTab.color}-100 p-4 rounded-2xl flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 bg-white rounded-full flex items-center justify-center text-${activeTab.color}-600 font-bold text-xs shadow-sm`}>{o.quantity}x</div>
                        <div>
                            <h4 className="font-bold text-slate-900 text-sm">{o.item_name}</h4>
                            <p className={`text-[10px] font-bold text-${activeTab.color}-600 uppercase tracking-wider`}>{activeTab.label}</p>
                        </div>
                    </div>
                    <span className="text-xs font-bold text-slate-400">#{o.id.toString().slice(-4)}</span>
                </div>
            ))}
            
            {activeTab.items.length === 0 && (
                <div className="py-12 text-center text-slate-400 text-sm font-medium italic">No orders in this status</div>
            )}
        </div>
    </div>
  );
};

export default StatusView;
