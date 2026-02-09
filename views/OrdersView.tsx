
import React, { useState, useEffect, useMemo } from 'react';
import * as MenuService from '../services/menuService';
import { supabase } from '../lib/supabase';

interface OrdersViewProps {
  restaurantId?: string;
  tableNumber: string | null;
  onPayNow: () => void;
  onGoToMenu: () => void;
  onIdentifyTable: () => void; 
}

const VerticalStepper: React.FC<{ status: string | null, description?: string }> = ({ status, description }) => {
    // Default to 'Pending' if no status exists in DB
    const currentStatus = status || 'Pending';
    
    const steps = [
        { id: 'Pending', label: 'Pending', desc: 'Order not received yet in kitchen.' },
        { id: 'Confirmed', label: 'Order Received', desc: 'The kitchen has accepted your request.' },
        { id: 'Preparing', label: 'Cooking Now', desc: 'Our chefs are currently preparing your dish.' },
        { id: 'Serving', label: 'Ready for Service', desc: 'Your meal is plated and heading to your table.' },
        { id: 'Served', label: 'Served', desc: 'Hope you enjoy your delicious selection!' }
    ];

    // Map legacy status strings to our stepper IDs
    const currentIdx = steps.findIndex(s => 
      s.id === currentStatus || 
      (currentStatus === 'Cooking' && s.id === 'Preparing') || 
      (currentStatus === 'Ready' && s.id === 'Serving')
    );
    
    const safeIdx = currentIdx === -1 ? 0 : currentIdx;

    return (
        <div className="space-y-0 relative pl-8 mt-4">
            {/* Vertical Line Connector */}
            <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-slate-100 z-0">
                <div 
                    className="w-full bg-indigo-500 transition-all duration-[1s] ease-in-out" 
                    style={{ height: `${(safeIdx / (steps.length - 1)) * 100}%` }}
                />
            </div>

            {steps.map((step, i) => {
                const isPassed = i < safeIdx;
                const isCurrent = i === safeIdx;
                const isUpcoming = i > safeIdx;

                return (
                    <div key={step.id} className={`relative pb-10 last:pb-0 animate-fade-in`} style={{ animationDelay: `${i * 80}ms` }}>
                        {/* Status Icon Node */}
                        <div className={`absolute -left-8 top-1 w-8 h-8 rounded-full border-4 flex items-center justify-center z-10 transition-all duration-500 ${
                            isCurrent ? 'bg-indigo-600 border-indigo-100 text-white scale-110 shadow-lg' : 
                            isPassed ? 'bg-indigo-500 border-white text-white' : 
                            'bg-white border-slate-50 text-slate-200'
                        }`}>
                            {isPassed ? (
                                <i className="fa-solid fa-check text-[10px]"></i>
                            ) : (
                                <div className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-white' : 'bg-slate-200'}`} />
                            )}
                        </div>

                        {/* Text Content */}
                        <div className="flex flex-col gap-1">
                            <h4 className={`text-sm font-black uppercase tracking-tight leading-none ${isCurrent ? 'text-indigo-600' : isPassed ? 'text-slate-900' : 'text-slate-300'}`}>
                                {step.label}
                            </h4>
                            <p className={`text-[11px] font-medium leading-relaxed ${isCurrent ? 'text-slate-600' : 'text-slate-400 opacity-60'}`}>
                                {step.desc}
                            </p>
                            
                            {/* KITCHEN NOTE */}
                            {isCurrent && description && (
                                <div className="mt-4 animate-fade-in bg-indigo-50/50 p-5 rounded-[2rem] border border-indigo-100/50 flex gap-4">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                                        <i className="fa-solid fa-message text-[10px]"></i>
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-black uppercase text-indigo-400 tracking-[0.2em] mb-1">Kitchen Update</p>
                                        <p className="text-xs font-bold text-indigo-900 leading-tight italic">"{description}"</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const OrdersView: React.FC<OrdersViewProps> = ({ restaurantId, tableNumber, onPayNow, onGoToMenu, onIdentifyTable }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [showBillModal, setShowBillModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [modalActiveTab, setModalActiveTab] = useState<'status' | 'details'>('status');

  const fetchOrders = async () => {
    if (!tableNumber || !restaurantId) return;
    try {
      const data = await MenuService.getOrdersByTable(restaurantId, tableNumber);
      setOrders(data);
    } catch (err) {
      console.error("Order sync failed");
    }
  };

  useEffect(() => {
    if (tableNumber && restaurantId) {
      fetchOrders();

      const channel = supabase.channel(`table-updates-${tableNumber}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurantId}` }, (payload) => {
            if (payload.new && (payload.new as any).table_number === tableNumber) {
                fetchOrders();
                if (selectedOrder && (payload.new as any).id === selectedOrder.id) {
                    setSelectedOrder(payload.new);
                }
            } else if (payload.old && orders.some(o => o.id === (payload.old as any).id)) {
                fetchOrders();
            }
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [tableNumber, restaurantId, selectedOrder]);

  const totalUnpaid = orders
    .filter(o => o.payment_status === 'Unpaid')
    .reduce((sum, o) => sum + o.amount, 0);

  if (!tableNumber) {
    return (
      <div className="p-10 text-center py-48 animate-fade-in flex flex-col items-center font-jakarta">
        <div className="w-24 h-24 bg-white text-slate-200 rounded-[2.5rem] flex items-center justify-center mb-8 text-4xl shadow-xl border border-slate-50">
          <i className="fa-solid fa-qrcode text-orange-500/20"></i>
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-4 uppercase tracking-tighter">Scan Table.</h2>
        <p className="text-slate-400 text-sm font-medium max-w-xs mb-10 leading-relaxed">Unlock your menu and see live orders by scanning your table QR.</p>
        <button onClick={onIdentifyTable} className="w-full max-w-xs bg-slate-900 text-white py-6 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.3em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3">Find My Table</button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in bg-[#F2F2F7] min-h-screen pb-48 font-jakarta">
      <div className="max-w-[800px] mx-auto px-6 py-10">
        <header className="mb-10 flex items-center justify-between bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div>
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1 leading-none">Your Location</p>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">Table {tableNumber}</h2>
          </div>
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner">
            <i className="fa-solid fa-location-crosshairs"></i>
          </div>
        </header>

        <section className="space-y-6">
            <div className="flex items-center gap-4 px-4">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Activity Log</span>
                <div className="h-px bg-slate-200 flex-1"></div>
            </div>

            <div className="grid grid-cols-1 gap-3">
                {orders.map(order => (
                    <button key={order.id} onClick={() => { setSelectedOrder(order); setModalActiveTab('status'); }} className="w-full bg-white p-6 rounded-[2.2rem] border border-white shadow-sm flex items-center justify-between active:scale-[0.98] transition-all text-left">
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center font-black text-slate-800 border border-slate-100 text-[10px] shrink-0">x{order.quantity}</div>
                            <div className="min-w-0">
                                <h4 className="font-black text-slate-800 uppercase text-sm leading-none mb-1.5 truncate">{order.item_name}</h4>
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${order.payment_status === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                                            {order.payment_status}
                                        </span>
                                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{order.order_status || 'Pending'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className="text-sm font-black text-slate-900 tracking-tighter">₱{order.amount.toLocaleString()}</span>
                            <i className="fa-solid fa-chevron-right text-[10px] text-slate-100"></i>
                        </div>
                    </button>
                ))}
            </div>

            {orders.length === 0 && (
                <div className="py-32 text-center border-4 border-dashed border-white rounded-[4rem] bg-white/50 flex flex-col items-center">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-slate-100 mb-4 shadow-sm">
                      <i className="fa-solid fa-mug-hot text-2xl"></i>
                    </div>
                    <p className="text-slate-300 text-[10px] font-black uppercase tracking-[0.4em]">Empty session</p>
                </div>
            )}
        </section>
      </div>

      {totalUnpaid > 0 && (
          <div className="fixed bottom-24 left-0 right-0 p-6 z-[45] flex flex-col items-center">
            <button onClick={() => setShowBillModal(true)} className="w-full max-w-sm bg-slate-900 text-white py-6 px-10 rounded-[2.5rem] font-black text-[12px] uppercase tracking-[0.2em] shadow-2xl active:scale-95 flex justify-between items-center transition-all">
                <div className="flex items-center gap-3">
                    <i className="fa-solid fa-receipt text-indigo-400"></i>
                    <span>Unpaid Bill</span>
                </div>
                <span className="text-lg tracking-tighter italic">₱{totalUnpaid.toLocaleString()}</span>
            </button>
          </div>
      )}

      {selectedOrder && (
          <div className="fixed inset-0 z-[2000] flex items-end justify-center animate-fade-in p-0 sm:p-4">
              <div onClick={() => setSelectedOrder(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" />
              <div className="relative bg-[#F2F2F7] w-full max-w-lg rounded-t-[3rem] shadow-2xl flex flex-col h-[90vh] sm:h-auto animate-slide-up overflow-hidden">
                  
                  <header className="bg-white border-b border-slate-100 sticky top-0 z-10 shrink-0 px-10 pt-10 pb-6">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none italic">{selectedOrder.quantity}x {selectedOrder.item_name}</h3>
                            <p className="text-[10px] font-black text-indigo-600 uppercase mt-2 tracking-[0.2em] leading-none">Order Tracking</p>
                        </div>
                        <button onClick={() => setSelectedOrder(null)} className="w-10 h-10 rounded-full bg-slate-50 text-slate-300 flex items-center justify-center hover:text-slate-900 transition-colors"><i className="fa-solid fa-xmark"></i></button>
                      </div>

                      <div className="bg-slate-100 p-1 rounded-2xl flex border border-slate-200/50">
                          <button 
                            onClick={() => setModalActiveTab('status')}
                            className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${modalActiveTab === 'status' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                          >
                            Status
                          </button>
                          <button 
                            onClick={() => setModalActiveTab('details')}
                            className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${modalActiveTab === 'details' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                          >
                            Details
                          </button>
                      </div>
                  </header>

                  <div className="flex-1 overflow-y-auto no-scrollbar p-10 py-8">
                      {modalActiveTab === 'status' ? (
                          <div className="animate-fade-in">
                              <VerticalStepper status={selectedOrder.order_status} description={selectedOrder.description} />
                          </div>
                      ) : (
                          <div className="space-y-6 animate-fade-in">
                              <div className="bg-white rounded-[2.5rem] p-8 border border-white shadow-sm space-y-6">
                                  <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Customer</span>
                                      <span className="text-[12px] font-black text-slate-900 uppercase italic">{selectedOrder.customer_name}</span>
                                  </div>
                                  <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Time Sent</span>
                                      <span className="text-[12px] font-black text-slate-900 uppercase">{new Date(selectedOrder.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                  </div>
                                  <div className="pt-2 flex justify-between items-center">
                                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Amount</span>
                                      <span className="text-3xl font-black text-slate-900 tracking-tighter italic">₱{selectedOrder.amount.toLocaleString()}</span>
                                  </div>
                              </div>

                              {selectedOrder.payment_status === 'Unpaid' && (
                                  <button onClick={() => { setSelectedOrder(null); onPayNow(); }} className="w-full bg-indigo-600 text-white py-6 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.3em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3">
                                    <i className="fa-solid fa-credit-card"></i>
                                    Pay for Item Now
                                  </button>
                              )}
                          </div>
                      )}
                  </div>

                  <div className="p-8 pt-0 bg-[#F2F2F7] shrink-0">
                      <button onClick={() => setSelectedOrder(null)} className="w-full py-5 bg-white text-slate-400 rounded-[2rem] font-black text-[13px] uppercase tracking-widest active:scale-[0.98] transition-all shadow-sm">Dismiss</button>
                  </div>
              </div>
          </div>
      )}

      {showBillModal && (
          <div className="fixed inset-0 z-[1000] flex items-end justify-center animate-fade-in">
              <div onClick={() => setShowBillModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
              <div className="relative bg-white w-full max-w-lg rounded-t-[3.5rem] shadow-2xl flex flex-col overflow-hidden animate-slide-up pb-12 max-h-[85vh]">
                  <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto my-5 shrink-0" />
                  
                  <div className="px-10 pb-8 flex justify-between items-center border-b border-slate-50">
                      <div>
                          <h3 className="text-2xl font-black tracking-tighter uppercase text-slate-900 leading-none italic">Total Bill</h3>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2 leading-none">Table {tableNumber} • Outstanding</p>
                      </div>
                      <button onClick={() => setShowBillModal(false)} className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 hover:text-slate-900 transition-colors"><i className="fa-solid fa-xmark"></i></button>
                  </div>

                  <div className="flex-1 overflow-y-auto px-10 py-8 no-scrollbar space-y-6">
                      {orders.filter(o => o.payment_status === 'Unpaid').map((order, idx) => (
                          <div key={idx} className="flex justify-between items-center">
                              <div className="flex gap-4 items-center">
                                  <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 w-8 h-8 rounded-lg flex items-center justify-center border border-indigo-100">{order.quantity}x</span>
                                  <div>
                                      <p className="text-sm font-black text-slate-800 uppercase leading-none truncate max-w-[150px]">{order.item_name}</p>
                                      <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-1.5">For {order.customer_name}</p>
                                  </div>
                              </div>
                              <span className="text-sm font-black text-slate-900 tracking-tighter">₱{order.amount.toLocaleString()}</span>
                          </div>
                      ))}
                      
                      <div className="pt-8 border-t border-dashed border-slate-100">
                          <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Subtotal Due</span>
                              <span className="text-sm font-bold text-slate-800">₱{totalUnpaid.toLocaleString()}</span>
                          </div>
                      </div>
                  </div>

                  <div className="px-10 pt-6 space-y-6">
                      <div className="flex justify-between items-end">
                          <span className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] leading-none mb-1">Total Payable</span>
                          <span className="text-5xl font-black text-slate-900 tracking-tighter leading-none italic">₱{totalUnpaid.toLocaleString()}</span>
                      </div>
                      <button 
                        onClick={onPayNow} 
                        className="w-full bg-slate-900 text-white py-7 rounded-[2.5rem] font-black uppercase text-[12px] tracking-[0.4em] shadow-2xl active:scale-95 transition-all"
                      >
                        Proceed to Checkout
                      </button>
                  </div>
              </div>
          </div>
      )}

      <style>{`
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.23, 1, 0.32, 1) forwards; }
      `}</style>
    </div>
  );
};

export default OrdersView;
