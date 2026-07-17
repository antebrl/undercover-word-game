import { Card } from "@/components/ui/card";
import { Users, UserX, Ghost } from "lucide-react";
import { Player } from "@/types/game";
import { useEffect, useState } from "react";
import { useSound } from "@/context/SoundContext";
import { useTranslation } from "react-i18next";
import { SpecialRoleBadge } from "./SpecialRoleBadge";
import { FALAFEL_EFFECT_LABELS } from "@/roles/special/FalafelVendorRole";

interface PlayerListProps {
  players: Player[];
  selectedPlayer?: string;
  onPlayerClick?: (playerId: string) => void;
  votingResults?: Record<string, string>;
  currentPlayerId?: string;
  speakingOrder?: boolean;
  showEliminated?: boolean;
  lastEliminatedId?: string;
  showScores?: boolean;
  tieBreakerPlayers?: string[];
  showSpecialRoles?: boolean; // only shown to the viewing player for their own role
}

export const PlayerList = ({
  players,
  selectedPlayer,
  onPlayerClick,
  votingResults,
  currentPlayerId,
  speakingOrder,
  showEliminated,
  lastEliminatedId,
  showScores,
  tieBreakerPlayers = [],
  showSpecialRoles = false,
}: PlayerListProps) => {
  const { playSound } = useSound();
  const { t } = useTranslation();

  const [highlightedPlayer, setHighlightedPlayer] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setHighlightedPlayer(tieBreakerPlayers[0]);
    if (tieBreakerPlayers.length > 1 && lastEliminatedId) {
      setIsAnimating(true);
    }
  }, [tieBreakerPlayers, lastEliminatedId]);

  useEffect(() => {
    if (!isAnimating || tieBreakerPlayers.length <= 1) return;

    let timeoutId: NodeJS.Timeout;
    let duration = 400;
    let iterations = 0;
    let currentIndex = 0;

    const animate = () => {
      playSound("/sounds/click-sound.mp3");
      setHighlightedPlayer(tieBreakerPlayers[currentIndex]);
      currentIndex = (currentIndex + 1) % tieBreakerPlayers.length;
      iterations++;

      if (iterations < 10) {
        duration = Math.max(duration * 0.9, 200);
      } else {
        duration = duration * 1.15;
      }

      if (duration > 800) {
        setHighlightedPlayer(lastEliminatedId!);
        timeoutId = setTimeout(() => setIsAnimating(false), 1500);
        return;
      }
      timeoutId = setTimeout(animate, duration);
    };

    animate();
    return () => { if (timeoutId) clearTimeout(timeoutId); };
  }, [isAnimating, tieBreakerPlayers, lastEliminatedId]);

  const getVotesForPlayer = (playerId: string) => {
    if (!votingResults) return [];
    return Object.entries(votingResults)
      .filter(([_, targetId]) => targetId === playerId)
      .map(([voterId]) => players.find(p => p.id === voterId)?.name || "");
  };

  const hasCurrentPlayerVoted = currentPlayerId && votingResults?.[currentPlayerId];
  const isCurrentPlayerEliminated = !players.some(p => p.id === currentPlayerId);

  const filteredPlayers = !showEliminated
    ? players.filter(p => !p.isEliminated || p.specialRole === "ghost")
    : players;
  const displayPlayers = speakingOrder ? players : filteredPlayers;

  const currentSpeakerIndex = speakingOrder
    ? displayPlayers.findIndex(p => !p.submittedDescription)
    : 0;

  return (
    <Card className="p-6 glass-morphism">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-white/90 text-lg">
          <Users className="h-5 w-5" />
          <span>{t("playerList.players", { count: displayPlayers.length })}</span>
        </div>

        <div className="space-y-2">
          {displayPlayers.map((player, index) => {
            if (!speakingOrder && currentPlayerId && !hasCurrentPlayerVoted && player.id === currentPlayerId) return null;

            const votes = getVotesForPlayer(player.id);
            const showVotes = (hasCurrentPlayerVoted || isCurrentPlayerEliminated) && votes.length > 0;
            const isLastEliminated = player.id === lastEliminatedId;
            const isCurrentSpeaker = speakingOrder && index === currentSpeakerIndex;
            const isHighlighted = highlightedPlayer === player.id;
            const isGhost = player.specialRole === "ghost" && player.isEliminated;
            const isCurrentUser = player.id === currentPlayerId;

            return (
              <div
                key={player.id}
                className={`
                  flex items-center gap-3 p-3 rounded-lg transition-all duration-200
                  ${onPlayerClick ? "cursor-pointer" : ""}
                  ${selectedPlayer === player.id
                    ? "bg-primary/20 border border-primary/30"
                    : isHighlighted
                      ? "bg-red-500/30 border-2 border-red-500"
                      : "bg-white/5 hover:bg-white/10"
                  }
                  ${isLastEliminated && !votingResults ? "border-2 border-blue-500" : ""}
                  ${player.isEliminated && !isGhost ? "opacity-50" : ""}
                  ${isGhost ? "opacity-70 border border-blue-300/30" : ""}
                `}
                onClick={() => onPlayerClick?.(player.id)}
              >
                {speakingOrder && (
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                    ${isCurrentSpeaker ? "bg-primary" : "bg-white/10"}
                    ${isCurrentSpeaker ? "text-white" : "text-white/80"}
                  `}>
                    {isGhost ? <Ghost className="h-4 w-4" /> : index + 1}
                  </div>
                )}

                <div className="flex-1 flex items-center justify-between min-w-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-lg max-w-[200px] truncate ${isCurrentSpeaker ? "text-primary font-bold" : "text-white"}`}>
                        {player.name}
                        {isCurrentUser && (
                          <span className="text-primary ml-2 text-sm">{t("common.you")}</span>
                        )}
                      </span>

                      {/* Ghost indicator */}
                      {isGhost && (
                        <span className="text-blue-300 text-xs flex items-center gap-1">
                          <Ghost className="h-3 w-3" /> {t("roles.ghost")}
                        </span>
                      )}

                      {/* Falafel effect badge */}
                      {player.temporaryEffect && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {FALAFEL_EFFECT_LABELS[player.temporaryEffect]}
                        </span>
                      )}

                      {/* Special role - only shown to the player themselves or in summary screens */}
                      {showSpecialRoles && isCurrentUser && player.specialRole && player.specialRole !== "none" && (
                        <SpecialRoleBadge role={player.specialRole} showLabel size="sm" />
                      )}
                    </div>

                    {player.submittedDescription && (
                      <p className="text-sm text-white/70 mt-1">{player.submittedDescription}</p>
                    )}

                    {showVotes && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {votes.map((voterName, vIndex) => (
                          <span key={vIndex} className="px-2 py-1 text-sm rounded-full bg-primary/60 text-white">
                            {voterName}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {player.isEliminated && player.role && !isGhost && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm text-white/70">{t(`roles.${player.role}`)}</span>
                      <UserX className="h-5 w-5 text-red-500" />
                    </div>
                  )}
                </div>

                {showScores && (
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="w-px self-stretch bg-gray-300/20" />
                    <div className="flex items-center gap-1">
                      <span className="text-lg font-bold text-white">{player.score}</span>
                      <span className="text-sm text-white/70">{t("playerList.points")}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};
