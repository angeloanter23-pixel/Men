import React, { useState, useRef, useEffect } from 'react';
import jsQR from 'https://esm.sh/jsqr@1.4.0';
import * as MenuService from '../services/menuService';

interface QRVerifyViewProps {
  onVerify: (token?: string) => void;
  onCancel: () => void;
}

const QRVerifyView: React.FC<QRVerifyViewProps> = ({ onVerify, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'selection' | 'camera' | 'upload'>('selection');
  const [isScanning, setIsScanning] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const requestRef = useRef<number>(null);

  // Stop camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  const startCamera = async () => {
    setError(null);
    setLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
        setMode('camera');
        setIsScanning(true);
        requestRef.current = requestAnimationFrame(scanTick);
      }
    } catch (err) {
      setError("Camera access denied or unavailable.");
      setMode('selection');
    } finally {
      setLoading(false);
    }
  };

  const scanTick = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          canvas.height = video.videoHeight;
          canvas.width = video.videoWidth;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (code) {
            handleDetectedToken(code.data);
            return; // Stop scanning
          }
        }
      }
    }
    if (isScanning) {
      requestRef.current = requestAnimationFrame(scanTick);
    }
  };

  const handleDetectedToken = async (fullUrl: string) => {
    setIsScanning(false);
    stopCamera();
    setLoading(true);
    
    // Extract token from URL (handles both raw tokens and full URLs)
    const token = fullUrl.includes('/') ? fullUrl.split('/').pop() : fullUrl;
    
    if (!token) {
      setError("Invalid QR format.");
      setLoading(false);
      setMode('selection');
      return;
    }

    try {
      const details = await MenuService.getQRCodeByCode(token);
      if (details) {
        onVerify(token);
      } else {
        setError("Token not recognized.");
        setLoading(false);
        setMode('selection');
      }
    } catch (err) {
      setError("Verification failed.");
      setLoading(false);
      setMode('selection');
    }
  };

  const processFile = (file: File) => {
    setLoading(true);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const tempCanvas = document.createElement('canvas');
        const ctx = tempCanvas.getContext('2d');
        if (!ctx) return;
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
          handleDetectedToken(code.data);
        } else {
          setError("No QR detected in image.");
          setLoading(false);
          setMode('selection');
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-950/90 backdrop-blur-2xl flex flex-col items-center justify-center p-6 font-jakarta animate-fade-in">
      
      {/* Premium Scanner Container */}
      <div className="bg-white w-full max-w-lg rounded-[4rem] overflow-hidden shadow-2xl flex flex-col relative min-h-[500px]">
        
        {/* Header Section */}
        <header className="p-8 pb-4 flex justify-between items-start z-20 bg-white">
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tighter italic text-slate-900">Table <span className="text-indigo-600">Sync.</span></h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Identity Verification Module</p>
          </div>
          <button onClick={onCancel} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 hover:text-rose-500 transition-all border border-slate-100">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </header>

        {/* Viewport Area */}
        <div className="flex-1 relative bg-slate-900 overflow-hidden min-h-[300px]">
          {mode === 'selection' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center space-y-8">
              <div className="w-24 h-24 bg-white/5 rounded-[2.5rem] flex items-center justify-center text-white/20 text-5xl">
                <i className="fa-solid fa-qrcode"></i>
              </div>
              <p className="text-slate-400 text-sm font-medium italic leading-relaxed">
                Scan your table QR code to enable tracking and live updates.
              </p>
            </div>
          )}

          {mode === 'camera' && (
            <>
              <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" />
              <canvas ref={canvasRef} className="hidden" />
              {/* Scanner Overlay UI */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="w-64 h-64 border-2 border-white/20 rounded-[3rem] relative">
                  {/* Corner Accents */}
                  <div className="absolute -top-1 -left-1 w-10 h-10 border-t-4 border-l-4 border-indigo-500 rounded-tl-3xl"></div>
                  <div className="absolute -top-1 -right-1 w-10 h-10 border-t-4 border-r-4 border-indigo-500 rounded-tr-3xl"></div>
                  <div className="absolute -bottom-1 -left-1 w-10 h-10 border-b-4 border-l-4 border-indigo-500 rounded-bl-3xl"></div>
                  <div className="absolute -bottom-1 -right-1 w-10 h-10 border-b-4 border-r-4 border-indigo-500 rounded-br-3xl"></div>
                  
                  {/* Animated Scan Line */}
                  <div className="absolute inset-x-4 h-1 bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.8)] rounded-full animate-scan-fast"></div>
                </div>
                <p className="mt-8 text-[10px] font-black text-white/50 uppercase tracking-[0.4em] animate-pulse">Align QR within frame</p>
              </div>
            </>
          )}

          {mode === 'upload' && (
             <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center bg-slate-50">
                <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center text-3xl mb-4 shadow-inner">
                    <i className="fa-solid fa-cloud-arrow-up"></i>
                </div>
                <p className="text-slate-900 font-black uppercase text-[10px] tracking-widest mb-2">Processing Image</p>
                <div className="w-48 h-1 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 animate-loading-bar w-0"></div>
                </div>
             </div>
          )}

          {loading && (
            <div className="absolute inset-0 z-30 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
               <div className="w-12 h-12 border-4 border-indigo-50 border-t-indigo-500 rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-8 bg-white space-y-4">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-4 animate-fade-in">
              <i className="fa-solid fa-circle-exclamation text-rose-500"></i>
              <p className="text-[10px] font-black text-rose-600 uppercase italic">{error}</p>
            </div>
          )}

          <div className="flex gap-4">
            {mode === 'selection' ? (
              <>
                <button 
                  onClick={startCamera}
                  disabled={loading}
                  className="flex-1 bg-slate-900 text-white py-6 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.3em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <i className="fa-solid fa-camera"></i>
                  Open Camera
                </button>
                <button 
                  onClick={() => { setMode('selection'); fileInputRef.current?.click(); }}
                  disabled={loading}
                  className="flex-1 bg-slate-100 text-slate-500 py-6 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.3em] active:scale-95 transition-all flex items-center justify-center gap-3 border border-slate-200"
                >
                  <i className="fa-solid fa-file-image"></i>
                  Upload Photo
                </button>
              </>
            ) : (
              <button 
                onClick={() => { stopCamera(); setMode('selection'); }}
                className="w-full bg-slate-100 text-slate-900 py-6 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.3em] transition-all"
              >
                Switch to Manual Options
              </button>
            )}
          </div>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setMode('upload');
                processFile(file);
              }
            }} 
          />
        </div>
      </div>

      <p className="mt-12 text-[10px] font-black text-white/20 uppercase tracking-[1em] italic">System Core v4.5 Active</p>

      <style>{`
        @keyframes scan-fast {
          0%, 100% { top: 10%; }
          50% { top: 90%; }
        }
        .animate-scan-fast {
          position: absolute;
          animation: scan-fast 1.5s ease-in-out infinite;
        }
        @keyframes loading-bar {
            0% { width: 0%; }
            100% { width: 100%; }
        }
        .animate-loading-bar {
            animation: loading-bar 2s ease-in-out forwards;
        }
      `}</style>
    </div>
  );
};

export default QRVerifyView;