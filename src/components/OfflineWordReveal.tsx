import { useGame } from "@/context/GameContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Eye, EyeOff, ChevronRight } from "lucide-react";
import { SpecialRoleBadge } from "@/components/shared/SpecialRoleBadge";
import { useTranslation } from "react-i18next";

/**
 * Offline-only: shows one player at a time their secret word.
 * The device is passed around - each player taps to reveal, then taps Done.
 */
export const OfflineWordReveal = () => {
  const { gameState, advanceOfflinePlayer } = useGame();
  const { t } = useTranslation();
  const [revealed, setRevealed] = useState(false);

  const activePlayers = gameState.players.filter(p => !p.isEliminated);
  const currentIndex = gameState.offlineCurrentPlayerIndex ?? 0;
  const currentPlayer = activePlayers[currentIndex];
  const isLastPlayer = currentIndex >= activePlayers.length - 1;

  const handleNext = () => {
    setRevealed(false);
    advanceOfflinePlayer();
  };

  if (!currentPlayer) return null;

  return (
    <div className="max-w-md mx-auto p-6 space-y-6 animate-fade-in">
      <div className="text-center space-y-1">
        <p className="text-white/60 text-sm">{t("offline.playerOf", { current: currentIndex + 1, total: activePlayers.length })}</p>
        <h2 className="text-3xl font-bold text-white">{t("offline.passTo", { name: currentPlayer.name })}</h2>
      </div>

      <Card className="p-8 glass-morphism text-center space-y-6">
        {!revealed ? (
          <>
            <div className="text-6xl mb-2">🙈</div>
            <p className="text-white/70">{t("offline.tapToReveal")}</p>
            <Button
              onClick={() => setRevealed(true)}
              size="lg"
              className="w-full bg-primary hover:bg-primary/90 gap-2"
            >
              <Eye className="h-5 w-5" />
              {t("offline.revealMyWord")}
            </Button>
          </>
        ) : (
          <>
            <div className="space-y-4">
              {/* Special role notification - always visible before game starts */}
              {currentPlayer.specialRole && currentPlayer.specialRole !== "none" && (
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-white/70 text-sm mb-1">{t("wordReveal.yourSpecialRole")}</p>
                  <div className="flex items-center justify-center gap-2">
                    <SpecialRoleBadge role={currentPlayer.specialRole} showLabel size="lg" />
                  </div>
                </div>
              )}

              <div>
                <p className="text-white/70 text-sm mb-1">
                  {currentPlayer.role === "mrwhite"
                    ? t("wordReveal.youAre")
                    : t("wordReveal.yourWordIs")}
                </p>
                <p className="text-4xl font-bold text-primary">
                  {currentPlayer.role === "mrwhite"
                    ? t("wordReveal.mrWhite")
                    : currentPlayer.word}
                </p>
                <p className="text-white/50 text-sm mt-1 capitalize">
                  {t(`roles.${currentPlayer.role}`)}
                </p>
              </div>
            </div>

            <Button
              onClick={handleNext}
              size="lg"
              className="w-full bg-primary hover:bg-primary/90 gap-2"
            >
              {isLastPlayer ? t("offline.startGame") : t("offline.done")}
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}
      </Card>

      {/* Progress dots */}
      <div className="flex justify-center gap-2">
        {activePlayers.map((_, i) => (
          <div
            key={i}
            className={`h-2 w-2 rounded-full transition-all ${
              i < currentIndex ? "bg-primary" :
              i === currentIndex ? "bg-white" : "bg-white/20"
            }`}
          />
        ))}
      </div>
    </div>
  );
};
