import { useContext } from "react";
import { GameSoundsContext } from "./GameSoundsProvider";

// Hook para acceder a los sonidos
export default function useGameSounds() {
  return useContext(GameSoundsContext);
}