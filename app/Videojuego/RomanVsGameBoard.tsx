// app/Videojuego/RomanVsGameBoard.tsx
"use client";
import React, { useState, useEffect, useCallback } from "react";
import { FaHeartBroken, FaUser, FaCat, FaDog, FaDragon, FaHippo, FaFrog, FaFish, FaSpider } from "react-icons/fa";
import { GiShamblingZombie } from "react-icons/gi";
import LifeBar from "./_components/LifeBar";
import OnScreenKeyboard from "./_components/OnScreenKeyboard";
import TurnTimer from "./_components/TurnTimer";
import GameOverModal from "./_components/GameOverModal";
import { Button, Row, Col, Card, Alert } from "react-bootstrap";

// --- Utilidades para números romanos ---
const romanNumerals: [number, string][] = [
    [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"],
    [5, "V"], [4, "IV"], [1, "I"]
];

function toRoman(num: number): string {
    let result = "";
    for (const [value, numeral] of romanNumerals) {
        while (num >= value) {
            result += numeral;
            num -= value;
        }
    }
    return result;
}

/*
function fromRoman(roman: string): number {
    let i = 0, num = 0;
    const map: Record<string, number> = {I:1, V:5, X:10, L:50, C:100};
    while (i < roman.length) {
        const curr = map[roman[i]];
        const next = map[roman[i+1]] || 0;
        if (next > curr) {
            num += next - curr;
            i += 2;
        } else {
            num += curr;
            i += 1;
        }
    }
    return num;
}
*/

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

// --- Tipos ---
type Player = { name: string; life: number; };
type GameBoardProps = {
    onRestart: () => void;
    characters: [string | null, string | null];
};
type DamageInfo = { playerIndex: number; amount: number; self: boolean; } | null;
type PlayerAnswer = {
    turn: number;
    correct: boolean;
    timeout: boolean;
    reaction: number;
    operationText: string;
    expected: string;
    input: string;
    explanation: string;
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

// --- Generador de problemas ---
type RomanProblem = {
    type: "toRoman" | "fromRoman";
    question: string;
    expected: string;
    explanation: string;
    operationText: string;
};

function getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRomanProblem(): RomanProblem {
    // Números entre 1 y 100 (nivel primaria)
    const type = Math.random() < 0.5 ? "toRoman" : "fromRoman";
    if (type === "toRoman") {
        const num = getRandomInt(1, 100);
        return {
            type,
            question: `¿Cómo se escribe el número ${num} en números romanos?`,
            expected: toRoman(num),
            explanation: `El número ${num} en números romanos es ${toRoman(num)}.`,
            operationText: `${num} → ?`
        };
    } else {
        const num = getRandomInt(1, 100);
        const roman = toRoman(num);
        return {
            type,
            question: `¿A qué número corresponde el número romano ${roman}?`,
            expected: num.toString(),
            explanation: `${roman} corresponde al número ${num}.`,
            operationText: `${roman} → ?`
        };
    }
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

// --- Teclado para números romanos (debe estar FUERA del componente principal) ---
function RomanKeyboard({ onLetter, onBackspace, onClear, onEnter, disabled }: {
    onLetter: (l: string) => void,
    onBackspace: () => void,
    onClear: () => void,
    onEnter: () => void,
    disabled?: boolean
}) {
    return (
        <div style={{ display: "inline-block" }}>
            <div className="mb-2 d-flex justify-content-center">
                {["I", "V", "X", "L", "C"].map(k => (
                    <Button
                        key={k}
                        variant="secondary"
                        className="mx-1"
                        style={{ width: 60, height: 48, fontSize: 22 }}
                        onClick={() => !disabled && onLetter(k)}
                        disabled={disabled}
                    >{k}</Button>
                ))}
            </div>
            <div className="mb-2 d-flex justify-content-center">
                <Button
                    variant="danger"
                    className="mx-1"
                    style={{ width: 60, height: 48, fontSize: 22 }}
                    onClick={() => !disabled && onBackspace()}
                    disabled={disabled}
                >←</Button>
                <Button
                    variant="danger"
                    className="mx-1"
                    style={{ width: 60, height: 48, fontSize: 22 }}
                    onClick={() => !disabled && onClear()}
                    disabled={disabled}
                >C</Button>
                <Button
                    variant="success"
                    className="mx-1"
                    style={{ width: 90, height: 48, fontSize: 22, fontWeight: "bold" }}
                    onClick={() => !disabled && onEnter()}
                    disabled={disabled}
                >OK</Button>
            </div>
        </div>
    );
}

// --- Componente principal ---
const MAX_LIFE = 300;
const TURN_TIME = 30;

export default function RomanVsGameBoard({ onRestart, characters }: GameBoardProps) {
    const [players, setPlayers] = useState<Player[]>([
        { name: "Jugador 1", life: MAX_LIFE },
        { name: "Jugador 2", life: MAX_LIFE },
    ]);
    const [turn, setTurn] = useState<number>(0);
    const [problem, setProblem] = useState<RomanProblem>(() => generateRomanProblem());
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

    // --- Validación de respuesta ---
    function cleanRoman(str: string) {
        return str.toUpperCase().replace(/[^IVXLCDM]/g, "");
    }

    const handleAnswer = useCallback((timeLeft: number) => {
        if (answerResult !== null) return;
        let isCorrect = false;
        if (problem.type === "toRoman") {
            isCorrect = cleanRoman(input) === problem.expected;
        } else {
            isCorrect = Number(input) === Number(problem.expected);
        }
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
            operationText: problem.operationText,
            expected: problem.expected,
            input,
            explanation: problem.explanation,
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
            if (problem.type === "toRoman") {
                if ("IVXLCDMivxlcdm".includes(e.key) && input.length < 8) setInput((prev) => prev + e.key.toUpperCase());
            } else {
                if (e.key >= "0" && e.key <= "9" && input.length < 3) setInput((prev) => prev + e.key);
            }
            if (e.key === "Backspace") setInput((prev) => prev.slice(0, -1));
            if (e.key === "Enter") handleAnswer(currentTimeLeft);
            if (e.key === "c" || e.key === "C") setInput("");
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [input, showGameOver, answerResult, handleAnswer, currentTimeLeft, problem.type]);

    function handleNumber(n: string) {
        if (problem.type === "fromRoman") {
            if (input.length < 3 && answerResult === null) setInput(input + n);
        }
    }
    function handleBackspace() {
        if (answerResult === null) setInput(input.slice(0, -1));
    }
    function handleClear() {
        if (answerResult === null) setInput("");
    }
    function handleRomanLetter(letter: string) {
        if (problem.type === "toRoman" && input.length < 8 && answerResult === null) setInput(input + letter);
    }

    function nextTurn() {
        setInput("");
        setTimerKey((k) => k + 1);
        setTurn((t) => (t + 1) % 2);
        setProblem(generateRomanProblem());
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
            operationText: problem.operationText,
            expected: problem.expected,
            input: "",
            explanation: problem.explanation,
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
        setProblem(generateRomanProblem());
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
                            <span>{problem.question}</span><br />
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
                            <span>{problem.question}</span><br />
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
                        {problem.question}
                    </div>
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
                    {problem.type === "toRoman" ? (
                        <RomanKeyboard
                            onLetter={handleRomanLetter}
                            onBackspace={handleBackspace}
                            onClear={handleClear}
                            onEnter={() => handleAnswer(currentTimeLeft)}
                            disabled={showGameOver || answerResult !== null}
                        />
                    ) : (
                        <OnScreenKeyboard
                            onNumber={handleNumber}
                            onBackspace={handleBackspace}
                            onClear={handleClear}
                            onEnter={() => handleAnswer(currentTimeLeft)}
                            disabled={showGameOver || answerResult !== null}
                        />
                    )}
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