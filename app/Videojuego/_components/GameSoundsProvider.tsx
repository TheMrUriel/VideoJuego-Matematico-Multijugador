import React, { createContext, useRef } from "react";

const SOUND_MAP: Record<string, string> = {
  damage: "/sounds/damage.mp3",
  win1: "/sounds/win1.mp3",
  win2: "/sounds/win2.mp3",
  select: "/sounds/select.mp3",
  timer: "/sounds/timer.mp3",
  // Agrega más sonidos aquí
};

type GameSoundsContextType = {
  play: (sound: keyof typeof SOUND_MAP) => void;
  stop: (sound: keyof typeof SOUND_MAP) => void;
  stopAll: () => void;
};

export const GameSoundsContext = createContext<GameSoundsContextType>({
  play: () => {},
  stop: () => {},
  stopAll: () => {},
});

export function GameSoundsProvider({ children }: { children: React.ReactNode }) {
  // refs para los audios
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});

  // Inicializa los audios solo una vez
  React.useEffect(() => {
    Object.entries(SOUND_MAP).forEach(([key, src]) => {
      const audio = new Audio(src);
      audioRefs.current[key] = audio;
    });

    // Captura el valor actual del ref en una variable local
    const currentAudioRefs = audioRefs.current;

    return () => {
      Object.values(currentAudioRefs).forEach((audio) => {
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
      });
    };
  }, []);

  // Función para reproducir un sonido
  function play(sound: keyof typeof SOUND_MAP) {
    const audio = audioRefs.current[sound];
    if (audio) {
      audio.currentTime = 0;
      audio.play();
    }
  }

  // Función para detener un sonido
  function stop(sound: keyof typeof SOUND_MAP) {
    const audio = audioRefs.current[sound];
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }

  // Detener todos los sonidos
  function stopAll() {
    Object.values(audioRefs.current).forEach((audio) => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
  }

  return (
    <GameSoundsContext.Provider value={{ play, stop, stopAll }}>
      {children}
    </GameSoundsContext.Provider>
  );
}