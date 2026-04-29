import { Card } from "@/components/ui/card";
import { Users, UserX } from "lucide-react";
import { Player } from "../../types/game";
import { useEffect, useState } from "react";
import { useSound } from "@/context/SoundContext";
import { useTranslation } from "react-i18next";

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
}: PlayerListProps) => {
  const { playSound } = useSound();
  const { t } = useTranslation();

  // The player that is going to be eliminated (red highlight)
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

    // Animate the elimination if there is a tie in votes
    let timeoutId: NodeJS.Timeout;
    let duration = 400;
    let iterations = 0;
    let currentIndex = 0;

    const animate = () => {
      // Switching between highlighting the players, who are in the tie breaker
      playSound("/sounds/click-sound.mp3");
      setHighlightedPlayer(tieBreakerPlayers[currentIndex]);
      currentIndex = (currentIndex + 1) % tieBreakerPlayers.length;
      iterations++;

      if (iterations < 10) {
        //Increase switching speed
        duration = Math.max(duration * 0.9, 200);
      } else {
        //Decrease switching speed
        duration = duration * 1.15;
      }

      if (duration > 800) {
        //Stay on the eliminated player
        setHighlightedPlayer(lastEliminatedId!);
        timeoutId = setTimeout(() => {
          setIsAnimating(false);
        }, 1500);
        return;
      }

      timeoutId = setTimeout(animate, duration);
    };

    animate();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isAnimating, tieBreakerPlayers, lastEliminatedId]);

  const getVotesForPlayer = (playerId: string) => {
    if (!votingResults) return [];
    return Object.entries(votingResults)
      .filter(([_, targetId]) => targetId === playerId)
      .map(([voterId]) => players.find(p => p.id === voterId)?.name || '');
  };

  const hasCurrentPlayerVoted = currentPlayerId && votingResults?.[currentPlayerId];
  const isCurrentPlayerEliminated = !players.some(player => player.id === currentPlayerId);

  const filteredEliminatedPlayers = !showEliminated ? players.filter(p => !p.isEliminated) : players;
  const displayPlayers = speakingOrder ? players : filteredEliminatedPlayers;

  const currentSpeakerIndex = speakingOrder ? displayPlayers.findIndex(p => !p.submittedDescription) : 0;

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

            return (
              <div
                key={player.id}
                className={`
                  flex items-center gap-3 p-3 rounded-lg transition-all duration-200
                  ${onPlayerClick ? 'cursor-pointer' : ''}
                  ${selectedPlayer === player.id
                    ? 'bg-primary/20 border border-primary/30'
                    : isHighlighted
                      ? 'bg-red-500/30 border-2 border-red-500'
                      : 'bg-white/5 hover:bg-white/10'
                  }
                  ${isLastEliminated && !votingResults ? 'border-2 border-blue-500' : ''}
                  ${player.isEliminated ? 'opacity-50' : ''}
                `}
                onClick={() => onPlayerClick?.(player.id)}
              >

                {/* Speaker Indicator: used in WordReveal.tsx (discussion) */}
                {speakingOrder && (
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center
                    ${isCurrentSpeaker ? 'bg-primary' : 'bg-white/10'}
                    ${isCurrentSpeaker ? 'text-white' : 'text-white/80'}
                  `}>
                    {index + 1}
                  </div>
                )}
                <div className="flex-1 flex items-center justify-between">
                  <div>
                    <span className={`text-lg block max-w-[250px] truncate ${isCurrentSpeaker ? 'text-primary font-bold' : 'text-white'}`}>
                      {player.name}
                      {player.id === currentPlayerId && (
                        <span className="text-primary ml-2">{t("common.you")}</span>
                      )}
                    </span>
                    {/* Text or phrase the player has submitted this round */}
                    {player.submittedDescription && (
                      <p className="text-sm text-white/70 mt-1">
                        {player.submittedDescription}
                      </p>
                    )}

                    {/* Votes Overview: used in VotingScreen.tsx and Results.tsx */}
                    {showVotes && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {votes.map((voterName, vIndex) => (
                          <span
                            key={vIndex}
                            className="px-2 py-1 text-sm rounded-full bg-primary/60 text-white"
                          >
                            {voterName}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {player.isEliminated && player.role && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white/70">{t(`roles.${player.role}`)}</span>
                      <UserX className="h-5 w-5 text-red-500" />
                    </div>
                  )}
                </div>
                {/* Scores Overview: used in GameSetup.tsx */}
                {showScores && (
                  <div className="flex items-center gap-3">
                    <div className="w-px self-stretch bg-gray-300/20"></div>
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