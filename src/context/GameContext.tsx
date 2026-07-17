import React, { createContext, useContext, useState } from "react";
import {
  GameState, Player, GamePhase, PlayerRole,
  RoleDistribution, SpecialRoleConfig,
} from "../types/game";
import { toast } from "sonner";
import { calculateDefaultDistribution } from "../config/roleDistribution";
import { useTranslation } from "react-i18next";
import { shuffle } from "@/lib/utils";
import {
  assignSpecialRoles,
  DEFAULT_SPECIAL_ROLE_CONFIG,
  resolveVote,
  resolveElimination,
  resolveGameEnd,
  resolveRoundStart,
  canPlayerVote,
  canPlayerSpeak,
} from "@/roles";
import { applyFalafelEffect } from "@/roles/special/FalafelVendorRole";

interface GameContextType {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  addPlayer: (name: string, id: string) => void;
  removePlayer: (id: string) => void;
  startGame: () => void;
  initOfflinePlayers: (usernames: string[]) => void;
  setPhase: (phase: GamePhase) => void;
  submitVote: (voterId: string, targetId: string) => void;
  submitMrWhiteGuess: (guess: string) => void;
  submitDescription: (playerId: string, description: string) => void;
  resetGame: () => void;
  updateRoleDistribution: (distribution: RoleDistribution) => void;
  updateSpecialRoleConfig: (config: SpecialRoleConfig) => void;
  checkGameEnd: (players: Player[]) => string | null;
  eliminatePlayer: (eliminatedId: string | undefined) => void;
  rerollWords: () => void;
  resolveJusticeDecision: (chosenId: string) => void;
  resolveRevengerDecision: (targetId: string) => void;
  resolveFalafelDecision: (targetId: string) => void;
  advanceOfflinePlayer: () => void;
  advanceOfflineVoting: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const INITIAL_STATE: GameState = {
  players: [],
  phase: "setup",
  currentRound: 0,
  majorityWord: "",
  undercoverWord: "",
  mrWhiteGuess: undefined,
  roleDistribution: calculateDefaultDistribution(4),
  specialRoleConfig: DEFAULT_SPECIAL_ROLE_CONFIG,
  gameMode: "online",
};

export const GameProvider = ({ children }: { children: React.ReactNode }) => {
  const { t } = useTranslation();
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);

  const generateSpeakingOrder = (players: Player[]): string[] => {
    const speakers = players.filter(p => canPlayerSpeak(p));
    const nonWhite = speakers.filter(p => p.role !== "mrwhite");
    const first = nonWhite.length > 0
      ? nonWhite[Math.floor(Math.random() * nonWhite.length)]
      : speakers[0];
    if (!first) return [];
    return [first, ...shuffle(speakers.filter(p => p.id !== first.id))].map(p => p.id);
  };

  const checkGameEnd = (players: Player[]): string | null => {
    const alive = players.filter(p => !p.isEliminated);
    const civs = alive.filter(p => p.role === "civilian");
    const unders = alive.filter(p => p.role === "undercover");
    const whites = alive.filter(p => p.role === "mrwhite");
    if (unders.length === 0 && whites.length === 0) return civs.length === 0 ? null : "civilian";
    if (civs.length <= 1) {
      if (unders.length > 0) return whites.length > 0 ? "infiltrators" : "undercover";
      return "mrwhite";
    }
    return null;
  };

  const generateAndAssignWords = (players: Player[]) => {
    const pairs = t("wordPairs", { returnObjects: true }) as [string, string][];
    const [majorityWord, undercoverWord] = pairs[Math.floor(Math.random() * pairs.length)];
    return {
      players: players.map(p => ({
        ...p,
        word: p.role === "mrwhite" ? "" : p.role === "undercover" ? undercoverWord : majorityWord,
        submittedDescription: undefined,
      })),
      majorityWord,
      undercoverWord,
    };
  };

  /** Mark one player eliminated, recording the round they went out. */
  const doEliminate = (state: GameState, id: string): GameState => ({
    ...state,
    players: state.players.map(p =>
      p.id === id
        ? { ...p, isEliminated: true, submittedDescription: undefined, eliminatedInRound: state.currentRound }
        : p
    ),
  });

  /** Wrap up the game: run end-of-game scoring hooks, set winner and phase. */
  const finalizeGame = (state: GameState, winner: string): GameState =>
    resolveGameEnd({ ...state, winner, phase: "gameEnd" });


  const addPlayer = (name: string, id: string) => {
    setGameState(prev => {
      if (prev.players.length >= 10) { toast.error(t("gameSetup.maxPlayers")); return prev; }
      let role: PlayerRole | undefined;
      let isEliminated: boolean | undefined;
      if (prev.phase !== "setup") { role = "spectator"; isEliminated = true; }
      const newPlayers = [...prev.players, { id, name, role, isEliminated, score: 0, specialRole: "none" as const }];
      return { ...prev, players: newPlayers, roleDistribution: calculateDefaultDistribution(newPlayers.length) };
    });
  };

  const removePlayer = (id: string) => {
    setGameState(prev => {
      const newPlayers = prev.players.filter(p => p.id !== id);
      const newOrder = prev.speakingOrder?.filter(s => s !== id);
      if (prev.phase !== "setup") {
        const end = checkGameEnd(newPlayers);
        if (end) return { ...prev, phase: "gameEnd", winner: end, players: newPlayers, speakingOrder: newOrder };
      }
      return { ...prev, players: newPlayers, speakingOrder: newOrder };
    });
  };


  const buildRound = (prev: GameState, offline: boolean): GameState => {
    if (prev.players.length < 4) { toast.error(t("gameSetup.atLeastFourPlayers")); return prev; }

    const shuffled = shuffle(prev.players);
    const { undercovers, mrWhites } = prev.roleDistribution;
    const withRoles: Player[] = shuffled.map((p, i) => ({
      ...p,
      role: (i < mrWhites ? "mrwhite" : i < mrWhites + undercovers ? "undercover" : "civilian") as PlayerRole,
      isEliminated: false,
    }));

    const withSpecial = assignSpecialRoles(withRoles, prev.specialRoleConfig);
    const { players, majorityWord, undercoverWord } = generateAndAssignWords(withSpecial);
    const speakingOrder = generateSpeakingOrder(players);

    let next: GameState = resolveRoundStart({
      ...prev,
      players,
      speakingOrder,
      phase: offline ? "offlineWordReveal" : "wordReveal",
      majorityWord,
      undercoverWord,
      currentRound: 1,
      mrWhiteGuess: undefined,
      gameMode: offline ? "offline" : "online",
      firstEliminatedId: undefined,
      offlineCurrentPlayerIndex: offline ? 0 : undefined,
      offlineVotingPlayerIndex: undefined,
      votingResults: {},
      boomerangVictims: undefined,
      tieCandidates: undefined,
      revengerPlayerId: undefined,
    });

    if (next.falafelTargets && next.falafelTargets.length > 0)
      return { ...next, phase: "falafelDecision" };
    return next;
  };

  const startGame = () => {
    setGameState(prev => {
      const isOffline = prev.gameMode === "offline";
      if (prev.currentRound === 0) return buildRound(prev, isOffline);

      // Subsequent rounds inherit the current game mode
      const nextPhase: GamePhase = isOffline ? "offlineWordReveal" : "wordReveal";
      let next: GameState = resolveRoundStart({
        ...prev,
        speakingOrder: generateSpeakingOrder(prev.players),
        phase: nextPhase,
        votingResults: {},
        currentRound: prev.currentRound + 1,
        mrWhiteGuess: undefined,
        boomerangVictims: undefined,
        tieCandidates: undefined,
        revengerPlayerId: undefined,
        offlineVotingPlayerIndex: undefined,
        offlineCurrentPlayerIndex: isOffline ? 0 : undefined,
      });

      if (next.falafelTargets && next.falafelTargets.length > 0)
        return { ...next, phase: "falafelDecision" };
      return next;
    });
  };

  /**
   * Offline-only: registers players and marks gameMode as offline, then stops at
   * GameSetup so the host can configure special roles and role distribution before
   * clicking "Start Game" (which calls startGame() above).
   */
  const initOfflinePlayers = (usernames: string[]) => {
    if (usernames.length < 4) { toast.error(t("gameSetup.atLeastFourPlayers")); return; }
    const players: Player[] = usernames.map((name, i) => ({
      id: `offline_${i}`,
      name,
      score: 0,
      specialRole: "none" as const,
    }));
    setGameState(prev => ({
      ...prev,
      players,
      gameMode: "offline",
      roleDistribution: calculateDefaultDistribution(players.length),
    }));
  };

  const rerollWords = () => {
    setGameState(prev => {
      if (prev.currentRound !== 1) return prev;
      const { players, majorityWord, undercoverWord } = generateAndAssignWords(prev.players);
      return { ...prev, players, majorityWord, undercoverWord };
    });
  };


  /** Advance to the next player's private word reveal screen. */
  const advanceOfflinePlayer = () => {
    setGameState(prev => {
      const active = prev.players.filter(p => !p.isEliminated);
      const next = (prev.offlineCurrentPlayerIndex ?? 0) + 1;
      return next >= active.length
        ? { ...prev, phase: "wordReveal", offlineCurrentPlayerIndex: undefined }
        : { ...prev, offlineCurrentPlayerIndex: next };
    });
  };

  /** Advance to the next player's private voting turn. */
  const advanceOfflineVoting = () => {
    setGameState(prev => {
      const active = prev.players.filter(p => !p.isEliminated);
      const next = (prev.offlineVotingPlayerIndex ?? 0) + 1;
      return next >= active.length
        ? { ...prev, offlineVotingPlayerIndex: undefined }
        : { ...prev, offlineVotingPlayerIndex: next };
    });
  };


  const setPhase = (phase: GamePhase) => setGameState(prev => ({ ...prev, phase }));

  const submitDescription = (playerId: string, desc: string) => {
    setGameState(prev => ({
      ...prev,
      players: prev.players.map(p => p.id === playerId ? { ...p, submittedDescription: desc } : p),
    }));
  };


  const submitVote = (voterId: string, targetId: string) => {
    setGameState(prev => {
      const votes = { ...(prev.votingResults ?? {}), [voterId]: targetId };
      const eligible = prev.players.filter(canPlayerVote);
      if (!eligible.every(p => p.id in votes)) return { ...prev, votingResults: votes };

      // Tally
      const count: Record<string, number> = {};
      Object.values(votes).forEach(id => { count[id] = (count[id] ?? 0) + 1; });
      const max = Math.max(...Object.values(count));
      const top = Object.keys(count).filter(id => count[id] === max);
      const rawElim = top[Math.floor(Math.random() * top.length)];
      const voters = Object.entries(votes).filter(([, t]) => t === rawElim).map(([v]) => v);

      const withVotes: GameState = { ...prev, votingResults: votes };
      const resolution = resolveVote(withVotes, rawElim, voters);

      if (resolution.kind === "pause")
        return { ...resolution.state, votingResults: votes, phase: "justiceDecision", tieCandidates: resolution.tieCandidates };

      if (resolution.kind === "redirect")
        return { ...resolution.state, votingResults: votes, phase: "results", lastEliminatedId: rawElim, boomerangVictims: resolution.eliminatedIds };

      return { ...withVotes, phase: "results", lastEliminatedId: rawElim, boomerangVictims: undefined };
    });
  };


  /**
   * Full elimination pipeline - called from Results "Continue" button.
   *
   * Priority:
   *   1. Boomerang victims (redirect - eliminate voters instead)
   *   2. Normal elimination of lastEliminatedId
   *   3. Lovers chain
   *   4. Revenger pause
   *   5. Victory check → discussion | gameEnd
   */
  const eliminatePlayer = (eliminatedId: string | undefined) => {
    setGameState(prev => {
      // Boomerang: eliminate the voters, not the original target
      if (prev.boomerangVictims?.length) {
        let s: GameState = { ...prev, boomerangVictims: undefined };
        for (const vid of prev.boomerangVictims) {
          s = doEliminate(s, vid);
          if (!s.firstEliminatedId) s = { ...s, firstEliminatedId: vid };
        }
        const w = checkGameEnd(s.players);
        return w ? finalizeGame({ ...s, votingResults: {} }, w) : { ...s, phase: "discussion", votingResults: {} };
      }

      if (!eliminatedId) return prev;

      let s = doEliminate(prev, eliminatedId);
      if (!s.firstEliminatedId) s = { ...s, firstEliminatedId: eliminatedId };

      const hook = resolveElimination(s, eliminatedId);

      if (hook.kind === "pause")
        return { ...hook.state, phase: "revengerDecision", revengerPlayerId: hook.revengerPlayerId };

      if (hook.kind === "chain") {
        // Lovers: kill the partner too
        s = doEliminate(hook.state, hook.nextId);
        if (!s.firstEliminatedId) s = { ...s, firstEliminatedId: hook.nextId };
      } else {
        s = hook.state;
      }

      const w = checkGameEnd(s.players);
      return w ? finalizeGame({ ...s, votingResults: {} }, w) : { ...s, phase: "discussion", votingResults: {} };
    });
  };


  const resolveJusticeDecision = (chosenId: string) => {
    setGameState(prev => ({
      ...prev,
      phase: "results",
      lastEliminatedId: chosenId,
      tieCandidates: undefined,
      boomerangVictims: undefined,
    }));
  };

  const resolveRevengerDecision = (targetId: string) => {
    setGameState(prev => {
      let s = doEliminate(prev, targetId);
      s = { ...s, revengerPlayerId: undefined };
      const w = checkGameEnd(s.players);
      return w ? finalizeGame({ ...s, votingResults: {} }, w) : { ...s, phase: "discussion", votingResults: {} };
    });
  };

  const resolveFalafelDecision = (targetId: string) => {
    setGameState(prev => {
      const s = applyFalafelEffect(prev, targetId);
      return { ...s, phase: prev.gameMode === "offline" ? "offlineWordReveal" : "wordReveal" };
    });
  };


  const submitMrWhiteGuess = (guess: string) => {
    setGameState(prev => {
      if (guess.toLowerCase() === prev.majorityWord.toLowerCase())
        return finalizeGame({ ...prev, mrWhiteGuess: guess }, "mrwhite");
      const w = checkGameEnd(prev.players);
      return w ? finalizeGame({ ...prev, mrWhiteGuess: guess }, w) : { ...prev, phase: "results", mrWhiteGuess: guess };
    });
  };


  const resetGame = () => {
    setGameState(prev => ({
      players: prev.players.map(p => ({
        ...p, isEliminated: false, submittedDescription: undefined,
        specialRole: "none" as const, specialRoleData: undefined,
        temporaryEffect: undefined, eliminatedInRound: undefined,
      })),
      phase: "setup",
      currentRound: 0,
      majorityWord: "",
      undercoverWord: "",
      mrWhiteGuess: undefined,
      roleDistribution: prev.roleDistribution,
      specialRoleConfig: prev.specialRoleConfig,
      gameMode: prev.gameMode,
      firstEliminatedId: undefined,
      tieCandidates: undefined,
      revengerPlayerId: undefined,
      falafelTargets: undefined,
      boomerangVictims: undefined,
      offlineVotingPlayerIndex: undefined,
    }));
  };

  const updateRoleDistribution = (d: RoleDistribution) => setGameState(prev => ({ ...prev, roleDistribution: d }));
  const updateSpecialRoleConfig = (c: SpecialRoleConfig) => setGameState(prev => ({ ...prev, specialRoleConfig: c }));

  return (
    <GameContext.Provider value={{
      gameState, setGameState,
      addPlayer, removePlayer,
      startGame, initOfflinePlayers, setPhase,
      submitVote, submitMrWhiteGuess, submitDescription,
      resetGame, updateRoleDistribution, updateSpecialRoleConfig,
      checkGameEnd, eliminatePlayer, rerollWords,
      resolveJusticeDecision, resolveRevengerDecision, resolveFalafelDecision,
      advanceOfflinePlayer, advanceOfflineVoting,
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within a GameProvider");
  return ctx;
};
