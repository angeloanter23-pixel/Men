import React from 'react';

interface OrderItemSummaryProps {
  order: any;
}

const OrderItemSummary: React.FC<OrderItemSummaryProps> = ({ order }) => {
  return (
    <div className="space-y-6">
        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4">
            <div className="flex justify-between items-center">
                <span className="text-slate-500 text-sm font-medium">Quantity</span>
                <span className="text-slate-900 font-bold">{order.quantity}x</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-slate-500 text-sm font-medium">Price per item</span>
                <span className="text-slate-900 font-bold">₱{order.price.toLocaleString()}</span>
            </div>
            <div className="h-px bg-slate-200"></div>
            <div className="flex justify-between items-center">
                <span className="text-slate-900 font-bold">Total Amount</span>
                <span className="text-slate-900 font-black text-lg">₱{order.amount.toLocaleString()}</span>
            </div>
        </div>

        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex items-center justify-between">
            <span className="text-slate-500 text-sm font-medium">Payment Status</span>
            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${order.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                {order.payment_status}
            </span>
        </div>
        
        {order.instructions && (
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-2">
                <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Special Instructions</span>
                <p className="text-slate-900 text-sm font-medium italic">"{order.instructions}"</p>
            </div>
        )}
    </div>
  );
};

export default OrderItemSummary;
