import { SpecialRoleDefinition } from "../engine/types";
import { GameState } from "../../types/game";

const DUELIST_WINNER_BONUS = 5;
const DUELIST_LOSER_PENALTY = -2;

/**
 * Duelists: Two linked players compete. Whichever survives longer earns
 * bonus points; the earlier-eliminated one loses points.
 * Scoring is applied at game end.
 */
export const DuelistRole: SpecialRoleDefinition = {
  role: "duelist",

  onGameEnd(state: GameState): GameState {
    // Collect all Duelist pairs (avoid double-processing)
    const processed = new Set<string>();
    let players = [...state.players];

    for (const player of players) {
      if (player.specialRole !== "duelist") continue;
      if (processed.has(player.id)) continue;

      const opponentId = player.specialRoleData?.duelOpponentId;
      if (!opponentId) continue;

      const opponent = players.find(p => p.id === opponentId);
      if (!opponent) continue;

      processed.add(player.id);
      processed.add(opponentId);

      // Lower eliminatedInRound (or undefined if still alive) = survived longer
      const playerRound = player.eliminatedInRound ?? Infinity;
      const opponentRound = opponent.eliminatedInRound ?? Infinity;

      if (playerRound === opponentRound) continue; // Equal survival - no bonus

      const winnerId = playerRound > opponentRound ? player.id : opponent.id;
      const loserId = playerRound > opponentRound ? opponent.id : player.id;

      players = players.map(p => {
        if (p.id === winnerId) return { ...p, score: (p.score ?? 0) + DUELIST_WINNER_BONUS };
        if (p.id === loserId) return { ...p, score: (p.score ?? 0) + DUELIST_LOSER_PENALTY };
        return p;
      });
    }

    return { ...state, players };
  },
};
