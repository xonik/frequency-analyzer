import React, { useRef, useEffect } from 'react';
import type { Sample } from '../logic/calculator';

type BitmapPlotProps = {
    label: string;
    samples: Sample[];
    width?: number;
    height?: number;
    marginLeft?: number;
    marginRight?: number;
};

const BitmapPlot: React.FC<BitmapPlotProps> = ({
                                                   label,
                                                   samples,
                                                   width = 600,
                                                   height = 200,
                                                   marginLeft = 0,
                                                   marginRight = 0
                                               }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    let min = 0
    let max = 0
    samples.forEach(({value}) => {
        if(value < min) {
            min = value
        }
        if(value > max) {
            max = value
        }
    })

    useEffect(() => {
        if (!canvasRef.current || samples.length === 0) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, width, height);

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
    }, [samples, width, height, min, max]);

    return (
        <div style={{ marginLeft, marginRight }}>
            <div style={{ marginBottom: 4, fontSize: 16, color: '#555' }}>
                {label} (Min: {min.toFixed(2)} &nbsp;|&nbsp; Max: {max.toFixed(2)})
            </div>
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                style={{ border: '1px solid #ccc' }}
            />
        </div>
    );
};

export default BitmapPlot;