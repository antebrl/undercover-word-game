import { useGame } from "../context/GameContext";
import { usePeer } from "../context/PeerContext";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { PlayerList } from "./shared/PlayerList";
import { useSound } from "@/context/SoundContext";
import { useTranslation } from "react-i18next";
import { canPlayerVote } from "@/roles";
import { Eye, ChevronRight } from "lucide-react";

// Offline: one player votes at a time, device is passed around

const OfflineVotingTurn = () => {
  const { gameState, submitVote, advanceOfflineVoting } = useGame();
  const { t } = useTranslation();
  const { playSound } = useSound();
  const [revealed, setRevealed] = useState(false);
  const [selected, setSelected] = useState("");

  const active = gameState.players.filter(p => !p.isEliminated);
  const idx = gameState.offlineVotingPlayerIndex ?? 0;
  const voter = active[idx];
  const targets = active.filter(p => p.id !== voter?.id);
  const isLastVoter = idx >= active.length - 1;

  const handleVote = () => {
    if (!voter || !selected) return;
    playSound("/sounds/submit-vote.wav");
    submitVote(voter.id, selected);
    // Only advance index if this isn't the last voter (last vote triggers results automatically)
    if (!isLastVoter) {
      advanceOfflineVoting();
      setRevealed(false);
      setSelected("");
    }
  };

  if (!voter) return null;

  return (
    <div className="max-w-md mx-auto p-6 space-y-6 animate-fade-in">
      <div className="text-center space-y-1">
        <p className="text-white/50 text-sm">{t("offline.playerOf", { current: idx + 1, total: active.length })}</p>
        <h2 className="text-2xl font-bold text-white">{t("offline.passTo", { name: voter.name })}</h2>
      </div>

      {!revealed ? (
        <div className="rounded-xl glass-morphism p-8 text-center space-y-4">
          <div className="text-5xl">🙈</div>
          <p className="text-white/60 text-sm">{t("offline.tapToVote")}</p>
          <Button onClick={() => setRevealed(true)} size="lg" className="w-full bg-primary hover:bg-primary/90 gap-2">
            <Eye className="h-5 w-5" /> {t("offline.revealVoting")}
          </Button>
        </div>
      ) : (
        <div className="space-y-4 animate-fade-in">
          <h3 className="text-lg font-semibold text-white text-center">{t("voting.voteToEliminate")}</h3>
          <div className="space-y-2">
            {targets.map(target => (
              <button key={target.id} onClick={() => setSelected(target.id)}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all text-left
                  ${selected === target.id
                    ? "bg-red-500/20 border-red-500/50 text-white"
                    : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:text-white"}`}>
                <span className="flex-1 text-base font-medium">{target.name}</span>
                {selected === target.id && <span className="text-red-400 text-lg">✓</span>}
              </button>
            ))}
          </div>
          <Button onClick={handleVote} disabled={!selected}
            className="w-full bg-primary hover:bg-primary/90 gap-2 disabled:opacity-40">
            {t("voting.submitVote")} <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Progress dots */}
      <div className="flex justify-center gap-2 pt-2">
        {active.map((_, i) => (
          <div key={i} className={`h-2 rounded-full transition-all duration-300
            ${i < idx ? "w-4 bg-primary" : i === idx ? "w-4 bg-white" : "w-2 bg-white/20"}`} />
        ))}
      </div>
    </div>
  );
};

// Online: standard voting

export const VotingScreen = () => {
  const { gameState, submitVote } = useGame();
  const { peer, isHost, sendToHost } = usePeer();
  const { playSound } = useSound();
  const [selected, setSelected] = useState("");
  const { t } = useTranslation();

  useEffect(() => { playSound("/sounds/new-page.mp3"); }, []);

  if (gameState.gameMode === "offline") return <OfflineVotingTurn />;

  const currentPlayer = gameState.players.find(p => p.id === peer?.id);
  const hasVoted = !!(currentPlayer && gameState.votingResults?.[currentPlayer.id]);
  const isEligible = currentPlayer && canPlayerVote(currentPlayer);
  const cannotVote = currentPlayer?.temporaryEffect === "cannotVote";
  const hasDoubleVote =
    currentPlayer?.temporaryEffect === "doubleVote" ||
    currentPlayer?.temporaryEffect === "extraVote";

  const activePlayers = (gameState.speakingOrder ?? [])
    .map(id => gameState.players.find(p => p.id === id))
    .filter((p): p is NonNullable<typeof p> => !!p && !p.isEliminated);

  const castVote = (voterId: string, targetId: string) => {
    if (isHost) submitVote(voterId, targetId);
    else sendToHost({ type: "SUBMIT_VOTE", voterId, targetId });
  };

  const handleVote = () => {
    if (!currentPlayer || !selected) return;
    playSound("/sounds/submit-vote.wav");
    castVote(currentPlayer.id, selected);
    // Extra vote (doubleVote / extraVote Falafel effect) - cast a second vote immediately
    if (hasDoubleVote) setTimeout(() => castVote(`${currentPlayer.id}_x2`, selected), 60);
  };

  if (!isEligible) {
    return (
      <div className="max-w-md mx-auto p-6 space-y-6 animate-fade-in">
        <h2 className="text-2xl font-bold text-center text-gradient">{t("voting.inProgress")}</h2>
        <PlayerList players={activePlayers} votingResults={gameState.votingResults} currentPlayerId={peer?.id} />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-center text-gradient">{t("voting.voteToEliminate")}</h2>

      {cannotVote && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-center text-red-400 text-sm">
          🚫 {t("voting.cannotVote")}
        </div>
      )}
      {currentPlayer?.specialRole === "ghost" && currentPlayer.isEliminated && (
        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-300/30 text-center text-blue-300 text-sm">
          👻 {t("voting.ghostVoting")}
        </div>
      )}

      <PlayerList
        players={activePlayers}
        selectedPlayer={selected}
        onPlayerClick={!hasVoted && !cannotVote ? setSelected : undefined}
        votingResults={gameState.votingResults}
        currentPlayerId={peer?.id}
      />

      {!hasVoted && !cannotVote && (
        <Button onClick={handleVote} disabled={!selected} className="w-full bg-primary hover:bg-primary/90">
          {t("voting.submitVote")}
          {hasDoubleVote && <span className="ml-2 opacity-70 text-xs">({t("voting.doubleVote")})</span>}
        </Button>
      )}
    </div>
  );
};
