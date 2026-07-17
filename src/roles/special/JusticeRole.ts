import { SpecialRoleDefinition, VoteResolveResult } from "../engine/types";
import { GameState } from "../../types/game";

/**
 * Goddess of Justice: When there is a tie in votes, Justice (alive OR dead) 
 * pauses the game and picks which tied player is eliminated.
 * If no tie, this hook returns null and normal flow continues.
 */
export const JusticeRole: SpecialRoleDefinition = {
  role: "justice",

  onBeforeElimination(state: GameState, _eliminatedId: string, _voterIds: string[]): VoteResolveResult | null {
    const justicePlayer = state.players.find(p => p.specialRole === "justice");
    if (!justicePlayer) return null;

    const count: Record<string, number> = {};
    Object.values(state.votingResults ?? {}).forEach(id => {
      count[id] = (count[id] ?? 0) + 1;
    });
    if (Object.keys(count).length === 0) return null;

    const max = Math.max(...Object.values(count));
    const tied = Object.keys(count).filter(id => count[id] === max);

    // Only intervene when there's actually a tie
    if (tied.length <= 1) return null;

    return {
      kind: "pause",
      phase: "justiceDecision",
      tieCandidates: tied,
      state: { ...state, tieCandidates: tied },
    };
  },
};
