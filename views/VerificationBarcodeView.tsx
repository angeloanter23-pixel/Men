import React, { useEffect, useRef } from 'react';

interface VerificationBarcodeViewProps {
  orders: any[];
  onDismiss: () => void;
}

// Added comment above fix
// Fixed: Moved BarcodeItem outside of the main component and used React.FC to properly define props and handle React-specific attributes like 'key' correctly
const BarcodeItem: React.FC<{ code: string; itemName: string }> = ({ code, itemName }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current && (window as any).JsBarcode) {
      (window as any).JsBarcode(svgRef.current, code, {
        format: "CODE128",
        width: 2.5,
        height: 120,
        displayValue: true,
        fontSize: 20,
        font: "monospace",
        textMargin: 12,
        background: "#ffffff",
        lineColor: "#000000"
      });
    }
  }, [code]);

  return (
    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col items-center gap-6 animate-fade-in">
      <div className="text-center space-y-1">
        <p className="text-[10px] font-black text-[#FF6B00] uppercase tracking-[0.3em]">Verification ID</p>
        <h4 className="text-[14px] font-bold text-slate-800 uppercase italic truncate max-w-full px-4">{itemName}</h4>
      </div>
      
      <div className="bg-white p-4 rounded-3xl border border-slate-50 shadow-inner flex flex-col items-center">
        <svg ref={svgRef} className="max-w-full h-auto"></svg>
        <div className="mt-8 px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100">
           <span className="text-3xl font-mono font-black tracking-[0.4em] text-slate-900">{code}</span>
        </div>
      </div>

      <div className="bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100 flex gap-4 w-full">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
          <i className="fa-solid fa-cash-register"></i>
        </div>
        <p className="text-[11px] text-indigo-900 font-bold leading-snug">
          Show this 6-character barcode to our staff to verify your order and proceed with payment.
        </p>
      </div>
    </div>
  );
};

const VerificationBarcodeView: React.FC<VerificationBarcodeViewProps> = ({ orders, onDismiss }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Group by verification code if multiple items placed together
  const uniqueGroups = Array.from(new Set(orders.map(o => o.verification_code))).filter(Boolean);

  return (
    <div className="min-h-screen bg-[#F2F2F7] font-jakarta animate-fade-in flex flex-col items-center">
      <header className="w-full bg-white px-8 pt-16 pb-8 border-b border-slate-100 text-center shrink-0">
        <div className="w-16 h-16 bg-orange-50 text-[#FF6B00] rounded-[1.5rem] flex items-center justify-center mx-auto text-2xl shadow-sm mb-6 animate-bounce">
          <i className="fa-solid fa-receipt"></i>
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">Order Sent.</h1>
        <p className="text-slate-400 text-[13px] font-medium mt-3">Action required: Payment verification</p>
      </header>

      <div ref={scrollRef} className="flex-1 w-full max-w-lg p-6 space-y-8 overflow-y-auto no-scrollbar pb-32">
         {orders.map((order, idx) => (
           <BarcodeItem key={idx} code={order.verification_code} itemName={order.item_name} />
         ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-8 bg-white/80 backdrop-blur-xl border-t border-slate-100 z-50">
        <button 
          onClick={onDismiss}
          className="w-full max-w-md mx-auto py-6 bg-slate-900 text-white rounded-full font-black uppercase text-[12px] tracking-[0.3em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          <span>Continue to Status</span>
          <i className="fa-solid fa-arrow-right text-[10px]"></i>
        </button>
      </div>
    </div>
  );
};

export default VerificationBarcodeView;