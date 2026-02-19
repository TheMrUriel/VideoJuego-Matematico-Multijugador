"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
    FaHeartBroken, FaCat, FaDog, FaDragon, FaHippo, FaFrog, FaFish, FaSpider, FaUser
} from "react-icons/fa";
import { GiShamblingZombie } from "react-icons/gi";
import LifeBar from "./_components/LifeBar";
import OnScreenKeyboard from "./_components/OnScreenKeyboard";
import TurnTimer from "./_components/TurnTimer";
import GameOverModal from "./_components/GameOverModal";
import { Button, Row, Col, Card, Alert } from "react-bootstrap";

const MAX_LIFE = 300;
const TURN_TIME = 30; // segundos

type Modes = {
    suma: boolean;
    resta: boolean;
    multi: boolean;
};

type OperationType = "suma" | "resta" | "multi";

type Operation = {
    type: OperationType;
    a: number;
    b: number;
    answer: number;
    text: string;
};

type Player = {
    name: string;
    life: number;
};

type GameBoardProps = {
    config: { modes: Modes };
    onRestart: () => void;
    characters: [string | null, string | null];
};

type DamageInfo = {
    playerIndex: number; // 0 o 1
    amount: number;
    self: boolean; // true si se dañó a sí mismo
} | null;

type PlayerAnswer = {
    turn: number;
    correct: boolean;
    timeout: boolean;
    reaction: number; // segundos
    operationText: string;
};

type PlayerStats = {
    correct: number;
    total: number;
    reactionTimes: number[]; // en segundos
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

function getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateOperation(modes: Modes): Operation {
    const available: OperationType[] = [];
    if (modes.suma) available.push("suma");
    if (modes.resta) available.push("resta");
    if (modes.multi) available.push("multi");
    const type = available[getRandomInt(0, available.length - 1)];
    let a = 0, b = 0, answer = 0, text = "";

    if (type === "suma") {
        a = getRandomInt(1, 20);
        b = getRandomInt(1, 20);
        answer = a + b;
        text = `${a} + ${b}`;
    } else if (type === "resta") {
        a = getRandomInt(1, 20);
        b = getRandomInt(1, Math.min(20, a));
        answer = a - b;
        text = `${a} - ${b}`;
    } else if (type === "multi") {
        a = getRandomInt(1, 10);
        b = getRandomInt(1, 10);
        answer = a * b;
        text = `${a} × ${b}`;
    }
    return { type, a, b, answer, text };
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

// --- NUEVO: Renderizado vertical clásico de primaria ---
function renderVerticalOperation(operation: Operation) {
    let sign = "";
    if (operation.type === "suma") sign = "+";
    else if (operation.type === "resta") sign = "−";
    else if (operation.type === "multi") sign = "×";
    // Para alineación, usamos el mayor número de dígitos
    const maxLen = Math.max(operation.a.toString().length, operation.b.toString().length);
    const pad = (n: number) => n.toString().padStart(maxLen, " ");
    return (
        <div style={{ display: "inline-block", fontSize: 48, textAlign: "right", lineHeight: 1.2, fontFamily: "monospace" }}>
            <div style={{ minHeight: 60 }}>
                {pad(operation.a)}
            </div>
            <div>
                <span style={{ fontWeight: "bold", marginRight: 8 }}>{sign}</span>
                {pad(operation.b)}
            </div>
            <div style={{
                borderBottom: "4px solid #222",
                marginTop: 4,
                marginBottom: 2,
                height: 0,
                width: `${(maxLen + 1) * 32}px`
            }} />
        </div>
    );
}
// -------------------------------------------------------

export default function GameBoard({ config, onRestart, characters }: GameBoardProps) {
    const [players, setPlayers] = useState<Player[]>([
        { name: "Jugador 1", life: MAX_LIFE },
        { name: "Jugador 2", life: MAX_LIFE },
    ]);
    const [turn, setTurn] = useState<number>(0); // 0 o 1
    const [operation, setOperation] = useState<Operation>(() => generateOperation(config.modes));
    const [input, setInput] = useState<string>("");
    const [timerKey, setTimerKey] = useState<number>(0);
    const [showGameOver, setShowGameOver] = useState<boolean>(false);
    const [winner, setWinner] = useState<number | null>(null);

    // Estado para mostrar resultado
    const [answerResult, setAnswerResult] = useState<null | "correct" | "wrong">(null);

    // Estado para mostrar daño
    const [damageInfo, setDamageInfo] = useState<DamageInfo>(null);

    // Estado para animaciones de personajes
    const [animations, setAnimations] = useState<[null | "damage" | "attack", null | "damage" | "attack"]>([null, null]);

    // Estado para globos de diálogo
    const [dialogs, setDialogs] = useState<[string | null, string | null]>([null, null]);

    // Estado para el tiempo restante
    const [currentTimeLeft, setCurrentTimeLeft] = useState(TURN_TIME);

    // Estado para estadísticas
    const [stats, setStats] = useState<[PlayerStats, PlayerStats]>([
        initialStats(),
        initialStats()
    ]);

    const handleAnswer = useCallback((timeLeft: number) => {
        if (answerResult !== null) return; // Evita doble click
        const isCorrect = Number(input) === operation.answer;
        const newPlayers = [...players];
        const newAnimations: [null | "damage" | "attack", null | "damage" | "attack"] = [null, null];
        const newDialogs: [string | null, string | null] = [null, null];
        let damage = 10;

        // --- Estadísticas ---
        const reactionTime = TURN_TIME - timeLeft;
        const newStats = [...stats] as [PlayerStats, PlayerStats];
        const s = newStats[turn];
        s.total += 1;
        s.reactionTimes.push(reactionTime);

        // Guardar respuesta
        s.answers.push({
            turn: s.total,
            correct: isCorrect,
            timeout: false,
            reaction: reactionTime,
            operationText: operation.text,
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
    }, [answerResult, input, operation.text, operation.answer, players, turn, stats]);

    useEffect(() => {
        if (showGameOver || answerResult !== null) return;

        function handleKeyDown(e: KeyboardEvent) {
            if (showGameOver || answerResult !== null) return;
            if (e.key >= "0" && e.key <= "9") {
                if (input.length < 3) setInput((prev) => prev + e.key);
            } else if (e.key === "Backspace") {
                setInput((prev) => prev.slice(0, -1));
            } else if (e.key === "Enter") {
                handleAnswer(currentTimeLeft);
            } else if (e.key === "c" || e.key === "C") {
                setInput("");
            }
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [input, showGameOver, answerResult, handleAnswer, currentTimeLeft]);

    function handleNumber(n: string) {
        if (input.length < 3 && answerResult === null) setInput(input + n);
    }
    function handleBackspace() {
        if (answerResult === null) setInput(input.slice(0, -1));
    }
    function handleClear() {
        if (answerResult === null) setInput("");
    }

    function nextTurn() {
        setInput("");
        setTimerKey((k) => k + 1);
        setTurn((t) => (t + 1) % 2);
        setOperation(generateOperation(config.modes));
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
            operationText: operation.text,
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
        setOperation(generateOperation(config.modes));
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
                        correctAnswer={operation.answer}
                        turn={turn}
                        onTick={setCurrentTimeLeft}
                    />
                </Col>
            </Row>
            <Row className="mb-2">
                <Col className="text-center">
                    {renderVerticalOperation(operation)}
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
            {answerResult === "correct" && (
                <Row className="mb-2">
                    <Col className="text-center">
                        <Alert variant="success" className="fs-4 fw-bold mb-0">
                            ¡Correcto!
                        </Alert>
                    </Col>
                </Row>
            )}
            {answerResult === "wrong" && (
                <Row className="mb-2">
                    <Col className="text-center">
                        <Alert variant="danger" className="fs-4 fw-bold mb-0">
                            Incorrecto
                        </Alert>
                        <div className="text-muted">La respuesta era: <b>{operation.answer}</b></div>
                    </Col>
                </Row>
            )}
            <Row className="mb-2">
                <Col className="text-center">
                    <div className="fs-2 mb-2">
                        Respuesta: <span className="fw-bold">{input || "?"}</span>
                    </div>
                    <OnScreenKeyboard
                        onNumber={handleNumber}
                        onBackspace={handleBackspace}
                        onClear={handleClear}
                        onEnter={() => handleAnswer(currentTimeLeft)}
                        disabled={showGameOver || answerResult !== null}
                    />
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