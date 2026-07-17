import { useGame } from "../context/GameContext";
import { usePeer } from "../context/PeerContext";
import { Button } from "@/components/ui/button";
import { Link, Hash, Plus, Minus } from "lucide-react";
import { toast } from "sonner";
import { PlayerList } from "./shared/PlayerList";
import { Card } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { distributionMeetsLimits } from "@/config/roleDistribution";
import { useTranslation } from "react-i18next";
import { SpecialRole, SpecialRoleConfig } from "@/types/game";
import { getSpecialRoleMeta } from "./shared/SpecialRoleBadge";
import { useIsHost } from "@/hooks/useIsHost";

const SPECIAL_ROLES: SpecialRole[] = [
  "justice", "lovers", "revenger", "ghost",
  "joyFool", "boomerang", "duelist", "falafelVendor", "mrMeme",
];

export const GameSetup = () => {
  const { gameState, startGame, updateRoleDistribution, updateSpecialRoleConfig } = useGame();
  const { hostId, isHost: isPeerHost } = usePeer();
  const isMobile = useIsMobile();
  const { t } = useTranslation();
  const isHost = useIsHost();
  const isOffline = gameState.gameMode === "offline";

  const handleCopyLink = () => {
    if (hostId) {
      navigator.clipboard.writeText(`${window.location.origin}${import.meta.env.BASE_URL}?gameId=${hostId}`);
      toast.success(t("gameSetup.copied"));
    }
  };

  const toggleSpecialRole = (role: SpecialRole) => {
    if (!isHost) return;
    updateSpecialRoleConfig({ ...gameState.specialRoleConfig, [role]: !gameState.specialRoleConfig[role] } as SpecialRoleConfig);
  };

  const rd = gameState.roleDistribution;
  const hasEnoughPlayers = gameState.players.length >= 4;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-fade-in">
      <h1 className="text-4xl font-bold text-white text-center">{t("gameSetup.title")}</h1>

      {/* Share link - online only */}
      {!isOffline && hostId && (
        <div onClick={handleCopyLink}
          className="glass-morphism p-6 rounded-lg hover:bg-white/10 transition-colors cursor-pointer group">
          <div className="flex items-center gap-2 text-white/90 text-lg mb-3">
            <Hash className="h-5 w-5" />
            <span>{t("gameSetup.shareLabel")}</span>
          </div>
          <div className="flex items-center gap-3">
            <code className="flex-1 bg-white/5 px-4 py-2 rounded-lg text-[#1EAEDB] font-mono text-base text-center truncate">{hostId}</code>
            <Link className="h-5 w-5 text-white/50 group-hover:text-white flex-shrink-0" />
          </div>
        </div>
      )}

      <div className={isMobile ? "space-y-6" : "grid grid-cols-2 gap-6"}>
        <PlayerList players={gameState.players} showScores={gameState.players.some(p => (p.score ?? 0) > 0)} />

        <div className="space-y-6">
          {/* Role distribution */}
          <Card className="p-6 bg-white/5">
            <h3 className="text-lg font-semibold text-white mb-5">{t("gameSetup.roleDistribution")}</h3>
            <div className="space-y-5">
              <p className="text-center text-white/60 text-sm">
                {gameState.players.length - rd.mrWhites - rd.undercovers} {t("gameSetup.civilians")}
              </p>
              {(["undercovers", "mrWhites"] as const).map(key => (
                <div key={key} className="flex items-center justify-between gap-4">
                  <Button variant="outline" size="icon"
                    onClick={() => updateRoleDistribution({ ...rd, [key]: rd[key] - 1 })}
                    disabled={!isHost || !distributionMeetsLimits({ ...rd, [key]: rd[key] - 1 }, gameState.players.length)}
                    className="bg-white/10 hover:bg-white/20 disabled:opacity-40">
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="flex-1 text-center text-white">{rd[key]} {t(`gameSetup.${key}`)}</span>
                  <Button variant="outline" size="icon"
                    onClick={() => updateRoleDistribution({ ...rd, [key]: rd[key] + 1 })}
                    disabled={!isHost || !distributionMeetsLimits({ ...rd, [key]: rd[key] + 1 }, gameState.players.length)}
                    className="bg-white/10 hover:bg-white/20 disabled:opacity-40">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          {/* Special roles */}
          <Card className="p-6 bg-white/5">
            <h3 className="text-lg font-semibold text-white mb-1">{t("gameSetup.specialRoles")}</h3>
            <p className="text-white/40 text-xs mb-4">{t("gameSetup.specialRolesHint")}</p>
            <div className="space-y-2">
              {SPECIAL_ROLES.map(role => {
                const meta = getSpecialRoleMeta(role);
                const on = !!gameState.specialRoleConfig[role];
                return (
                  <button key={role} onClick={() => toggleSpecialRole(role)} disabled={!isHost}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left
                      ${on ? "bg-primary/15 border-primary/40 text-white" : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white/80"}
                      ${!isHost ? "cursor-default" : "cursor-pointer"}`}>
                    <span className="text-lg flex-shrink-0">{meta.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{meta.label}</p>
                      <p className="text-xs opacity-60 truncate">{t(`specialRoles.${role}.desc`)}</p>
                    </div>
                    <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center text-xs transition-colors
                      ${on ? "bg-primary border-primary text-white" : "border-white/30"}`}>
                      {on && "✓"}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          <div className="space-y-2">
            {!hasEnoughPlayers && (
              <p className="text-red-500 text-sm text-center">{t("gameSetup.atLeastFourPlayers")}</p>
            )}
            <Button onClick={startGame} size="lg" disabled={!isHost || !hasEnoughPlayers}
              className="w-full bg-primary hover:bg-primary/90 text-lg font-medium disabled:opacity-40">
              {t("gameSetup.startGame", { count: gameState.players.length })}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
