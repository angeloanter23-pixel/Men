import React from 'react';

interface OrderItemStatusProps {
  order: any;
}

const OrderItemStatus: React.FC<OrderItemStatusProps> = ({ order }) => {
  const getStatusStep = (status: string) => {
    switch (status) {
        case 'Pending': return 0;
        case 'Preparing': return 1;
        case 'Cooking': return 1;
        case 'Serving': return 2;
        case 'Served': return 3;
        case 'Paid': return 3;
        default: return 0;
    }
  };

  return (
    <div className="pl-4 border-l-2 border-slate-100 space-y-10 relative py-2">
        {[
            { label: 'Order Pending', desc: 'Not yet processed in kitchen.', status: 'Pending' },
            { label: 'Cooking Now', desc: 'Chef is preparing your food.', status: 'Preparing' },
            { label: 'Ready for Service', desc: 'Your food is being plated.', status: 'Serving' },
            { label: 'Served', desc: 'Enjoy your meal!', status: 'Served' }
        ].map((step, idx) => {
            const currentStep = getStatusStep(order.order_status);
            const isCompleted = idx <= currentStep;
            const isCurrent = idx === currentStep;

            return (
                <div key={step.label} className="relative pl-8">
                    <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 ${isCompleted ? 'bg-orange-500 border-orange-500' : 'bg-white border-slate-200'} transition-colors z-10`}></div>
                    {idx !== 3 && <div className={`absolute left-[-1px] top-4 bottom-[-40px] w-[2px] ${idx < currentStep ? 'bg-orange-200' : 'bg-transparent'}`}></div>}
                    
                    <h4 className={`text-sm font-bold ${isCompleted ? 'text-slate-900' : 'text-slate-300'}`}>{step.label}</h4>
                    
                    {isCurrent && (
                        <div className="mt-2 space-y-2 animate-fade-in">
                            <p className="text-xs text-slate-500 font-medium leading-relaxed">{step.desc}</p>
                            {(order.admin_note || order.status_description) && (
                                <div className="bg-orange-50 p-3 rounded-xl border border-orange-100">
                                    <p className="text-[10px] font-bold text-orange-600 uppercase mb-1">Kitchen Note</p>
                                    <p className="text-xs text-slate-700 italic">"{order.admin_note || order.status_description}"</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            );
        })}
    </div>
  );
};

export default OrderItemStatus;
