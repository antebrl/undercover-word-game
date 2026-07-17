import { SpecialRoleDefinition } from "../engine/types";
import { GameState } from "../../types/game";

const JOY_FOOL_BONUS = 5;

/**
 * Joy Fool: Earns bonus points if they are the very first player eliminated
 * across the entire game session (not just a round).
 */
export const JoyFoolRole: SpecialRoleDefinition = {
  role: "joyFool",

  onGameEnd(state: GameState): GameState {
    const firstEliminated = state.players.find(
      p => p.id === state.firstEliminatedId
    );
    if (firstEliminated?.specialRole !== "joyFool") return state;

    return {
      ...state,
      players: state.players.map(p =>
        p.id === firstEliminated.id
          ? { ...p, score: (p.score ?? 0) + JOY_FOOL_BONUS }
          : p
      ),
    };
  },
};
