import React, { useState, useEffect } from 'react';

interface SignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const SignUpModal: React.FC<SignUpModalProps> = ({ isOpen, onClose, onComplete }) => {
  const [formData, setFormData] = useState({ name: 'Demo Partner', email: 'partner@demo.com', phone: '+63 900 000 0000' });
  const [loading, setLoading] = useState(false);
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => setIsRendered(true), 10);
    } else {
      document.body.style.overflow = 'unset';
      setIsRendered(false);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Mock simulation
    setTimeout(() => {
      setLoading(false);
      alert("Mockup application received! Proceeding to the demo dashboard.");
      onComplete();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-end justify-center font-jakarta">
      <div onClick={onClose} className={`absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity duration-500 ${isRendered ? 'opacity-100' : 'opacity-0'}`} />
      
      <div className={`relative bg-white w-full max-w-lg rounded-t-[3rem] shadow-2xl flex flex-col p-10 pb-16 transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] max-h-[90vh] overflow-y-auto no-scrollbar ${isRendered ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8 shrink-0" />
        
        <header className="text-center mb-10 space-y-4">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-[1.5rem] flex items-center justify-center mx-auto text-2xl shadow-sm">
            <i className="fa-solid fa-user-plus"></i>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">Partner Application</h2>
            <p className="text-slate-400 text-sm font-medium mt-1">This is a mockup. Hit submit to test the dashboard.</p>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
            <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-[15px] font-bold outline-none focus:ring-4 ring-indigo-500/5 transition-all shadow-inner" placeholder="John Doe" />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
            <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-[15px] font-bold outline-none focus:ring-4 ring-indigo-500/5 transition-all shadow-inner" placeholder="name@email.com" />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">WhatsApp / Contact</label>
            <input required type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-[15px] font-bold outline-none focus:ring-4 ring-indigo-500/5 transition-all shadow-inner" placeholder="+63 9xx..." />
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full py-6 bg-slate-900 text-white rounded-full font-bold uppercase text-[12px] tracking-[0.2em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? <i className="fa-solid fa-spinner animate-spin"></i> : 'Submit Demo Application'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignUpModal;