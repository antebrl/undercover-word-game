import { useGame } from "../context/GameContext";
import { usePeer } from "../context/PeerContext";
import { Button } from "@/components/ui/button";
import { UserX } from "lucide-react";
import { PlayerList } from "./shared/PlayerList";
import { useTranslation } from "react-i18next";

export const GameLobby = () => {
  const { gameState, startGame } = useGame();
  const { isHost } = usePeer();
  const { t } = useTranslation();

  const handleStartNextRound = () => {
    startGame();
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-8 animate-fade-in">
      <h1 className="text-4xl font-bold text-white mb-8 text-center">{t("gameLobby.title")}</h1>

      <PlayerList
        players={gameState.players}
        showEliminated={true}
        lastEliminatedId={gameState.lastEliminatedId}
      />

      {isHost && (
        <Button
          onClick={handleStartNextRound}
          size="lg"
          className="w-full bg-primary hover:bg-primary/90 text-lg font-medium transition-colors duration-200"
        >
          {t("gameLobby.startNextRound", { count: gameState.players.filter(player => !player.isEliminated).length })}
        </Button>
      )}
    </div>
  );
};