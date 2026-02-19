"use client";
import React, { useState, useEffect, useCallback } from "react";
import { FaHeartBroken, FaUser, FaCat, FaDog, FaDragon, FaHippo, FaFrog, FaFish, FaSpider, FaGreaterThan, FaLessThan, FaEquals, FaCheck, FaTimes } from "react-icons/fa";
import { GiShamblingZombie } from "react-icons/gi";
import LifeBar from "./_components/LifeBar";
import TurnTimer from "./_components/TurnTimer";
import GameOverModal from "./_components/GameOverModal";
import { Button, Row, Col, Card, Alert } from "react-bootstrap";

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

// Agrega operationText para compatibilidad con GameOverModal
type PlayerAnswer = {
    turn: number;
    correct: boolean;
    timeout: boolean;
    reaction: number;
    compareText: string;
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

// Genera un problema de comparación
function generateCompareProblem(): {
    a: number;
    b: number;
    compareText: string;
    expected: string;
    explanation: string;
    type: "compare" | "truefalse";
} {
    // Decide si es comparación directa o pregunta de verdadero/falso
    const type: "compare" | "truefalse" = Math.random() < 0.5 ? "compare" : "truefalse";
    const a = getRandomInt(1, 100);
    let b = getRandomInt(1, 100);
    let compareText = "";
    let expected = "";
    let explanation = "";

    // Para evitar igualdad accidental
    if (a === b) {
        b = a + getRandomInt(1, 5);
    }

    if (type === "compare") {
        compareText = `${a} ___ ${b}`;
        if (a > b) {
            expected = ">";
            explanation = `El número ${a} es mayor que ${b}.`;
        } else if (a < b) {
            expected = "<";
            explanation = `El número ${a} es menor que ${b}.`;
        } else {
            expected = "=";
            explanation = `Ambos números son iguales.`;
        }
    } else {
        const relations = [
            { op: ">", symbol: <FaGreaterThan />, text: "mayor que" },
            { op: "<", symbol: <FaLessThan />, text: "menor que" },
            { op: "=", symbol: <FaEquals />, text: "igual a" }
        ];
        const rel = relations[getRandomInt(0, relations.length - 1)];
        compareText = `¿Es cierto que ${a} ${rel.text} ${b}?`;
        if (rel.op === ">") {
            expected = a > b ? "V" : "F";
            explanation = a > b
                ? `Sí, ${a} es mayor que ${b}.`
                : `No, ${a} no es mayor que ${b}.`;
        } else if (rel.op === "<") {
            expected = a < b ? "V" : "F";
            explanation = a < b
                ? `Sí, ${a} es menor que ${b}.`
                : `No, ${a} no es menor que ${b}.`;
        } else {
            expected = a === b ? "V" : "F";
            explanation = a === b
                ? `Sí, ambos números son iguales.`
                : `No, los números son diferentes.`;
        }
    }

    return {
        a,
        b,
        compareText,
        expected,
        explanation,
        type
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

export default function CompareVsGameBoard({ onRestart, characters }: GameBoardProps) {
    const [players, setPlayers] = useState<Player[]>([
        { name: "Jugador 1", life: MAX_LIFE },
        { name: "Jugador 2", life: MAX_LIFE },
    ]);
    const [turn, setTurn] = useState<number>(0);
    const [problem, setProblem] = useState(() => generateCompareProblem());
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

    const compareKeys = problem.type === "compare"
        ? [
            [{ key: "<", label: <FaLessThan size={28} /> }, { key: "=", label: <FaEquals size={28} /> }, { key: ">", label: <FaGreaterThan size={28} /> }]
        ]
        : [
            [{ key: "V", label: <FaCheck className="text-success" /> }, { key: "F", label: <FaTimes className="text-danger" /> }]
        ];

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

        // Agrega operationText igual a compareText
        s.answers.push({
            turn: s.total,
            correct: isCorrect,
            timeout: false,
            reaction: reactionTime,
            compareText: problem.compareText,
            expected: problem.expected,
            input,
            explanation: problem.explanation,
            operationText: problem.compareText,
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
            if (problem.type === "compare") {
                if (["<", ">", "="].includes(e.key)) setInput(e.key);
            } else {
                if (e.key.toLowerCase() === "v") setInput("V");
                if (e.key.toLowerCase() === "f") setInput("F");
            }
            if (e.key === "Enter") handleAnswer(currentTimeLeft);
            if (e.key === "c" || e.key === "C") setInput("");
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [input, showGameOver, answerResult, handleAnswer, currentTimeLeft, problem.type]);

    function handleKey(key: string) {
        if (answerResult === null) setInput(key);
    }

    function nextTurn() {
        setInput("");
        setTimerKey((k) => k + 1);
        setTurn((t) => (t + 1) % 2);
        setProblem(generateCompareProblem());
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
            compareText: problem.compareText,
            expected: problem.expected,
            input: "",
            explanation: problem.explanation,
            operationText: problem.compareText,
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
        setProblem(generateCompareProblem());
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
                            <span>{problem.compareText}</span><br />
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
                            La respuesta era: <b>
                                {problem.type === "compare"
                                    ? (problem.expected === ">" ? <FaGreaterThan /> : problem.expected === "<" ? <FaLessThan /> : <FaEquals />)
                                    : (problem.expected === "V" ? <FaCheck className="text-success" /> : <FaTimes className="text-danger" />)
                                }
                            </b>
                        </div>
                        <div className="mt-2">
                            <span>{problem.compareText}</span><br />
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
                        {problem.compareText}
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
                        Respuesta: <span className="fw-bold">
                            {input === ""
                                ? "?"
                                : problem.type === "compare"
                                    ? (input === ">" ? <FaGreaterThan /> : input === "<" ? <FaLessThan /> : <FaEquals />)
                                    : (input === "V" ? <FaCheck className="text-success" /> : <FaTimes className="text-danger" />)
                            }
                        </span>
                    </div>
                    <div style={{ display: "inline-block" }}>
                        {compareKeys.map((row, i) => (
                            <div key={i} className="mb-2 d-flex justify-content-center">
                                {row.map(({ key, label }) => (
                                    <Button
                                        key={key}
                                        className="mx-1"
                                        style={{
                                            width: problem.type === "compare" ? 70 : 120,
                                            height: 48,
                                            fontSize: 22,
                                            fontWeight: "bold"
                                        }}
                                        onClick={() => handleKey(key)}
                                        disabled={showGameOver || answerResult !== null}
                                    >
                                        {label}
                                    </Button>
                                ))}
                            </div>
                        ))}
                        <Button
                            variant="success"
                            className="mx-1"
                            style={{ width: 120, height: 48, fontSize: 22, fontWeight: "bold" }}
                            onClick={() => handleAnswer(currentTimeLeft)}
                            disabled={showGameOver || answerResult !== null || input === ""}
                        >
                            OK
                        </Button>
                        <Button
                            variant="danger"
                            className="mx-1"
                            style={{ width: 80, height: 48, fontSize: 22, fontWeight: "bold" }}
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