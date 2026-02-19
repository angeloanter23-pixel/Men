import React, { useState, useEffect, useRef } from 'react';
import Quagga from 'quagga';

interface BarcodeScannerProps {
    onDetected: (code: string) => void;
    onClose?: () => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onDetected, onClose }) => {
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [manualCode, setManualCode] = useState('');
    const [showManual, setShowManual] = useState(false);

    const scannerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isScanning) {
            startScanner();
        } else {
            stopScanner();
        }
        return () => stopScanner();
    }, [isScanning]);

    const startScanner = () => {
        setError(null);
        if (!scannerRef.current) return;

        Quagga.init({
            inputStream: {
                name: "Live",
                type: "LiveStream",
                target: scannerRef.current,
                constraints: {
                    facingMode: "environment"
                },
            },
            decoder: {
                readers: ["code_128_reader", "ean_reader", "ean_8_reader", "code_39_reader", "code_39_vin_reader", "codabar_reader", "upc_reader", "upc_e_reader", "i2of5_reader"]
            }
        }, (err) => {
            if (err) {
                console.error(err);
                setError("Camera access denied or not supported.");
                setIsScanning(false);
                return;
            }
            Quagga.start();
        });

        Quagga.onDetected((data) => {
            if (data?.codeResult?.code) {
                onDetected(data.codeResult.code);
                setIsScanning(false);
            }
        });
    };

    const stopScanner = () => {
        if (Quagga && typeof Quagga.stop === 'function') {
            Quagga.stop();
            Quagga.offDetected();
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setError(null);
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            if (Quagga && typeof Quagga.decodeSingle === 'function') {
                Quagga.decodeSingle({
                    src: dataUrl,
                    decoder: {
                        readers: ["code_128_reader", "ean_reader", "ean_8_reader", "code_39_reader", "code_39_vin_reader", "codabar_reader", "upc_reader", "upc_e_reader", "i2of5_reader"]
                    }
                }, (result) => {
                    if (result?.codeResult?.code) {
                        onDetected(result.codeResult.code);
                    } else {
                        setError("No barcode found in the selected image.");
                    }
                    setLoading(false);
                });
            } else {
                setError("Scanner library not available.");
                setLoading(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const toggleScan = () => {
        setIsScanning(!isScanning);
        setError(null);
        setShowManual(false);
    };

    const handleManualSubmit = () => {
        if (manualCode.trim()) {
            onDetected(manualCode.trim());
            setShowManual(false);
            setManualCode('');
        }
    };

    return (
        <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 w-full animate-fade-in text-center space-y-8">
            <header className="relative">
                {onClose && (
                    <button 
                        onClick={onClose}
                        className="absolute -top-4 -right-4 w-10 h-10 bg-slate-50 text-slate-300 hover:text-rose-500 rounded-full flex items-center justify-center transition-all shadow-sm border border-slate-100"
                    >
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                )}
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto text-2xl shadow-sm mb-4">
                    <i className="fa-solid fa-barcode"></i>
                </div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Barcode Registry</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Verify guest verification codes</p>
            </header>

            {isScanning ? (
                <div className="relative aspect-video w-full max-w-[400px] mx-auto bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl border-4 border-slate-50 group">
                    <div ref={scannerRef} className="absolute inset-0 w-full h-full object-cover [&>video]:w-full [&>video]:h-full [&>video]:object-cover [&>canvas]:hidden" />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-full h-0.5 bg-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.5)] animate-scan"></div>
                    </div>
                </div>
            ) : showManual ? (
                <div className="space-y-4 animate-scale">
                    <input 
                        type="text" 
                        value={manualCode} 
                        onChange={(e) => setManualCode(e.target.value)}
                        placeholder="Enter 6-char code"
                        className="w-full bg-slate-50 border border-slate-200 p-5 rounded-2xl font-black text-center text-xl outline-none focus:ring-4 ring-indigo-500/10 transition-all"
                    />
                    <div className="flex gap-2">
                        <button onClick={handleManualSubmit} className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg">Submit</button>
                        <button onClick={() => setShowManual(false)} className="px-6 py-4 bg-slate-100 text-slate-400 rounded-xl font-black uppercase text-[10px] tracking-widest">Cancel</button>
                    </div>
                </div>
            ) : (
                <div className="py-12 border-2 border-dashed border-slate-100 rounded-[2rem] bg-slate-50/50">
                    <p className="text-slate-300 font-bold uppercase tracking-widest text-[11px]">Scanner Standby</p>
                </div>
            )}

            {error && <p className="text-rose-500 text-[10px] font-bold uppercase tracking-widest">{error}</p>}

            <div className="space-y-3">
                <button 
                    onClick={toggleScan}
                    className={`w-full py-5 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 ${isScanning ? 'bg-rose-500 text-white' : 'bg-slate-900 text-white'}`}
                >
                    <i className={`fa-solid ${isScanning ? 'fa-video-slash' : 'fa-camera'}`}></i>
                    {isScanning ? 'Cancel Session' : 'Launch Scanner'}
                </button>
                
                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={loading}
                        className="py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-image"></i>}
                        {loading ? '...' : 'Upload PNG'}
                    </button>
                    
                    <button 
                        onClick={() => setShowManual(true)}
                        className="py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                    >
                        <i className="fa-solid fa-keyboard"></i>
                        Manual
                    </button>
                </div>
                
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/png, image/jpeg" 
                    onChange={handleImageUpload} 
                />
            </div>

            <style>{`
                @keyframes scan {
                    0% { top: 0%; }
                    50% { top: 100%; }
                    100% { top: 0%; }
                }
                .animate-scan {
                    position: absolute;
                    width: 100%;
                    animation: scan 2s linear infinite;
                }
                @keyframes scale {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .animate-scale {
                    animation: scale 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                }
            `}</style>
        </div>
    );
};

export default BarcodeScanner;
