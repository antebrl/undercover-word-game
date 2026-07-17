import { SpecialRoleDefinition } from "../engine/types";

/**
 * Ghost: After being eliminated, the Ghost player can still vote and discuss.
 * Their isEliminated flag is set normally (for win-condition purposes),
 * but the UI reads specialRole === "ghost" to grant participation rights.
 * No mechanical hooks needed here - handled purely in UI + vote counting.
 */
export const GhostRole: SpecialRoleDefinition = {
  role: "ghost",
  // Ghost lives in the UI layer:
  //   - VotingScreen: include ghost in active voters
  //   - WordReveal: show ghost as still-describing
  //   - PlayerList: render ghost icon and semi-transparent styling
};
