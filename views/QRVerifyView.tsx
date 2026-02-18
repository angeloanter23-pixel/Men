import React, { useState, useRef, useEffect } from 'react';
import jsQR from 'jsqr';
import * as MenuService from '../services/menuService';

interface QRVerifyViewProps {
  initialToken?: string;
  onVerify: (session: any) => void;
  onCancel: () => void;
}

const QRVerifyView: React.FC<QRVerifyViewProps> = ({ initialToken, onVerify, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'scan' | 'pin'>(initialToken ? 'pin' : 'scan');
  const [detectedToken, setDetectedToken] = useState<string>(initialToken || '');
  const [pin, setPin] = useState(['', '', '', '']);
  const pinRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const requestRef = useRef<number>(null);

  useEffect(() => {
    if (mode === 'scan') startCamera();
    else stopCamera();
    return () => stopCamera();
  }, [mode]);

  const stopCamera = () => {
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
        requestRef.current = requestAnimationFrame(scanTick);
      }
    } catch (err) { setError("Please allow camera access or use the image upload option below."); }
  };

  const scanTick = () => {
    if (videoRef.current?.readyState === videoRef.current?.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          canvas.height = video.videoHeight;
          canvas.width = video.videoWidth;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code) {
            const token = extractToken(code.data);
            if (token) handleTokenDetected(token);
            return;
          }
        }
      }
    }
    requestRef.current = requestAnimationFrame(scanTick);
  };

  const extractToken = (data: string) => {
    return data.includes('/') ? data.split('/').pop() : data;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code) {
            const token = extractToken(code.data);
            if (token) handleTokenDetected(token);
            else { setError("Could not read QR code from image."); setLoading(false); }
          } else {
            setError("No QR code found in the selected image.");
            setLoading(false);
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleTokenDetected = async (token: string) => {
    setLoading(true);
    setError(null);
    try {
      const details = await MenuService.getQRCodeByCode(token);
      if (details) {
        setDetectedToken(token);
        const session = await MenuService.getActiveSessionByQR(details.id);
        if (session && session.pin_required === false) {
            onVerify({ 
              ...session, 
              label: details.label, 
              restaurantName: details.restaurant_name, 
              theme: details.theme, 
              restaurant_id: details.restaurant_id,
              qr_token: details.code 
            });
        } else {
            setMode('pin');
        }
      } else { 
        setError("QR not found. Please scan an active table code."); 
      }
    } catch (err) {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePinChange = (index: number, value: string) => {
    const cleanValue = value.replace(/[^0-9]/g, '').slice(-1);
    if (!cleanValue && value !== "") return;
    
    const newPin = [...pin];
    newPin[index] = cleanValue;
    setPin(newPin);
    
    if (cleanValue && index < 3) pinRefs[index + 1].current?.focus();
  };

  const handleVerify = async () => {
    const fullPin = pin.join('');
    if (fullPin.length < 4) return;
    setLoading(true);
    setError(null);
    try {
        const details = await MenuService.getQRCodeByCode(detectedToken);
        if (details) {
            const session = await MenuService.verifySessionPin(details.id, fullPin);
            if (session) {
                onVerify({ 
                  ...session, 
                  label: details.label, 
                  restaurantName: details.restaurant_name, 
                  theme: details.theme, 
                  restaurant_id: details.restaurant_id,
                  qr_token: details.code 
                });
            }
            else { 
              setError("Incorrect PIN. Please ask staff for the table code."); 
              setPin(['','','','']); 
              pinRefs[0].current?.focus(); 
            }
        } else {
            setError("Table identity lost. Please scan again.");
            setMode('scan');
        }
    } catch (e) { 
      setError("Verification failed. Check your connection."); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center font-jakarta animate-fade-in">
      <div onClick={onCancel} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
      <div className="relative bg-white w-full max-w-lg rounded-t-[3rem] shadow-2xl flex flex-col overflow-hidden animate-slide-up pb-12">
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto my-5 shrink-0" />
        <div className="px-8 pb-8 flex justify-between items-center border-b border-slate-50">
            <div>
                <h2 className="text-2xl font-black text-slate-900 leading-none">Table <span className="text-[#FF6B00]">Unlock</span></h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Required to place order</p>
            </div>
            <button onClick={onCancel} className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 hover:text-rose-500 transition-all shadow-sm"><i className="fa-solid fa-xmark"></i></button>
        </div>

        <div className="px-8 pt-8 flex-1">
            {mode === 'scan' ? (
                <div className="space-y-8 animate-fade-in">
                    <div className="relative aspect-square w-full max-w-[280px] mx-auto bg-slate-900 rounded-[3rem] overflow-hidden shadow-2xl group border-4 border-slate-50">
                        <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" />
                        <canvas ref={canvasRef} className="hidden" />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-48 h-48 border-2 border-white/20 rounded-[2.5rem] relative">
                                <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-[#FF6B00] rounded-tl-2xl"></div>
                                <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-[#FF6B00] rounded-tr-2xl"></div>
                                <div className="absolute inset-x-4 h-0.5 bg-[#FF6B00]/50 shadow-[0_0_15px_rgba(255,107,0,0.5)] animate-scan"></div>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col items-center gap-4">
                        <p className="text-center text-slate-500 text-sm font-medium italic">Which table are you at? Scan the QR code.</p>
                        
                        <div className="w-full h-px bg-slate-100 my-2" />
                        
                        <button 
                          disabled={loading}
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-3 px-6 py-4 bg-slate-50 text-slate-600 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-100 disabled:opacity-50"
                        >
                          {loading ? (
                            <i className="fa-solid fa-spinner animate-spin text-[#FF6B00]"></i>
                          ) : (
                            <i className="fa-solid fa-image text-[#FF6B00]"></i>
                          )}
                          <span>{loading ? 'Processing Image...' : 'Use image QR'}</span>
                        </button>
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          className="hidden" 
                          accept="image/*" 
                          onChange={handleImageUpload} 
                        />
                    </div>
                </div>
            ) : (
                <div className="space-y-10 animate-fade-in">
                    <div className="text-center space-y-3">
                        <div className="w-16 h-16 bg-orange-50 text-[#FF6B00] rounded-3xl flex items-center justify-center mx-auto text-2xl"><i className="fa-solid fa-lock"></i></div>
                        <h4 className="text-xl font-black text-slate-800">Enter Table PIN</h4>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Ask our staff for the 4-digit code</p>
                    </div>
                    <div className="flex justify-center gap-4">
                        {pin.map((digit, idx) => (
                            <input 
                                key={idx} 
                                ref={pinRefs[idx]} 
                                type="text" 
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={1} 
                                value={digit} 
                                onChange={(e) => handlePinChange(idx, e.target.value)} 
                                onKeyDown={(e) => e.key === 'Backspace' && !digit && idx > 0 && pinRefs[idx - 1].current?.focus()} 
                                className="w-14 h-20 bg-slate-50 border-none rounded-2xl text-center text-3xl font-black text-slate-900 outline-none focus:ring-4 ring-orange-500/5 shadow-inner" 
                            />
                        ))}
                    </div>
                    <button 
                        onClick={handleVerify} 
                        disabled={loading || pin.join('').length < 4} 
                        className="w-full bg-[#FF6B00] text-white py-6 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.4em] shadow-2xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                        {loading ? (
                            <>
                                <i className="fa-solid fa-spinner animate-spin"></i>
                                <span>Verifying...</span>
                            </>
                        ) : (
                            'Unlock Table'
                        )}
                    </button>
                    {!initialToken && (
                        <button disabled={loading} onClick={() => setMode('scan')} className="w-full text-[10px] font-black uppercase text-slate-300 hover:text-slate-900 tracking-widest transition-all disabled:opacity-20">Scan Different Table</button>
                    )}
                </div>
            )}
            {error && <div className="mt-8 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-center text-[10px] font-black text-rose-500 uppercase italic animate-fade-in">{error}</div>}
        </div>
      </div>
    </div>
  );
};

export default QRVerifyView;