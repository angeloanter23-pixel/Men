import React, { useState } from 'react';
import OrderItemSummary from './OrderItemSummary';
import OrderItemStatus from './OrderItemStatus';

interface OrderBottomModalProps {
  order: any;
  onClose: () => void;
}

const OrderBottomModal: React.FC<OrderBottomModalProps> = ({ order, onClose }) => {
  const [modalTab, setModalTab] = useState<'summary' | 'status'>('summary');

  return (
    <div className="fixed inset-0 z-[2000] flex items-end justify-center sm:items-center p-0 sm:p-6">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
        <div className="bg-white w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] p-0 shadow-2xl relative animate-slide-up sm:animate-scale-up max-h-[85vh] flex flex-col overflow-hidden pb-6">
            
            <div className="p-6 pb-0 shrink-0 bg-white z-10">
                <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6" />
                <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-slate-900 mb-1">{order.item_name}</h3>
                </div>

                <div className="bg-slate-100 p-1 rounded-xl flex mb-2">
                    <button 
                        onClick={() => setModalTab('summary')}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${modalTab === 'summary' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                    >
                        Summary
                    </button>
                    <button 
                        onClick={() => setModalTab('status')}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${modalTab === 'status' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                    >
                        Status
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 px-6 py-2 pb-6">
                {modalTab === 'summary' ? <OrderItemSummary order={order} /> : <OrderItemStatus order={order} />}
            </div>

            <div className="px-6 pt-2 bg-white shrink-0 z-10">
                <button onClick={onClose} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-xl active:scale-95 transition-all">
                    Close
                </button>
            </div>
        </div>
    </div>
  );
};

export default OrderBottomModal;
