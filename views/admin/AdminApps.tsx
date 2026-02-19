import React, { useState } from 'react';
import BarcodeScanner from '../../src/components/BarcodeScanner';

const Calculator: React.FC = () => {
    const [display, setDisplay] = useState('0');
    const [prevValue, setPrevValue] = useState<number | null>(null);
    const [operator, setOperator] = useState<string | null>(null);
    const [waitingForOperand, setWaitingForOperand] = useState(false);

    const inputDigit = (digit: string) => {
        if (waitingForOperand) {
            setDisplay(digit);
            setWaitingForOperand(false);
        } else {
            setDisplay(display === '0' ? digit : display + digit);
        }
    };

    const inputDot = () => {
        if (!display.includes('.')) {
            setDisplay(display + '.');
            setWaitingForOperand(false);
        }
    };

    const clear = () => {
        setDisplay('0');
        setPrevValue(null);
        setOperator(null);
        setWaitingForOperand(false);
    };

    const performOperation = (nextOperator: string) => {
        const inputValue = parseFloat(display);

        if (prevValue === null) {
            setPrevValue(inputValue);
        } else if (operator) {
            const currentValue = prevValue || 0;
            const newValue = operate(currentValue, inputValue, operator);
            setPrevValue(newValue);
            setDisplay(String(newValue));
        }

        setWaitingForOperand(true);
        setOperator(nextOperator);
    };

    const operate = (a: number, b: number, op: string) => {
        switch (op) {
            case '+': return a + b;
            case '-': return a - b;
            case '*': return a * b;
            case '/': return a / b;
            default: return b;
        }
    };

    const CalcButton = ({ label, onClick, className = "bg-slate-100 text-slate-900" }: { label: string, onClick: () => void, className?: string }) => (
        <button 
            onClick={onClick}
            className={`h-16 rounded-2xl font-black text-lg transition-all active:scale-95 shadow-sm ${className}`}
        >
            {label}
        </button>
    );

    return (
        <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 max-w-sm mx-auto w-full animate-fade-in">
            <div className="bg-slate-900 text-right p-6 rounded-2xl mb-6 shadow-inner overflow-hidden">
                <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-2 opacity-50">Precision Calc</p>
                <div className="text-4xl font-black text-white tabular-nums truncate">{display}</div>
            </div>
            <div className="grid grid-cols-4 gap-3">
                <CalcButton label="C" onClick={clear} className="bg-rose-50 text-rose-500 col-span-2" />
                <CalcButton label="/" onClick={() => performOperation('/')} className="bg-indigo-50 text-indigo-600" />
                <CalcButton label="*" onClick={() => performOperation('*')} className="bg-indigo-50 text-indigo-600" />
                
                <CalcButton label="7" onClick={() => inputDigit('7')} />
                <CalcButton label="8" onClick={() => inputDigit('8')} />
                <CalcButton label="9" onClick={() => inputDigit('9')} />
                <CalcButton label="-" onClick={() => performOperation('-')} className="bg-indigo-50 text-indigo-600" />
                
                <CalcButton label="4" onClick={() => inputDigit('4')} />
                <CalcButton label="5" onClick={() => inputDigit('5')} />
                <CalcButton label="6" onClick={() => inputDigit('6')} />
                <CalcButton label="+" onClick={() => performOperation('+')} className="bg-indigo-50 text-indigo-600" />
                
                <CalcButton label="1" onClick={() => inputDigit('1')} />
                <CalcButton label="2" onClick={() => inputDigit('2')} />
                <CalcButton label="3" onClick={() => inputDigit('3')} />
                <CalcButton label="=" onClick={() => performOperation('=')} className="bg-indigo-600 text-white row-span-2" />
                
                <CalcButton label="0" onClick={() => inputDigit('0')} className="col-span-2" />
                <CalcButton label="." onClick={inputDot} />
            </div>
        </div>
    );
};



const AdminApps: React.FC = () => {
  const [activeApp, setActiveApp] = useState<'calc' | 'scanner' | null>(null);
  const [scanResult, setScanResult] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#F2F2F7] font-jakarta pb-40">
        <div className="max-w-4xl mx-auto px-6 pt-12 space-y-12">
            <header className="px-2 text-center">
                <p className="text-[10px] font-bold uppercase text-orange-500 tracking-[0.4em] mb-2">Merchant Utilities</p>
                <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-none uppercase">Terminal Apps</h1>
                <p className="text-[17px] font-medium text-slate-500 leading-relaxed mt-4">
                    Internal tools to assist your daily operations.
                </p>
            </header>

            {!activeApp ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button 
                        onClick={() => setActiveApp('scanner')}
                        className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col items-center gap-6 group hover:shadow-xl transition-all duration-500"
                    >
                        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center text-3xl transition-transform group-hover:scale-110">
                            <i className="fa-solid fa-barcode"></i>
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 leading-none mb-2">Barcode Scanner</h3>
                            <p className="text-sm text-slate-400 font-medium">Verify orders with Barcode or 6-char codes</p>
                        </div>
                    </button>

                    <button 
                        onClick={() => setActiveApp('calc')}
                        className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col items-center gap-6 group hover:shadow-xl transition-all duration-500"
                    >
                        <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-3xl flex items-center justify-center text-3xl transition-transform group-hover:scale-110">
                            <i className="fa-solid fa-calculator"></i>
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 leading-none mb-2">Calculator</h3>
                            <p className="text-sm text-slate-400 font-medium">Quick pricing and math tools</p>
                        </div>
                    </button>
                </div>
            ) : (
                <div className="space-y-10 animate-fade-in">
                    <button 
                        onClick={() => { setActiveApp(null); setScanResult(null); }}
                        className="flex items-center gap-2 text-indigo-600 font-black uppercase text-[11px] tracking-widest px-4 hover:opacity-70"
                    >
                        <i className="fa-solid fa-arrow-left"></i>
                        Back to Apps
                    </button>
                    
                    {activeApp === 'calc' ? (
                        <Calculator />
                    ) : scanResult ? (
                        <div className="bg-white p-12 rounded-[3rem] shadow-xl border border-slate-100 text-center space-y-8 animate-scale">
                            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto text-3xl shadow-sm">
                                <i className="fa-solid fa-check"></i>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Verification Successful</p>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{scanResult}</h3>
                            </div>
                            <button 
                                onClick={() => setScanResult(null)}
                                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all"
                            >
                                Scan Another
                            </button>
                        </div>
                    ) : (
                        <BarcodeScanner onDetected={(code) => setScanResult(code)} />
                    )}
                </div>
            )}
        </div>
    </div>
  );
};

export default AdminApps;