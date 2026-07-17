import { SpecialRoleDefinition, ElimResult } from "../engine/types";
import { GameState } from "../../types/game";

/**
 * Lovers: Two players are linked. When one dies the other dies immediately.
 * The second death triggers full elimination logic (Revenger, Ghost, Victory check).
 */
export const LoversRole: SpecialRoleDefinition = {
  role: "lovers",

  onPlayerEliminated(state: GameState, eliminatedId: string): ElimResult | null {
    const eliminatedPlayer = state.players.find(p => p.id === eliminatedId);
    if (eliminatedPlayer?.specialRole !== "lovers") return null;

    const loverId = eliminatedPlayer.specialRoleData?.loverId;
    if (!loverId) return null;

    const lover = state.players.find(p => p.id === loverId);
    // Only chain if the partner is still alive
    if (!lover || lover.isEliminated) return null;

    return { kind: "chain", nextId: loverId, state };
  },
};
