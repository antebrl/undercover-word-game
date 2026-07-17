import { GameProvider } from "../context/GameContext";
import { PeerProvider } from "../context/PeerContext";
import { useGame } from "../context/GameContext";
import { usePeer } from "../context/PeerContext";
import { GameSetup } from "../components/GameSetup";
import { GameLobby } from "../components/GameLobby";
import { WordReveal } from "../components/WordReveal";
import { MultiplayerSetup } from "../components/MultiplayerSetup";
import { VotingScreen } from "../components/VotingScreen";
import { Results } from "../components/Results";
import { GameEnd } from "../components/GameEnd";
import { OfflineWordReveal } from "../components/OfflineWordReveal";
import { JusticeScreen } from "../components/shared/JusticeScreen";
import { RevengerScreen } from "../components/shared/RevengerScreen";
import { FalafelScreen } from "../components/shared/FalafelScreen";
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";
import { SoundProvider } from "@/context/SoundContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const GameContent = () => {
  const { gameState } = useGame();
  const { hostId } = usePeer();
  const isOffline = gameState.gameMode === "offline";

  // Show welcome screen unless we're in an active game.
  // For offline mode, players.length > 0 means initOfflinePlayers was called and
  // we should show GameSetup so the host can configure special roles before starting.
  const gameActive = !!hostId || (isOffline && gameState.players.length > 0);
  if (!gameActive) return <MultiplayerSetup />;

  // Special role interaction phases - render immediately before anything else
  if (gameState.phase === "justiceDecision") return <JusticeScreen />;
  if (gameState.phase === "revengerDecision") return <RevengerScreen />;
  if (gameState.phase === "falafelDecision") return <FalafelScreen />;

  // Offline private word reveal
  if (gameState.phase === "offlineWordReveal") return <OfflineWordReveal />;

  // Pre-game setup (first time only)
  if (gameState.phase === "setup" && gameState.currentRound === 0) return <GameSetup />;

  // Inter-round lobby (after each round, before next)
  if (gameState.phase === "setup" || gameState.phase === "discussion") return <GameLobby />;

  switch (gameState.phase) {
    case "wordReveal": return <WordReveal />;
    case "voting":    return <VotingScreen />;
    case "results":   return <Results />;
    case "gameEnd":   return <GameEnd />;
    default:          return <GameLobby />;
  }
};

const Index = () => (
  <div className="min-h-screen bg-gradient-to-br from-accent via-secondary to-accent text-white">
    <div className="container mx-auto px-4 py-3">
      <SoundProvider>
        <GameProvider>
          <PeerProvider>
            <div className="mx-auto flex max-w-4xl flex-col gap-4">
              <div className="flex justify-end">
                <LanguageSwitcher />
              </div>
              <GameContent />
            </div>
          </PeerProvider>
        </GameProvider>
      </SoundProvider>
    </div>

    <div className="hidden md:block">
      <a href="https://github.com/antebrl/undercover-word-game" target="_blank" rel="noopener noreferrer"
        className="fixed bottom-4 left-4 md:bottom-8 md:left-8">
        <Button variant="secondary" className="glass-morphism hover:bg-white/10 transition-all duration-300">
          <Github className="mr-2 h-4 w-4" /> View on GitHub
        </Button>
      </a>
    </div>
  </div>
);

export default Index;
