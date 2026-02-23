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
                <PayNowButton totalAmount={totalAmount} onPayNow={onPayNow} />
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
    </div>
  );
};

export default OrdersView;
