import { useGame } from "@/context/GameContext";
import { usePeer } from "@/context/PeerContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

export const RevengerScreen = () => {
  const { gameState, resolveRevengerDecision } = useGame();
  const { peer, isHost, sendToHost } = usePeer();
  const { t } = useTranslation();
  const isOffline = gameState.gameMode === "offline";

  const revenger = gameState.players.find(p => p.id === gameState.revengerPlayerId);
  const currentPlayer = gameState.players.find(p => p.id === peer?.id);
  const canDecide = isOffline || isHost || currentPlayer?.id === revenger?.id;

  const livingTargets = gameState.players.filter(p => !p.isEliminated && p.id !== revenger?.id);

  const handleChoose = (targetId: string) => {
    if (isHost || isOffline) {
      resolveRevengerDecision(targetId);
    } else {
      sendToHost({ type: "REVENGER_DECISION", targetId });
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <span className="text-5xl block">💀</span>
        <h2 className="text-2xl font-bold text-white">{t("revenger.title")}</h2>
        <p className="text-white/60 text-sm">{t("revenger.subtitle", { name: revenger?.name })}</p>
      </div>

      <Card className="p-6 glass-morphism space-y-4">
        {canDecide ? (
          <>
            <p className="text-white text-center font-medium text-sm">{t("revenger.yourTurn")}</p>
            <div className="space-y-3">
              {livingTargets.map(target => (
                <Button key={target.id} onClick={() => handleChoose(target.id)} variant="outline"
                  className="w-full bg-white/5 hover:bg-red-500/20 border-white/10 hover:border-red-500 text-white text-lg py-6">
                  {target.name}
                </Button>
              ))}
            </div>
          </>
        ) : (
          <p className="text-white/70 text-center">{t("revenger.waiting", { name: revenger?.name })}</p>
        )}
      </Card>
    </div>
  );
};
