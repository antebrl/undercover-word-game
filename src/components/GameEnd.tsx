import { useGame } from "../context/GameContext";
import { usePeer } from "../context/PeerContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, User } from "lucide-react";
import { useSound } from "@/context/SoundContext";
import { useEffect } from "react";
import { MrWhiteGuess } from "./shared/MrWhiteGuess";
import { useTranslation } from "react-i18next";

export const GameEnd = () => {
  const { gameState, resetGame, setGameState } = useGame();
  const { peer, isHost } = usePeer();
  const { playSound } = useSound();
  const { t } = useTranslation();

  const currentPlayer = gameState.players.find(p => p.id === peer?.id);

  useEffect(() => {
    // Update scores for winners
    const updatedPlayers = gameState.players.map(player => {
      const currentScore = player.score || 0;
      let pointsToAdd = 0;

      if (gameState.winner === "civilian" && player.role === "civilian") {
        pointsToAdd = 2;
      } else if (gameState.winner === "undercover" && player.role === "undercover") {
        pointsToAdd = 10;
      } else if (gameState.winner === "mrwhite" && player.role === "mrwhite") {
        pointsToAdd = 6;
      } else if (gameState.winner === "infiltrators") {
        if (player.role === "undercover") pointsToAdd = 10;
        if (player.role === "mrwhite") pointsToAdd = 6;
      }

      return {
        ...player,
        score: currentScore + pointsToAdd,
      };
    });

    setGameState({ ...gameState, players: updatedPlayers });

    switch (gameState.winner) {
      case "civilian":
        playSound("/sounds/civilians-win.mp3");
        break;
      case "infiltrators":
      case "undercover":
        playSound("/sounds/undercover-win.mp3");
        break;
      case "mrwhite":
        playSound("/sounds/mrwhite-win.mp3");
        break;
    }
  }, []);
  
  const getWinnerPlayers = () => {
    if(gameState.winner === "infiltrators") {
      return gameState.players.filter(p => p.role === "undercover" || p.role === "mrwhite");
    }
    return gameState.players.filter(p => p.role === gameState.winner);
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-6 animate-fade-in">
      <div className="text-center space-y-4">
        {gameState.winner === currentPlayer?.role ? (
          <Trophy className="w-16 h-16 text-yellow-400 mx-auto" />
        ) : (
          <User className="w-16 h-16 text-red-400 mx-auto" />
        )}
        <h1 className="text-4xl font-bold text-white text-center">{t("gameEnd.title")}</h1>
      </div>

      <MrWhiteGuess />

      <Card className="p-6 glass-morphism">
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white">
              {gameState.winner === "civilian" && t("gameEnd.civilianWin")}
              {gameState.winner === "undercover" && t("gameEnd.undercoverWin")}
              {gameState.winner === "mrwhite" && t("gameEnd.mrWhiteWin")}
              {gameState.winner === "infiltrators" && t("gameEnd.infiltratorsWin")}
            </h2>
          </div>

          <div className="space-y-3">
            {getWinnerPlayers().map((player) => (
                <div 
                key={player.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/5"
                >
                {player.isEliminated ? (
                  <User className="w-5 h-5 text-gray-500" />
                ) : (
                  <User className="w-5 h-5 text-primary" />
                )}
                <div>
                  <p className="text-lg block max-w-[250px] truncate text-white">{player.name}</p>
                  <p className="text-sm text-white/70">
                  {t(`roles.${player.role}`)}{player.word && ` - ${t("gameEnd.word")} ${player.word}`}
                  </p>
                </div>
                </div>
            ))}
          </div>
        </div>
      </Card>

      {isHost && (
        <Button
          onClick={resetGame}
          size="lg"
          className="w-full bg-primary hover:bg-primary/90 text-lg font-medium transition-colors duration-200"
        >
          {t("gameEnd.startNewRound")}
        </Button>
      )}
    </div>
  );
};
