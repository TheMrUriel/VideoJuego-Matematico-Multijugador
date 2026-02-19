// app/Videojuego/_components/FractionVisualizer.tsx
"use client";
import React from "react";

// Dibuja una fracción como un círculo dividido en partes, coloreando el numerador
export default function FractionVisualizer({
    numerator,
    denominator,
    size = 100,
    color = "#1976d2",
    bg = "#e3f2fd"
}: {
    numerator: number;
    denominator: number;
    size?: number;
    color?: string;
    bg?: string;
}) {
    const cx = size / 2;
    const cy = size / 2;
    const r = size * 0.45;
    const angle = 2 * Math.PI / denominator;

    // Genera los "pedazos" del círculo
    const slices = [];
    for (let i = 0; i < denominator; i++) {
        const startAngle = i * angle - Math.PI / 2;
        const endAngle = (i + 1) * angle - Math.PI / 2;
        const x1 = cx + r * Math.cos(startAngle);
        const y1 = cy + r * Math.sin(startAngle);
        const x2 = cx + r * Math.cos(endAngle);
        const y2 = cy + r * Math.sin(endAngle);
        const largeArc = angle > Math.PI ? 1 : 0;
        const pathData = [
            `M ${cx} ${cy}`,
            `L ${x1} ${y1}`,
            `A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
            "Z"
        ].join(" ");
        slices.push(
            <path
                key={i}
                d={pathData}
                fill={i < numerator ? color : bg}
                stroke="#222"
                strokeWidth={1}
            />
        );
    }

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {slices}
            <circle
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke="#222"
                strokeWidth={2}
            />
        </svg>
    );
}