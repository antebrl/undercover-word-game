// Public API for the Special Role system
export { assignSpecialRoles, DEFAULT_SPECIAL_ROLE_CONFIG, resolveVote, resolveElimination, resolveGameEnd, resolveRoundStart, canPlayerVote, canPlayerSpeak } from "./engine/SpecialRoleEngine";
export type { SpecialRoleDefinition, VoteResolveResult, ElimResult } from "./engine/types";
export { applyFalafelEffect, FALAFEL_EFFECTS, FALAFEL_EFFECT_LABELS } from "./special/FalafelVendorRole";
export { isEmojiOnly } from "./special/MrMemeRole";
