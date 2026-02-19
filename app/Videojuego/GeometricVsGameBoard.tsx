// app/Videojuego/GeometricVsGameBoard.tsx
"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
    FaHeartBroken, FaUser, FaCat, FaDog, FaDragon, FaHippo, FaFrog, FaFish, FaSpider,
    FaRegCircle, FaRegSquare
} from "react-icons/fa";
import { GiShamblingZombie, GiTriangleTarget } from "react-icons/gi";
import LifeBar from "./_components/LifeBar";
import TurnTimer from "./_components/TurnTimer";
import GameOverModal from "./_components/GameOverModal";
import { Button, Row, Col, Card, Alert } from "react-bootstrap";

// --- Configuración ---
const MAX_LIFE = 300;
const TURN_TIME = 30;

type Player = {
    name: string;
    life: number;
};

type GameBoardProps = {
    onRestart: () => void;
    characters: [string | null, string | null];
};

type DamageInfo = {
    playerIndex: number;
    amount: number;
    self: boolean;
} | null;

type PlayerAnswer = {
    turn: number;
    correct: boolean;
    timeout: boolean;
    reaction: number;
    questionText: string;
    expected: string;
    input: string;
    explanation: string;
    operationText: string;
};

type PlayerStats = {
    correct: number;
    total: number;
    reactionTimes: number[];
    maxStreak: number;
    maxErrorStreak: number;
    currentStreak: number;
    currentErrorStreak: number;
    fastest: number;
    slowest: number;
    timeouts: number;
    errors: number;
    damageDone: number;
    damageTaken: number;
    answers: PlayerAnswer[];
};

// --- Íconos de personajes ---
const ICON_MAP: Record<string, React.ReactElement> = {
    Gato: <FaCat />,
    Perro: <FaDog />,
    Dragón: <FaDragon />,
    Hipopótamo: <FaHippo />,
    Rana: <FaFrog />,
    Pez: <FaFish />,
    Araña: <FaSpider />,
    Zombie: <GiShamblingZombie />,
};

// --- Propiedades de figuras ---
type FigureProps = {
    lados: number;
    vertices: number;
    regular: boolean;
    nombre: string;
    icon: React.ReactElement;
};

const FIGURE_PROPS: Record<string, FigureProps> = {
    "Círculo": {
        lados: 0,
        vertices: 0,
        regular: true,
        nombre: "Círculo",
        icon: <FaRegCircle size={48} color="#1976d2" />
    },
    "Triángulo": {
        lados: 3,
        vertices: 3,
        regular: true,
        nombre: "Triángulo",
        icon: <GiTriangleTarget size={48} color="#fbc02d" />
    },
    "Cuadrado": {
        lados: 4,
        vertices: 4,
        regular: true,
        nombre: "Cuadrado",
        icon: <FaRegSquare size={48} color="#388e3c" />
    },
    "Rectángulo": {
        lados: 4,
        vertices: 4,
        regular: false,
        nombre: "Rectángulo",
        icon: (
            <svg width={60} height={48} viewBox="0 0 60 48">
                <rect x="6" y="12" width="48" height="24" fill="#6d4c41" stroke="#3e2723" strokeWidth="2" rx="4" />
            </svg>
        )
    },
    "Trapecio": {
        lados: 4,
        vertices: 4,
        regular: false,
        nombre: "Trapecio",
        icon: (
            <svg width={60} height={48} viewBox="0 0 60 48">
                <polygon
                    points="15,40 45,40 50,20 10,20"
                    fill="#ffb300"
                    stroke="#b26a00"
                    strokeWidth="2"
                />
            </svg>
        )
    },
    "Romboide": {
        lados: 4,
        vertices: 4,
        regular: false,
        nombre: "Romboide",
        icon: (
            <svg width={60} height={48} viewBox="0 0 60 48">
                <polygon
                    points="10,40 50,40 40,10 0,10"
                    fill="#00bcd4"
                    stroke="#006064"
                    strokeWidth="2"
                />
            </svg>
        )
    },
    "Paralelogramo": {
        lados: 4,
        vertices: 4,
        regular: false,
        nombre: "Paralelogramo",
        icon: (
            <svg width={60} height={48} viewBox="0 0 60 48">
                <polygon
                    points="15,40 55,40 45,10 5,10"
                    fill="#8bc34a"
                    stroke="#33691e"
                    strokeWidth="2"
                />
            </svg>
        )
    },
    "Cometa": {
        lados: 4,
        vertices: 4,
        regular: false,
        nombre: "Cometa",
        icon: (
            <svg width={60} height={48} viewBox="0 0 60 48">
                <polygon
                    points="30,5 50,24 30,43 10,24"
                    fill="#e91e63"
                    stroke="#880e4f"
                    strokeWidth="2"
                />
            </svg>
        )
    },
    "Flecha": {
        lados: 7,
        vertices: 7,
        regular: false,
        nombre: "Flecha",
        icon: (
            <svg width={60} height={48} viewBox="0 0 60 48">
                <polygon
                    points="30,5 50,24 40,24 40,43 20,43 20,24 10,24"
                    fill="#9e9e9e"
                    stroke="#212121"
                    strokeWidth="2"
                />
            </svg>
        )
    },
    "Pentágono": {
        lados: 5,
        vertices: 5,
        regular: true,
        nombre: "Pentágono",
        icon: (
            <svg width={48} height={48} viewBox="0 0 48 48">
                <polygon
                    points="24,6 44,19 36,42 12,42 4,19"
                    fill="#8e24aa"
                    stroke="#6d1b7b"
                    strokeWidth="2"
                />
            </svg>
        )
    },
    "Hexágono": {
        lados: 6,
        vertices: 6,
        regular: true,
        nombre: "Hexágono",
        icon: (
            <svg width={48} height={48} viewBox="0 0 48 48">
                <polygon
                    points={
                        Array.from({ length: 6 }).map((_, i) => {
                            const angle = (2 * Math.PI * i) / 6 - Math.PI / 2;
                            const x = 24 + 18 * Math.cos(angle);
                            const y = 24 + 18 * Math.sin(angle);
                            return `${x},${y}`;
                        }).join(" ")
                    }
                    fill="#0288d1"
                    stroke="#01579b"
                    strokeWidth="2"
                />
            </svg>
        )
    },
    "Heptágono": {
        lados: 7,
        vertices: 7,
        regular: true,
        nombre: "Heptágono",
        icon: (
            <svg width={48} height={48} viewBox="0 0 48 48">
                <polygon
                    points={
                        Array.from({ length: 7 }).map((_, i) => {
                            const angle = (2 * Math.PI * i) / 7 - Math.PI / 2;
                            const x = 24 + 18 * Math.cos(angle);
                            const y = 24 + 18 * Math.sin(angle);
                            return `${x},${y}`;
                        }).join(" ")
                    }
                    fill="#009688"
                    stroke="#00695c"
                    strokeWidth="2"
                />
            </svg>
        )
    },
    "Octágono": {
        lados: 8,
        vertices: 8,
        regular: true,
        nombre: "Octágono",
        icon: (
            <svg width={48} height={48} viewBox="0 0 48 48">
                <polygon
                    points={
                        Array.from({ length: 8 }).map((_, i) => {
                            const angle = (2 * Math.PI * i) / 8 - Math.PI / 2;
                            const x = 24 + 18 * Math.cos(angle);
                            const y = 24 + 18 * Math.sin(angle);
                            return `${x},${y}`;
                        }).join(" ")
                    }
                    fill="#d32f2f"
                    stroke="#b71c1c"
                    strokeWidth="2"
                />
            </svg>
        )
    },
    "Eneágono": {
        lados: 9,
        vertices: 9,
        regular: true,
        nombre: "Eneágono",
        icon: (
            <svg width={48} height={48} viewBox="0 0 48 48">
                <polygon
                    points={
                        Array.from({ length: 9 }).map((_, i) => {
                            const angle = (2 * Math.PI * i) / 9 - Math.PI / 2;
                            const x = 24 + 18 * Math.cos(angle);
                            const y = 24 + 18 * Math.sin(angle);
                            return `${x},${y}`;
                        }).join(" ")
                    }
                    fill="#ff9800"
                    stroke="#e65100"
                    strokeWidth="2"
                />
            </svg>
        )
    },
    "Decágono": {
        lados: 10,
        vertices: 10,
        regular: true,
        nombre: "Decágono",
        icon: (
            <svg width={48} height={48} viewBox="0 0 48 48">
                <polygon
                    points={
                        Array.from({ length: 10 }).map((_, i) => {
                            const angle = (2 * Math.PI * i) / 10 - Math.PI / 2;
                            const x = 24 + 18 * Math.cos(angle);
                            const y = 24 + 18 * Math.sin(angle);
                            return `${x},${y}`;
                        }).join(" ")
                    }
                    fill="#3f51b5"
                    stroke="#1a237e"
                    strokeWidth="2"
                />
            </svg>
        )
    },
    "Endecágono": {
        lados: 11,
        vertices: 11,
        regular: true,
        nombre: "Endecágono",
        icon: (
            <svg width={48} height={48} viewBox="0 0 48 48">
                <polygon
                    points={
                        Array.from({ length: 11 }).map((_, i) => {
                            const angle = (2 * Math.PI * i) / 11 - Math.PI / 2;
                            const x = 24 + 18 * Math.cos(angle);
                            const y = 24 + 18 * Math.sin(angle);
                            return `${x},${y}`;
                        }).join(" ")
                    }
                    fill="#607d8b"
                    stroke="#263238"
                    strokeWidth="2"
                />
            </svg>
        )
    },
    "Dodecágono": {
        lados: 12,
        vertices: 12,
        regular: true,
        nombre: "Dodecágono",
        icon: (
            <svg width={48} height={48} viewBox="0 0 48 48">
                <polygon
                    points={
                        Array.from({ length: 12 }).map((_, i) => {
                            const angle = (2 * Math.PI * i) / 12 - Math.PI / 2;
                            const x = 24 + 18 * Math.cos(angle);
                            const y = 24 + 18 * Math.sin(angle);
                            return `${x},${y}`;
                        }).join(" ")
                    }
                    fill="#9c27b0"
                    stroke="#4a148c"
                    strokeWidth="2"
                />
            </svg>
        )
    },
};

const FIGURES = Object.keys(FIGURE_PROPS);

// --- Temas extra ---
const THEMES = [
    "identify",
    "sides",
    "compare",
    "vertices",
    "regular",
    "which_regular",
    "which_irregular",
    "which_equal_sides",
    "which_unequal_sides"
];

// --- Generador de preguntas ---
type GeometricProblem = {
    questionText: string;
    expected: string;
    explanation: string;
    type: string;
    options: string[];
    render?: React.ReactNode;
};

function getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]): T[] {
    return arr.slice().sort(() => Math.random() - 0.5);
}

function generateGeometricProblem(): GeometricProblem {
    const type = shuffle(THEMES)[0];

    // --- 1. Identificar figura ---
    if (type === "identify") {
        const idx = getRandomInt(0, FIGURES.length - 1);
        const figure = FIGURES[idx];
        const options = shuffle([
            figure,
            ...shuffle(FIGURES.filter(f => f !== figure)).slice(0, 2)
        ]);
        return {
            questionText: "¿Qué figura es esta?",
            expected: figure,
            explanation: `La figura mostrada es un ${figure.toLowerCase()}.`,
            type: "identify",
            options,
            render: <div className="mb-3">{FIGURE_PROPS[figure].icon}</div>
        };
    }
    // --- 2. ¿Cuántos lados tiene? ---
    if (type === "sides") {
        const idx = getRandomInt(0, FIGURES.length - 1);
        const figure = FIGURES[idx];
        const correct = FIGURE_PROPS[figure].lados;
        const wrongs = [];
        const used = new Set([correct]);
        while (wrongs.length < 2) {
            const w = getRandomInt(Math.max(0, correct - 3), correct + 3);
            if (!used.has(w) && w >= 0 && w <= 12) {
                wrongs.push(w);
                used.add(w);
            }
        }
        const options = shuffle([
            correct.toString(),
            ...wrongs.map(String)
        ]);
        return {
            questionText: `¿Cuántos lados tiene un ${figure.toLowerCase()}?`,
            expected: correct.toString(),
            explanation: `Un ${figure.toLowerCase()} tiene ${correct} lado${correct === 1 ? "" : "s"}.`,
            type: "sides",
            options,
            render: <div className="mb-3">{FIGURE_PROPS[figure].icon}</div>
        };
    }
    // --- 3. Comparar figuras por lados ---
    if (type === "compare") {
        const idx1 = getRandomInt(0, FIGURES.length - 1);
        let idx2 = getRandomInt(0, FIGURES.length - 1);
        while (idx2 === idx1) idx2 = getRandomInt(0, FIGURES.length - 1);
        const f1 = FIGURES[idx1];
        const f2 = FIGURES[idx2];
        const s1 = FIGURE_PROPS[f1].lados;
        const s2 = FIGURE_PROPS[f2].lados;
        let expected = "";
        if (s1 > s2) expected = f1;
        else if (s2 > s1) expected = f2;
        else expected = "Igual";
        const options = shuffle([f1, f2, "Igual"]);
        return {
            questionText: `¿Cuál figura tiene más lados?`,
            expected,
            explanation: s1 === s2
                ? `Ambas figuras tienen ${s1} lados.`
                : `${expected} tiene más lados.`,
            type: "compare",
            options,
            render: (
                <div className="mb-3 d-flex justify-content-center align-items-center gap-4">
                    <div className="text-center">
                        {FIGURE_PROPS[f1].icon}
                        <div style={{ fontSize: 16 }}>{f1}</div>
                    </div>
                    <span className="fs-2 fw-bold">vs</span>
                    <div className="text-center">
                        {FIGURE_PROPS[f2].icon}
                        <div style={{ fontSize: 16 }}>{f2}</div>
                    </div>
                </div>
            )
        };
    }
    // --- 4. ¿Cuántos vértices tiene? ---
    if (type === "vertices") {
        const idx = getRandomInt(0, FIGURES.length - 1);
        const figure = FIGURES[idx];
        const correct = FIGURE_PROPS[figure].vertices;
        const wrongs = [];
        const used = new Set([correct]);
        while (wrongs.length < 2) {
            const w = getRandomInt(Math.max(0, correct - 3), correct + 3);
            if (!used.has(w) && w >= 0 && w <= 12) {
                wrongs.push(w);
                used.add(w);
            }
        }
        const options = shuffle([
            correct.toString(),
            ...wrongs.map(String)
        ]);
        return {
            questionText: `¿Cuántos vértices tiene un ${figure.toLowerCase()}?`,
            expected: correct.toString(),
            explanation: `Un ${figure.toLowerCase()} tiene ${correct} vértice${correct === 1 ? "" : "s"}.`,
            type: "vertices",
            options,
            render: <div className="mb-3">{FIGURE_PROPS[figure].icon}</div>
        };
    }
    // --- 5. ¿Es un polígono regular? ---
    if (type === "regular") {
        const idx = getRandomInt(0, FIGURES.length - 1);
        const figure = FIGURES[idx];
        const isRegular = FIGURE_PROPS[figure].regular;
        return {
            questionText: `¿El ${figure.toLowerCase()} es un polígono regular?`,
            expected: isRegular ? "Sí" : "No",
            explanation: isRegular
                ? `Sí, el ${figure.toLowerCase()} es regular porque todos sus lados y ángulos son iguales.`
                : `No, el ${figure.toLowerCase()} no es regular porque no todos sus lados y ángulos son iguales.`,
            type: "regular",
            options: ["Sí", "No"],
            render: <div className="mb-3">{FIGURE_PROPS[figure].icon}</div>
        };
    }
    // --- 6. ¿Cuál figura es regular? ---
    if (type === "which_regular") {
        const regulars = FIGURES.filter(f => FIGURE_PROPS[f].regular);
        const irregulars = FIGURES.filter(f => !FIGURE_PROPS[f].regular);
        const correct = regulars[getRandomInt(0, regulars.length - 1)];
        const options = shuffle([
            correct,
            ...shuffle(irregulars).slice(0, 2)
        ]);
        return {
            questionText: "¿Cuál de estas figuras es regular?",
            expected: correct,
            explanation: `${correct} es regular porque todos sus lados y ángulos son iguales.`,
            type: "which_regular",
            options,
            render: (
                <div className="mb-3 d-flex justify-content-center align-items-center gap-3">
                    {options.map(opt => (
                        <div key={opt} className="text-center">
                            {FIGURE_PROPS[opt].icon}
                            <div style={{ fontSize: 16 }}>{opt}</div>
                        </div>
                    ))}
                </div>
            )
        };
    }
    // --- 7. ¿Cuál figura es irregular? ---
    if (type === "which_irregular") {
        const regulars = FIGURES.filter(f => FIGURE_PROPS[f].regular);
        const irregulars = FIGURES.filter(f => !FIGURE_PROPS[f].regular);
        const correct = irregulars[getRandomInt(0, irregulars.length - 1)];
        const options = shuffle([
            correct,
            ...shuffle(regulars).slice(0, 2)
        ]);
        return {
            questionText: "¿Cuál de estas figuras es irregular?",
            expected: correct,
            explanation: `${correct} es irregular porque no todos sus lados y ángulos son iguales.`,
            type: "which_irregular",
            options,
            render: (
                <div className="mb-3 d-flex justify-content-center align-items-center gap-3">
                    {options.map(opt => (
                        <div key={opt} className="text-center">
                            {FIGURE_PROPS[opt].icon}
                            <div style={{ fontSize: 16 }}>{opt}</div>
                        </div>
                    ))}
                </div>
            )
        };
    }
    // --- 8. ¿Cuál figura tiene todos sus lados iguales? ---
    if (type === "which_equal_sides") {
        const equal = FIGURES.filter(f => FIGURE_PROPS[f].regular && FIGURE_PROPS[f].lados > 0);
        const notEqual = FIGURES.filter(f => !FIGURE_PROPS[f].regular && FIGURE_PROPS[f].lados > 0);
        const correct = equal[getRandomInt(0, equal.length - 1)];
        const options = shuffle([
            correct,
            ...shuffle(notEqual).slice(0, 2)
        ]);
        return {
            questionText: "¿Cuál de estas figuras tiene todos sus lados iguales?",
            expected: correct,
            explanation: `${correct} tiene todos sus lados iguales.`,
            type: "which_equal_sides",
            options,
            render: (
                <div className="mb-3 d-flex justify-content-center align-items-center gap-3">
                    {options.map(opt => (
                        <div key={opt} className="text-center">
                            {FIGURE_PROPS[opt].icon}
                            <div style={{ fontSize: 16 }}>{opt}</div>
                        </div>
                    ))}
                </div>
            )
        };
    }
    // --- 9. ¿Cuál figura tiene lados desiguales? ---
    if (type === "which_unequal_sides") {
        const notEqual = FIGURES.filter(f => !FIGURE_PROPS[f].regular && FIGURE_PROPS[f].lados > 0);
        const equal = FIGURES.filter(f => FIGURE_PROPS[f].regular && FIGURE_PROPS[f].lados > 0);
        const correct = notEqual[getRandomInt(0, notEqual.length - 1)];
        const options = shuffle([
            correct,
            ...shuffle(equal).slice(0, 2)
        ]);
        return {
            questionText: "¿Cuál de estas figuras tiene lados desiguales?",
            expected: correct,
            explanation: `${correct} tiene lados desiguales.`,
            type: "which_unequal_sides",
            options,
            render: (
                <div className="mb-3 d-flex justify-content-center align-items-center gap-3">
                    {options.map(opt => (
                        <div key={opt} className="text-center">
                            {FIGURE_PROPS[opt].icon}
                            <div style={{ fontSize: 16 }}>{opt}</div>
                        </div>
                    ))}
                </div>
            )
        };
    }

    // fallback
    return {
        questionText: "¿Qué figura es esta?",
        expected: "Círculo",
        explanation: "La figura mostrada es un círculo.",
        type: "identify",
        options: ["Círculo", "Cuadrado", "Triángulo"],
        render: <div className="mb-3">{FIGURE_PROPS["Círculo"].icon}</div>
    };
}

function initialStats(): PlayerStats {
    return {
        correct: 0,
        total: 0,
        reactionTimes: [],
        maxStreak: 0,
        maxErrorStreak: 0,
        currentStreak: 0,
        currentErrorStreak: 0,
        fastest: 999,
        slowest: 0,
        timeouts: 0,
        errors: 0,
        damageDone: 0,
        damageTaken: 0,
        answers: [],
    };
}

export default function GeometricVsGameBoard({ onRestart, characters }: GameBoardProps) {
    const [players, setPlayers] = useState<Player[]>([
        { name: "Jugador 1", life: MAX_LIFE },
        { name: "Jugador 2", life: MAX_LIFE },
    ]);
    const [turn, setTurn] = useState<number>(0);
    const [problem, setProblem] = useState<GeometricProblem>(() => generateGeometricProblem());
    const [input, setInput] = useState<string>("");
    const [timerKey, setTimerKey] = useState<number>(0);
    const [showGameOver, setShowGameOver] = useState<boolean>(false);
    const [winner, setWinner] = useState<number | null>(null);

    const [answerResult, setAnswerResult] = useState<null | "correct" | "wrong">(null);
    const [damageInfo, setDamageInfo] = useState<DamageInfo>(null);
    const [animations, setAnimations] = useState<[null | "damage" | "attack", null | "damage" | "attack"]>([null, null]);
    const [dialogs, setDialogs] = useState<[string | null, string | null]>([null, null]);
    const [currentTimeLeft, setCurrentTimeLeft] = useState(TURN_TIME);
    const [stats, setStats] = useState<[PlayerStats, PlayerStats]>([
        initialStats(),
        initialStats()
    ]);

    // --- Manejo de respuesta ---
    const handleAnswer = useCallback((timeLeft: number) => {
        if (answerResult !== null) return;
        const isCorrect = input === problem.expected;
        const newPlayers = [...players];
        const newAnimations: [null | "damage" | "attack", null | "damage" | "attack"] = [null, null];
        const newDialogs: [string | null, string | null] = [null, null];
        let damage = 10;

        const reactionTime = TURN_TIME - timeLeft;
        const newStats = [...stats] as [PlayerStats, PlayerStats];
        const s = newStats[turn];
        s.total += 1;
        s.reactionTimes.push(reactionTime);

        s.answers.push({
            turn: s.total,
            correct: isCorrect,
            timeout: false,
            reaction: reactionTime,
            questionText: problem.questionText,
            expected: problem.expected,
            input,
            explanation: problem.explanation,
            operationText: problem.questionText,
        });

        if (isCorrect) {
            s.correct += 1;
            s.currentStreak += 1;
            s.maxStreak = Math.max(s.maxStreak, s.currentStreak);
            s.currentErrorStreak = 0;
            if (reactionTime < s.fastest) s.fastest = reactionTime;
            if (reactionTime > s.slowest) s.slowest = reactionTime;
        } else {
            s.errors += 1;
            s.currentErrorStreak += 1;
            s.maxErrorStreak = Math.max(s.maxErrorStreak, s.currentErrorStreak);
            s.currentStreak = 0;
        }
        if (isCorrect) {
            damage = Math.max(5, Math.round((timeLeft / TURN_TIME) * 30));
            const rival = (turn + 1) % 2;
            newStats[rival].damageTaken += damage;
            s.damageDone += damage;
        } else {
            s.damageTaken += 5;
        }
        setStats(newStats);

        if (isCorrect) {
            const rival = (turn + 1) % 2;
            newPlayers[rival].life = Math.max(0, newPlayers[rival].life - damage);
            setAnswerResult("correct");
            setDamageInfo({
                playerIndex: rival,
                amount: damage,
                self: false,
            });
            newAnimations[rival] = "damage";
            newAnimations[turn] = "attack";
            newDialogs[turn] = "¡Toma!";
            newDialogs[rival] = "¡Ay!";
        } else {
            newPlayers[turn].life = Math.max(0, newPlayers[turn].life - damage);
            setAnswerResult("wrong");
            setDamageInfo({
                playerIndex: turn,
                amount: damage,
                self: true,
            });
            newAnimations[turn] = "damage";
            newDialogs[turn] = "¡Auch!";
        }
        setPlayers(newPlayers);
        setAnimations(newAnimations);
        setDialogs(newDialogs);

        if (newPlayers[0].life === 0 || newPlayers[1].life === 0) {
            setTimeout(() => {
                setWinner(newPlayers[0].life === 0 ? 1 : 0);
                setShowGameOver(true);
            }, 1200);
        }
    }, [answerResult, input, problem, players, turn, stats]);

    useEffect(() => {
        if (showGameOver || answerResult !== null) return;
        function handleKeyDown(e: KeyboardEvent) {
            if (showGameOver || answerResult !== null) return;
            // Atajos: 1,2,3 para opciones
            if (["1", "2", "3"].includes(e.key)) {
                const idx = Number(e.key) - 1;
                if (problem.options[idx]) setInput(problem.options[idx]);
            }
            if (e.key === "Enter") handleAnswer(currentTimeLeft);
            if (e.key === "c" || e.key === "C") setInput("");
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [input, showGameOver, answerResult, handleAnswer, currentTimeLeft, problem.options]);

    function handleOption(option: string) {
        if (answerResult === null) setInput(option);
    }

    function nextTurn() {
        setInput("");
        setTimerKey((k) => k + 1);
        setTurn((t) => (t + 1) % 2);
        setProblem(generateGeometricProblem());
        setAnswerResult(null);
        setDamageInfo(null);
        setAnimations([null, null]);
        setDialogs([null, null]);
        setCurrentTimeLeft(TURN_TIME);
    }

    function handleTimeOut() {
        if (answerResult !== null) return;
        const newPlayers = [...players];
        const newAnimations: [null | "damage" | "attack", null | "damage" | "attack"] = [null, null];
        const newDialogs: [string | null, string | null] = [null, null];
        const damage = 10;
        newPlayers[turn].life = Math.max(0, newPlayers[turn].life - damage);
        setPlayers(newPlayers);
        setAnswerResult("wrong");
        setDamageInfo({
            playerIndex: turn,
            amount: damage,
            self: true,
        });
        newAnimations[turn] = "damage";
        newDialogs[turn] = "¡Ups!";
        setAnimations(newAnimations);
        setDialogs(newDialogs);

        const reactionTime = TURN_TIME;
        const newStats = [...stats] as [PlayerStats, PlayerStats];
        const s = newStats[turn];
        s.total += 1;
        s.reactionTimes.push(reactionTime);
        s.timeouts += 1;
        s.errors += 1;
        s.currentErrorStreak += 1;
        s.maxErrorStreak = Math.max(s.maxErrorStreak, s.currentErrorStreak);
        s.currentStreak = 0;
        s.damageTaken += damage;
        s.answers.push({
            turn: s.total,
            correct: false,
            timeout: true,
            reaction: reactionTime,
            questionText: problem.questionText,
            expected: problem.expected,
            input: "",
            explanation: problem.explanation,
            operationText: problem.questionText,
        });
        setStats(newStats);

        if (newPlayers[0].life === 0 || newPlayers[1].life === 0) {
            setTimeout(() => {
                setWinner(newPlayers[0].life === 0 ? 1 : 0);
                setShowGameOver(true);
            }, 1200);
        }
    }

    function handleRestart() {
        setPlayers([
            { name: "Jugador 1", life: MAX_LIFE },
            { name: "Jugador 2", life: MAX_LIFE },
        ]);
        setTurn(0);
        setProblem(generateGeometricProblem());
        setShowGameOver(false);
        setWinner(null);
        setInput("");
        setTimerKey((k) => k + 1);
        setAnswerResult(null);
        setDamageInfo(null);
        setAnimations([null, null]);
        setDialogs([null, null]);
        setCurrentTimeLeft(TURN_TIME);
        setStats([
            initialStats(),
            initialStats()
        ]);
    }

    const canContinue = answerResult !== null && !showGameOver && players[0].life > 0 && players[1].life > 0;

    function renderDamageMessage() {
        if (!damageInfo) return null;
        const playerIcon = characters[damageInfo.playerIndex]
            ? ICON_MAP[characters[damageInfo.playerIndex]!]
            : <FaUser />;
        return (
            <Row className="mb-2">
                <Col className="text-center">
                    <div
                        style={{
                            fontSize: 36,
                            fontWeight: "bold",
                            color: "#e53935",
                            background: "#fff3cd",
                            borderRadius: 12,
                            padding: "10px 0",
                            marginBottom: 8,
                            border: "3px solid #e53935",
                            boxShadow: "0 0 10px #e53935",
                            letterSpacing: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 12,
                            animation: "shake 0.5s",
                        }}
                    >
                        {playerIcon}
                        <FaHeartBroken size={44} style={{ color: "#e53935", marginBottom: 4 }} />
                        -{damageInfo.amount}
                    </div>
                    <style>{`
                        @keyframes shake {
                            0% { transform: translateX(0); }
                            20% { transform: translateX(-10px); }
                            40% { transform: translateX(10px); }
                            60% { transform: translateX(-10px); }
                            80% { transform: translateX(10px); }
                            100% { transform: translateX(0); }
                        }
                    `}</style>
                </Col>
            </Row>
        );
    }

    function renderAnswerMessage() {
        if (answerResult === "correct") {
            return (
                <Row className="mb-2">
                    <Col className="text-center">
                        <Alert variant="success" className="fs-4 fw-bold mb-0">
                            ¡Correcto!
                        </Alert>
                        <div className="mt-2">
                            <span>{problem.questionText}</span><br />
                            <span className="text-success">{problem.explanation}</span>
                        </div>
                    </Col>
                </Row>
            );
        }
        if (answerResult === "wrong") {
            return (
                <Row className="mb-2">
                    <Col className="text-center">
                        <Alert variant="danger" className="fs-4 fw-bold mb-0">
                            Incorrecto
                        </Alert>
                        <div className="text-muted">
                            La respuesta era: <b>{problem.expected}</b>
                        </div>
                        <div className="mt-2">
                            <span>{problem.questionText}</span><br />
                            <span className="text-danger">{problem.explanation}</span>
                        </div>
                    </Col>
                </Row>
            );
        }
        return null;
    }

    return (
        <Card className="p-3 shadow-lg">
            <style>{`
                .fit-text {
                    font-size: 1.1rem;
                    white-space: normal;
                    line-height: 1.1;
                    word-break: break-word;
                    text-align: center;
                    width: 100%;
                    display: block;
                }
                @media (max-width: 600px) {
                    .fit-text {
                        font-size: 0.95rem;
                    }
                }
            `}</style>
            <Row className="mb-3">
                <Col>
                    <LifeBar
                        player={players[0]}
                        active={turn === 0}
                        icon={characters[0] ? ICON_MAP[characters[0]] : <FaUser />}
                        animation={animations[0]}
                        dialog={dialogs[0]}
                    />
                </Col>
                <Col className="text-end">
                    <LifeBar
                        player={players[1]}
                        active={turn === 1}
                        icon={characters[1] ? ICON_MAP[characters[1]] : <FaUser />}
                        animation={animations[1]}
                        dialog={dialogs[1]}
                    />
                </Col>
            </Row>
            <Row className="mb-2">
                <Col className="text-center">
                    <TurnTimer
                        key={timerKey}
                        duration={TURN_TIME}
                        onTimeOut={handleTimeOut}
                        onAnswered={handleAnswer}
                        disabled={showGameOver || answerResult !== null}
                        input={input}
                        correctAnswer={problem.expected}
                        turn={turn}
                        onTick={setCurrentTimeLeft}
                    />
                </Col>
            </Row>
            <Row className="mb-2">
                <Col className="text-center">
                    <div className="fs-1 fw-bold mb-2" style={{ letterSpacing: 2 }}>
                        {problem.questionText}
                    </div>
                    {problem.render}
                </Col>
            </Row>
            {renderDamageMessage()}
            {canContinue && (
                <Row className="mb-2">
                    <Col className="text-center">
                        <Button variant="primary" size="lg" onClick={nextTurn}>
                            Continuar
                        </Button>
                    </Col>
                </Row>
            )}
            {renderAnswerMessage()}
            <Row className="mb-2">
                <Col className="text-center">
                    <div className="fs-2 mb-2">
                        Respuesta: <span className="fw-bold">{input || "?"}</span>
                    </div>
                    <div style={{ display: "inline-block" }}>
                        {problem.options.map((option, idx) => (
                            <Button
                                key={option}
                                className="mx-1 mb-2"
                                style={{
                                    width: 140,
                                    minHeight: 48,
                                    fontSize: "1rem",
                                    fontWeight: "bold",
                                    whiteSpace: "normal",
                                    lineHeight: 1.1,
                                    padding: 4,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    textAlign: "center"
                                }}
                                variant={input === option ? "info" : "outline-secondary"}
                                onClick={() => handleOption(option)}
                                disabled={showGameOver || answerResult !== null}
                            >
                                <span className="me-2">{idx + 1}.</span>
                                <span className="fit-text">
                                    {problem.type === "sides"
                                        ? `${option} lados`
                                        : problem.type === "vertices"
                                            ? `${option} vértices`
                                            : option === "Igual"
                                                ? "Igual número de lados"
                                                : option}
                                </span>
                            </Button>
                        ))}
                        <Button
                            variant="success"
                            className="mx-1"
                            style={{ width: 90, minHeight: 48, fontSize: 18, fontWeight: "bold" }}
                            onClick={() => handleAnswer(currentTimeLeft)}
                            disabled={showGameOver || answerResult !== null || input === ""}
                        >
                            OK
                        </Button>
                        <Button
                            variant="danger"
                            className="mx-1"
                            style={{ width: 60, minHeight: 48, fontSize: 18, fontWeight: "bold" }}
                            onClick={() => setInput("")}
                            disabled={showGameOver || answerResult !== null}
                        >
                            C
                        </Button>
                    </div>
                </Col>
            </Row>
            <Row>
                <Col className="text-center">
                    <Button variant="secondary" onClick={onRestart}>Salir</Button>
                </Col>
            </Row>
            <GameOverModal
                show={showGameOver}
                winner={winner}
                onRestart={handleRestart}
                onClose={onRestart}
                stats={stats}
                characters={characters}
            />
        </Card>
    );
}