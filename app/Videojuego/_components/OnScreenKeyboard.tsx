"use client";
import { Button } from "react-bootstrap";

const keys = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["C", "0", "←"],
    ["OK"]
];

export default function OnScreenKeyboard({
    onNumber,
    onBackspace,
    onClear,
    onEnter,
    disabled
}: {
    onNumber: (n: string) => void,
    onBackspace: () => void,
    onClear: () => void,
    onEnter: () => void,
    disabled?: boolean
}) {
    return (
        <div style={{ display: "inline-block" }}>
            {keys.map((row, i) => (
                <div key={i} className="mb-2 d-flex justify-content-center">
                    {row.map((k) => (
                        <Button
                            key={k}
                            variant={
                                k === "OK"
                                    ? "success"
                                    : k === "C"
                                    ? "danger"
                                    : "secondary"
                            }
                            className="mx-1"
                            style={{
                                width: 60,
                                height: 48,
                                fontSize: k === "OK" ? 22 : 22,
                                fontWeight: k === "OK" ? "bold" : undefined
                            }}
                            onClick={() => {
                                if (disabled) return;
                                if (k === "←") onBackspace();
                                else if (k === "C") onClear();
                                else if (k === "OK") onEnter();
                                else onNumber(k);
                            }}
                            disabled={disabled}
                        >
                            {k}
                        </Button>
                    ))}
                </div>
            ))}
        </div>
    );
}