import React from 'react';
import StatusView from './StatusView';

interface AllStatusBottomModalProps {
  orders: any[];
  onClose: () => void;
}

const AllStatusBottomModal: React.FC<AllStatusBottomModalProps> = ({ orders, onClose }) => {
  return (
    <div className="fixed inset-0 z-[2000] flex items-end justify-center sm:items-center p-0 sm:p-6">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
        <div className="bg-white w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] p-0 shadow-2xl relative animate-slide-up sm:animate-scale-up h-[75vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white z-10">
                <h3 className="text-xl font-bold text-slate-900">Kitchen Status</h3>
                <button onClick={onClose} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
                    <i className="fa-solid fa-xmark"></i>
                </button>
            </div>
            
            <div className="flex-1 overflow-hidden">
                <StatusView orders={orders} />
            </div>
        </div>
    </div>
  );
};

export default AllStatusBottomModal;
