import { GameState, SpecialRole, SpecialRoleConfig, Player } from "../../types/game";
import { SpecialRoleDefinition, VoteResolveResult, ElimResult } from "./types";
import { shuffle } from "../../lib/utils";

// Import every role. To add a new role: create its file, import it here,
// and add it to ROLE_REGISTRY. Zero changes needed to GameContext.

import { LoversRole } from "../special/LoversRole";
import { JusticeRole } from "../special/JusticeRole";
import { RevengerRole } from "../special/RevengerRole";
import { GhostRole } from "../special/GhostRole";
import { JoyFoolRole } from "../special/JoyFoolRole";
import { BoomerangRole } from "../special/BoomerangRole";
import { DuelistRole } from "../special/DuelistRole";
import { FalafelVendorRole } from "../special/FalafelVendorRole";
import { MrMemeRole } from "../special/MrMemeRole";

const ROLE_REGISTRY: SpecialRoleDefinition[] = [
  JusticeRole,  // Must run first - may pause before elimination
  BoomerangRole, // Redirects elimination to voters
  LoversRole,    // Chains death after elimination
  RevengerRole,  // Pauses for revenge pick after elimination
  GhostRole,
  JoyFoolRole,   // Scores at game end
  DuelistRole,   // Scores at game end
  FalafelVendorRole,
  MrMemeRole,
];


export const DEFAULT_SPECIAL_ROLE_CONFIG: SpecialRoleConfig = {
  none: false,
  justice: false,
  lovers: false,
  revenger: false,
  ghost: false,
  joyFool: false,
  boomerang: false,
  duelist: false,
  falafelVendor: false,
  mrMeme: false,
};

/**
 * Assign special roles to players at game start.
 *
 * Rules:
 *   - Roles that need a pair (lovers, duelist) consume two players each.
 *   - Every player gets at most one special role.
 *   - If fewer available players than a role requires, that role is skipped.
 *   - All remaining players keep specialRole === "none".
 */
export const assignSpecialRoles = (
  players: Player[],
  config: SpecialRoleConfig
): Player[] => {
  const enabled = (Object.entries(config) as [SpecialRole, boolean][])
    .filter(([role, on]) => role !== "none" && on)
    .map(([role]) => role);

  if (enabled.length === 0) {
    return players.map(p => ({ ...p, specialRole: "none" as SpecialRole }));
  }

  // Work on a mutable copy; track which players have been assigned
  let result: Player[] = players.map(p => ({
    ...p,
    specialRole: "none" as SpecialRole,
    specialRoleData: undefined,
  }));
  const available = shuffle([...players.map(p => p.id)]);
  const taken = new Set<string>();

  const take = (): string | undefined => {
    while (available.length > 0) {
      const id = available.shift()!;
      if (!taken.has(id)) { taken.add(id); return id; }
    }
    return undefined;
  };

  const assign = (id: string, role: SpecialRole, extra?: Record<string, unknown>) => {
    result = result.map(p =>
      p.id === id
        ? { ...p, specialRole: role, specialRoleData: { ...p.specialRoleData, ...extra } }
        : p
    );
  };

  for (const role of enabled) {
    if (role === "lovers" || role === "duelist") {
      const p1 = take();
      const p2 = take();
      if (!p1 || !p2) continue; // Not enough players
      if (role === "lovers") {
        assign(p1, "lovers", { loverId: p2 });
        assign(p2, "lovers", { loverId: p1 });
      } else {
        assign(p1, "duelist", { duelOpponentId: p2 });
        assign(p2, "duelist", { duelOpponentId: p1 });
      }
    } else {
      const p1 = take();
      if (!p1) continue;
      assign(p1, role);
    }
  }

  return result;
};

/**
 * Called when all votes are in and an eliminated player has been chosen.
 * Runs onBeforeElimination hooks in priority order.
 * Returns the first non-null result, or a plain "normal" result.
 */
export const resolveVote = (
  state: GameState,
  eliminatedId: string,
  voterIds: string[]
): VoteResolveResult => {
  for (const def of ROLE_REGISTRY) {
    if (!def.onBeforeElimination) continue;
    const result = def.onBeforeElimination(state, eliminatedId, voterIds);
    if (result !== null && result !== undefined) return result;
  }
  return { kind: "normal", eliminatedId, state };
};


/**
 * Called after a player is marked isEliminated=true in state.
 * Runs onPlayerEliminated hooks in priority order.
 */
export const resolveElimination = (
  state: GameState,
  eliminatedId: string
): ElimResult => {
  for (const def of ROLE_REGISTRY) {
    if (!def.onPlayerEliminated) continue;
    const result = def.onPlayerEliminated(state, eliminatedId);
    if (result !== null && result !== undefined) return result;
  }
  return { kind: "done", state };
};


/**
 * Called when the game ends. Each role's onGameEnd hook can adjust scores.
 */
export const resolveGameEnd = (state: GameState): GameState => {
  let s = state;
  for (const def of ROLE_REGISTRY) {
    if (def.onGameEnd) s = def.onGameEnd(s);
  }
  return s;
};


/**
 * Called at the start of each new round. Runs all onRoundStart hooks.
 */
export const resolveRoundStart = (state: GameState): GameState => {
  let s = state;
  for (const def of ROLE_REGISTRY) {
    if (def.onRoundStart) s = def.onRoundStart(s);
  }
  return s;
};


/**
 * Returns true if this player is allowed to vote.
 * Eliminated Ghosts can still vote.
 */
export const canPlayerVote = (player: Player): boolean => {
  if (!player.isEliminated) return true;
  return player.specialRole === "ghost";
};

/**
 * Returns true if this player should appear in the speaking order / discussion.
 */
export const canPlayerSpeak = (player: Player): boolean => {
  if (!player.isEliminated) return true;
  return player.specialRole === "ghost";
};
