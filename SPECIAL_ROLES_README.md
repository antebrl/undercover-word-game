# Special Roles System - Architecture Guide

## Overview

The special roles system is a modular, event-driven extension to the core game. It uses a **Role Engine** that intercepts key game events and lets each role modify game state in isolation.

---

## Directory Structure

```
src/
├── roles/
│   ├── engine/
│   │   ├── types.ts              # SpecialRoleDefinition interface & result types
│   │   └── SpecialRoleEngine.ts  # Registry + event dispatchers
│   └── special/
│       ├── BoomerangRole.ts
│       ├── DuelistRole.ts
│       ├── FalafelVendorRole.ts
│       ├── GhostRole.ts
│       ├── JoyFoolRole.ts
│       ├── JusticeRole.ts
│       ├── LoversRole.ts
│       ├── MrMemeRole.ts
│       └── RevengerRole.ts
├── components/shared/
│   ├── JusticeScreen.tsx         # UI for Justice tie-break decision
│   ├── RevengerScreen.tsx        # UI for Revenger revenge pick
│   └── FalafelScreen.tsx         # UI for Falafel Vendor target pick
└── hooks/
    └── useIsHost.ts              # Returns true for online host OR offline device
```

---

## Event Priority Order

```
Votes tallied
    │
    ▼
1. Justice (onBeforeElimination) - pauses if tied
2. Boomerang (onBeforeElimination) - redirects voters → eliminated instead
    │
    ▼
Elimination applied (player marked isEliminated)
    │
    ▼
3. Lovers (onPlayerEliminated) - chain-kills partner
4. Revenger (onPlayerEliminated) - pauses for revenge pick
5. Ghost - no hook needed; canPlayerVote() handles participation
    │
    ▼
Victory check
    │
    ▼
6. JoyFool (onGameEnd) - bonus points if first eliminated
7. Duelist (onGameEnd) - bonus/penalty based on survival order
    │
    ▼
Round start
    │
    ▼
8. FalafelVendor (onRoundStart) - clears old effects, pauses for vendor pick
```

---

## Adding a New Special Role

1. Create `src/roles/special/MyRole.ts`:

```typescript
import { SpecialRoleDefinition } from "../engine/types";

export const MyRole: SpecialRoleDefinition = {
  role: "myRole",

  onPlayerEliminated(state, eliminatedId) {
    // return null to pass through, or a result to modify state
    return null;
  },
};
```

2. Register it in `src/roles/engine/SpecialRoleEngine.ts`:

```typescript
import { MyRole } from "../special/MyRole";

const ROLE_REGISTRY: SpecialRoleDefinition[] = [
  // ...existing roles...
  MyRole,  // add here in correct priority position
];
```

3. Add it to the `SpecialRole` type in `src/types/game.ts`:

```typescript
export type SpecialRole = "none" | ... | "myRole";
```

4. Add it to `DEFAULT_SPECIAL_ROLE_CONFIG` in `SpecialRoleEngine.ts`.

5. Add translation keys in `src/i18n/locales/en/en.ts` under `specialRoles.myRole.desc`.

6. Add the role to the `SPECIAL_ROLES` array in `GameSetup.tsx`.

That's it - no changes to `GameContext.tsx` or any other file.

---

## Offline Mode

The offline mode allows a single device to run a full game. Key behaviour:

- **Word Reveal**: Sequential private reveal (`offlineWordReveal` phase). Each player taps to see their word, then passes the device.
- **Discussion**: Standard `wordReveal` phase with a "See My Word" toggle button.
- **Voting**: Sequential private voting (`OfflineVotingTurn` inside `VotingScreen`). Each player reveals their voting screen, votes, then passes the device.
- **Special role decisions**: Justice / Revenger / Falafel screens show choices to anyone on the device (it is passed to the relevant player to decide).

`useIsHost()` returns `true` for the online PeerJS host AND for any player in offline mode, giving offline players full host-level control.

---

## Special Role Descriptions

| Role | Trigger | Effect |
|------|---------|--------|
| ⚖️ Justice | Tie in votes | Pauses game; Justice picks who dies |
| ❤️ Lovers | Either lover eliminated | Partner immediately eliminated |
| 💀 Revenger | Revenger eliminated | Pauses game; Revenger picks a living target |
| 👻 Ghost | Ghost eliminated | Ghost can still vote & give clues |
| 🤡 Joy Fool | Game ends | Bonus pts if Joy Fool was first eliminated |
| 🪃 Boomerang | Boomerang voted out (1st time) | All voters eliminated; Boomerang survives |
| ⚔️ Duelist | Game ends | Surviving duelist gets bonus; earlier-eliminated gets penalty |
| 🥙 Falafel Vendor | Round starts | Vendor picks a player; they get a random temporary effect |
| 🎭 Mr. Meme | Clue phase | Mr. Meme can only submit emoji-only clues |

