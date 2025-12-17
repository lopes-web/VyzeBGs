
import React, { useRef, useState, useEffect } from 'react';

interface AreaSelectorProps {
  imageSrc: string;
  onMaskChange: (maskBase64: string | null) => void;
  isSelecting: boolean;
  onCancel: () => void;
}

const AreaSelector: React.FC<AreaSelectorProps> = ({ imageSrc, onMaskChange, isSelecting, onCancel }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [startPos, setStartPos] = useState<{ x: number, y: number } | null>(null);
  const [currentPos, setCurrentPos] = useState<{ x: number, y: number } | null>(null);
  const [selection, setSelection] = useState<{ x: number, y: number, w: number, h: number } | null>(null);

  useEffect(() => {
      // Reset selection when image changes or mode changes
      setSelection(null);
      setStartPos(null);
      setCurrentPos(null);
      onMaskChange(null);
  }, [imageSrc, isSelecting]);

  const getRelativeCoords = (e: React.MouseEvent | React.TouchEvent) => {
    if (!imgRef.current) return { x: 0, y: 0 };
    const rect = imgRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isSelecting) return;
    const coords = getRelativeCoords(e);
    setStartPos(coords);
    setCurrentPos(coords);
    setSelection(null);
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isSelecting || !startPos) return;
    const coords = getRelativeCoords(e);
    setCurrentPos(coords);
  };

  const handleMouseUp = () => {
    if (!isSelecting || !startPos || !currentPos || !imgRef.current) return;
    
    const x = Math.min(startPos.x, currentPos.x);
    const y = Math.min(startPos.y, currentPos.y);
    const w = Math.abs(currentPos.x - startPos.x);
    const h = Math.abs(currentPos.y - startPos.y);

    if (w > 10 && h > 10) {
        setSelection({ x, y, w, h });
        generateMask(x, y, w, h);
    }
    setStartPos(null);
    setCurrentPos(null);
  };

  const generateMask = (x: number, y: number, w: number, h: number) => {
      if (!imgRef.current) return;
      
      const canvas = document.createElement('canvas');
      canvas.width = imgRef.current.naturalWidth;
      canvas.height = imgRef.current.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Calculate scaling factor between displayed image and natural image
      const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
      const scaleY = imgRef.current.naturalHeight / imgRef.current.height;

      // Fill black (preserve original)
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Fill white (edit area)
      ctx.fillStyle = 'white';
      ctx.fillRect(x * scaleX, y * scaleY, w * scaleX, h * scaleY);

      const base64 = canvas.toDataURL('image/png').split(',')[1];
      onMaskChange(base64);
  };

  return (
    <div 
        ref={containerRef} 
        className={`relative w-full h-full flex items-center justify-center bg-gray-950 rounded-xl overflow-hidden select-none ${isSelecting ? 'cursor-crosshair' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
        // Ensure right-click defaults are preserved when not selecting
        onContextMenu={(e) => !isSelecting && e.stopPropagation()} 
    >
      <img 
        ref={imgRef}
        src={imageSrc} 
        alt="Creative" 
        // CRITICAL FIX: allow pointer events (right click) when NOT selecting
        className={`max-w-full max-h-[80vh] object-contain shadow-2xl ${isSelecting ? 'pointer-events-none' : 'pointer-events-auto'}`}
      />
      
      {/* Selection Overlay */}
      {(startPos && currentPos) && (
        <div 
            className="absolute border-2 border-lime-500 bg-lime-500/20"
            style={{
                left: Math.min(startPos.x, currentPos.x),
                top: Math.min(startPos.y, currentPos.y),
                width: Math.abs(currentPos.x - startPos.x),
                height: Math.abs(currentPos.y - startPos.y),
                pointerEvents: 'none'
            }}
        />
      )}

       {/* Final Selection Box */}
       {selection && (
        <div 
            className="absolute border-2 border-white bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"
            style={{
                left: selection.x,
                top: selection.y,
                width: selection.w,
                height: selection.h,
                pointerEvents: 'none'
            }}
        >
            <div className="absolute -top-8 left-0 bg-lime-500 text-black text-xs font-bold px-2 py-1 rounded">
                Área Selecionada
            </div>
        </div>
      )}

      {/* Helper text when selecting */}
      {isSelecting && !selection && !startPos && (
          <div className="absolute top-4 bg-black/70 text-white px-4 py-2 rounded-full text-sm backdrop-blur-md border border-gray-600 pointer-events-none">
              Clique e arraste para selecionar a área de edição
          </div>
      )}
    </div>
  );
};

export default AreaSelector;
