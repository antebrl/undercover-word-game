import { GameState, SpecialRole } from "../../types/game";

/**
 * Result returned when a vote resolves.
 * A role can redirect the elimination (Boomerang), pause for a decision (Justice),
 * or keep processing normally (most roles).
 */
export type VoteResolveResult =
  | { kind: "normal"; eliminatedId: string; state: GameState }
  | { kind: "redirect"; eliminatedIds: string[]; state: GameState } // Boomerang
  | { kind: "pause"; phase: "justiceDecision"; tieCandidates: string[]; state: GameState }; // Justice

/**
 * Result returned after a player is actually eliminated.
 * A role can chain additional eliminations (Lovers, Revenger).
 */
export type ElimResult =
  | { kind: "done"; state: GameState }
  | { kind: "chain"; nextId: string; state: GameState }   // Lovers
  | { kind: "pause"; phase: "revengerDecision"; revengerPlayerId: string; state: GameState }; // Revenger

/**
 * Every special role implements this interface.
 * All handlers are optional - only implement what the role needs.
 *
 * PRIORITY ORDER (applied in this sequence each time votes resolve):
 *   1. onBeforeElimination  - Boomerang (may redirect), Justice (may pause for tie)
 *   2. onPlayerEliminated   - Lovers (chain death), Revenger (pause for revenge pick)
 *   3. onGameEnd            - JoyFool, Duelist (scoring adjustments)
 *   4. onRoundStart         - FalafelVendor (picks a target at round start)
 */
export interface SpecialRoleDefinition {
  role: SpecialRole;

  /**
   * Called when votes are fully counted, before the elimination is applied.
   * Returning a redirect or pause overrides normal flow.
   */
  onBeforeElimination?: (
    state: GameState,
    eliminatedId: string,
    voterIds: string[]
  ) => VoteResolveResult | null;

  /**
   * Called immediately after a player is marked isEliminated=true.
   * Can chain another elimination or pause for a decision.
   */
  onPlayerEliminated?: (
    state: GameState,
    eliminatedId: string
  ) => ElimResult | null;

  /**
   * Called at game end to adjust scores.
   */
  onGameEnd?: (state: GameState) => GameState;

  /**
   * Called at the start of every new round.
   */
  onRoundStart?: (state: GameState) => GameState;
}
