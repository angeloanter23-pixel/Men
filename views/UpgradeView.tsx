import React from 'react';

interface UpgradeViewProps {
  onLogout: () => void;
}

export const UpgradeView: React.FC<UpgradeViewProps> = ({ onLogout }) => {
  return (
    <div className="min-h-screen bg-[#F2F2F7] flex flex-col items-center justify-center p-6 font-jakarta">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 text-center shadow-2xl animate-scale-up border border-slate-100">
        <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-[2rem] flex items-center justify-center mx-auto text-4xl mb-8 shadow-inner">
          <i className="fa-solid fa-hourglass-end"></i>
        </div>
        
        <h2 className="text-3xl font-black text-slate-900 mb-3 uppercase tracking-tight">Trial Expired</h2>
        <p className="text-slate-500 font-medium mb-10 leading-relaxed text-base px-4">
          Your 24-hour trial period has ended. <br/>
          Upgrade now to continue managing your restaurant and accepting orders.
        </p>
        
        <div className="space-y-4">
            <button 
              onClick={() => window.open('https://m.me/940288252493266', '_blank')}
              className="w-full py-5 bg-[#0084FF] text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-600 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
            >
              <i className="fa-brands fa-facebook-messenger text-lg"></i>
              <span>Contact Support to Upgrade</span>
            </button>
            
            <button 
              onClick={onLogout}
              className="w-full py-5 bg-transparent text-slate-400 rounded-2xl font-bold text-xs uppercase tracking-widest hover:text-slate-600 transition-all"
            >
              Sign Out
            </button>
        </div>
      </div>
      
      <style>{`
        @keyframes scale-up { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-scale-up { animation: scale-up 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
      `}</style>
    </div>
  );
};
