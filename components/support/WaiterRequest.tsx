
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
    <div className="flex-1 overflow-y-auto no-scrollbar">
      <div className="flex flex-col items-center justify-center p-12 text-center animate-fade-in min-h-full">
        <div className={`w-32 h-32 rounded-[3rem] flex items-center justify-center text-5xl shadow-2xl transition-all duration-700 mb-8 ${waiterStatus === 'done' ? 'bg-emerald-500' : 'bg-slate-900'} text-white`}>
          <i className={`fa-solid ${waiterStatus === 'done' ? 'fa-check' : 'fa-bell'} ${waiterStatus === 'calling' ? 'animate-ping' : ''}`}></i>
        </div>
        <h3 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 mb-2">
          {waiterStatus === 'calling' ? 'Pinging...' : waiterStatus === 'done' ? 'Staff Alerted' : 'Need Help?'}
        </h3>
        <p className="text-slate-500 text-sm font-medium mb-12">
          {waiterStatus === 'done' 
            ? 'Assistance is on the way! You can ping again in a few seconds.' 
            : `Staff will visit Table ${tableNumber} shortly.`
          }
        </p>
        
        <button 
          onClick={onCallWaiter} 
          disabled={waiterStatus !== 'idle'} 
          className={`w-full py-6 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 ${
            waiterStatus === 'idle' 
            ? 'bg-slate-900 text-white' 
            : waiterStatus === 'calling'
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
            : 'bg-emerald-50 text-emerald-600 cursor-not-allowed'
          }`}
        >
          {waiterStatus === 'idle' && (
            <>
              <i className="fa-solid fa-bell"></i>
              <span>Call Staff Member</span>
            </>
          )}
          {waiterStatus === 'calling' && (
            <>
              <i className="fa-solid fa-spinner animate-spin"></i>
              <span>Sending Alert...</span>
            </>
          )}
          {waiterStatus === 'done' && (
            <>
              <i className="fa-solid fa-check"></i>
              <span>Alert Received</span>
            </>
          )}
        </button>
        
        {waiterStatus === 'done' && (
          <p className="mt-4 text-[9px] font-black text-slate-300 uppercase tracking-widest animate-pulse">Button will reset shortly</p>
        )}
      </div>
    </div>
  );
};

export default WaiterRequest;
