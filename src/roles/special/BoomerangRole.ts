import { SpecialRoleDefinition, VoteResolveResult } from "../engine/types";
import { GameState } from "../../types/game";

/**
 * Boomerang: The first time this player would be eliminated by votes,
 * ALL living players who voted for them are eliminated instead.
 * Boomerang survives. Ability is single-use; subsequent eliminations are normal.
 */
export const BoomerangRole: SpecialRoleDefinition = {
  role: "boomerang",

  onBeforeElimination(state: GameState, eliminatedId: string, _voterIds: string[]): VoteResolveResult | null {
    const boomerang = state.players.find(p => p.id === eliminatedId);
    if (boomerang?.specialRole !== "boomerang") return null;
    if (boomerang.specialRoleData?.boomerangUsed) return null;

    const victims = Object.entries(state.votingResults ?? {})
      .filter(([, targetId]) => targetId === eliminatedId)
      .map(([voterId]) => voterId)
      .filter(id => {
        const voter = state.players.find(p => p.id === id);
        return voter && !voter.isEliminated;
      });

    if (victims.length === 0) return null;

    const updatedState: GameState = {
      ...state,
      players: state.players.map(p =>
        p.id === eliminatedId
          ? { ...p, specialRoleData: { ...p.specialRoleData, boomerangUsed: true } }
          : p
      ),
    };

    return { kind: "redirect", eliminatedIds: victims, state: updatedState };
  },
};
