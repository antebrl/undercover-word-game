import { useGame } from "../context/GameContext";
import { usePeer } from "../context/PeerContext";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { PlayerList } from "./shared/PlayerList";
import { useSound } from "@/context/SoundContext";
import { useTranslation } from "react-i18next";

export const VotingScreen = () => {
  const { gameState, submitVote } = useGame();
  const { peer, isHost, sendToHost } = usePeer();
  const { playSound } = useSound();
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");
  const { t } = useTranslation();

  useEffect(() => {
    playSound("/sounds/new-page.mp3");
  }, []);

  const currentPlayer = gameState.players.find(p => p.id === peer?.id);
  const hasVoted = currentPlayer && gameState.votingResults?.[currentPlayer.id];
  const isEliminated = currentPlayer?.isEliminated;

  // Sort players by speaking order (and filter out eliminated players)
  const activePlayers = gameState.speakingOrder
    .map(id => gameState.players.find(p => p.id === id));

  // Don't show voting UI if player is eliminated
  if (isEliminated) {
    return (
      <div className="max-w-md mx-auto p-6 space-y-6 animate-fade-in">
        <h2 className="text-2xl font-bold text-center mb-4 text-gradient">{t("voting.inProgress")}</h2>
        <PlayerList
          players={activePlayers}
          votingResults={gameState.votingResults}
          currentPlayerId={peer?.id}
        />
      </div>
    );
  }

  const handleVote = () => {
    playSound("/sounds/submit-vote.wav");
    if (currentPlayer && selectedPlayer) {
      //playSound("/sounds/vote.mp3");
      if (isHost) {
        submitVote(currentPlayer.id, selectedPlayer);
      } else {
        sendToHost({
          type: "SUBMIT_VOTE",
          voterId: currentPlayer.id,
          targetId: selectedPlayer
        });
      }
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-center mb-4 text-gradient">{t("voting.voteToEliminate")}</h2>

      <PlayerList
        players={activePlayers}
        selectedPlayer={selectedPlayer}
        onPlayerClick={!hasVoted ? setSelectedPlayer : undefined}
        votingResults={gameState.votingResults}
        currentPlayerId={peer?.id}
      />

      {!hasVoted && (
        <Button
          onClick={handleVote}
          disabled={!selectedPlayer}
          className="w-full mt-4 bg-primary hover:bg-primary/90"
        >
          {t("voting.submitVote")}
        </Button>
      )}
    </div>
  );
};