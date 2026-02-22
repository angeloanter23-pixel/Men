import React, { useState } from 'react';

interface CalculatorAppProps {
    onClose?: () => void;
}

const CalculatorApp: React.FC<CalculatorAppProps> = ({ onClose }) => {
    const [display, setDisplay] = useState('0');
    const [prevValue, setPrevValue] = useState<number | null>(null);
    const [operator, setOperator] = useState<string | null>(null);
    const [waitingForOperand, setWaitingForOperand] = useState(false);
    const [equation, setEquation] = useState('');

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
        setEquation('');
    };

    const performOperation = (nextOperator: string) => {
        const inputValue = parseFloat(display);

        if (prevValue === null) {
            setPrevValue(inputValue);
            setEquation(`${inputValue} ${nextOperator}`);
        } else if (operator) {
            const currentValue = prevValue || 0;
            const newValue = operate(currentValue, inputValue, operator);
            setPrevValue(newValue);
            setDisplay(String(newValue));
            
            if (nextOperator === '=') {
                setEquation(`${currentValue} ${operator} ${inputValue} =`);
            } else {
                setEquation(`${newValue} ${nextOperator}`);
            }
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

    const CalcButton = ({ label, onClick, className = "bg-slate-50 text-slate-900", icon }: { label: string, onClick: () => void, className?: string, icon?: string }) => (
        <button 
            onClick={onClick}
            className={`rounded-2xl font-bold text-2xl transition-all active:scale-95 shadow-sm flex items-center justify-center ${className}`}
        >
            {icon ? <i className={`fa-solid ${icon}`}></i> : label}
        </button>
    );

    return (
        <div className="fixed inset-0 z-[5000] bg-[#F2F2F7] animate-fade-in flex flex-col font-jakarta">
            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between bg-[#F2F2F7] sticky top-0 z-10">
                <button 
                    onClick={onClose}
                    className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all shadow-sm"
                >
                    <i className="fa-solid fa-arrow-left"></i>
                </button>
                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Standard Calculator</p>
                <div className="w-10"></div> {/* Spacer */}
            </div>

            <div className="flex-1 flex flex-col max-w-md mx-auto w-full px-6 pb-12">
                {/* Display */}
                <div className="bg-white rounded-[2rem] p-8 shadow-lg mb-6 flex flex-col items-end justify-end h-48 border border-slate-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-20"></div>
                    <p className="text-slate-400 font-medium text-lg mb-2 h-6">{equation}</p>
                    <div className="text-6xl font-black text-slate-900 tabular-nums tracking-tight truncate w-full text-right">{display}</div>
                </div>

                {/* Keypad */}
                <div className="grid grid-cols-4 gap-4 flex-1">
                    <CalcButton label="C" onClick={clear} className="bg-rose-50 text-rose-500 hover:bg-rose-100" />
                    <CalcButton label="" icon="fa-divide" onClick={() => performOperation('/')} className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100" />
                    <CalcButton label="" icon="fa-xmark" onClick={() => performOperation('*')} className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100" />
                    <CalcButton label="" icon="fa-delete-left" onClick={() => {
                        if (display.length > 1) {
                            setDisplay(display.slice(0, -1));
                        } else {
                            setDisplay('0');
                        }
                    }} className="bg-slate-200 text-slate-600 hover:bg-slate-300" />
                    
                    <CalcButton label="7" onClick={() => inputDigit('7')} className="bg-white hover:bg-slate-50" />
                    <CalcButton label="8" onClick={() => inputDigit('8')} className="bg-white hover:bg-slate-50" />
                    <CalcButton label="9" onClick={() => inputDigit('9')} className="bg-white hover:bg-slate-50" />
                    <CalcButton label="" icon="fa-minus" onClick={() => performOperation('-')} className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100" />
                    
                    <CalcButton label="4" onClick={() => inputDigit('4')} className="bg-white hover:bg-slate-50" />
                    <CalcButton label="5" onClick={() => inputDigit('5')} className="bg-white hover:bg-slate-50" />
                    <CalcButton label="6" onClick={() => inputDigit('6')} className="bg-white hover:bg-slate-50" />
                    <CalcButton label="" icon="fa-plus" onClick={() => performOperation('+')} className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100" />
                    
                    <CalcButton label="1" onClick={() => inputDigit('1')} className="bg-white hover:bg-slate-50" />
                    <CalcButton label="2" onClick={() => inputDigit('2')} className="bg-white hover:bg-slate-50" />
                    <CalcButton label="3" onClick={() => inputDigit('3')} className="bg-white hover:bg-slate-50" />
                    <CalcButton label="=" onClick={() => performOperation('=')} className="bg-slate-900 text-white row-span-2 shadow-xl hover:bg-slate-800" />
                    
                    <CalcButton label="0" onClick={() => inputDigit('0')} className="col-span-2 bg-white hover:bg-slate-50" />
                    <CalcButton label="." onClick={inputDot} className="bg-white hover:bg-slate-50" />
                </div>
            </div>
        </div>
    );
};

export default CalculatorApp;
