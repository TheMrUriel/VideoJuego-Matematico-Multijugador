// app/Videojuego/FractionVsGameBoard.tsx
"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { FaHeartBroken, FaUser, FaCat, FaDog, FaDragon, FaHippo, FaFrog, FaFish, FaSpider } from "react-icons/fa";
import { GiShamblingZombie } from "react-icons/gi";
import LifeBar from "./_components/LifeBar";
import OnScreenKeyboard from "./_components/OnScreenKeyboard";
import TurnTimer from "./_components/TurnTimer";
import GameOverModal from "./_components/GameOverModal";
import FractionVisualizer from "./_components/FractionVisualizer";
import { Button, Row, Col, Card, Alert } from "react-bootstrap";

const MAX_LIFE = 300;
const TURN_TIME = 30;

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

function getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]): T[] {
    return arr.slice().sort(() => Math.random() - 0.5);
}

// Simplifica una fracción
function gcd(a: number, b: number): number {
    return b === 0 ? a : gcd(b, a % b);
}
function simplifyFraction(n: number, d: number): [number, number] {
    const g = gcd(Math.abs(n), Math.abs(d));
    return [n / g, d / g];
}
function parseFraction(str: string): [number, number] | null {
    const parts = str.split("/");
    if (parts.length !== 2) return null;
    const n = parseInt(parts[0], 10);
    const d = parseInt(parts[1], 10);
    if (isNaN(n) || isNaN(d) || d === 0) return null;
    return [n, d];
}
function areFractionsEquivalent(a: string, b: string): boolean {
    const fa = parseFraction(a);
    const fb = parseFraction(b);
    if (!fa || !fb) return false;
    const [na, da] = simplifyFraction(fa[0], fa[1]);
    const [nb, db] = simplifyFraction(fb[0], fb[1]);
    return na === nb && da === db;
}

// Tipos de problema: "escribe la fracción" o "elige la imagen"
type FractionProblem =
    | {
        type: "write";
        numerator: number;
        denominator: number;
        explanation: string;
        operationText: string;
        expected: string; // "a/b"
    }
    | {
        type: "select";
        numerator: number;
        denominator: number;
        options: { numerator: number; denominator: number }[];
        explanation: string;
        operationText: string;
        expected: string; // "a/b"
    };

function generateFractionProblem(): FractionProblem {
    // Solo fracciones propias, denominadores 2 a 8, numeradores 1 a (den-1)
    const mode = Math.random() < 0.5 ? "write" : "select";
    const denominator = getRandomInt(2, 8);
    const numerator = getRandomInt(1, denominator - 1);

    if (mode === "write") {
        return {
            type: "write",
            numerator,
            denominator,
            explanation: `La fracción sombreada es ${numerator}/${denominator}.`,
            operationText: `¿Qué fracción está representada?`,
            expected: `${numerator}/${denominator}`,
        };
    } else {
        // Opción correcta y dos distractores (sin equivalentes)
        const options: { numerator: number; denominator: number }[] = [
            { numerator, denominator }
        ];
        while (options.length < 3) {
            const d = getRandomInt(2, 8);
            const n = getRandomInt(1, d - 1);
            if (
                !(n === numerator && d === denominator) &&
                !options.some(o => areFractionsEquivalent(`${o.numerator}/${o.denominator}`, `${n}/${d}`))
            ) {
                options.push({ numerator: n, denominator: d });
            }
        }
        return {
            type: "select",
            numerator,
            denominator,
            options: shuffle(options),
            explanation: `La fracción ${numerator}/${denominator} es la correcta.`,
            operationText: `¿Cuál imagen representa la fracción ${numerator}/${denominator}?`,
            expected: `${numerator}/${denominator}`,
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

export default function FractionVsGameBoard({ onRestart, characters }: GameBoardProps) {
    const [players, setPlayers] = useState<Player[]>([
        { name: "Jugador 1", life: MAX_LIFE },
        { name: "Jugador 2", life: MAX_LIFE },
    ]);
    const [turn, setTurn] = useState<number>(0);
    const [problem, setProblem] = useState<FractionProblem>(() => generateFractionProblem());
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

    // Scroll refs
    const topRef = useRef<HTMLDivElement>(null);
    const continueRef = useRef<HTMLDivElement>(null);

    // --- DECLARA canContinue ANTES DEL useEffect ---
    const canContinue = answerResult !== null && !showGameOver && players[0].life > 0 && players[1].life > 0;

    // Scroll automático cuando aparece "Continuar"
    useEffect(() => {
        if (canContinue && continueRef.current) {
            setTimeout(() => {
                continueRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 100);
        }
    }, [canContinue, answerResult]);

    // Validación de respuesta
    function cleanFraction(str: string) {
        return str.replace(/\s/g, "").replace(/^0+/, "");
    }

    const handleAnswer = useCallback((timeLeft: number) => {
        if (answerResult !== null) return;
        let isCorrect = false;
        if (problem.type === "write") {
            isCorrect = areFractionsEquivalent(cleanFraction(input), `${problem.numerator}/${problem.denominator}`);
        } else {
            isCorrect = areFractionsEquivalent(input, `${problem.numerator}/${problem.denominator}`);
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
            expected: `${problem.numerator}/${problem.denominator}`,
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
            if (problem.type === "write") {
                if ((e.key >= "0" && e.key <= "9") || e.key === "/") {
                    if (input.length < 5) setInput((prev) => prev + e.key);
                }
            }
            if (e.key === "Backspace") setInput((prev) => prev.slice(0, -1));
            if (e.key === "Enter") handleAnswer(currentTimeLeft);
            if (e.key === "c" || e.key === "C") setInput("");
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [input, showGameOver, answerResult, handleAnswer, currentTimeLeft, problem.type]);

    function handleNumber(n: string) {
        if (problem.type === "write") {
            if (input.length < 5 && answerResult === null) setInput(input + n);
        }
    }
    function handleBackspace() {
        if (answerResult === null) setInput(input.slice(0, -1));
    }
    function handleClear() {
        if (answerResult === null) setInput("");
    }
    function handleSlash() {
        if (problem.type === "write" && !input.includes("/") && input.length > 0 && answerResult === null) setInput(input + "/");
    }
    function handleSelect(option: { numerator: number; denominator: number }) {
        if (answerResult === null) setInput(`${option.numerator}/${option.denominator}`);
    }

    function nextTurn() {
        setInput("");
        setTimerKey((k) => k + 1);
        setTurn((t) => (t + 1) % 2);
        setProblem(generateFractionProblem());
        setAnswerResult(null);
        setDamageInfo(null);
        setAnimations([null, null]);
        setDialogs([null, null]);
        setCurrentTimeLeft(TURN_TIME);
        if (topRef.current) {
            setTimeout(() => {
                topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 100);
        }
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
            expected: `${problem.numerator}/${problem.denominator}`,
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
        setProblem(generateFractionProblem());
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
                            <span>{problem.operationText}</span><br />
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
                            La respuesta era: <b>{problem.numerator}/{problem.denominator}</b>
                        </div>
                        <div className="mt-2">
                            <span>{problem.operationText}</span><br />
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
            <div ref={topRef}></div>
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
                        correctAnswer={problem.type === "write" ? `${problem.numerator}/${problem.denominator}` : problem.expected}
                        turn={turn}
                        onTick={setCurrentTimeLeft}
                    />
                </Col>
            </Row>
            <Row className="mb-2">
                <Col className="text-center">
                    <div className="fs-1 fw-bold mb-2" style={{ letterSpacing: 2 }}>
                        {problem.operationText}
                    </div>
                    <div className="mb-3 d-flex justify-content-center">
                        {problem.type === "write" ? (
                            <FractionVisualizer numerator={problem.numerator} denominator={problem.denominator} size={120} />
                        ) : null}
                    </div>
                </Col>
            </Row>
            {problem.type === "select" && (
                <Row className="mb-2">
                    <Col className="text-center">
                        <div className="d-flex justify-content-center gap-3 flex-wrap mb-2">
                            {problem.options.map((opt, idx) => (
                                <Button
                                    key={idx}
                                    variant={input === `${opt.numerator}/${opt.denominator}` ? "info" : "outline-secondary"}
                                    className="mb-2"
                                    style={{ padding: 0, width: 110, height: 110, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
                                    onClick={() => handleSelect(opt)}
                                    disabled={showGameOver || answerResult !== null}
                                    aria-label={`Opción ${idx + 1}`}
                                >
                                    <FractionVisualizer numerator={opt.numerator} denominator={opt.denominator} size={80} />
                                </Button>
                            ))}
                        </div>
                        <div>
                            <Button
                                variant="success"
                                className="mx-1"
                                style={{ width: 90, height: 48, fontSize: 18, fontWeight: "bold" }}
                                onClick={() => handleAnswer(currentTimeLeft)}
                                disabled={showGameOver || answerResult !== null || input === ""}
                            >
                                OK
                            </Button>
                            <Button
                                variant="danger"
                                className="mx-1"
                                style={{ width: 60, height: 48, fontSize: 18, fontWeight: "bold" }}
                                onClick={handleClear}
                                disabled={showGameOver || answerResult !== null || input === ""}
                            >
                                C
                            </Button>
                        </div>
                        <div className="fs-2 mt-2">
                            Respuesta: <span className="fw-bold">
                                {input
                                    ? `Opción ${problem.options.findIndex(
                                        o => `${o.numerator}/${o.denominator}` === input
                                    ) + 1}`
                                    : "?"}
                            </span>
                        </div>
                    </Col>
                </Row>
            )}
            {problem.type === "write" && (
                <Row className="mb-2">
                    <Col className="text-center">
                        <div className="fs-2 mb-2">
                            Respuesta: <span className="fw-bold">{input || "?"}</span>
                        </div>
                        <div style={{ display: "inline-block" }}>
                            <OnScreenKeyboard
                                onNumber={handleNumber}
                                onBackspace={handleBackspace}
                                onClear={handleClear}
                                onEnter={() => handleAnswer(currentTimeLeft)}
                                disabled={showGameOver || answerResult !== null}
                            />
                            <Button
                                variant="secondary"
                                className="mx-1"
                                style={{ width: 60, height: 48, fontSize: 22, fontWeight: "bold" }}
                                onClick={handleSlash}
                                disabled={showGameOver || answerResult !== null || input.includes("/")}
                            >/</Button>
                        </div>
                    </Col>
                </Row>
            )}
            {renderDamageMessage()}
            {canContinue && (
                <Row className="mb-2">
                    <Col className="text-center">
                        <div ref={continueRef}></div>
                        <Button variant="primary" size="lg" onClick={nextTurn}>
                            Continuar
                        </Button>
                    </Col>
                </Row>
            )}
            {renderAnswerMessage()}
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