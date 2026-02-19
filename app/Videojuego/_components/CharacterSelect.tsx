// app/TESTING/MathVsGame/CharacterSelect.tsx
"use client";
import { useState } from "react";
import { FaCat, FaDog, FaDragon, FaHippo, FaFrog, FaFish, FaSpider } from "react-icons/fa";
import { GiShamblingZombie } from "react-icons/gi";
import { Button, Card } from "react-bootstrap";

const ICONS = [
    { name: "Gato", icon: FaCat },
    { name: "Perro", icon: FaDog },
    { name: "Dragón", icon: FaDragon },
    { name: "Hipopótamo", icon: FaHippo },
    { name: "Rana", icon: FaFrog },
    { name: "Pez", icon: FaFish },
    { name: "Araña", icon: FaSpider },
    { name: "Zombie", icon: GiShamblingZombie },
];

export default function CharacterSelect({
    onSelect,
    initialCharacters = [null, null],
}: {
    onSelect: (icons: [string, string]) => void;
    initialCharacters?: [string | null, string | null];
}) {
    const [selected, setSelected] = useState<[string | null, string | null]>(initialCharacters);

    function handleSelect(player: 0 | 1, name: string) {
        setSelected((prev) => {
            const arr: [string | null, string | null] = [...prev];
            arr[player] = name;
            return arr;
        });
    }

    const bothSelected = selected[0] && selected[1];

    return (
        <Card className="shadow-lg p-4 w-100 mb-4">
            <div className="fw-bold mb-3 text-center" style={{ fontSize: 26 }}>
                Elijan su personaje
            </div>
            {/* CAMBIO: vertical */}
            <div className="d-flex flex-column align-items-center gap-4">
                {[0, 1].map((player) => (
                    <div key={player} className="d-flex flex-column align-items-center">
                        <div className={`mb-2 fw-bold ${player === 0 ? "text-primary" : "text-danger"}`} style={{ fontSize: 20 }}>
                            Jugador {player + 1}
                        </div>
                        <div className="d-flex flex-wrap justify-content-center gap-2 mb-3">
                            {ICONS.map(({ name, icon: Icon }) => (
                                <Button
                                    key={name}
                                    variant={selected[player] === name ? (player === 0 ? "primary" : "danger") : "outline-secondary"}
                                    className="d-flex flex-column align-items-center justify-content-center"
                                    style={{
                                        width: 60,
                                        height: 60,
                                        fontSize: 28,
                                        borderWidth: selected[player] === name ? 3 : 1,
                                        transition: "transform 0.2s",
                                        transform: selected[player] === name ? "scale(1.15)" : "scale(1)",
                                    }}
                                    onClick={() => handleSelect(player as 0 | 1, name)}
                                >
                                    <Icon />
                                    <span style={{ fontSize: 10 }}>{name}</span>
                                </Button>
                            ))}
                        </div>
                        <div className="mb-2" style={{ minHeight: 24 }}>
                            {selected[player] && (
                                <span className="badge bg-success" style={{ fontSize: 14 }}>
                                    {selected[player]}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            <div className="text-center mt-3">
                <Button
                    variant="success"
                    size="lg"
                    disabled={!bothSelected}
                    onClick={() => bothSelected && onSelect([selected[0]!, selected[1]!])}
                >
                    Elegir
                </Button>
            </div>
        </Card>
    );
}