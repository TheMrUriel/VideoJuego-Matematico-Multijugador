"use client";
import { useState } from "react";
import { Modal, Button, Collapse, Table, Badge } from "react-bootstrap";
import { FaTrophy, FaChevronDown, FaChevronUp, FaCheck, FaTimes, FaClock, FaMedal, FaCat, FaDog, FaDragon, FaHippo, FaFrog, FaFish, FaSpider, FaUser } from "react-icons/fa";
import { GiShamblingZombie } from "react-icons/gi";

type PlayerAnswer = {
    turn: number;
    correct: boolean;
    timeout: boolean;
    reaction: number;
    operationText: string;
    type?: "suma" | "resta" | "multi";
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
    Gato: <FaCat size={32} />,
    Perro: <FaDog size={32} />,
    Dragón: <FaDragon size={32} />,
    Hipopótamo: <FaHippo size={32} />,
    Rana: <FaFrog size={32} />,
    Pez: <FaFish size={32} />,
    Araña: <FaSpider size={32} />,
    Zombie: <GiShamblingZombie size={32} />,
};

const ICON_MAP_BIG: Record<string, React.ReactElement> = {
    Gato: <FaCat size={60} />,
    Perro: <FaDog size={60} />,
    Dragón: <FaDragon size={60} />,
    Hipopótamo: <FaHippo size={60} />,
    Rana: <FaFrog size={60} />,
    Pez: <FaFish size={60} />,
    Araña: <FaSpider size={60} />,
    Zombie: <GiShamblingZombie size={60} />,
};

function getOperationTypeFromText(text: string): "suma" | "resta" | "multi" | "desconocida" {
    if (text.includes("+")) return "suma";
    if (text.includes("-")) return "resta";
    if (text.includes("×") || text.includes("x") || text.includes("*")) return "multi";
    return "desconocida";
}

// Extrae los operandos de la operación para análisis de errores
function getOperands(text: string): [number, number] | null {
    // Suma
    let match = text.match(/^(\d+)\s*\+\s*(\d+)$/);
    if (match) return [parseInt(match[1]), parseInt(match[2])];
    // Resta
    match = text.match(/^(\d+)\s*-\s*(\d+)$/);
    if (match) return [parseInt(match[1]), parseInt(match[2])];
    // Multiplicación
    match = text.match(/^(\d+)\s*[×x*]\s*(\d+)$/);
    if (match) return [parseInt(match[1]), parseInt(match[2])];
    return null;
}

type Medal = {
    type: "good" | "bad";
    text: string;
    short: string;
};

export default function GameOverModal({
    show,
    winner,
    onRestart,
    onClose,
    stats,
    characters
}: {
    show: boolean,
    winner: number | null,
    winnerIcon?: React.ReactElement,
    onRestart: () => void,
    onClose: () => void,
    stats?: [PlayerStats, PlayerStats],
    characters?: [string | null, string | null]
}) {
    const [showDetails, setShowDetails] = useState(false);
    const [selectedMedal, setSelectedMedal] = useState<{ player: number, medal: Medal } | null>(null);

    function getStats(player: 0 | 1) {
        if (!stats) return {
            percent: 0, avg: 0, fastest: 0, slowest: 0, maxStreak: 0, maxErrorStreak: 0,
            timeouts: 0, errors: 0, total: 0, damageDone: 0, damageTaken: 0, answers: []
        };
        const s = stats[player];
        const percent = s.total ? Math.round((s.correct / s.total) * 100) : 0;
        const avg = s.reactionTimes.length
            ? (s.reactionTimes.reduce((a: number, b: number) => a + b, 0) / s.reactionTimes.length)
            : 0;
        const fastest = s.fastest === 999 ? 0 : s.fastest;
        const slowest = s.slowest === 0 ? 0 : s.slowest;
        return {
            percent,
            avg: Number(avg.toFixed(2)),
            fastest,
            slowest,
            maxStreak: s.maxStreak,
            maxErrorStreak: s.maxErrorStreak,
            timeouts: s.timeouts,
            errors: s.errors,
            total: s.total,
            damageDone: s.damageDone,
            damageTaken: s.damageTaken,
            answers: s.answers
        };
    }

    // NUEVO: Análisis por tipo de operación y operandos
    function getOperationStats(answers: PlayerAnswer[]) {
        const tipos: ("suma" | "resta" | "multi")[] = ["suma", "resta", "multi"];
        const statsPorTipo: Record<string, {
            total: number,
            correct: number,
            errors: number,
            timeouts: number,
            avg: number,
            fastest: number,
            slowest: number,
            erroresOperandos: number[][]
        }> = {};

        for (const tipo of tipos) {
            const filtradas = answers.filter(a => getOperationTypeFromText(a.operationText) === tipo);
            const correctas = filtradas.filter(a => a.correct && !a.timeout);
            const errores = filtradas.filter(a => !a.correct && !a.timeout);
            const timeouts = filtradas.filter(a => a.timeout);
            const avg = filtradas.length
                ? (filtradas.reduce((acc, a) => acc + a.reaction, 0) / filtradas.length)
                : 0;
            const fastest = correctas.length ? Math.min(...correctas.map(a => a.reaction)) : 0;
            const slowest = correctas.length ? Math.max(...correctas.map(a => a.reaction)) : 0;

            // Para multiplicación: errores por tabla
            let erroresOperandos: number[][] = [];
            if (tipo === "multi") {
                erroresOperandos = Array.from({ length: 11 }, () => [0, 0]);
                for (const err of errores) {
                    const op = getOperands(err.operationText);
                    if (op) {
                        erroresOperandos[op[0]][0]++;
                        erroresOperandos[op[1]][1]++;
                    }
                }
            }
            statsPorTipo[tipo] = {
                total: filtradas.length,
                correct: correctas.length,
                errors: errores.length,
                timeouts: timeouts.length,
                avg: Number(avg.toFixed(2)),
                fastest,
                slowest,
                erroresOperandos
            };
        }
        return statsPorTipo;
    }

    function getTablaMultiplicarConMasErrores(answers: PlayerAnswer[]) {
        const errores = answers.filter(a => getOperationTypeFromText(a.operationText) === "multi" && !a.correct && !a.timeout);
        const tablaErrores: Record<number, number> = {};
        for (const err of errores) {
            const op = getOperands(err.operationText);
            if (op) {
                tablaErrores[op[0]] = (tablaErrores[op[0]] || 0) + 1;
                tablaErrores[op[1]] = (tablaErrores[op[1]] || 0) + 1;
            }
        }
        let maxTabla = 0;
        let maxErrores = 0;
        for (let t = 2; t <= 10; t++) {
            if ((tablaErrores[t] || 0) > maxErrores) {
                maxErrores = tablaErrores[t];
                maxTabla = t;
            }
        }
        return maxErrores > 0 ? maxTabla : null;
    }

    function getNumeroConMasErrores(answers: PlayerAnswer[], tipo: "suma" | "resta") {
        const errores = answers.filter(a => getOperationTypeFromText(a.operationText) === tipo && !a.correct && !a.timeout);
        const numeroErrores: Record<number, number> = {};
        for (const err of errores) {
            const op = getOperands(err.operationText);
            if (op) {
                numeroErrores[op[0]] = (numeroErrores[op[0]] || 0) + 1;
                numeroErrores[op[1]] = (numeroErrores[op[1]] || 0) + 1;
            }
        }
        let maxNum = 0;
        let maxErrores = 0;
        for (let n = 1; n <= 20; n++) {
            if ((numeroErrores[n] || 0) > maxErrores) {
                maxErrores = numeroErrores[n];
                maxNum = n;
            }
        }
        return maxErrores > 0 ? maxNum : null;
    }

    function getMedals(player: 0 | 1): Medal[] {
        const s = getStats(player);
        if (s.total === 0) return [{
            type: "bad",
            short: "Sin respuestas",
            text: "No se registraron respuestas para este jugador."
        }];

        const medals: Medal[] = [];
        const opStats = getOperationStats(s.answers);

        // Suma
        if (opStats.suma.total > 0) {
            if (opStats.suma.correct / opStats.suma.total >= 0.8) {
                medals.push({
                    type: "good",
                    short: "Sumas dominadas",
                    text: "¡Muy bien en sumas! Resolviste la mayoría correctamente."
                });
            } else if (opStats.suma.correct / opStats.suma.total < 0.5) {
                const num = getNumeroConMasErrores(s.answers, "suma");
                medals.push({
                    type: "bad",
                    short: "Sumas a mejorar",
                    text: num
                        ? `Las sumas parecen ser un área de oportunidad, especialmente con el número ${num}. Te recomiendo practicar sumas que incluyan el ${num}.`
                        : "Las sumas parecen ser un área de oportunidad. Te recomiendo repasar la suma y practicar ejercicios básicos y avanzados."
                });
            } else {
                medals.push({
                    type: "bad",
                    short: "Sumas aceptables",
                    text: "Tus resultados en sumas son aceptables, pero puedes mejorar aún más con práctica."
                });
            }
            if (opStats.suma.avg > 7) {
                medals.push({
                    type: "bad",
                    short: "Sumas lentas",
                    text: "En sumas, podrías intentar responder un poco más rápido para mejorar tu agilidad."
                });
            }
        }

        // Resta
        if (opStats.resta.total > 0) {
            if (opStats.resta.correct / opStats.resta.total >= 0.8) {
                medals.push({
                    type: "good",
                    short: "Restas dominadas",
                    text: "¡Excelente en restas! Tienes un buen dominio de la resta."
                });
            } else if (opStats.resta.correct / opStats.resta.total < 0.5) {
                const num = getNumeroConMasErrores(s.answers, "resta");
                medals.push({
                    type: "bad",
                    short: "Restas a mejorar",
                    text: num
                        ? `Las restas te costaron trabajo, especialmente con el número ${num}. Practica restas donde intervenga el ${num}.`
                        : "Las restas te costaron trabajo. Repasa especialmente la resta con números cercanos y lleva cuidado con los signos."
                });
            } else {
                medals.push({
                    type: "bad",
                    short: "Restas aceptables",
                    text: "Tus resultados en restas son aceptables, pero puedes mejorar aún más con práctica."
                });
            }
            if (opStats.resta.avg > 7) {
                medals.push({
                    type: "bad",
                    short: "Restas lentas",
                    text: "En restas, intenta agilizar tus respuestas para ganar confianza."
                });
            }
        }

        // Multiplicación
        if (opStats.multi.total > 0) {
            if (opStats.multi.correct / opStats.multi.total >= 0.8) {
                medals.push({
                    type: "good",
                    short: "Multiplicaciones dominadas",
                    text: "¡Muy bien en multiplicaciones! Demuestras buen manejo de las tablas."
                });
            } else if (opStats.multi.correct / opStats.multi.total < 0.5) {
                const tabla = getTablaMultiplicarConMasErrores(s.answers);
                medals.push({
                    type: "bad",
                    short: "Multiplicaciones a mejorar",
                    text: tabla
                        ? `Las multiplicaciones fueron tu mayor reto, especialmente con la tabla del ${tabla}. Te recomiendo repasar y practicar la tabla del ${tabla}.`
                        : "Las multiplicaciones fueron tu mayor reto. Repasa las tablas y practica ejercicios de multiplicación."
                });
            } else {
                medals.push({
                    type: "bad",
                    short: "Multiplicaciones aceptables",
                    text: "Tus resultados en multiplicaciones son aceptables, pero puedes mejorar aún más con práctica."
                });
            }
            if (opStats.multi.avg > 7) {
                medals.push({
                    type: "bad",
                    short: "Multiplicaciones lentas",
                    text: "En multiplicaciones, intenta responder más rápido para mejorar tu agilidad mental."
                });
            }
        }

        // Casos generales y patrones extraños
        const respuestasRapidas = s.answers.filter(a => !a.timeout && a.reaction <= 2).length;
        if (respuestasRapidas >= s.total * 0.7 && s.percent < 40) {
            medals.push({
                type: "bad",
                short: "Respuestas impulsivas",
                text: "Respondiste muy rápido pero la mayoría de tus respuestas fueron incorrectas. Es posible que solo estuvieras presionando OK sin intentar resolver los ejercicios."
            });
        }

        if (s.percent >= 80 && s.avg <= 5 && s.errors <= 2) {
            medals.push({
                type: "good",
                short: "¡Desempeño excelente!",
                text: "¡Excelente desempeño general! Respondiste correctamente la mayoría de los ejercicios y de forma rápida."
            });
        }

        if (s.percent >= 80 && s.avg > 7) {
            medals.push({
                type: "good",
                short: "Precisión alta",
                text: "Tu porcentaje de aciertos es muy bueno, pero podrías intentar responder un poco más rápido para mejorar tu agilidad mental."
            });
        }

        if (s.percent < 50 && s.avg > 7) {
            medals.push({
                type: "bad",
                short: "Precisión y velocidad bajas",
                text: "Tuviste dificultades tanto en precisión como en velocidad. Te recomiendo repasar los temas y practicar para mejorar tu comprensión y rapidez."
            });
        }

        if (s.timeouts >= Math.max(2, Math.round(s.total * 0.3))) {
            medals.push({
                type: "bad",
                short: "Muchos timeouts",
                text: "Dejaste varias preguntas sin responder (timeout). Intenta concentrarte y no dejar preguntas en blanco."
            });
        }

        if (s.maxErrorStreak >= 3) {
            medals.push({
                type: "bad",
                short: "Racha de errores",
                text: "Tuviste varias respuestas incorrectas seguidas. Si te atoras, tómate un momento para pensar antes de responder."
            });
        }

        if (s.maxStreak >= 3) {
            medals.push({
                type: "good",
                short: "Racha de aciertos",
                text: "¡Lograste una buena racha de respuestas correctas! Eso demuestra concentración y dominio."
            });
        }

        if (winner === player) {
            medals.push({
                type: "good",
                short: "¡Ganador!",
                text: "¡Felicidades, ganaste la partida!"
            });
        } else if (winner !== null) {
            medals.push({
                type: "bad",
                short: "No ganaste",
                text: "No ganaste esta vez, pero puedes mejorar practicando más."
            });
        } else {
            medals.push({
                type: "good",
                short: "Empate",
                text: "La partida terminó en empate."
            });
        }

        if (s.percent >= 70 && s.slowest - s.fastest > 10 && s.fastest > 0) {
            medals.push({
                type: "bad",
                short: "Tiempos variables",
                text: "Tus tiempos de respuesta fueron muy variables. Intenta mantener un ritmo constante."
            });
        }

        if (s.percent === 0 && respuestasRapidas === s.total) {
            medals.push({
                type: "bad",
                short: "Sin intentos reales",
                text: "Todas tus respuestas fueron incorrectas y muy rápidas. Es probable que no intentaste resolver los ejercicios."
            });
        }

        if (s.percent === 100 && s.avg <= 3) {
            medals.push({
                type: "good",
                short: "¡Perfecto y rápido!",
                text: "¡Respondiste todo correctamente y muy rápido! Excelente agilidad mental."
            });
        }

        if (s.percent === 100 && s.avg > 7) {
            medals.push({
                type: "good",
                short: "¡Perfecto pero lento!",
                text: "¡Todas tus respuestas fueron correctas! Si mejoras tu velocidad, serás imparable."
            });
        }

        if (s.percent < 50 && s.avg <= 3) {
            medals.push({
                type: "bad",
                short: "Errores por prisa",
                text: "Respondiste muy rápido pero cometiste muchos errores. Tómate un poco más de tiempo para pensar antes de responder."
            });
        }

        if (s.percent < 50 && s.avg > 7) {
            medals.push({
                type: "bad",
                short: "Errores y lento",
                text: "Cometiste varios errores y además tu tiempo de reacción fue alto. Repasa los temas y trata de practicar más."
            });
        }

        if (s.errors > s.timeouts && s.timeouts === 0 && s.percent < 50) {
            medals.push({
                type: "bad",
                short: "Errores pero sin timeouts",
                text: "Cometiste varios errores pero al menos intentaste responder todas las preguntas. Repasa los temas para mejorar tu precisión."
            });
        }

        if (s.timeouts > 0 && s.errors > 0 && s.percent < 50) {
            medals.push({
                type: "bad",
                short: "Errores y timeouts",
                text: "Cometiste varios errores y dejaste preguntas sin responder. Intenta mantener la calma y no dejar preguntas en blanco."
            });
        }

        // Si no hay medallas, dar una genérica
        if (medals.length === 0) {
            if (s.percent >= 70) {
                medals.push({
                    type: "good",
                    short: "Buen desempeño",
                    text: "Buen desempeño general. Puedes seguir practicando para mejorar aún más."
                });
            } else if (s.percent >= 40) {
                medals.push({
                    type: "bad",
                    short: "Puedes mejorar",
                    text: "Puedes mejorar tu precisión y velocidad con más práctica."
                });
            } else {
                medals.push({
                    type: "bad",
                    short: "Requiere práctica",
                    text: "Te recomiendo repasar los temas y practicar más para mejorar tus resultados."
                });
            }
        }

        return medals;
    }

    function renderAnswers(player: 0 | 1) {
        const s = getStats(player);
        if (!s.answers.length) return null;
        // Solo respuestas correctas para fastest/slowest
        const corrects = s.answers.filter(a => a.correct && !a.timeout);
        const fastest = corrects.length ? Math.min(...corrects.map(a => a.reaction)) : null;
        const slowest = corrects.length ? Math.max(...corrects.map(a => a.reaction)) : null;

        return (
            <div className="text-start mt-3">
                <div style={{ fontWeight: "bold" }}>Respuestas:</div>
                <div style={{ fontSize: 14, overflowX: "auto" }}>
                    <Table bordered size="sm" className="mb-0">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Operación</th>
                                <th>Tiempo</th>
                                <th>Resultado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {s.answers.map((a, idx) => (
                                <tr key={idx}>
                                    <td>{a.turn}</td>
                                    <td>{a.operationText}</td>
                                    <td>
                                        {a.timeout ? (
                                            <span>
                                                <FaClock className="text-warning" /> Timeout
                                            </span>
                                        ) : (
                                            <span>
                                                {a.reaction}s{" "}
                                                {a.correct && a.reaction === fastest && (
                                                    <Badge bg="success" className="ms-1">Más rápida</Badge>
                                                )}
                                                {a.correct && a.reaction === slowest && (
                                                    <Badge bg="secondary" className="ms-1">Más lenta</Badge>
                                                )}
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        {a.timeout ? (
                                            <Badge bg="warning" text="dark">Timeout</Badge>
                                        ) : a.correct ? (
                                            <Badge bg="success"><FaCheck /> Correcta</Badge>
                                        ) : (
                                            <Badge bg="danger"><FaTimes /> Incorrecta</Badge>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>
            </div>
        );
    }

    return (
        <Modal show={show} onHide={onClose} centered size="lg">
            <Modal.Header closeButton>
                <Modal.Title>
                    <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontSize: 60, color: "#ffc107", animation: "winner-bounce 1s infinite alternate" }}>
                            {winner !== null && characters && characters[winner] && ICON_MAP_BIG[characters[winner]!] ? (
                                <span style={{ marginRight: 8 }}>{ICON_MAP_BIG[characters[winner]!]}</span>
                            ) : null}
                            <FaTrophy />
                        </span>
                        <span>
                            ¡Fin del juego!
                        </span>
                    </span>
                    <style>{`
                        @keyframes winner-bounce {
                            0% { transform: scale(1);}
                            100% { transform: scale(1.2);}
                        }
                    `}</style>
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="text-center">
                <h3 className="mb-3">
                    {winner === null
                        ? "Empate"
                        : <>
                            {characters && characters[winner] && ICON_MAP[characters[winner]!]
                                ? <span style={{ marginRight: 8, verticalAlign: "middle" }}>{ICON_MAP[characters[winner]!]}</span>
                                : null}
                            ¡Ganó el Jugador {winner + 1}!
                        </>
                    }
                </h3>
                <div className="mb-3">
                    <h5>Estadísticas:</h5>
                    <div className="d-flex justify-content-around">
                        {[0, 1].map((i) => (
                            <div key={i} style={{ minWidth: 120 }}>
                                <div style={{ fontWeight: "bold", color: i === 0 ? "#1976d2" : "#d32f2f", display: "flex", alignItems: "center", gap: 6 }}>
                                    {characters && characters[i] && ICON_MAP[characters[i]!]
                                        ? <span>{ICON_MAP[characters[i]!]}</span>
                                        : <FaUser />}
                                    {characters && characters[i] ? characters[i] : `Jugador ${i + 1}`}
                                </div>
                                <div>
                                    % de aciertos: <b>{getStats(i as 0 | 1).percent}%</b>
                                </div>
                                <div>
                                    Promedio reacción: <b>{getStats(i as 0 | 1).avg} s</b>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Button
                        variant="link"
                        className="mt-2"
                        onClick={() => setShowDetails((v) => !v)}
                        aria-controls="collapse-details"
                        aria-expanded={showDetails}
                    >
                        {showDetails ? <>Ocultar detalles <FaChevronUp /></> : <>Ver detalles <FaChevronDown /></>}
                    </Button>
                    <Collapse in={showDetails}>
                        <div id="collapse-details">
                            <Table bordered size="sm" className="mt-2">
                                <thead>
                                    <tr>
                                        <th></th>
                                        <th>
                                            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                {characters && characters[0] && ICON_MAP[characters[0]!]
                                                    ? <span>{ICON_MAP[characters[0]!]}</span>
                                                    : <FaUser />}
                                                Jugador 1
                                            </span>
                                        </th>
                                        <th>
                                            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                {characters && characters[1] && ICON_MAP[characters[1]!]
                                                    ? <span>{ICON_MAP[characters[1]!]}</span>
                                                    : <FaUser />}
                                                Jugador 2
                                            </span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Turnos jugados</td>
                                        <td>{getStats(0).total}</td>
                                        <td>{getStats(1).total}</td>
                                    </tr>
                                    <tr>
                                        <td>Respuestas correctas</td>
                                        <td>{stats ? stats[0].correct : 0}</td>
                                        <td>{stats ? stats[1].correct : 0}</td>
                                    </tr>
                                    <tr>
                                        <td>Respuestas incorrectas</td>
                                        <td>{getStats(0).errors}</td>
                                        <td>{getStats(1).errors}</td>
                                    </tr>
                                    <tr>
                                        <td>Timeouts</td>
                                        <td>{getStats(0).timeouts}</td>
                                        <td>{getStats(1).timeouts}</td>
                                    </tr>
                                    <tr>
                                        <td>Racha máxima de aciertos</td>
                                        <td>{getStats(0).maxStreak}</td>
                                        <td>{getStats(1).maxStreak}</td>
                                    </tr>
                                    <tr>
                                        <td>Racha máxima de errores</td>
                                        <td>{getStats(0).maxErrorStreak}</td>
                                        <td>{getStats(1).maxErrorStreak}</td>
                                    </tr>
                                    <tr>
                                        <td>Respuesta más rápida (s)</td>
                                        <td>{getStats(0).fastest === 0 ? "-" : getStats(0).fastest}</td>
                                        <td>{getStats(1).fastest === 0 ? "-" : getStats(1).fastest}</td>
                                    </tr>
                                    <tr>
                                        <td>Respuesta más lenta (s)</td>
                                        <td>{getStats(0).slowest === 0 ? "-" : getStats(0).slowest}</td>
                                        <td>{getStats(1).slowest === 0 ? "-" : getStats(1).slowest}</td>
                                    </tr>
                                    <tr>
                                        <td>Daño total causado</td>
                                        <td>{getStats(0).damageDone}</td>
                                        <td>{getStats(1).damageDone}</td>
                                    </tr>
                                    <tr>
                                        <td>Daño total recibido</td>
                                        <td>{getStats(0).damageTaken}</td>
                                        <td>{getStats(1).damageTaken}</td>
                                    </tr>
                                </tbody>
                            </Table>
                            <div className="d-flex flex-wrap justify-content-around">
                                {[0, 1].map((i) => (
                                    <div key={i} style={{ minWidth: 220, maxWidth: 340 }}>
                                        <div style={{ fontWeight: "bold", color: i === 0 ? "#1976d2" : "#d32f2f", display: "flex", alignItems: "center", gap: 6 }}>
                                            {characters && characters[i] && ICON_MAP[characters[i]!]
                                                ? <span>{ICON_MAP[characters[i]!]}</span>
                                                : <FaUser />}
                                            {characters && characters[i] ? characters[i] : `Jugador ${i + 1}`}
                                        </div>
                                        {renderAnswers(i as 0 | 1)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Collapse>
                </div>
                {/* CONCLUSIÓN FINAL */}
                <div className="mt-4">
                    <h5>Medallas y recomendaciones:</h5>
                    <div className="d-flex flex-wrap justify-content-around gap-4">
                        {[0, 1].map((i) => {
                            const medals = getMedals(i as 0 | 1);
                            return (
                                <div key={i} style={{ minWidth: 220, maxWidth: 340, textAlign: "left" }}>
                                    <div style={{ fontWeight: "bold", color: i === 0 ? "#1976d2" : "#d32f2f", display: "flex", alignItems: "center", gap: 6 }}>
                                        {characters && characters[i] && ICON_MAP[characters[i]!]
                                            ? <span>{ICON_MAP[characters[i]!]}</span>
                                            : <FaUser />}
                                        {characters && characters[i] ? characters[i] : `Jugador ${i + 1}`}
                                    </div>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                                        {medals.map((medal, idx) => (
                                            <span
                                                key={idx}
                                                style={{
                                                    cursor: "pointer",
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    background: medal.type === "good" ? "#e8f5e9" : "#ffebee",
                                                    border: `2px solid ${medal.type === "good" ? "#43a047" : "#c62828"}`,
                                                    color: medal.type === "good" ? "#2e7d32" : "#b71c1c",
                                                    borderRadius: 18,
                                                    padding: "4px 12px",
                                                    fontWeight: "bold",
                                                    fontSize: 15,
                                                    boxShadow: medal.type === "good"
                                                        ? "0 2px 8px #43a04722"
                                                        : "0 2px 8px #c6282822"
                                                }}
                                                title="Haz clic para ver detalle"
                                                onClick={() => setSelectedMedal({ player: i, medal })}
                                            >
                                                <FaMedal style={{ marginRight: 6, color: medal.type === "good" ? "#ffd600" : "#d32f2f" }} />
                                                {medal.short}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <Button variant="primary" onClick={onRestart} className="me-2 mt-4">
                    Jugar de nuevo
                </Button>
                <Button variant="secondary" onClick={onClose} className="mt-4">
                    Salir
                </Button>
                {/* Modal para mostrar detalle de medalla */}
                <Modal
                    show={!!selectedMedal}
                    onHide={() => setSelectedMedal(null)}
                    centered
                    size="sm"
                >
                    <Modal.Header closeButton>
                        <Modal.Title>
                            <FaMedal style={{
                                marginRight: 8,
                                color: selectedMedal?.medal.type === "good" ? "#ffd600" : "#d32f2f"
                            }} />
                            {selectedMedal?.medal.short}
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <div style={{ fontSize: 17 }}>
                            {selectedMedal?.medal.text}
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setSelectedMedal(null)}>
                            Cerrar
                        </Button>
                    </Modal.Footer>
                </Modal>
            </Modal.Body>
        </Modal>
    );
}