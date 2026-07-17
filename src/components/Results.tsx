import { useGame } from "../context/GameContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { usePeer } from "@/context/PeerContext";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { useSound } from "@/context/SoundContext";
import { MrWhiteGuess } from "./shared/MrWhiteGuess";
import { PlayerList } from "./shared/PlayerList";
import { SpecialRoleBadge } from "./shared/SpecialRoleBadge";
import { useTranslation } from "react-i18next";
import { useIsHost } from "@/hooks/useIsHost";

export const Results = () => {
  const { gameState, submitMrWhiteGuess, eliminatePlayer } = useGame();
  const { peer, sendToHost } = usePeer();
  const { playSound } = useSound();
  const { t } = useTranslation();
  const isHost = useIsHost();
  const isOffline = gameState.gameMode === "offline";

  const [guess, setGuess] = useState("");
  const [tieBreakerPlayers, setTieBreakerPlayers] = useState<string[]>([]);
  const [showCard, setShowCard] = useState(false);

  const currentPlayer = isOffline ? undefined : gameState.players.find(p => p.id === peer?.id);
  const eliminated = gameState.players.find(p => p.id === gameState.lastEliminatedId);
  const gotEliminated = eliminated?.id === currentPlayer?.id;
  const isBoomerang = !!gameState.boomerangVictims?.length;

  const boomerangSurvivor = isBoomerang ? gameState.players.find(p => p.id === gameState.lastEliminatedId) : undefined;
  const boomerangVictimNames = isBoomerang
    ? (gameState.boomerangVictims ?? []).map(id => gameState.players.find(p => p.id === id)?.name).filter(Boolean)
    : [];

  const isMrWhiteGuessing = eliminated?.role === "mrwhite" && !gameState.mrWhiteGuess && !isBoomerang;
  // In offline mode, the device is always the "host" so we can always continue
  const canContinue = isHost && !isMrWhiteGuessing;

  const playSound_ = () => {
    if (isBoomerang) { playSound("/sounds/undercover-eliminated.mp3"); return; }
    if (gameState.mrWhiteGuess) { playSound("/sounds/mrwhite-wrong-guess.mp3"); return; }
    switch (eliminated?.role) {
      case "mrwhite": playSound("/sounds/mrwhite-eliminated.mp3"); break;
      case "undercover": playSound("/sounds/undercover-eliminated.mp3"); break;
      default: playSound("/sounds/civilian-eliminated.mp3");
    }
  };

  useEffect(() => {
    if (!gameState.lastEliminatedId || !gameState.votingResults) return;
    const count: Record<string, number> = {};
    Object.values(gameState.votingResults).forEach(id => { count[id] = (count[id] ?? 0) + 1; });
    const max = Math.max(...Object.values(count));
    const top = Object.keys(count).filter(id => count[id] === max);
    setTieBreakerPlayers(top);

    if (top.length > 1 && !isBoomerang) {
      setTimeout(() => { setShowCard(true); playSound_(); }, 7000);
    } else {
      setShowCard(true);
      playSound_();
    }
  }, [gameState.lastEliminatedId]);

  const handleGuessSubmit = () => {
    if (!guess.trim()) { toast.error(t("results.guessRequired")); return; }
    if (isHost) submitMrWhiteGuess(guess.trim());
    else sendToHost({ type: "MR_WHITE_GUESS", guess: guess.trim() });
  };

  const activePlayers = (gameState.speakingOrder ?? [])
    .map(id => gameState.players.find(p => p.id === id))
    .filter((p): p is NonNullable<typeof p> => !!p);

  return (
    <div className="max-w-md mx-auto p-6 space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-center text-white">{t("results.title")}</h2>

      {showCard && (
        <Card className="p-6 text-center glass-morphism space-y-4">
          {isBoomerang ? (
            <>
              <div className="text-5xl">🪃</div>
              <h3 className="text-xl font-bold text-white">{t("results.boomerangActivated")}</h3>
              <p className="text-white/70 text-sm">{t("results.boomerangSurvivor", { name: boomerangSurvivor?.name })}</p>
              {boomerangVictimNames.map((name, i) => (
                <div key={i} className="px-3 py-2 rounded-lg bg-red-500/20 text-white text-sm">💥 {name}</div>
              ))}
            </>
          ) : eliminated ? (
            <>
              <h3 className="text-xl font-bold text-white">
                {gotEliminated ? t("results.eliminatedYou") : t("results.eliminatedPlayer", { name: eliminated.name })}
              </h3>
              <p className="text-lg text-white">
                {t(gotEliminated ? "results.youWereA" : "results.theyWereA")}{" "}
                <span className="font-bold text-primary">{t(`roles.${eliminated.role}`)}</span>
              </p>

              {/* Reveal special role */}
              {eliminated.specialRole && eliminated.specialRole !== "none" && (
                <div className="flex justify-center items-center gap-2 p-2 rounded-lg bg-white/5">
                  <SpecialRoleBadge role={eliminated.specialRole} showLabel />
                </div>
              )}

              {/* Lovers: warn the partner */}
              {eliminated.specialRole === "lovers" && (
                <p className="text-pink-400 text-sm">
                  ❤️ {t("results.loversPartner", {
                    name: gameState.players.find(p => p.id === eliminated.specialRoleData?.loverId)?.name ?? "?",
                  })}
                </p>
              )}

              {/* Revenger warning */}
              {eliminated.specialRole === "revenger" && !eliminated.specialRoleData?.revengeUsed && (
                <p className="text-red-400 text-sm font-medium">💀 {t("results.revengerWillStrike")}</p>
              )}

              {/* Word reveal for spectators/eliminated */}
              {eliminated.role !== "mrwhite" && currentPlayer?.isEliminated && !gotEliminated && (
                <p className="text-white/70 text-sm">
                  {t("results.theirWordWas")} <span className="font-bold">{eliminated.word}</span>
                </p>
              )}

              {/* Mr White guess: only shown to the Mr White who was just eliminated */}
              {isMrWhiteGuessing && (gotEliminated || isOffline) && (
                <div className="space-y-3 mt-2">
                  <p className="text-white/80 text-sm">{t("results.finalGuess")}</p>
                  <div className="flex gap-2">
                    <Input value={guess} onChange={e => setGuess(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleGuessSubmit()}
                      placeholder={t("results.enterGuess")} className="flex-1" />
                    <Button onClick={handleGuessSubmit} className="bg-primary hover:bg-primary/90">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              <MrWhiteGuess />
            </>
          ) : null}
        </Card>
      )}

      <PlayerList
        players={activePlayers}
        votingResults={gameState.votingResults}
        currentPlayerId={peer?.id}
        tieBreakerPlayers={!isBoomerang && !gameState.mrWhiteGuess ? tieBreakerPlayers : []}
        lastEliminatedId={gameState.lastEliminatedId}
        showEliminated
      />

      <Button onClick={() => eliminatePlayer(eliminated?.id)} disabled={!canContinue}
        className="w-full" variant={canContinue ? "default" : "secondary"}>
        {t("results.continueGame")}
      </Button>
    </div>
  );
};
