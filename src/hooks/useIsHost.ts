import { usePeer } from "@/context/PeerContext";
import { useGame } from "@/context/GameContext";

/**
 * Returns true if this client should act as "host" - either they ARE the PeerJS host
 * or the game is running in offline mode (single-device, no networking).
 */
export const useIsHost = (): boolean => {
  const { isHost } = usePeer();
  const { gameState } = useGame();
  return isHost || gameState.gameMode === "offline";
};
