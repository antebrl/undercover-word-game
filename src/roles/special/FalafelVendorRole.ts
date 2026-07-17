import { SpecialRoleDefinition } from "../engine/types";
import { GameState, TemporaryEffect } from "../../types/game";
import { shuffle } from "../../lib/utils";

// All possible one-round effects the Falafel Vendor can apply
export const FALAFEL_EFFECTS: TemporaryEffect[] = [
  "extraVote",
  "cannotVote",
  "protected",
  "doubleVote",
  "silenced",
];

export const FALAFEL_EFFECT_LABELS: Record<TemporaryEffect, string> = {
  extraVote: "Extra Vote 🗳️",
  cannotVote: "Cannot Vote 🚫",
  protected: "Protected 🛡️",
  doubleVote: "Double Vote ✌️",
  silenced: "Silenced 🤐",
};

/**
 * Falafel Vendor: At the start of every round, the Vendor chooses one player.
 * That player receives a random temporary effect that lasts for the round.
 * Effects are listed in FALAFEL_EFFECTS above.
 *
 * The actual UI pause for the Vendor's choice is triggered by the
 * "falafelDecision" phase, which GameContext enters at round start when
 * a living Falafel Vendor exists.
 */
export const FalafelVendorRole: SpecialRoleDefinition = {
  role: "falafelVendor",

  onRoundStart(state: GameState): GameState {
    // Clear last round's effects
    const cleanedPlayers = state.players.map(p => ({ ...p, temporaryEffect: undefined }));
    const vendor = cleanedPlayers.find(
      p => p.specialRole === "falafelVendor" && !p.isEliminated
    );

    if (!vendor) return { ...state, players: cleanedPlayers };

    // List living, non-vendor targets the UI lets vendor choose from
    const targets = cleanedPlayers
      .filter(p => !p.isEliminated && p.id !== vendor.id)
      .map(p => p.id);

    // Phase switch happens in GameContext; here we just prep the target list
    return {
      ...state,
      players: cleanedPlayers,
      falafelTargets: targets,
    };
  },
};

/** Apply a random effect to the selected target. Called from GameContext. */
export const applyFalafelEffect = (
  state: GameState,
  targetId: string
): GameState => {
  const effects = shuffle([...FALAFEL_EFFECTS]);
  const effect = effects[0];

  return {
    ...state,
    players: state.players.map(p =>
      p.id === targetId ? { ...p, temporaryEffect: effect } : p
    ),
    falafelTargets: undefined,
  };
};
