import { SpecialRoleDefinition, ElimResult } from "../engine/types";
import { GameState } from "../../types/game";

/**
 * Revenger: When eliminated, chooses one living player to take down with them.
 * Ability is single-use.
 */
export const RevengerRole: SpecialRoleDefinition = {
  role: "revenger",

  onPlayerEliminated(state: GameState, eliminatedId: string): ElimResult | null {
    const eliminated = state.players.find(p => p.id === eliminatedId);
    if (eliminated?.specialRole !== "revenger") return null;
    if (eliminated.specialRoleData?.revengeUsed) return null;

    // Check there are living targets available
    const livingTargets = state.players.filter(
      p => !p.isEliminated && p.id !== eliminatedId
    );
    if (livingTargets.length === 0) return null;

    return {
      kind: "pause",
      phase: "revengerDecision",
      revengerPlayerId: eliminatedId,
      state: {
        ...state,
        revengerPlayerId: eliminatedId,
        players: state.players.map(p =>
          p.id === eliminatedId
            ? { ...p, specialRoleData: { ...p.specialRoleData, revengeUsed: true } }
            : p
        ),
      },
    };
  },
};
