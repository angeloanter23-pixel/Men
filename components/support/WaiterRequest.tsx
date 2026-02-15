
import React from 'react';

interface WaiterRequestProps {
  waiterStatus: 'idle' | 'calling' | 'done';
  onCallWaiter: () => void;
  tableNumber: string;
}

const WaiterRequest: React.FC<WaiterRequestProps> = ({
  waiterStatus,
  onCallWaiter,
  tableNumber
}) => {
  return (
    <div className="flex-1 overflow-y-auto no-scrollbar font-jakarta">
      <div className="flex flex-col items-center justify-center p-10 text-center animate-fade-in min-h-full">
        <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center text-4xl shadow-2xl transition-all duration-700 mb-8 ${waiterStatus === 'done' ? 'bg-emerald-500' : 'bg-slate-900'} text-white`}>
          <i className={`fa-solid ${waiterStatus === 'done' ? 'fa-check' : 'fa-bell'} ${waiterStatus === 'calling' ? 'animate-ping' : ''}`}></i>
        </div>
        <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900 mb-3">
          {waiterStatus === 'calling' ? 'Sending...' : waiterStatus === 'done' ? 'Staff Notified' : 'Need Help?'}
        </h3>
        <p className="text-slate-500 text-[15px] font-medium mb-12 max-w-xs leading-relaxed">
          {waiterStatus === 'done' 
            ? 'A staff member is coming to your table now.' 
            : `Tap the button below and a staff member will visit Table ${tableNumber} shortly.`
          }
        </p>
        
        <button 
          onClick={onCallWaiter} 
          disabled={waiterStatus !== 'idle'} 
          className={`w-full py-6 rounded-2xl font-black uppercase text-[12px] tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 ${
            waiterStatus === 'idle' 
            ? 'bg-[#FF6B00] text-white shadow-orange-500/20' 
            : waiterStatus === 'calling'
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
            : 'bg-emerald-50 text-emerald-600 cursor-not-allowed'
          }`}
        >
          {waiterStatus === 'idle' && (
            <>
              <i className="fa-solid fa-bell text-[10px]"></i>
              <span>Request Staff</span>
            </>
          )}
          {waiterStatus === 'calling' && (
            <>
              <i className="fa-solid fa-spinner animate-spin"></i>
              <span>Sending...</span>
            </>
          )}
          {waiterStatus === 'done' && (
            <>
              <i className="fa-solid fa-check"></i>
              <span>Help is on the way</span>
            </>
          )}
        </button>
        
        {waiterStatus === 'done' && (
          <p className="mt-6 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] animate-pulse">Available again shortly</p>
        )}
      </div>
    </div>
  );
};

export default WaiterRequest;
