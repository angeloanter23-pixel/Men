import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantName: string;
  tableName: string;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose, restaurantName, tableName }) => {
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-end justify-center font-jakarta">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ translateY: '100%' }}
            animate={{ translateY: 0 }}
            exit={{ translateY: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative bg-white w-full max-w-lg rounded-t-[2.5rem] shadow-2xl p-8 pb-12 overflow-hidden"
          >
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8" />
            
            <div className="text-center mb-8">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 block">Welcome</span>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight mb-2">
                Hello there!
              </h2>
              <p className="text-slate-500 font-medium">
                You're ordering from <span className="text-slate-900 font-bold">{restaurantName}</span>
              </p>
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-100">
                <i className="fa-solid fa-location-dot text-[#FF6B00] text-xs"></i>
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{tableName}</span>
              </div>
            </div>

            <div className="space-y-6">
              <button
                onClick={onClose}
                className="w-full py-6 rounded-2xl font-black uppercase text-[13px] tracking-[0.15em] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 bg-[#FF6B00] text-white shadow-orange-500/20 hover:bg-orange-600"
              >
                <span>Proceed</span>
                <i className="fa-solid fa-arrow-right text-[10px]"></i>
              </button>

              <p className="text-center text-xs font-medium text-slate-400 leading-relaxed px-4">
                By clicking proceed you agree to our <button onClick={() => setShowTerms(true)} className="text-slate-900 font-bold hover:underline">Terms</button> and <button onClick={() => setShowPrivacy(true)} className="text-slate-900 font-bold hover:underline">Privacy Policy</button>.
              </p>
            </div>
          </motion.div>

          {/* Terms Modal */}
          {showTerms && (
            <div className="fixed inset-0 z-[2100] bg-white flex flex-col animate-fade-in">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0">
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Terms of Service</h3>
                    <button onClick={() => setShowTerms(false)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    <p className="text-slate-500 text-sm leading-relaxed">
                        <strong>{restaurantName} Terms of Service</strong>
                        <br/><br/>
                        1. Acceptance of Terms<br/>
                        By accessing and using the services provided by {restaurantName}, you agree to comply with and be bound by these Terms of Service.
                        <br/><br/>
                        2. Service Availability<br/>
                        We strive to ensure our services are available at all times during business hours. However, we do not guarantee uninterrupted access.
                        <br/><br/>
                        3. Ordering and Payments<br/>
                        All orders placed through our digital menu are subject to acceptance. Prices and availability are subject to change without notice.
                        <br/><br/>
                        4. User Conduct<br/>
                        You agree to use our services only for lawful purposes and in a way that does not infringe the rights of, restrict or inhibit anyone else's use and enjoyment of the website.
                    </p>
                </div>
            </div>
          )}

          {/* Privacy Modal */}
          {showPrivacy && (
            <div className="fixed inset-0 z-[2100] bg-white flex flex-col animate-fade-in">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0">
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Privacy Policy</h3>
                    <button onClick={() => setShowPrivacy(false)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    <p className="text-slate-500 text-sm leading-relaxed">
                        <strong>{restaurantName} Privacy Policy</strong>
                        <br/><br/>
                        1. Information Collection<br/>
                        We collect information necessary to process your orders and improve your dining experience. This may include order history and preferences.
                        <br/><br/>
                        2. Use of Information<br/>
                        Your information is used solely for fulfilling your orders and providing customer support. We do not sell your personal data to third parties.
                        <br/><br/>
                        3. Data Security<br/>
                        We implement appropriate security measures to protect against unauthorized access, alteration, disclosure, or destruction of your personal information.
                    </p>
                </div>
            </div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
};

export default WelcomeModal;
