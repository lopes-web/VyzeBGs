import React, { useRef, useEffect, useState } from 'react';

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
    brushSize = 20,
    isDrawingEnabled = true,
    onDrawingStateChange
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasDrawn, setHasDrawn] = useState(false);

    // Initialize canvas with image
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // We don't draw the image on the canvas itself, we just use the canvas for the mask
        // The image will be displayed behind the canvas via CSS/Layout
        // But we need to ensure the canvas is transparent initially
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.fillRect(0, 0, width, height);

    }, [width, height]);

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawingEnabled) return;
        setIsDrawing(true);
        if (onDrawingStateChange) onDrawingStateChange(true);
        draw(e);
    };

    const stopDrawing = () => {
        if (isDrawing) {
            setIsDrawing(false);
            if (onDrawingStateChange) onDrawingStateChange(false);
            if (canvasRef.current) {
                onMaskChange(canvasRef.current.toDataURL('image/png'));
                setHasDrawn(true);
            }
        }
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !canvasRef.current || !isDrawingEnabled) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;

        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        const x = (clientX - rect.left) * (canvas.width / rect.width);
        const y = (clientY - rect.top) * (canvas.height / rect.height);

        ctx.globalCompositeOperation = 'source-over';
        ctx.beginPath();
        ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 50, 50, 0.3)'; // Softer red with lower opacity
        ctx.fill();

        // For the actual mask, we might want a solid color, but for UI feedback red is good.
        // We can process the mask later or draw on a hidden canvas if needed.
        // For now, let's assume the backend can handle the red overlay or we process it before sending.
    };

    return (
        <div className="absolute inset-0 w-full h-full">
            {/* Drawing Canvas */}
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                className={`w-full h-full touch-none cursor-crosshair ${isDrawingEnabled ? '' : 'pointer-events-none'}`}
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

