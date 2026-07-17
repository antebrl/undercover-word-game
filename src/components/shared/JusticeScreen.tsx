import { useGame } from "@/context/GameContext";
import { usePeer } from "@/context/PeerContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

export const JusticeScreen = () => {
  const { gameState, resolveJusticeDecision } = useGame();
  const { peer, isHost, sendToHost } = usePeer();
  const { t } = useTranslation();
  const isOffline = gameState.gameMode === "offline";

  const justicePlayer = gameState.players.find(p => p.specialRole === "justice");
  const currentPlayer = gameState.players.find(p => p.id === peer?.id);
  // In offline mode every player on the device can make the decision (device is passed to Justice)
  const canDecide = isOffline || isHost || currentPlayer?.specialRole === "justice";

  const handleChoose = (chosenId: string) => {
    if (isHost || isOffline) {
      resolveJusticeDecision(chosenId);
    } else {
      sendToHost({ type: "JUSTICE_DECISION", chosenId });
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <span className="text-5xl block">⚖️</span>
        <h2 className="text-2xl font-bold text-white">{t("justice.title")}</h2>
        <p className="text-white/60 text-sm">{t("justice.subtitle", { name: justicePlayer?.name })}</p>
      </div>

      <Card className="p-6 glass-morphism space-y-4">
        {canDecide ? (
          <>
            <p className="text-white text-center font-medium text-sm">{t("justice.yourTurn")}</p>
            <div className="space-y-3">
              {(gameState.tieCandidates ?? []).map(id => {
                const candidate = gameState.players.find(p => p.id === id);
                if (!candidate) return null;
                return (
                  <Button key={id} onClick={() => handleChoose(id)} variant="outline"
                    className="w-full bg-white/5 hover:bg-red-500/20 border-white/10 hover:border-red-500 text-white text-lg py-6">
                    {candidate.name}
                  </Button>
                );
              })}
            </div>
          </>
        ) : (
          <p className="text-white/70 text-center">{t("justice.waiting", { name: justicePlayer?.name })}</p>
        )}
      </Card>
    </div>
  );
};
