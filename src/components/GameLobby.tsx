import { useGame } from "../context/GameContext";
import { usePeer } from "../context/PeerContext";
import { Button } from "@/components/ui/button";
import { PlayerList } from "./shared/PlayerList";
import { useTranslation } from "react-i18next";
import { useIsHost } from "@/hooks/useIsHost";

export const GameLobby = () => {
  const { gameState, startGame } = useGame();
  const { t } = useTranslation();
  const isHost = useIsHost();

  return (
    <div className="max-w-md mx-auto p-6 space-y-8 animate-fade-in">
      <h1 className="text-4xl font-bold text-white text-center">{t("gameLobby.title")}</h1>

      <PlayerList
        players={gameState.players}
        showEliminated
        lastEliminatedId={gameState.lastEliminatedId}
        showScores={gameState.players.some(p => (p.score ?? 0) > 0)}
      />

      {isHost && (
        <Button
          onClick={startGame}
          size="lg"
          className="w-full bg-primary hover:bg-primary/90 text-lg font-medium"
        >
          {t("gameLobby.startNextRound", { count: gameState.players.filter(p => !p.isEliminated).length })}
        </Button>
      )}
    </div>
  );
};
