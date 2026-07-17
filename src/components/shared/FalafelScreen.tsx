import { useGame } from "@/context/GameContext";
import { usePeer } from "@/context/PeerContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { FALAFEL_EFFECT_LABELS } from "@/roles/special/FalafelVendorRole";

export const FalafelScreen = () => {
  const { gameState, resolveFalafelDecision } = useGame();
  const { peer, isHost, sendToHost } = usePeer();
  const { t } = useTranslation();
  const isOffline = gameState.gameMode === "offline";

  const vendor = gameState.players.find(p => p.specialRole === "falafelVendor" && !p.isEliminated);
  const currentPlayer = gameState.players.find(p => p.id === peer?.id);
  const canDecide = isOffline || isHost || currentPlayer?.specialRole === "falafelVendor";

  const targets = gameState.players.filter(p => (gameState.falafelTargets ?? []).includes(p.id));

  const handleChoose = (targetId: string) => {
    if (isHost || isOffline) {
      resolveFalafelDecision(targetId);
    } else {
      sendToHost({ type: "FALAFEL_DECISION", targetId });
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <span className="text-5xl block">🥙</span>
        <h2 className="text-2xl font-bold text-white">{t("falafel.title")}</h2>
        <p className="text-white/60 text-sm">{t("falafel.subtitle", { name: vendor?.name })}</p>
      </div>

      <Card className="p-6 glass-morphism space-y-4">
        {canDecide ? (
          <>
            <p className="text-white text-center font-medium text-sm">{t("falafel.yourTurn")}</p>
            <p className="text-white/50 text-xs text-center">{t("falafel.effectNote")}</p>
            <div className="space-y-3">
              {targets.map(target => (
                <Button key={target.id} onClick={() => handleChoose(target.id)} variant="outline"
                  className="w-full bg-white/5 hover:bg-amber-500/20 border-white/10 hover:border-amber-500 text-white text-lg py-6">
                  {target.name}
                </Button>
              ))}
            </div>
          </>
        ) : (
          <p className="text-white/70 text-center">{t("falafel.waiting", { name: vendor?.name })}</p>
        )}
      </Card>
    </div>
  );
};
