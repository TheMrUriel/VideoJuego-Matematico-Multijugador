"use client";
import { useEffect, useState, useRef } from "react";
import ProgressBar from "react-bootstrap/ProgressBar";

export default function TurnTimer({
    duration,
    onTimeOut,
    disabled,
    turn,
    onTick
}: {
    duration: number,
    onTimeOut: () => void,
    onAnswered: (timeLeft: number) => void,
    disabled?: boolean,
    input: string,
    correctAnswer: number | string;
    turn: number,
    onTick?: (timeLeft: number) => void
}) {
    const [timeLeft, setTimeLeft] = useState(duration);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (disabled) return;
        // No setTimeLeft(duration) here!
        intervalRef.current = setInterval(() => {
            setTimeLeft((t) => t - 1);
        }, 1000);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [duration, disabled, turn]);

    useEffect(() => {
        if (disabled) return;
        if (timeLeft <= 0) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            onTimeOut();
        }
    }, [timeLeft, disabled, onTimeOut]);

    // Nuevo: Notificar el tiempo restante al padre
    useEffect(() => {
        if (onTick) onTick(timeLeft);
    }, [timeLeft, onTick]);

    // Eliminado: el envío automático al escribir la respuesta correcta

    return (
        <div>
            <div className="mb-1">
                <span className="badge bg-info text-dark fs-6">
                    Tiempo: {timeLeft}s
                </span>
            </div>
            <ProgressBar
                now={timeLeft}
                max={duration}
                variant={timeLeft > duration / 2 ? "success" : timeLeft > duration / 4 ? "warning" : "danger"}
                style={{ height: 12 }}
                animated
            />
        </div>
    );
}