
import React from 'react';

interface QRVerifyViewProps {
  onVerify: () => void;
  onCancel: () => void;
}

const QRVerifyView: React.FC<QRVerifyViewProps> = ({ onVerify, onCancel }) => {
  return (
    <div className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center p-8 text-center animate-fade-in">
      <div className="mb-12">
        <h2 className="text-2xl font-black text-slate-800 mb-2">Scan & Verify</h2>
        <p className="text-slate-400 text-sm">Please verify your table or identity to confirm your order</p>
      </div>
      <div className="relative w-64 h-64 bg-slate-50 rounded-[3rem] border-4 border-orange-500/20 p-8 flex items-center justify-center mb-12 shadow-2xl">
        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-orange-500 rounded-tl-2xl"></div>
        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-orange-500 rounded-tr-2xl"></div>
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-orange-500 rounded-bl-2xl"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-orange-500 rounded-br-2xl"></div>
        <i className="fa-solid fa-qrcode text-9xl text-slate-800 opacity-80"></i>
        <div className="absolute inset-x-0 h-1 bg-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.5)] animate-scan"></div>
      </div>
      <div className="space-y-4 w-full max-w-[280px]">
        <button onClick={onVerify} className="w-full bg-orange-500 text-white py-4 rounded-2xl font-black shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all active:scale-95">VERIFY & ORDER</button>
        <button onClick={onCancel} className="w-full text-slate-400 py-2 font-bold text-sm">Cancel</button>
      </div>
      <style>{` @keyframes scan { 0%, 100% { top: 10%; } 50% { top: 85%; } } .animate-scan { position: absolute; animation: scan 3s ease-in-out infinite; } `}</style>
    </div>
  );
}

export default QRVerifyView;
