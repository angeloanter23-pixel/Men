
import React, { useState } from 'react';

interface PaymentViewProps {
  total: number;
  onClose: () => void;
  onSuccess: () => void;
}

const Barcode: React.FC = () => (
  <div className="flex items-center justify-center gap-0.5 h-20 bg-white p-4">
    {[...Array(30)].map((_, i) => (
      <div 
        key={i} 
        className="bg-black" 
        style={{ 
          width: Math.random() > 0.7 ? '4px' : '1px', 
          height: '100%' 
        }}
      />
    ))}
  </div>
);

const PaymentView: React.FC<PaymentViewProps> = ({ total, onClose, onSuccess }) => {
  const [method, setMethod] = useState<'none' | 'cash' | 'gcash' | 'maya'>('none');
  const [processing, setProcessing] = useState(false);

  const handleDigitalPay = (type: string) => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      onSuccess();
    }, 2500);
  };

  if (processing) {
    return (
      <div className="fixed inset-0 bg-white z-[300] flex flex-col items-center justify-center p-8 text-center animate-fade-in">
        <div className="w-24 h-24 border-8 border-slate-100 border-t-orange-500 rounded-full animate-spin mb-8"></div>
        <h2 className="text-2xl font-black text-slate-800 mb-2 uppercase italic">Processing...</h2>
        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Connecting to secure gateway</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-50 z-[250] flex flex-col animate-fade-in font-['Plus_Jakarta_Sans']">
      <header className="bg-white px-6 py-6 border-b border-slate-100 flex items-center justify-between">
        <button onClick={onClose} className="p-2 text-slate-400"><i className="fa-solid fa-chevron-left"></i></button>
        <h1 className="font-black text-sm uppercase tracking-widest text-slate-800">Checkout</h1>
        <div className="w-8"></div>
      </header>

      <div className="p-6 flex-1 overflow-y-auto no-scrollbar space-y-8">
        <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-x-10 -translate-y-10"></div>
           <p className="text-[10px] font-black uppercase tracking-[0.4em] text-orange-500 mb-2">Total Payable</p>
           <h2 className="text-4xl font-black italic tracking-tighter">₱{total.toLocaleString()}</h2>
           <p className="text-[9px] font-bold text-slate-400 mt-4 uppercase tracking-widest">Transaction ID: TXN-{Date.now().toString().slice(-6)}</p>
        </div>

        {method === 'none' ? (
          <div className="space-y-4">
             <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest ml-4">Select Method</h3>
             
             <button onClick={() => setMethod('cash')} className="w-full bg-white p-6 rounded-[2.5rem] border border-slate-100 flex items-center justify-between shadow-sm hover:border-orange-200 transition-all group">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center"><i className="fa-solid fa-money-bill-transfer"></i></div>
                   <div className="text-left">
                      <p className="text-sm font-black text-slate-800 uppercase">Cash at Counter</p>
                      <p className="text-[10px] font-bold text-slate-400">Generate payment barcode</p>
                   </div>
                </div>
                <i className="fa-solid fa-chevron-right text-slate-200 group-hover:text-orange-500 transition-colors"></i>
             </button>

             <button onClick={() => handleDigitalPay('gcash')} className="w-full bg-white p-6 rounded-[2.5rem] border border-slate-100 flex items-center justify-between shadow-sm hover:border-blue-200 transition-all group">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black">G</div>
                   <div className="text-left">
                      <p className="text-sm font-black text-slate-800 uppercase">GCash</p>
                      <p className="text-[10px] font-bold text-slate-400">Pay via GCash Wallet</p>
                   </div>
                </div>
                <i className="fa-solid fa-chevron-right text-slate-200 group-hover:text-blue-500 transition-colors"></i>
             </button>

             <button onClick={() => handleDigitalPay('maya')} className="w-full bg-white p-6 rounded-[2.5rem] border border-slate-100 flex items-center justify-between shadow-sm hover:border-emerald-200 transition-all group">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-black">M</div>
                   <div className="text-left">
                      <p className="text-sm font-black text-slate-800 uppercase">Maya</p>
                      <p className="text-[10px] font-bold text-slate-400">Pay via Maya App</p>
                   </div>
                </div>
                <i className="fa-solid fa-chevron-right text-slate-200 group-hover:text-emerald-500 transition-colors"></i>
             </button>
          </div>
        ) : method === 'cash' ? (
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl text-center space-y-8 animate-fade-in">
             <header>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter italic">Counter Payment</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Show this to our cashier</p>
             </header>

             <div className="py-6 border-y border-slate-100">
                <Barcode />
                <p className="text-xs font-mono font-black mt-4 tracking-[0.5em] text-slate-400">0112 4458 9963</p>
             </div>

             <div className="space-y-4">
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic">Your order is being prepared and will be served once payment is verified at the counter.</p>
                <button onClick={onSuccess} className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl active:scale-95">DONE</button>
                <button onClick={() => setMethod('none')} className="text-[10px] font-black uppercase text-slate-300 tracking-widest">Change Method</button>
             </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default PaymentView;
