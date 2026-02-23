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

  const steps = [
      { label: 'Order Received', desc: 'Sent to the kitchen', status: 'Pending', icon: 'fa-receipt' },
      { label: 'Preparing', desc: 'Chef is cooking your food', status: 'Preparing', icon: 'fa-fire-burner' },
      { label: 'Ready for Service', desc: 'Your food is being plated', status: 'Serving', icon: 'fa-bell-concierge' },
      { label: 'Served', desc: 'Enjoy your meal!', status: 'Served', icon: 'fa-check-double' }
  ];

  const currentStep = getStatusStep(order.order_status);

  return (
    <div className="relative py-4">
        {/* Vertical Line */}
        <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-slate-100 rounded-full"></div>
        <div 
            className="absolute left-6 top-8 w-0.5 bg-orange-500 rounded-full transition-all duration-500"
            style={{ height: `${(currentStep / (steps.length - 1)) * 100}%`, maxHeight: 'calc(100% - 2rem)' }}
        ></div>

        <div className="space-y-8 relative">
            {steps.map((step, idx) => {
                const isCompleted = idx <= currentStep;
                const isCurrent = idx === currentStep;

                return (
                    <div key={step.label} className={`relative flex gap-5 ${isCompleted ? 'opacity-100' : 'opacity-40'}`}>
                        {/* Icon Indicator */}
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 z-10 transition-all duration-500 ${
                            isCurrent ? 'bg-orange-500 text-white shadow-lg shadow-orange-200 scale-110' : 
                            isCompleted ? 'bg-orange-100 text-orange-500' : 
                            'bg-slate-50 text-slate-400 border border-slate-100'
                        }`}>
                            <i className={`fa-solid ${step.icon} ${isCurrent ? 'text-lg' : 'text-base'}`}></i>
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 pt-1.5">
                            <h4 className={`text-base font-bold tracking-tight ${isCurrent ? 'text-orange-600' : isCompleted ? 'text-slate-900' : 'text-slate-400'}`}>
                                {step.label}
                            </h4>
                            <p className={`text-xs font-medium mt-1 ${isCurrent ? 'text-slate-600' : 'text-slate-400'}`}>
                                {step.desc}
                            </p>
                            
                            {/* Admin Message under current stepper */}
                            {isCurrent && order.description && (
                                <div className="mt-3 bg-orange-50 p-3.5 rounded-xl border border-orange-100/50 shadow-sm animate-fade-in relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-orange-400"></div>
                                    <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                        <i className="fa-solid fa-circle-info text-[9px]"></i> Message from Kitchen
                                    </p>
                                    <p className="text-sm text-slate-700 font-medium leading-relaxed">"{order.description}"</p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
  );
};

export default OrderItemStatus;
