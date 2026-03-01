import React, { useState, useEffect, useMemo } from 'react';
import * as MenuService from '../../services/menuService';
import { supabase } from '../../lib/supabase';
import PayNowButton from './PayNowButton';
import OrderBottomModal from './OrderBottomModal';
import AllStatusBottomModal from './AllStatusBottomModal';

interface OrdersViewProps {
  restaurantId?: string;
  tableNumber: string | null;
  onPayNow: () => void;
  onGoToMenu: () => void;
  onIdentifyTable: () => void; 
}

const OrdersView: React.FC<OrdersViewProps> = ({ restaurantId, tableNumber, onPayNow, onGoToMenu, onIdentifyTable }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const fetchOrders = async () => {
    if (!tableNumber || !restaurantId) return;
    try {
      const data = await MenuService.getOrdersByTable(restaurantId, tableNumber);
      setOrders(data);
    } catch (err) { console.error("Order sync failed"); }
  };

  useEffect(() => {
    if (tableNumber && restaurantId) {
      fetchOrders();
      const channel = supabase.channel(`live-orders-${tableNumber}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurantId}` }, fetchOrders)
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [tableNumber, restaurantId]);

  const localIds = useMemo(() => JSON.parse(localStorage.getItem('foodie_my_order_ids') || '[]'), [orders]);
  
  const { myOrders, groupOrders } = useMemo(() => {
    const my = orders.filter(o => localIds.includes(String(o.id)));
    const others = orders.filter(o => !localIds.includes(String(o.id)));
    return { myOrders: my, groupOrders: others };
  }, [orders, localIds]);

  const totalAmount = useMemo(() => {
    return orders.reduce((sum, order) => sum + order.amount, 0);
  }, [orders]);

  if (!tableNumber) {
    return (
      <div className="p-10 text-center py-48 animate-fade-in flex flex-col items-center font-jakarta">
        <div className="w-24 h-24 bg-white text-slate-100 rounded-[2.5rem] flex items-center justify-center mb-8 text-4xl shadow-xl border border-slate-50"><i className="fa-solid fa-qrcode"></i></div>
        <h2 className="text-3xl font-bold text-slate-900 mb-4">Locate Table</h2>
        <button onClick={onIdentifyTable} className="w-full max-w-xs bg-slate-900 text-white py-4 rounded-2xl font-bold text-sm shadow-xl active:scale-95 transition-all">Find My Table</button>
      </div>
    );
  }

  const OrderItem: React.FC<{ order: any; showLabel?: boolean }> = ({ order, showLabel }) => (
    <div onClick={() => setSelectedOrder(order)} className="bg-white p-4 flex items-center justify-between cursor-pointer active:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 hover:bg-slate-50 group">
        <div className="flex items-center gap-4 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border transition-colors ${order.order_status === 'Served' ? 'bg-slate-50 text-slate-400 border-slate-200' : 'bg-orange-50 text-orange-600 border-orange-100 group-hover:bg-orange-100'}`}>
            {order.quantity}x
            </div>
            <div className="min-w-0">
            <h4 className="font-bold text-slate-900 text-[15px] leading-tight truncate">{order.item_name}</h4>
            {showLabel && <p className="text-[10px] text-slate-400 font-medium mt-1 flex items-center gap-1.5"><i className="fa-solid fa-user text-[9px]"></i> {order.customer_name || 'Guest'}</p>}
            </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0 ml-4">
            <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border ${order.order_status === 'Served' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>{order.order_status}</span>
            <span className="font-black text-slate-900 text-sm tracking-tight">₱{order.amount.toLocaleString()}</span>
        </div>
    </div>
  );

  const [showPayNow, setShowPayNow] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<'counter' | 'maya' | 'gcash' | 'card'>('counter');

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setShowPayNow(false); // Hide on scroll down
      } else {
        setShowPayNow(true); // Show on scroll up
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const unpaidOrders = useMemo(() => orders.filter(o => o.payment_status !== 'Paid'), [orders]);
  const unpaidTotal = useMemo(() => unpaidOrders.reduce((sum, o) => sum + o.amount, 0), [unpaidOrders]);

  return (
    <div className="animate-fade-in bg-slate-50 min-h-screen pb-64 font-jakarta relative">
      <div className="max-w-[800px] mx-auto">
        
        {/* HEADER */}
        <header className="px-6 pt-16 pb-10 text-center relative border-b border-slate-200/60 bg-white">
          <h1 className="text-[32px] font-black text-slate-900 tracking-tight leading-none mb-4 uppercase">
            Live Activity
          </h1>
          <p className="text-slate-400 text-[15px] font-medium leading-relaxed px-10">
            Real-time updates from the kitchen
          </p>
        </header>

        <div className="px-6 py-10 space-y-12">
          {/* MY ORDERS */}
          <section>
            <div className="mb-4 px-2 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">My Orders</h2>
              <button onClick={() => setShowStatusModal(true)} className="text-[10px] font-bold text-orange-500 uppercase tracking-wider flex items-center gap-1">status <i className="fa-solid fa-chevron-right text-[8px]"></i></button>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200/60">
              {myOrders.length > 0 ? (
                myOrders.map(order => <OrderItem key={order.id} order={order} />)
              ) : (
                <div className="py-8 text-center text-slate-400 text-sm font-medium italic">No orders yet</div>
              )}
            </div>
          </section>

          {/* OTHER ORDERS */}
          <section>
            <div className="mb-4 px-2 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Table Activity</h2>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Group Orders</span>
            </div>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200/60">
              {groupOrders.length > 0 ? (
                groupOrders.map(order => <OrderItem key={order.id} order={order} showLabel={true} />)
              ) : (
                <div className="py-8 text-center text-slate-400 text-sm font-medium italic">No other orders</div>
              )}
            </div>
          </section>
        </div>

        {/* PAY NOW FOOTER */}
        {orders.length > 0 && (
            <div className={`fixed bottom-24 left-0 right-0 z-[110] transition-transform duration-300 ${showPayNow ? 'translate-y-0' : 'translate-y-full'}`}>
                <PayNowButton totalAmount={totalAmount} onPayNow={() => setShowPaymentModal(true)} />
            </div>
        )}
      </div>

      {/* STATUS MODAL */}
      {showStatusModal && (
        <AllStatusBottomModal orders={orders} onClose={() => setShowStatusModal(false)} />
      )}

      {/* ORDER DETAIL MODAL */}
      {selectedOrder && (
        <OrderBottomModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}

      {/* PAYMENT MODAL */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[5000] flex items-end justify-center animate-fade-in" onClick={() => setShowPaymentModal(false)}>
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
            <div className="relative bg-[#F2F2F7] w-full max-w-lg rounded-t-[2rem] shadow-2xl flex flex-col overflow-hidden animate-slide-up max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-4 shrink-0" />
                
                <div className="px-8 pb-6">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-1">Payment Method</h3>
                    <p className="text-sm font-medium text-slate-500">Choose how you want to pay</p>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-8 space-y-6">
                    <div className="space-y-3">
                        <button 
                            onClick={() => setSelectedPayment('counter')}
                            className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all ${selectedPayment === 'counter' ? 'bg-white border-indigo-600 shadow-md ring-1 ring-indigo-600' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 text-xl">
                                    <i className="fa-solid fa-cash-register"></i>
                                </div>
                                <div className="text-left">
                                    <span className="block font-bold text-slate-900">Over the Counter</span>
                                    <span className="text-xs font-medium text-slate-400">Pay cash or card at the cashier</span>
                                </div>
                            </div>
                            {selectedPayment === 'counter' && <i className="fa-solid fa-circle-check text-indigo-600 text-xl"></i>}
                        </button>

                        {['maya', 'gcash', 'card'].map((method) => (
                            <button 
                                key={method}
                                disabled
                                className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-between opacity-60 cursor-not-allowed"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-slate-400 text-xl shadow-sm">
                                        {method === 'card' ? <i className="fa-solid fa-credit-card"></i> : <i className="fa-solid fa-wallet"></i>}
                                    </div>
                                    <div className="text-left">
                                        <span className="block font-bold text-slate-900 capitalize">{method}</span>
                                        <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider bg-orange-100 px-2 py-0.5 rounded-full">Coming Soon</span>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>

                    {selectedPayment === 'counter' && (
                        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-6 animate-fade-in">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 font-bold text-lg">1</div>
                                <div>
                                    <h4 className="font-bold text-slate-900 text-sm">Proceed to the Cashier</h4>
                                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">Show your table number <span className="font-bold text-slate-900">#{tableNumber}</span> to the staff.</p>
                                </div>
                            </div>
                            
                            <div className="border-t border-slate-100 pt-6">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Unpaid Orders</span>
                                    <span className="text-xl font-black text-slate-900">₱{unpaidTotal.toLocaleString()}</span>
                                </div>
                                {unpaidOrders.length > 0 ? (
                                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                        {unpaidOrders.map(order => (
                                            <div key={order.id} className="flex justify-between items-center text-sm">
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <span className="font-bold text-xs w-5">{order.quantity}x</span>
                                                    <span className="truncate max-w-[180px]">{order.item_name}</span>
                                                </div>
                                                <span className="font-bold text-slate-900">₱{order.amount.toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-4 text-emerald-600 font-bold text-sm bg-emerald-50 rounded-xl">
                                        <i className="fa-solid fa-check-circle mr-2"></i> All orders paid
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="p-6 bg-white border-t border-slate-100">
                    <button 
                        onClick={() => setShowPaymentModal(false)}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-xl active:scale-95 transition-all"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default OrdersView;
