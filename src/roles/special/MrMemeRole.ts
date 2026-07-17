import { SpecialRoleDefinition } from "../engine/types";

/**
 * Mr. Meme: Cannot give a normal text clue - must use emoji-only.
 * Enforced in the WordReveal UI by checking specialRole === "mrMeme"
 * and validating that the submitted description contains no non-emoji characters.
 * No game-state hooks needed.
 */
export const MrMemeRole: SpecialRoleDefinition = {
  role: "mrMeme",
};

/** Returns true if the string is emoji-only (no regular Latin/CJK characters). */
export const isEmojiOnly = (text: string): boolean => {
  // Strip all emoji and whitespace - if nothing remains the input is emoji-only
  const stripped = text.replace(
    /(\p{Emoji_Presentation}|\p{Extended_Pictographic}|\s)/gu,
    ""
  );
  return stripped.length === 0 && text.trim().length > 0;
};
