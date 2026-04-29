import React, { createContext, useContext, useState } from "react";
import { GameState, Player, GamePhase, PlayerRole, RoleDistribution } from "../types/game";
import { toast } from "sonner";
import { calculateDefaultDistribution } from "../config/roleDistribution";
import { useTranslation } from "react-i18next";
import { shuffle } from "@/lib/utils";

interface GameContextType {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  addPlayer: (name: string, id: string) => void;
  removePlayer: (id: string) => void;
  startGame: () => void;
  setPhase: (phase: GamePhase) => void;
  submitVote: (voterId: string, targetId: string) => void;
  submitMrWhiteGuess: (guess: string) => void;
  submitDescription: (playerId: string, description: string) => void;
  resetGame: () => void;
  updateRoleDistribution: (distribution: RoleDistribution) => void;
  checkGameEnd: (players: Player[]) => string | null;
  eliminatePlayer: (eliminatedId: string) => void;
  rerollWords: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: React.ReactNode }) => {
  const { t } = useTranslation();

  const [gameState, setGameState] = useState<GameState>({
    players: [],
    phase: "setup",
    currentRound: 0,
    majorityWord: "",
    undercoverWord: "",
    mrWhiteGuess: undefined,
    roleDistribution: calculateDefaultDistribution(4),
  });

  const addPlayer = (name: string, id: string) => {
    setGameState((prev) => {
      if (prev.players.length >= 10) {
        toast.error(t("gameSetup.maxPlayers"));
        return prev;
      }

      const score = 0;
      let role = undefined;
      let isEliminated = undefined;
      if (prev.phase !== "setup") {
        role = "spectator";
        isEliminated = true;
      }

      const newPlayers = [...prev.players, { id, name, role, isEliminated, score }];
      return {
        ...prev,
        players: newPlayers,
        roleDistribution: calculateDefaultDistribution(newPlayers.length),
      };
    });
  };

  const removePlayer = (id: string) => {
    setGameState((prev) => {
      const player = prev.players.find(p => p.id === id);
      if (!player) return prev;

      const newPlayers = prev.players.filter(p => p.id !== id);
      const newSpeakingOrder = prev.speakingOrder?.filter(s => s !== id);

      if (prev.phase !== "setup") {
        const gameEnd = checkGameEnd(newPlayers);
        if (gameEnd) {
          return {
            ...prev,
            phase: "gameEnd",
            winner: gameEnd,
            players: newPlayers,
            speakingOrder: newSpeakingOrder,
          };
        }
      }

      return {
        ...prev,
        players: newPlayers,
        speakingOrder: newSpeakingOrder,
      };
    });
  };

  const generateSpeakingOrder = (players: Player[]) => {
    const activePlayers = players.filter(p => !p.isEliminated);
    const nonWhitePlayers = activePlayers.filter(p => p.role !== "mrwhite");

    // Ensure the first player is not a Mr. White
    const firstPlayer = nonWhitePlayers[Math.floor(Math.random() * nonWhitePlayers.length)];

    const remainingPlayers = activePlayers.filter(p => p.id !== firstPlayer.id);
    const shuffledRemaining = shuffle(remainingPlayers);

    return [firstPlayer, ...shuffledRemaining].map(player => player.id);
  };

  const checkGameEnd = (players: Player[]) => {
    const alivePlayers = players.filter(p => !p.isEliminated);
    const aliveCivilians = alivePlayers.filter(p => p.role === "civilian");
    const aliveUndercovers = alivePlayers.filter(p => p.role === "undercover");
    const aliveMrWhites = alivePlayers.filter(p => p.role === "mrwhite");

    if (aliveUndercovers.length === 0 && aliveMrWhites.length === 0) {
      if (aliveCivilians.length === 0) return null;
      return "civilian";
    }

    if (aliveCivilians.length <= 1) {
      if (aliveUndercovers.length > 0) {
        if (aliveMrWhites.length > 0) {
          return "infiltrators";
        }
        return "undercover";
      }
      return "mrwhite";
    }

    return null;
  };

  const generateAndAssignWords = (players: Player[]) => {
    const wordPairs = t("wordPairs", { returnObjects: true }) as [string, string][];
    const randomPair = wordPairs[Math.floor(Math.random() * wordPairs.length)];
    const [majorityWord, undercoverWord] = randomPair;

    const updatedPlayers = players.map(player => ({
      ...player,
      word: player.role === "mrwhite" ? "" : player.role === "undercover" ? undercoverWord : majorityWord,
      submittedDescription: undefined,
    }));

    return {
      players: updatedPlayers,
      majorityWord,
      undercoverWord,
    };
  };

  const rerollWords = () => {
    setGameState(prev => {
      if (prev.currentRound !== 1) return prev;

      const { players, majorityWord, undercoverWord } = generateAndAssignWords(prev.players);
      return {
        ...prev,
        players,
        majorityWord,
        undercoverWord,
      };
    });
  };

  const startGame = () => {
    setGameState((prev) => {
      if (prev.currentRound === 0) {
        if (prev.players.length < 4) {
          toast.error(t("gameSetup.atLeastFourPlayers"));
          return prev;
        }

        const shuffledPlayers = shuffle(prev.players);
        const { undercovers, mrWhites } = prev.roleDistribution;

        const playersWithRoles = shuffledPlayers.map((player, index) => {
          let role: PlayerRole = "civilian";
          if (index < mrWhites) {
            role = "mrwhite";
          } else if (index < mrWhites + undercovers) {
            role = "undercover";
          }

          return {
            ...player,
            role,
            isEliminated: false,
          };
        });

        const { players, majorityWord, undercoverWord } = generateAndAssignWords(playersWithRoles);
        const speakingOrder = generateSpeakingOrder(players);

        return {
          ...prev,
          players,
          speakingOrder,
          phase: "wordReveal",
          majorityWord,
          undercoverWord,
          currentRound: 1,
          mrWhiteGuess: undefined,
        };
      } else {
        return {
          ...prev,
          speakingOrder: generateSpeakingOrder(prev.players),
          phase: "wordReveal",
          votingResults: {},
          currentRound: prev.currentRound + 1,
          mrWhiteGuess: undefined,
        };
      }
    });
  };

  const setPhase = (phase: GamePhase) => {
    setGameState((prev) => ({ ...prev, phase }));
  };

  const submitDescription = (playerId: string, submittedDescription: string) => {
    setGameState((prev) => {
      const updatedPlayers = prev.players.map(p =>
        p.id === playerId ? { ...p, submittedDescription } : p
      );

      return {
        ...prev,
        players: updatedPlayers,
      };
    });
  };

  const submitVote = (voterId: string, targetId: string) => {
    setGameState((prev) => {
      const newVotingResults = { ...(prev.votingResults || {}), [voterId]: targetId };
      const activePlayers = prev.players.filter(p => !p.isEliminated);
      const allVoted = activePlayers.every(p => p.id in newVotingResults);

      if (allVoted) {
        // Elimination logic
        const voteCount: Record<string, number> = {};
        Object.values(newVotingResults).forEach(id => {
          voteCount[id] = (voteCount[id] || 0) + 1;
        });

        // Find the highest vote count
        const maxVotes = Math.max(...Object.values(voteCount));

        // Get all players with the highest votes
        const mostVotedPlayers = Object.entries(voteCount)
          .filter(([_, votes]) => votes === maxVotes)
          .map(([id]) => id);

        // Randomly select one of the most voted players
        const eliminatedId = mostVotedPlayers[Math.floor(Math.random() * mostVotedPlayers.length)];

        return {
          ...prev,
          votingResults: newVotingResults,
          phase: "results",
          lastEliminatedId: eliminatedId,
        };
      }

      return {
        ...prev,
        votingResults: newVotingResults
      };
    });
  };

  const eliminatePlayer = (eliminatedId: string) => {
    setGameState((prev) => {
      const updatedPlayers = prev.players.map(p =>
        p.id === eliminatedId ? { ...p, isEliminated: true, submittedDescription: undefined } : { ...p, submittedDescription: undefined }
      );

      return {
        ...prev,
        players: updatedPlayers,
        phase: "results",
        lastEliminatedId: eliminatedId,
      };
    });
  };

  const submitMrWhiteGuess = (guess: string) => {
    setGameState((prev) => {
      if (guess.toLowerCase() === prev.majorityWord.toLowerCase()) {
        return {
          ...prev,
          phase: "gameEnd",
          winner: "mrwhite",
          mrWhiteGuess: guess
        };
      } else {
        const gameWinner = checkGameEnd(prev.players);
        return {
          ...prev,
          phase: gameWinner ? "gameEnd" : "results",
          winner: gameWinner || undefined,
          mrWhiteGuess: guess
        };
      }
    });
  };

  const resetGame = () => {
    setGameState((prev) => {
      const players = prev.players.map(p => ({ ...p, isEliminated: false, submittedDescription: undefined }));
      return {
        players: players,
        phase: "setup",
        currentRound: 0,
        majorityWord: "",
        undercoverWord: "",
        mrWhiteGuess: undefined,
        roleDistribution: prev.roleDistribution,
      };
    });
  };

  const updateRoleDistribution = (distribution: RoleDistribution) => {
    setGameState(prev => ({
      ...prev,
      roleDistribution: distribution
    }));
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
        submitDescription,
        resetGame,
        updateRoleDistribution,
        checkGameEnd,
        eliminatePlayer,
        rerollWords,
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