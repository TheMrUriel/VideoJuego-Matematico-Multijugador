"use client";
import { useState, useEffect } from "react";
import { Form, Button, Row, Col, Card } from "react-bootstrap";
import {
    FaPlus, FaMinus, FaGamepad, FaListOl, FaGreaterThan, FaEye, FaTimes, FaMoon, FaSun, FaCube
} from "react-icons/fa";

type Modes = {
    suma: boolean;
    resta: boolean;
    multi: boolean;
};

type HowManyModes = {
    suma: boolean;
    resta: boolean;
    contar: boolean;
};

type GameType =
    | "operations"
    | "sequences"
    | "compare"
    | "howmany"
    | "geometricas"
    | "romans"
    | "fractions";

type GameConfigProps = {
    onStart: (config: {
        modes: Modes,
        gameType: GameType,
        howManyModes?: HowManyModes
    }) => void;
};

export default function GameConfig({ onStart }: GameConfigProps) {
    const [modes, setModes] = useState<Modes>({ suma: true, resta: false, multi: false });
    const [howManyModes, setHowManyModes] = useState<HowManyModes>({ suma: true, resta: false, contar: false });
    const [gameType, setGameType] = useState<GameType | null>(null);
    const [isDark, setIsDark] = useState(false);

    // Sincroniza el estado con el atributo del body
    useEffect(() => {
        if (typeof document !== "undefined") {
            const updateTheme = () => {
                setIsDark(document.body.getAttribute("data-bs-theme") === "dark");
            };
            updateTheme();
            const observer = new MutationObserver(updateTheme);
            observer.observe(document.body, { attributes: true, attributeFilter: ["data-bs-theme"] });
            return () => observer.disconnect();
        }
    }, []);

    // Cambia el modo claro/oscuro
    function toggleTheme() {
        if (typeof document !== "undefined") {
            const isCurrentlyDark = document.body.getAttribute("data-bs-theme") === "dark";
            document.body.setAttribute("data-bs-theme", isCurrentlyDark ? "light" : "dark");
            setIsDark(!isCurrentlyDark);
        }
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        setModes({ ...modes, [e.target.name]: e.target.checked });
    }

    function handleHowManyChange(e: React.ChangeEvent<HTMLInputElement>) {
        setHowManyModes({ ...howManyModes, [e.target.name]: e.target.checked });
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!gameType) return;
        if (gameType === "operations" && !modes.suma && !modes.resta && !modes.multi) return;
        if (gameType === "howmany" && !howManyModes.suma && !howManyModes.resta && !howManyModes.contar) return;
        // No requiere subconfiguración para geometricas, romans, fractions, sequences, compare
        onStart({ modes, gameType, howManyModes });
    }

    // Colores para submenús
    const sumaBg = modes.suma ? (isDark ? "#225c2a" : "#e8f5e9") : (isDark ? "#222" : "#fff");
    const restaBg = modes.resta ? (isDark ? "#5c4a22" : "#fffde7") : (isDark ? "#222" : "#fff");
    const multiBg = modes.multi ? (isDark ? "#5c2222" : "#ffebee") : (isDark ? "#222" : "#fff");

    // Opciones de modo de juego
    const gameModes = [
        {
            key: "operations",
            icon: <FaGamepad className="text-primary" />,
            label: "Operaciones VS",
            description: "Compite resolviendo sumas, restas y multiplicaciones."
        },
        {
            key: "sequences",
            icon: <FaListOl className="text-warning" />,
            label: "Secuencias VS",
            description: "Adivina el número que falta o sigue en la secuencia."
        },
        {
            key: "compare",
            icon: <FaGreaterThan className="text-danger" />,
            label: "¿Quién es mayor? VS",
            description: "Responde si un número es mayor, menor o igual, o verdadero/falso."
        },
        {
            key: "howmany",
            icon: <FaPlus className="text-success" />,
            label: "¿Cuántos hay? VS",
            description: "Cuenta, suma o resta iconos en pantalla."
        },
        {
            key: "geometricas",
            icon: <FaCube className="text-info" />,
            label: "Figuras Geométricas VS",
            description: "Aprende y compite con preguntas de figuras geométricas."
        },
        {
            key: "romans",
            icon: <span style={{ fontWeight: "bold", fontSize: 22 }}>XIV</span>,
            label: "Números Romanos VS",
            description: "Convierte entre números arábigos y romanos, y viceversa."
        },
        {
            key: "fractions",
            icon: <span style={{ fontWeight: "bold", fontSize: 22 }}>⅓</span>,
            label: "Fracciones VS",
            description: "Aprende y compite con fracciones sencillas."
        },
    ];

    // Subconfiguraciones de operaciones
    const subConfigs = [
        {
            key: "suma",
            icon: <FaPlus className="text-success" />,
            label: "Suma",
            checked: modes.suma,
            bg: sumaBg
        },
        {
            key: "resta",
            icon: <FaMinus className="text-warning" />,
            label: "Resta",
            checked: modes.resta,
            bg: restaBg
        },
        {
            key: "multi",
            icon: <FaTimes className="text-danger" />,
            label: "Multiplicación",
            checked: modes.multi,
            bg: multiBg
        }
    ];

    // Subconfiguraciones de "¿Cuántos hay?"
    const howManySubConfigs = [
        {
            key: "suma",
            icon: <FaPlus className="text-success" />,
            label: "Suma visual",
            checked: howManyModes.suma,
            bg: howManyModes.suma ? (isDark ? "#225c2a" : "#e8f5e9") : (isDark ? "#222" : "#fff"),
            border: howManyModes.suma ? "2px solid #43a047" : "2px solid #ccc",
            boxShadow: howManyModes.suma ? "0 2px 8px #43a04722" : undefined
        },
        {
            key: "resta",
            icon: <FaMinus className="text-warning" />,
            label: "Resta visual",
            checked: howManyModes.resta,
            bg: howManyModes.resta ? (isDark ? "#5c4a22" : "#fffde7") : (isDark ? "#222" : "#fff"),
            border: howManyModes.resta ? "2px solid #fbc02d" : "2px solid #ccc",
            boxShadow: howManyModes.resta ? "0 2px 8px #fbc02d22" : undefined
        },
        {
            key: "contar",
            icon: <FaEye className="text-info" />,
            label: "Contar",
            checked: howManyModes.contar,
            bg: howManyModes.contar ? (isDark ? "#0d3552" : "#e3f2fd") : (isDark ? "#222" : "#fff"),
            border: howManyModes.contar ? "2px solid #0288d1" : "2px solid #ccc",
            boxShadow: howManyModes.contar ? "0 2px 8px #0288d122" : undefined
        }
    ];

    return (
        <Card className={`p-4 shadow-lg mx-auto ${isDark ? "bg-dark text-light" : ""}`} style={{ maxWidth: 420 }}>
            {/* Botón para alternar modo claro/oscuro */}
            <div className="d-flex justify-content-end mb-2">
                <Button
                    variant={isDark ? "light" : "dark"}
                    size="sm"
                    onClick={toggleTheme}
                    aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
                >
                    {isDark ? <FaSun className="me-1" /> : <FaMoon className="me-1" />}
                    {isDark ? "Claro" : "Oscuro"}
                </Button>
            </div>
            <Form onSubmit={handleSubmit}>
                <h4 className="mb-4 text-center fw-bold">
                    <FaGamepad className="me-2" size={28} />
                    Elige el modo de juego
                </h4>
                <Form.Group as={Row} className="mb-3">
                    <Col sm={12} className="d-flex flex-column gap-3">
                        {gameModes.map(mode => (
                            <div
                                key={mode.key}
                                onClick={() => setGameType(mode.key as GameType)}
                                style={{
                                    cursor: "pointer",
                                    background: gameType === mode.key ? (isDark ? "#222a" : "#e3f2fd") : (isDark ? "#222" : "#fff"),
                                    border: gameType === mode.key ? "2px solid #1976d2" : "2px solid #ccc",
                                    borderRadius: 12,
                                    padding: "12px 16px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 16,
                                    boxShadow: gameType === mode.key ? "0 2px 8px #1976d222" : undefined,
                                    transition: "background 0.2s, border 0.2s"
                                }}
                                tabIndex={0}
                                onKeyDown={e => {
                                    if (e.key === "Enter" || e.key === " ") setGameType(mode.key as GameType);
                                }}
                            >
                                <Form.Check
                                    type="radio"
                                    id={`mode-${mode.key}`}
                                    name="gameType"
                                    checked={gameType === mode.key}
                                    onChange={() => setGameType(mode.key as GameType)}
                                    style={{ marginRight: 8 }}
                                />
                                <div>
                                    <div className="d-flex align-items-center gap-2 fs-5 fw-bold">
                                        {mode.icon}
                                        {mode.label}
                                    </div>
                                    <div className="text-muted" style={{ fontSize: 14 }}>
                                        {mode.description}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </Col>
                </Form.Group>
                {gameType === "operations" && (
                    <Form.Group as={Row} className="mb-3">
                        <Col sm={12} className="d-flex flex-column gap-3">
                            {subConfigs.map(sub => (
                                <div
                                    key={sub.key}
                                    onClick={() => setModes({ ...modes, [sub.key]: !modes[sub.key as keyof Modes] })}
                                    style={{
                                        cursor: "pointer",
                                        background: sub.checked ? sub.bg : (isDark ? "#222" : "#fff"),
                                        border: sub.checked ? "2px solid #43a047" : "2px solid #ccc",
                                        borderRadius: 12,
                                        padding: "10px 16px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 16,
                                        boxShadow: sub.checked ? "0 2px 8px #43a04722" : undefined,
                                        transition: "background 0.2s, border 0.2s"
                                    }}
                                    tabIndex={0}
                                    onKeyDown={e => {
                                        if (e.key === "Enter" || e.key === " ") setModes({ ...modes, [sub.key]: !modes[sub.key as keyof Modes] });
                                    }}
                                >
                                    <Form.Check
                                        type="checkbox"
                                        id={sub.key}
                                        name={sub.key}
                                        checked={sub.checked}
                                        onChange={handleChange}
                                        style={{ marginRight: 8 }}
                                    />
                                    <div className="d-flex align-items-center gap-2 fs-5">
                                        {sub.icon}
                                        {sub.label}
                                    </div>
                                </div>
                            ))}
                        </Col>
                    </Form.Group>
                )}
                {gameType === "howmany" && (
                    <Form.Group as={Row} className="mb-3">
                        <Col sm={12} className="d-flex flex-column gap-3">
                            {howManySubConfigs.map(sub => (
                                <div
                                    key={sub.key}
                                    onClick={() => setHowManyModes({ ...howManyModes, [sub.key]: !howManyModes[sub.key as keyof HowManyModes] })}
                                    style={{
                                        cursor: "pointer",
                                        background: sub.bg,
                                        border: sub.border,
                                        borderRadius: 12,
                                        padding: "10px 16px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 16,
                                        boxShadow: sub.boxShadow,
                                        transition: "background 0.2s, border 0.2s"
                                    }}
                                    tabIndex={0}
                                    onKeyDown={e => {
                                        if (e.key === "Enter" || e.key === " ") setHowManyModes({ ...howManyModes, [sub.key]: !howManyModes[sub.key as keyof HowManyModes] });
                                    }}
                                >
                                    <Form.Check
                                        type="checkbox"
                                        id={sub.key}
                                        name={sub.key}
                                        checked={sub.checked}
                                        onChange={handleHowManyChange}
                                        style={{ marginRight: 8 }}
                                    />
                                    <div className="d-flex align-items-center gap-2 fs-5">
                                        {sub.icon}
                                        {sub.label}
                                    </div>
                                </div>
                            ))}
                        </Col>
                    </Form.Group>
                )}
                <div className="text-center mt-4">
                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        className="px-4 fw-bold"
                        disabled={
                            !gameType ||
                            (gameType === "operations" && !modes.suma && !modes.resta && !modes.multi) ||
                            (gameType === "howmany" && !howManyModes.suma && !howManyModes.resta && !howManyModes.contar)
                        }
                    >
                        ¡Comenzar!
                    </Button>
                </div>
            </Form>
        </Card>
    );
}