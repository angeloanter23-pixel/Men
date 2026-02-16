
import React, { useState, useMemo, useEffect } from 'react';
import * as MenuService from '../../services/menuService';

interface LiveOrdersConsoleProps {
  orders: any[];
  onRefresh: () => void;
}

type SortMode = 'time' | 'table';

export default function LiveOrdersConsole({ orders, onRefresh }: LiveOrdersConsoleProps) {
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [modalTab, setModalTab] = useState<'info' | 'actions'>('info');
  const [sortMode, setSortMode] = useState<SortMode>('time');
  const [showFinished, setShowFinished] = useState(true);
  const [now, setNow] = useState(Date.now());
  
  // Local state for pending changes
  const [localNote, setLocalNote] = useState('');
  const [localStatus, setLocalStatus] = useState('');
  const [localPayment, setLocalPayment] = useState<'Paid' | 'Unpaid'>('Unpaid');
  const [isSaving, setIsSaving] = useState(false);

  // Update "now" every minute to keep relative times fresh
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const handleOrderClick = (order: any) => {
    setSelectedOrder(order);
    setModalTab('info');
    setLocalNote(order.description || '');
    setLocalStatus(order.order_status || 'Pending');
    setLocalPayment(order.payment_status || 'Unpaid');
  };

  const handleSaveAllChanges = async () => {
    if (!selectedOrder) return;
    setIsSaving(true);
    
    try {
      const updates: any = { 
        order_status: localStatus,
        payment_status: localPayment,
        description: localNote
      };

      // Set paid_at timestamp if marking as Paid for the first time or if missing
      if (localPayment === 'Paid' && !selectedOrder.paid_at) {
        updates.paid_at = new Date().toISOString();
      } else if (localPayment === 'Unpaid') {
        updates.paid_at = null; // Reset if accidentally marked paid
      }

      // Set served_at timestamp if marking as Served
      if (localStatus === 'Served' && !selectedOrder.served_at) {
        updates.served_at = new Date().toISOString();
      } else if (localStatus !== 'Served') {
        updates.served_at = null; // Reset if downgraded status
      }

      await MenuService.updateOrder(selectedOrder.id, updates);
      onRefresh();
      setSelectedOrder(null);
    } catch (e) {
      console.error("Save failed", e);
    } finally {
      setIsSaving(false);
    }
  };

  const removeOrder = async () => {
    if (!selectedOrder || !confirm("Delete this order?")) return;
    setIsSaving(true);
    try {
      await MenuService.deleteOrder(selectedOrder.id);
      onRefresh();
      setSelectedOrder(null);
    } catch (e) {
      console.error("Delete failed");
    } finally {
      setIsSaving(false);
    }
  };

  const getFormattedTime = (ts: string) => {
    const date = new Date(ts);
    const dateMs = date.getTime();
    const diffMs = now - dateMs;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;

    const isCurrentYear = date.getFullYear() === new Date().getFullYear();
    if (isCurrentYear) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const processedOrders = useMemo(() => {
    let filtered = [...orders];
    if (!showFinished) {
        filtered = filtered.filter(o => o.order_status !== 'Served');
    }

    return filtered.sort((a, b) => {
      const aIsServed = a.order_status === 'Served' ? 1 : 0;
      const bIsServed = b.order_status === 'Served' ? 1 : 0;
      
      if (aIsServed !== bIsServed) return aIsServed - bIsServed;

      if (sortMode === 'time') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else {
        return a.table_number.toString().localeCompare(b.table_number.toString(), undefined, {numeric: true});
      }
    });
  }, [orders, sortMode, showFinished]);

  return (
    <div className="space-y-6 animate-fade-in font-jakarta">
      <div className="flex items-center justify-between px-4">
        <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.25em]">
          {processedOrders.length} {processedOrders.length === 1 ? 'Order' : 'Orders'} Total
        </p>
        
        <div className="bg-slate-200/50 p-1 rounded-2xl flex border border-slate-200/60 shadow-inner">
          <button 
            onClick={() => setSortMode('time')}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${sortMode === 'time' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <i className="fa-solid fa-clock-rotate-left text-xs"></i>
          </button>
          <button 
            onClick={() => setSortMode('table')}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${sortMode === 'table' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <i className="fa-solid fa-chair text-xs"></i>
          </button>
          <div className="w-px h-4 bg-slate-300 mx-1 self-center opacity-40"></div>
          <button 
            onClick={() => setShowFinished(!showFinished)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${showFinished ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <i className={`fa-solid ${showFinished ? 'fa-history' : 'fa-eye-slash'} text-xs`}></i>
          </button>
        </div>
      </div>

      <div className="mx-2 bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm overflow-hidden divide-y divide-slate-100">
        {processedOrders.map(order => {
          const isServed = order.order_status === 'Served';
          const isPending = order.order_status === 'Pending' || !order.order_status;
          return (
            <button 
              key={order.id} 
              onClick={() => handleOrderClick(order)}
              className={`w-full px-6 py-6 flex items-center justify-between active:bg-slate-50 transition-colors text-left relative group ${isServed ? 'opacity-40 grayscale-[0.5]' : ''}`}
            >
              <div className="flex items-center gap-5 min-w-0">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${isServed ? 'bg-slate-50 border-slate-200 text-slate-400' : isPending ? 'bg-rose-50 border-rose-100 text-rose-500 shadow-lg shadow-rose-100/50' : 'bg-indigo-50 border-indigo-100 text-indigo-600'}`}>
                  <span className="text-[16px] font-black leading-none">x{order.quantity}</span>
                </div>

                <div className="flex flex-col min-w-0">
                  <h4 className="text-[17px] font-black text-slate-900 uppercase tracking-tight leading-none mb-1.5 truncate">
                    {order.item_name}
                  </h4>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                        <i className="fa-solid fa-chair text-[9px] text-slate-300"></i>
                        <span className={`text-[11px] font-black uppercase tracking-widest ${isServed ? 'text-slate-400' : 'text-indigo-600'}`}>
                            Table {order.table_number}
                        </span>
                    </div>
                    <span className="text-[10px] font-medium text-slate-300 uppercase tabular-nums">
                        {getFormattedTime(order.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1.5 shrink-0 ml-4">
                <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-[0.1em] border ${
                    isServed ? 'bg-slate-100 text-slate-400 border-slate-200' 
                    : isPending ? 'bg-rose-50 text-rose-500 border-rose-100 animate-pulse' 
                    : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                }`}>
                    {order.order_status || 'Pending'}
                </span>
                <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${order.payment_status === 'Paid' ? 'bg-emerald-500' : 'bg-orange-500'}`}></div>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${order.payment_status === 'Paid' ? 'text-emerald-600' : 'text-orange-600'}`}>
                        {order.payment_status}
                    </span>
                </div>
                <i className="fa-solid fa-chevron-right text-[10px] text-slate-200 group-active:translate-x-0.5 transition-transform mt-1"></i>
              </div>
            </button>
          );
        })}

        {processedOrders.length === 0 && (
          <div className="py-32 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto text-2xl shadow-inner">
                <i className="fa-solid fa-inbox"></i>
            </div>
            <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.4em] italic">Queue is clear</p>
          </div>
        )}
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-[1500] flex items-end justify-center animate-fade-in font-jakarta">
          <div onClick={() => !isSaving && setSelectedOrder(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl" />
          <div className="relative bg-[#F2F2F7] w-full max-w-lg rounded-t-[3.5rem] shadow-2xl flex flex-col h-[88vh] animate-slide-up overflow-hidden">
            
            <header className="px-10 pt-10 pb-6 bg-white border-b border-slate-100 shrink-0">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none italic">{selectedOrder.item_name}</h3>
                  <p className="text-[10px] font-black text-indigo-600 uppercase mt-2 tracking-[0.2em] leading-none">Table {selectedOrder.table_number} • Qty {selectedOrder.quantity}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="w-12 h-12 rounded-full bg-slate-50 text-slate-300 hover:text-slate-900 transition-colors flex items-center justify-center border border-slate-100 shadow-sm"><i className="fa-solid fa-xmark text-lg"></i></button>
              </div>
              <div className="bg-[#E8E8ED] p-1.5 rounded-2xl flex border border-slate-100 shadow-inner">
                <button onClick={() => setModalTab('info')} className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${modalTab === 'info' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Order Info</button>
                <button onClick={() => setModalTab('actions')} className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${modalTab === 'actions' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Update Status</button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto no-scrollbar p-10 pt-8">
              {modalTab === 'info' ? (
                <div className="space-y-8 animate-fade-in">
                  <div className="bg-white rounded-[2.5rem] p-8 border border-white shadow-sm space-y-6">
                    <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">Customer</span>
                      <span className="text-sm font-black text-slate-900 uppercase italic">{selectedOrder.customer_name}</span>
                    </div>
                    
                    <div className="space-y-4">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none ml-2">Payment Status</span>
                      <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200">
                        <button 
                          onClick={() => setLocalPayment('Paid')}
                          className={`flex-1 py-4 rounded-xl text-[11px] font-black uppercase transition-all flex items-center justify-center gap-2 ${localPayment === 'Paid' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                          <i className="fa-solid fa-circle-check"></i> 
                          Paid
                        </button>
                        <button 
                          onClick={() => setLocalPayment('Unpaid')}
                          className={`flex-1 py-4 rounded-xl text-[11px] font-black uppercase transition-all flex items-center justify-center gap-2 ${localPayment === 'Unpaid' ? 'bg-orange-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                          <i className="fa-solid fa-clock"></i> 
                          Unpaid
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">Total Price</span>
                      <span className="text-3xl font-black text-slate-900 italic tracking-tighter">₱{selectedOrder.amount.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-200/40 shadow-inner">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 leading-none italic">Guest Instructions</p>
                    <p className="text-sm font-bold text-slate-600 leading-relaxed italic">"{selectedOrder.instructions || 'No specific requests.'}"</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-10 animate-fade-in">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4 leading-none">Current Phase</h4>
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        { id: 'Pending', label: 'Order Received', icon: 'fa-envelope' },
                        { id: 'Preparing', label: 'Cooking Now', icon: 'fa-fire' },
                        { id: 'Serving', label: 'Ready for Service', icon: 'fa-bell' },
                        { id: 'Served', label: 'Finished / Served', icon: 'fa-check-circle' }
                      ].map(status => (
                        <button 
                          key={status.id} 
                          onClick={() => setLocalStatus(status.id)}
                          className={`w-full py-6 rounded-[2.2rem] font-black uppercase text-[11px] tracking-[0.2em] transition-all flex items-center justify-between px-10 border-2 ${
                            localStatus === status.id 
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xl shadow-indigo-100' 
                            : 'bg-white border-white text-slate-300 hover:border-slate-100'
                          }`}
                        >
                          <span>{status.label}</span>
                          <i className={`fa-solid ${status.icon} text-sm`}></i>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4 italic leading-none">Note to Guest</h4>
                    <textarea 
                      value={localNote} 
                      onChange={e => setLocalNote(e.target.value)} 
                      placeholder="e.g. 'Your food is almost ready!'" 
                      className="w-full bg-white border border-white rounded-[2.5rem] p-8 text-sm font-bold outline-none focus:ring-4 ring-indigo-500/5 transition-all shadow-sm h-32 resize-none"
                    />
                  </div>
                  <div className="pt-6 border-t border-slate-200">
                    <button onClick={removeOrder} className="w-full py-5 text-rose-500 font-black text-[12px] uppercase tracking-widest hover:bg-rose-50 rounded-[2rem] transition-colors">Void Order</button>
                  </div>
                </div>
              )}
            </div>

            <div className="p-10 bg-white border-t border-slate-100 shrink-0">
              <button 
                onClick={handleSaveAllChanges} 
                disabled={isSaving}
                className="w-full py-7 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase text-[12px] tracking-[0.4em] shadow-2xl active:scale-95 transition-all disabled:opacity-50"
              >
                {isSaving ? <i className="fa-solid fa-spinner animate-spin mr-2"></i> : 'Confirm Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
