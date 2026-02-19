// app/Videojuego/_components/LifeBar.tsx
"use client";
import React from "react";
import ProgressBar from "react-bootstrap/ProgressBar";

type Player = {
    name: string;
    life: number;
};

type LifeBarProps = {
    player: Player;
    active: boolean;
    icon?: React.ReactNode;
    animation?: "damage" | "attack" | null;
    dialog?: string | null;
};

export default function LifeBar({ player, active, icon, animation, dialog }: LifeBarProps) {
    // CAMBIO: Nueva vida máxima
    const MAX_LIFE = 300;

    return (
        <div>
            <div className="fw-bold mb-1 d-flex align-items-center gap-2">
                {icon}
                {player.name} {active && <span className="badge bg-success">Tu turno</span>}
            </div>
            <ProgressBar
                now={player.life}
                max={MAX_LIFE}
                variant={player.life > MAX_LIFE * 0.6 ? "success" : player.life > MAX_LIFE * 0.3 ? "warning" : "danger"}
                label={`${player.life}/${MAX_LIFE}`}
                style={{ height: 24, fontSize: 16 }}
                animated={active}
            />
            <div className="d-flex flex-column align-items-center mt-2" style={{ minHeight: 90 }}>
                {dialog && (
                    <div className="comic-bubble mt-2">
                        {dialog}
                        <span className="comic-bubble-arrow" />
                    </div>
                )}
                <span
                    className={`character-giant ${animation ? `character-${animation}` : ""}`}
                    style={{
                        fontSize: 64,
                        transition: "transform 0.2s",
                        filter: active
                            ? "drop-shadow(0 0 8px #00e676) drop-shadow(0 0 16px #00e67688) drop-shadow(0 0 32px #00e67644)"
                            : undefined,
                    }}
                >
                    {icon}
                </span>
            </div>
            <style jsx>{`
                .character-giant.character-damage {
                    animation: shake 0.5s;
                }
                .character-giant.character-attack {
                    animation: attack-bounce 0.5s;
                }
                @keyframes shake {
                    0% { transform: translateX(0); }
                    20% { transform: translateX(-12px); }
                    40% { transform: translateX(12px); }
                    60% { transform: translateX(-12px); }
                    80% { transform: translateX(12px); }
                    100% { transform: translateX(0); }
                }
                @keyframes attack-bounce {
                    0% { transform: scale(1);}
                    50% { transform: scale(1.3);}
                    100% { transform: scale(1);}
                }
                .comic-bubble {
                    position: relative;
                    background: #fff;
                    border: 3px solid #222;
                    border-radius: 18px;
                    padding: 8px 18px;
                    font-size: 1.3rem;
                    font-weight: bold;
                    color: #222;
                    box-shadow: 2px 4px 8px #0002;
                    display: inline-block;
                    margin-top: 8px;
                    z-index: 2;
                }
                .comic-bubble-arrow {
                    position: absolute;
                    left: 30px;
                    top: 100%;
                    width: 0;
                    height: 0;
                    border-left: 12px solid transparent;
                    border-right: 12px solid transparent;
                    border-top: 16px solid #fff;
                    filter: drop-shadow(0px -2px 0px #222);
                    z-index: 1;
                }
            `}</style>
        </div>
    );
}