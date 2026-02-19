// app/Videojuego/_components/OperationDisplay.tsx
"use client";
export default function OperationDisplay({ operation }: { operation: string }) {
    return (
        <div className="fs-1 fw-bold mb-2" style={{ letterSpacing: 2 }}>
            {operation}
        </div>
    );
}