// app/Videojuego/page.tsx
"use client";
import { useState } from "react";
import GameConfig from "./_components/GameConfig";
import GameBoard from "./GameBoard";
import SequenceVsGameBoard from "./SequenceVsGameBoard";
import CompareVsGameBoard from "./CompareVsGameBoard";
import HowManyVsGameBoard from "./HowManyVsGameBoard";
import GeometricVsGameBoard from "./GeometricVsGameBoard";
import RomanVsGameBoard from "./RomanVsGameBoard";
import FractionVsGameBoard from "./FractionVsGameBoard"; // <--- NUEVO
import CharacterSelect from "./_components/CharacterSelect";
import Container from "react-bootstrap/Container";
import { Button, Card } from "react-bootstrap";
import { FaPlay, FaTrafficLight, FaCat, FaDog, FaDragon, FaHippo, FaFrog, FaFish, FaSpider } from "react-icons/fa";
import { GiShamblingZombie } from "react-icons/gi";

const ICON_MAP: Record<string, React.ReactElement> = {
    Gato: <FaCat size={60} />,
    Perro: <FaDog size={60} />,
    Dragón: <FaDragon size={60} />,
    Hipopótamo: <FaHippo size={60} />,
    Rana: <FaFrog size={60} />,
    Pez: <FaFish size={60} />,
    Araña: <FaSpider size={60} />,
    Zombie: <GiShamblingZombie size={60} />,
};

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

type ConfigState = {
    modes: Modes;
    gameType: GameType;
    howManyModes?: HowManyModes;
};

export default function MathVsGamePage() {
    const [config, setConfig] = useState<ConfigState | null>(null);
    const [showReady, setShowReady] = useState(false);
    const [characters, setCharacters] = useState<[string | null, string | null]>([null, null]);

    function handleStart(config: ConfigState) {
        setConfig(config);
    }

    function handleSelectCharacters(icons: [string, string]) {
        setCharacters(icons);
        setShowReady(true);
    }

    function handleBeginGame() {
        setShowReady(false);
    }

    function handleRestart() {
        setConfig(null);
        setShowReady(false);
        setCharacters([null, null]);
    }

    return (
        <Container className="py-4">
            {!config ? (
                <GameConfig onStart={handleStart} />
            ) : characters[0] === null || characters[1] === null ? (
                <CharacterSelect onSelect={handleSelectCharacters} />
            ) : showReady ? (
                <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: 350 }}>
                    <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: 350 }}>
                        <Card className="shadow-lg p-4 w-100" style={{ maxWidth: 400 }}>
                            <div className="d-flex flex-column align-items-center">
                                {characters[0] && ICON_MAP[characters[0]]}
                                <div className="fw-bold mb-2 text-primary" style={{ fontSize: 32, letterSpacing: 1 }}>
                                    ¡Jugador 1 listo!
                                </div>
                                <div className="mb-4 text-secondary d-flex align-items-center gap-2" style={{ fontSize: 20 }}>
                                    <FaTrafficLight className="text-warning" size={32} />
                                    <span>¡Preparados!</span>
                                </div>
                                <Button size="lg" variant="success" onClick={handleBeginGame} className="px-4 py-2 fw-bold" style={{ fontSize: 22 }}>
                                    <FaPlay className="me-2 mb-1" />
                                    Empezar
                                </Button>
                            </div>
                        </Card>
                    </div>
                </div>
            ) : (
                config.gameType === "operations" ? (
                    <GameBoard config={config} onRestart={handleRestart} characters={characters} />
                ) : config.gameType === "sequences" ? (
                    <SequenceVsGameBoard onRestart={handleRestart} characters={characters} />
                ) : config.gameType === "compare" ? (
                    <CompareVsGameBoard onRestart={handleRestart} characters={characters} />
                ) : config.gameType === "howmany" ? (
                    <HowManyVsGameBoard
                        onRestart={handleRestart}
                        characters={characters}
                        howManyModes={config.howManyModes}
                    />
                ) : config.gameType === "romans" ? (
                    <RomanVsGameBoard onRestart={handleRestart} characters={characters} />
                ) : config.gameType === "fractions" ? (
                    <FractionVsGameBoard onRestart={handleRestart} characters={characters} />
                ) : (
                    <GeometricVsGameBoard
                        onRestart={handleRestart}
                        characters={characters}
                    />
                )
            )}
        </Container>
    );
}