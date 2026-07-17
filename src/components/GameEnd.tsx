import { useGame } from "../context/GameContext";
import { usePeer } from "../context/PeerContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, User } from "lucide-react";
import { useSound } from "@/context/SoundContext";
import { useEffect } from "react";
import { MrWhiteGuess } from "./shared/MrWhiteGuess";
import { SpecialRoleBadge } from "./shared/SpecialRoleBadge";
import { useTranslation } from "react-i18next";
import { useIsHost } from "@/hooks/useIsHost";

export const GameEnd = () => {
  const { gameState, resetGame, setGameState } = useGame();
  const { peer } = usePeer();
  const { playSound } = useSound();
  const { t } = useTranslation();
  const isHost = useIsHost();
  const isOffline = gameState.gameMode === "offline";

  const currentPlayer = isOffline ? undefined : gameState.players.find(p => p.id === peer?.id);
  const isWinner = !currentPlayer || gameState.winner === currentPlayer.role ||
    (gameState.winner === "infiltrators" && (currentPlayer.role === "undercover" || currentPlayer.role === "mrwhite"));

  useEffect(() => {
    // Award round win points (on top of any special-role end-game scoring already applied)
    const updated = gameState.players.map(p => {
      let bonus = 0;
      if (gameState.winner === "civilian" && p.role === "civilian") bonus = 2;
      else if (gameState.winner === "undercover" && p.role === "undercover") bonus = 10;
      else if (gameState.winner === "mrwhite" && p.role === "mrwhite") bonus = 6;
      else if (gameState.winner === "infiltrators") {
        if (p.role === "undercover") bonus = 10;
        if (p.role === "mrwhite") bonus = 6;
      }
      return { ...p, score: (p.score ?? 0) + bonus };
    });
    setGameState(prev => ({ ...prev, players: updated }));

    switch (gameState.winner) {
      case "civilian": playSound("/sounds/civilians-win.mp3"); break;
      case "infiltrators":
      case "undercover": playSound("/sounds/undercover-win.mp3"); break;
      case "mrwhite": playSound("/sounds/mrwhite-win.mp3"); break;
    }
  }, []);

  const winners = gameState.winner === "infiltrators"
    ? gameState.players.filter(p => p.role === "undercover" || p.role === "mrwhite")
    : gameState.players.filter(p => p.role === gameState.winner);

  return (
    <div className="max-w-md mx-auto p-6 space-y-6 animate-fade-in">
      <div className="text-center space-y-4">
        {isWinner
          ? <Trophy className="w-16 h-16 text-yellow-400 mx-auto" />
          : <User className="w-16 h-16 text-red-400 mx-auto" />}
        <h1 className="text-4xl font-bold text-white">{t("gameEnd.title")}</h1>
      </div>

      <MrWhiteGuess />

      {/* Winner announcement */}
      <Card className="p-6 glass-morphism space-y-4">
        <h2 className="text-2xl font-bold text-white text-center">
          {gameState.winner === "civilian" && t("gameEnd.civilianWin")}
          {gameState.winner === "undercover" && t("gameEnd.undercoverWin")}
          {gameState.winner === "mrwhite" && t("gameEnd.mrWhiteWin")}
          {gameState.winner === "infiltrators" && t("gameEnd.infiltratorsWin")}
        </h2>
        <div className="space-y-2">
          {winners.map(p => (
            <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
              <User className={`w-5 h-5 flex-shrink-0 ${p.isEliminated ? "text-gray-500" : "text-primary"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-white truncate">{p.name}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-white/60">{t(`roles.${p.role}`)}{p.word && ` - ${p.word}`}</span>
                  {p.specialRole && p.specialRole !== "none" && <SpecialRoleBadge role={p.specialRole} showLabel size="sm" />}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Full player breakdown */}
      <Card className="p-6 glass-morphism space-y-3">
        <h3 className="text-base font-semibold text-white">{t("gameEnd.allPlayers")}</h3>
        {gameState.players.filter(p => p.role !== "spectator").map(p => (
          <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
            <div className="min-w-0 flex-1">
              <p className="text-white text-sm font-medium truncate">{p.name}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-white/50 text-xs">{t(`roles.${p.role}`)}</span>
                {p.specialRole && p.specialRole !== "none" && <SpecialRoleBadge role={p.specialRole} showLabel size="sm" />}
              </div>
            </div>
            <div className="text-right flex-shrink-0 ml-3">
              <span className="text-white font-bold">{p.score ?? 0}</span>
              <span className="text-white/50 text-xs ml-1">{t("playerList.points")}</span>
            </div>
          </div>
        ))}
      </Card>

      {isHost && (
        <Button onClick={resetGame} size="lg" className="w-full bg-primary hover:bg-primary/90 text-lg font-medium">
          {t("gameEnd.startNewRound")}
        </Button>
      )}
    </div>
  );
};
