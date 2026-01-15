
import React, { useState, useRef } from 'react';

const PackagingEditorView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [svgData, setSvgData] = useState<string | null>(null);
  const [rotation, setRotation] = useState({ x: -20, y: 45 });
  const [boxDimensions, setBoxDimensions] = useState({ width: 200, height: 150, depth: 100 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSvgData(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      alert("Please upload a valid SVG file.");
    }
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if ('buttons' in e && e.buttons !== 1) return;
    
    let clientX, clientY;
    if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }

    setRotation({
      x: (clientY / window.innerHeight) * 360,
      y: (clientX / window.innerWidth) * 360
    });
  };

  const faceStyle: React.CSSProperties = {
    position: 'absolute',
    border: '1px solid #e2e8f0',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: 'white',
    backgroundImage: svgData ? `url(${svgData})` : 'none',
    boxShadow: 'inset 0 0 10px rgba(0,0,0,0.05)'
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center animate-fade-in font-['Plus_Jakarta_Sans']">
      <header className="w-full max-w-2xl flex justify-between items-center mb-8">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all">
          <i className="fa-solid fa-arrow-left"></i>
        </button>
        <div className="text-center">
            <h1 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900">PACKAGING<span className="text-indigo-600">EDITOR</span></h1>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">3D Mockup Generator</p>
        </div>
        <div className="w-10"></div>
      </header>

      <div className="w-full max-w-2xl bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col gap-8">
        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Source Assets</h3>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".svg" 
              onChange={handleFileUpload} 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-slate-50 border-2 border-dashed border-slate-200 py-6 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-indigo-400 transition-colors"
            >
              {svgData ? (
                <img src={svgData} className="h-12 w-auto object-contain opacity-50" />
              ) : (
                <i className="fa-solid fa-file-arrow-up text-2xl text-slate-300"></i>
              )}
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                {svgData ? 'Change Dieline SVG' : 'Upload Dieline SVG'}
              </span>
            </button>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Dimensions (mm)</h3>
            <div className="grid grid-cols-3 gap-2">
               {['width', 'height', 'depth'].map((dim) => (
                 <div key={dim} className="space-y-1">
                    <label className="text-[8px] font-bold text-slate-300 uppercase ml-1">{dim}</label>
                    <input 
                      type="number" 
                      value={(boxDimensions as any)[dim]}
                      onChange={(e) => setBoxDimensions({...boxDimensions, [dim]: Number(e.target.value)})}
                      className="w-full bg-slate-50 p-3 rounded-xl text-xs font-bold outline-none focus:ring-2 ring-indigo-500/10"
                    />
                 </div>
               ))}
            </div>
          </div>
        </div>

        {/* 3D Scene */}
        <div 
          className="relative h-[400px] w-full bg-slate-900 rounded-[2rem] overflow-hidden flex items-center justify-center perspective-1000 cursor-move shadow-inner"
          onMouseMove={handleMouseMove}
          onTouchMove={handleMouseMove}
        >
          <div className="absolute top-4 left-4 text-white/20 text-[8px] font-bold uppercase tracking-widest pointer-events-none">
            DRAG TO ROTATE VIEW
          </div>
          
          <div 
            style={{
              width: boxDimensions.width,
              height: boxDimensions.height,
              position: 'relative',
              transformStyle: 'preserve-3d',
              transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
              transition: 'transform 0.1s ease-out'
            }}
          >
            {/* Front */}
            <div style={{
              ...faceStyle,
              width: boxDimensions.width,
              height: boxDimensions.height,
              transform: `translateZ(${boxDimensions.depth / 2}px)`
            }}>
                {!svgData && <span className="text-slate-200 font-black uppercase text-[10px]">FRONT</span>}
            </div>
            {/* Back */}
            <div style={{
              ...faceStyle,
              width: boxDimensions.width,
              height: boxDimensions.height,
              transform: `rotateY(180deg) translateZ(${boxDimensions.depth / 2}px)`
            }}>
                {!svgData && <span className="text-slate-200 font-black uppercase text-[10px]">BACK</span>}
            </div>
            {/* Top */}
            <div style={{
              ...faceStyle,
              width: boxDimensions.width,
              height: boxDimensions.depth,
              transform: `rotateX(90deg) translateZ(${boxDimensions.depth / 2}px)`,
              top: (boxDimensions.height - boxDimensions.depth) / 2
            }}>
                {!svgData && <span className="text-slate-200 font-black uppercase text-[10px]">TOP</span>}
            </div>
            {/* Bottom */}
            <div style={{
              ...faceStyle,
              width: boxDimensions.width,
              height: boxDimensions.depth,
              transform: `rotateX(-90deg) translateZ(${boxDimensions.height - boxDimensions.depth / 2}px)`,
              top: (boxDimensions.height - boxDimensions.depth) / 2
            }}>
                {!svgData && <span className="text-slate-200 font-black uppercase text-[10px]">BOTTOM</span>}
            </div>
            {/* Left */}
            <div style={{
              ...faceStyle,
              width: boxDimensions.depth,
              height: boxDimensions.height,
              transform: `rotateY(-90deg) translateZ(${boxDimensions.depth / 2}px)`,
              left: (boxDimensions.width - boxDimensions.depth) / 2
            }}>
                {!svgData && <span className="text-slate-200 font-black uppercase text-[10px]">LEFT</span>}
            </div>
            {/* Right */}
            <div style={{
              ...faceStyle,
              width: boxDimensions.depth,
              height: boxDimensions.height,
              transform: `rotateY(90deg) translateZ(${boxDimensions.width - boxDimensions.depth / 2}px)`,
              left: (boxDimensions.width - boxDimensions.depth) / 2
            }}>
                {!svgData && <span className="text-slate-200 font-black uppercase text-[10px]">RIGHT</span>}
            </div>
          </div>
        </div>

        <div className="flex gap-4">
            <button 
                onClick={() => setRotation({ x: -20, y: 45 })}
                className="flex-1 py-4 bg-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 active:scale-95 transition-all"
            >
                Reset View
            </button>
            <button 
                onClick={() => window.print()}
                className="flex-1 py-4 bg-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg active:scale-95 transition-all"
            >
                Export Specs
            </button>
        </div>
      </div>
    </div>
  );
};

export default PackagingEditorView;
