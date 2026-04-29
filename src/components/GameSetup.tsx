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

export const GameSetup = () => {
  const { gameState, startGame, updateRoleDistribution } = useGame();
  const { hostId, isHost } = usePeer();
  const isMobile = useIsMobile();
  const { t } = useTranslation();

  const handleCopyLink = () => {
    if (hostId) {
      const gameLink = `${window.location.origin}${import.meta.env.BASE_URL}?gameId=${hostId}`;
      navigator.clipboard.writeText(gameLink);
      toast.success(t("gameSetup.copied"));
    }
  };

  const hasEnoughPlayers = gameState.players.length >= 4;
  const roleDistribution = gameState.roleDistribution;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-fade-in">
      <h1 className="text-4xl font-bold text-white mb-8 text-center">{t("gameSetup.title")}</h1>

      <div
        onClick={handleCopyLink}
        className="glass-morphism p-6 rounded-lg hover:bg-white/10 transition-colors cursor-pointer group"
      >
        <div className="flex items-center gap-2 text-white/90 text-lg mb-4">
          <Hash className="h-5 w-5" />
          <span>{t("gameSetup.shareLabel")}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 w-full">
            <code className="bg-white/5 px-4 py-2 rounded-lg text-[#1EAEDB] font-mono text-lg w-full text-center">{hostId}</code>
            <Link className="h-5 w-5 text-white/70 group-hover:text-white transition-colors" />
          </div>
        </div>
      </div>

      <div className={`${isMobile ? 'space-y-6' : 'grid grid-cols-2 gap-6'}`}>
        <PlayerList
          players={gameState.players}
          showScores={gameState.players.some(p => p.score > 0)}
        />

        <div className="space-y-6">
          <Card className="p-6 bg-white/5">
            <h3 className="text-lg font-semibold text-white mb-6">{t("gameSetup.roleDistribution")}</h3>
            <div className="space-y-6">
              <div className="text-center text-white/70">
                {gameState.players.length - roleDistribution.mrWhites - roleDistribution.undercovers} {t("gameSetup.civilians")}
              </div>
              <div className="flex items-center justify-between gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => updateRoleDistribution({ ...roleDistribution, undercovers: roleDistribution.undercovers - 1 })}
                  disabled={!isHost || !distributionMeetsLimits(
                    {
                      ...roleDistribution,
                      undercovers: roleDistribution.undercovers - 1
                    },
                    gameState.players.length)
                  }
                  className="bg-white/10 hover:bg-white/20 disabled:opacity-50"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <div className="flex-1 text-center text-white">
                  {roleDistribution.undercovers} {t("gameSetup.undercovers")}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => updateRoleDistribution({ ...roleDistribution, undercovers: roleDistribution.undercovers + 1 })}
                  disabled={!isHost || !distributionMeetsLimits(
                    {
                      ...roleDistribution,
                      undercovers: roleDistribution.undercovers + 1
                    },
                    gameState.players.length)
                  }
                  className="bg-white/10 hover:bg-white/20 disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => updateRoleDistribution({ ...roleDistribution, mrWhites: roleDistribution.mrWhites - 1 })}
                  disabled={!isHost || !distributionMeetsLimits(
                    {
                      ...roleDistribution,
                      mrWhites: roleDistribution.mrWhites - 1
                    },
                    gameState.players.length)
                  }
                  className="bg-white/10 hover:bg-white/20 disabled:opacity-50"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <div className="flex-1 text-center text-white">
                  {roleDistribution.mrWhites} {t("gameSetup.mrWhites")}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => updateRoleDistribution({ ...roleDistribution, mrWhites: roleDistribution.mrWhites + 1 })}
                  disabled={!isHost || !distributionMeetsLimits(
                    {
                      ...roleDistribution,
                      mrWhites: roleDistribution.mrWhites + 1
                    },
                    gameState.players.length)
                  }
                  className="bg-white/10 hover:bg-white/20 disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>

          <div className="space-y-2">
            {!hasEnoughPlayers && (
              <div className="text-red-500 text-sm text-center mb-2">
                {t("gameSetup.atLeastFourPlayers")}
              </div>
            )}
            <Button
              onClick={startGame}
              size="lg"
              disabled={!isHost || !hasEnoughPlayers}
              className="w-full bg-primary hover:bg-primary/90 text-lg font-medium transition-colors duration-200 disabled:opacity-50"
            >
              {t("gameSetup.startGame", { count: gameState.players.length })}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
