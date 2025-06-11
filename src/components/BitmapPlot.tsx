import React, { useRef, useEffect } from 'react';
import type { Sample } from '../logic/calculator';

type BitmapPlotProps = {
    samples: Sample[];
    width?: number;
    height?: number;
    marginLeft?: number;
    marginRight?: number;
};

const BitmapPlot: React.FC<BitmapPlotProps> = ({
                                                   samples,
                                                   width = 600,
                                                   height = 200,
                                                   marginLeft = 0,
                                                   marginRight = 0
                                               }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasRef.current || samples.length === 0) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, width, height);

        // Find min/max for scaling
        const values = samples.map(s => s.value).filter(v => typeof v === 'number' && !isNaN(v));
        const min = Math.min(...values);
        const max = Math.max(...values);

        // Draw line
        ctx.beginPath();
        samples.forEach((s, i) => {
            const x = (i / (samples.length - 1)) * (width - 1);
            const y = height - ((s.value - min) / (max - min || 1)) * (height - 1);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.strokeStyle = '#d21919';
        ctx.lineWidth = 0.5;
        ctx.stroke();
    }, [samples, width, height]);

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            style={{ border: '1px solid #ccc', marginLeft, marginRight }}
        />
    );
};

export default BitmapPlot;