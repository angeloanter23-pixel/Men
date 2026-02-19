import React, { useEffect, useRef } from 'react';

interface VerificationBarcodeViewProps {
  orders: any[];
  onDismiss: () => void;
}

// Added comment above fix
// Fixed: Moved BarcodeItem outside of the main component and used React.FC to properly define props and handle React-specific attributes like 'key' correctly
const BarcodeItem: React.FC<{ code: string; itemName: string; orderId?: string }> = ({ code, itemName, orderId }) => {
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

  const handleSaveAsPNG = () => {
    if (svgRef.current) {
      const svg = svgRef.current;
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const svgSize = svg.getBBox();
      
      // Add padding
      canvas.width = svgSize.width + 60;
      canvas.height = svgSize.height + 100;
      
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const img = new Image();
      img.onload = () => {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw text info
        ctx.fillStyle = "black";
        ctx.font = "bold 20px Arial";
        ctx.textAlign = "center";
        ctx.fillText(itemName, canvas.width / 2, 40);
        if (orderId) {
          ctx.font = "14px Arial";
          ctx.fillText(`Order #${orderId}`, canvas.width / 2, 65);
        }

        ctx.drawImage(img, 30, 80);
        
        const pngUrl = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.href = pngUrl;
        downloadLink.download = `Order_${orderId || code}.png`;
        downloadLink.click();
      };
      img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
    }
  };

  return (
    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col items-center gap-6 animate-fade-in relative group">
      <div className="text-center space-y-1">
        <p className="text-[10px] font-black text-[#FF6B00] uppercase tracking-[0.3em]">Verification ID</p>
        <h4 className="text-[14px] font-bold text-slate-800 uppercase italic truncate max-w-full px-4">{itemName}</h4>
        {orderId && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Order #{orderId}</p>}
      </div>
      
      <div className="bg-white p-4 rounded-3xl border border-slate-50 shadow-inner flex flex-col items-center">
        <svg ref={svgRef} className="max-w-full h-auto"></svg>
        <div className="mt-8 px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100">
           <span className="text-3xl font-mono font-black tracking-[0.4em] text-slate-900">{code}</span>
        </div>
      </div>

      <button 
        onClick={handleSaveAsPNG}
        className="absolute top-6 right-6 w-10 h-10 bg-slate-50 text-slate-300 hover:text-indigo-600 rounded-full flex items-center justify-center transition-all shadow-sm border border-slate-100 opacity-0 group-hover:opacity-100"
        title="Save as PNG"
      >
        <i className="fa-solid fa-download text-xs"></i>
      </button>

      <div className="bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100 flex gap-4 w-full">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
          <i className="fa-solid fa-cash-register"></i>
        </div>
        <p className="text-[11px] text-indigo-900 font-bold leading-snug">
          Show this barcode to our staff to verify your order and proceed with payment.
        </p>
      </div>
    </div>
  );
};

const VerificationBarcodeView: React.FC<VerificationBarcodeViewProps> = ({ orders, onDismiss }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Group by verification code
  const groups = orders.reduce((acc: Record<string, any[]>, order) => {
    const code = order.verification_code || 'UNPAID';
    if (!acc[code]) acc[code] = [];
    acc[code].push(order);
    return acc;
  }, {} as Record<string, any[]>);

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
         {(Object.entries(groups) as [string, any[]][]).map(([code, items], gIdx) => (
           <div key={gIdx} className="space-y-4">
             <BarcodeItem 
               code={code} 
               itemName={items.length > 1 ? `${items.length} Items Ordered` : items[0].item_name} 
               orderId={items[0].id}
             />
             {items.length > 1 && (
               <div className="bg-white/50 rounded-2xl p-4 border border-slate-100">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Items in this group</p>
                 <div className="space-y-2">
                   {items.map((it: any, iIdx: number) => (
                     <div key={iIdx} className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-slate-50">
                       <span className="text-[11px] font-bold text-slate-700">{it.item_name}</span>
                       <span className="text-[11px] font-black text-slate-900">x{it.quantity}</span>
                     </div>
                   ))}
                 </div>
               </div>
             )}
           </div>
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