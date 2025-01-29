import React, { createContext, useContext, useState } from "react";
import { GameState, Player, GamePhase, PlayerRole } from "../types/game";
import { toast } from "sonner";

interface GameContextType {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  addPlayer: (name: string, id: string) => void;
  removePlayer: (id: string) => void;
  startGame: () => void;
  setPhase: (phase: GamePhase) => void;
  submitVote: (voterId: string, targetId: string) => void;
  submitMrWhiteGuess: (guess: string) => void;
  resetGame: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: React.ReactNode }) => {
  const [gameState, setGameState] = useState<GameState>({
    players: [],
    phase: "setup",
    currentRound: 0,
    majorityWord: "",
    undercoverWord: "",
  });

  const addPlayer = (name: string, id: string) => {
    if (gameState.players.length >= 10) {
      toast.error("Maximum 10 players allowed!");
      return;
    }
    setGameState((prev) => ({
      ...prev,
      players: [...prev.players, { id, name }],
    }));
  };

  const removePlayer = (id: string) => {
    setGameState((prev) => ({
      ...prev,
      players: prev.players.filter((p) => p.id !== id),
    }));
  };

  const generateSpeakingOrder = (players: Player[]) => {
    const activePlayers = players.filter(p => !p.isEliminated);
    const nonWhitePlayers = activePlayers.filter(p => p.role !== "mrwhite");
    const whitePlayers = activePlayers.filter(p => p.role === "mrwhite");
    const shuffledNonWhite = [...nonWhitePlayers].sort(() => Math.random() - 0.5);
    const shuffledWhite = [...whitePlayers].sort(() => Math.random() - 0.5);
    return [...shuffledNonWhite, ...shuffledWhite].map(player => player.id);
  };

  const checkGameEnd = () => {
    const alivePlayers = gameState.players.filter(p => !p.isEliminated);
    const aliveCivilians = alivePlayers.filter(p => p.role === "civilian");
    const aliveUndercovers = alivePlayers.filter(p => p.role === "undercover");
    const aliveMrWhites = alivePlayers.filter(p => p.role === "mrwhite");

    if (aliveUndercovers.length === 0 && aliveMrWhites.length === 0) {
      return "civilian";
    }

    if (aliveCivilians.length === 1 && aliveUndercovers.length > 0) {
      return "undercover";
    }

    return null;
  };

  const startGame = () => {
    if (gameState.currentRound === 0) {
      if (gameState.players.length < 4) {
        toast.error("Minimum 4 players required!");
        return;
      }

      const wordPairs = [
        ["Dog", "Cat"],
        ["Pizza", "Burger"],
        ["Beach", "Mountain"],
        ["Coffee", "Tea"],
        ["Car", "Bus"],
        ["Sun", "Moon"],
      ];
      
      const randomPair = wordPairs[Math.floor(Math.random() * wordPairs.length)];
      const [majorityWord, undercoverWord] = randomPair;

      const shuffledPlayers = [...gameState.players].sort(() => Math.random() - 0.5);
      const numUndercover = Math.floor(gameState.players.length / 4);
      const hasMrWhite = gameState.players.length >= 5;

      const updatedPlayers = shuffledPlayers.map((player, index) => {
        let role: PlayerRole = "civilian";
        let word = majorityWord;

        if (hasMrWhite && index === 0) {
          role = "mrwhite";
          word = "";  
        } else if (index < numUndercover + (hasMrWhite ? 1 : 0)) {
          role = "undercover";
          word = undercoverWord;
        }

        return {
          ...player,
          word,
          role,
          isEliminated: false,
        };
      });

      const speakingOrder = generateSpeakingOrder(updatedPlayers);

      setGameState((prev) => ({
        ...prev,
        players: updatedPlayers,
        speakingOrder,
        phase: "wordReveal",
        majorityWord,
        undercoverWord,
        currentRound: 1,
      }));
    } else {
      setGameState((prev) => ({
        ...prev,
        speakingOrder: generateSpeakingOrder(prev.players),
        phase: "wordReveal",
        votingResults: {},
        currentRound: prev.currentRound + 1,
      }));
    }
  };

  const setPhase = (phase: GamePhase) => {
    setGameState((prev) => ({ ...prev, phase }));
  };

  const submitVote = (voterId: string, targetId: string) => {
    setGameState((prev) => {
      const newVotingResults = { ...(prev.votingResults || {}), [voterId]: targetId };
      const activePlayers = prev.players.filter(p => !p.isEliminated);
      const allVoted = activePlayers.every(p => p.id in newVotingResults);

      if (allVoted) {
        const voteCount: Record<string, number> = {};
        Object.values(newVotingResults).forEach(id => {
          voteCount[id] = (voteCount[id] || 0) + 1;
        });

        const eliminatedId = Object.entries(voteCount).reduce((a, b) => 
          (voteCount[a[0]] > voteCount[b[0]] ? a : b)
        )[0];

        const updatedPlayers = prev.players.map(p => 
          p.id === eliminatedId ? { ...p, isEliminated: true } : p
        );

        const eliminatedPlayer = updatedPlayers.find(p => p.id === eliminatedId);
        
        if (eliminatedPlayer?.role === "mrwhite") {
          return {
            ...prev,
            players: updatedPlayers,
            votingResults: {},
            phase: "mrwhiteGuess",
            lastEliminatedId: eliminatedId
          };
        }

        const gameWinner = checkGameEnd();
        if (gameWinner) {
          return {
            ...prev,
            players: updatedPlayers,
            phase: "gameEnd",
            winner: gameWinner,
            lastEliminatedId: eliminatedId
          };
        }

        return {
          ...prev,
          players: updatedPlayers,
          votingResults: {},
          phase: "results",
          lastEliminatedId: eliminatedId
        };
      }

      return {
        ...prev,
        votingResults: newVotingResults
      };
    });
  };

  const submitMrWhiteGuess = (guess: string) => {
    if (guess.toLowerCase() === gameState.majorityWord.toLowerCase()) {
      setGameState(prev => ({
        ...prev,
        phase: "gameEnd",
        winner: "mrwhite"
      }));
    } else {
      const gameWinner = checkGameEnd();
      setGameState(prev => ({
        ...prev,
        phase: gameWinner ? "gameEnd" : "results",
        winner: gameWinner || undefined
      }));
    }
  };

  const resetGame = () => {
    setGameState({
      players: [],
      phase: "setup",
      currentRound: 1,
      majorityWord: "",
      undercoverWord: "",
    });
  };

  return (
    <GameContext.Provider
      value={{
        gameState,
        setGameState,
        addPlayer,
        removePlayer,
        startGame,
        setPhase,
        submitVote,
        submitMrWhiteGuess,
        resetGame,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
};
