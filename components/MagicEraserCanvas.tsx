import React, { useRef, useEffect, useState, useCallback } from 'react';

interface MagicEraserCanvasProps {
    imageUrl: string;
    width: number;
    height: number;
    onMaskChange: (maskDataUrl: string | null) => void;
    brushSize?: number;
    isDrawingEnabled?: boolean;
    onDrawingStateChange?: (isDrawing: boolean) => void;
}

const MagicEraserCanvas: React.FC<MagicEraserCanvasProps> = ({
    imageUrl,
    width,
    height,
    onMaskChange,
    brushSize = 30,
    isDrawingEnabled = true,
    onDrawingStateChange
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasDrawn, setHasDrawn] = useState(false);
    const lastPointRef = useRef<{ x: number; y: number } | null>(null);
    const [currentBrushSize, setCurrentBrushSize] = useState(brushSize);

    // Initialize canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.fillRect(0, 0, width, height);
    }, [width, height]);

    const getCanvasPoint = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return null;

        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;

        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        return {
            x: (clientX - rect.left) * (canvas.width / rect.width),
            y: (clientY - rect.top) * (canvas.height / rect.height)
        };
    }, []);

    const drawLine = useCallback((from: { x: number; y: number }, to: { x: number; y: number }) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.globalCompositeOperation = 'source-over';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = currentBrushSize;
        ctx.strokeStyle = 'rgba(255, 50, 50, 0.4)';

        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();

        // Also draw circle at endpoints for smoother edges
        ctx.beginPath();
        ctx.arc(to.x, to.y, currentBrushSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 50, 50, 0.4)';
        ctx.fill();
    }, [currentBrushSize]);

    const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawingEnabled) return;

        const point = getCanvasPoint(e);
        if (!point) return;

        setIsDrawing(true);
        lastPointRef.current = point;

        if (onDrawingStateChange) onDrawingStateChange(true);

        // Draw initial point
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.beginPath();
                ctx.arc(point.x, point.y, currentBrushSize / 2, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 50, 50, 0.4)';
                ctx.fill();
            }
        }
    }, [isDrawingEnabled, getCanvasPoint, onDrawingStateChange, currentBrushSize]);

    const stopDrawing = useCallback(() => {
        if (isDrawing) {
            setIsDrawing(false);
            lastPointRef.current = null;
            if (onDrawingStateChange) onDrawingStateChange(false);
            if (canvasRef.current) {
                onMaskChange(canvasRef.current.toDataURL('image/png'));
                setHasDrawn(true);
            }
        }
    }, [isDrawing, onDrawingStateChange, onMaskChange]);

    const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !isDrawingEnabled) return;

        const point = getCanvasPoint(e);
        if (!point) return;

        if (lastPointRef.current) {
            drawLine(lastPointRef.current, point);
        }

        lastPointRef.current = point;
    }, [isDrawing, isDrawingEnabled, getCanvasPoint, drawLine]);

    // Handle brush size with keyboard
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === '[' || e.key === '-') {
                setCurrentBrushSize(prev => Math.max(5, prev - 5));
            } else if (e.key === ']' || e.key === '+' || e.key === '=') {
                setCurrentBrushSize(prev => Math.min(100, prev + 5));
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className="absolute inset-0 w-full h-full">
            {/* Brush Size Indicator */}
            <div className="absolute top-4 right-4 z-50 bg-black/70 backdrop-blur-sm px-3 py-2 rounded-lg flex items-center gap-3">
                <button
                    onClick={() => setCurrentBrushSize(prev => Math.max(5, prev - 10))}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                >
                    <i className="fas fa-minus text-xs"></i>
                </button>
                <div className="flex items-center gap-2">
                    <div
                        className="rounded-full bg-red-500/50 border-2 border-red-400"
                        style={{ width: Math.min(currentBrushSize, 40), height: Math.min(currentBrushSize, 40) }}
                    />
                    <span className="text-white text-sm font-mono">{currentBrushSize}px</span>
                </div>
                <button
                    onClick={() => setCurrentBrushSize(prev => Math.min(100, prev + 10))}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                >
                    <i className="fas fa-plus text-xs"></i>
                </button>
            </div>

            {/* Drawing Canvas */}
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                className={`w-full h-full touch-none ${isDrawingEnabled ? '' : 'pointer-events-none'}`}
                style={{ cursor: 'crosshair' }}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
            />
        </div>
    );
};

export default MagicEraserCanvas;
