export type PlayerRole = "civilian" | "undercover" | "mrwhite" | "spectator";

export type SpecialRole =
  | "none"
  | "justice"
  | "lovers"
  | "revenger"
  | "ghost"
  | "joyFool"
  | "boomerang"
  | "duelist"
  | "falafelVendor"
  | "mrMeme";

export type TemporaryEffect =
  | "extraVote"
  | "cannotVote"
  | "protected"
  | "doubleVote"
  | "silenced";

export type SpecialRoleData = {
  loverId?: string;
  duelOpponentId?: string;
  boomerangUsed?: boolean;
  revengeUsed?: boolean;
};

export type RoleDistribution = {
  undercovers: number;
  mrWhites: number;
};

export type SpecialRoleConfig = Record<SpecialRole, boolean>;

export type Player = {
  id: string;
  name: string;
  word?: string;
  role?: PlayerRole;
  specialRole?: SpecialRole;
  specialRoleData?: SpecialRoleData;
  temporaryEffect?: TemporaryEffect;
  isEliminated?: boolean;
  score?: number;
  submittedDescription?: string;
  eliminatedInRound?: number;
};

export type GamePhase =
  | "setup"
  | "wordReveal"
  | "discussion"        // Inter-round lobby - maps to GameLobby
  | "voting"
  | "results"
  | "gameEnd"
  | "justiceDecision"   // Paused: Justice picks from tied candidates
  | "revengerDecision"  // Paused: Revenger picks revenge target
  | "falafelDecision"   // Paused: Vendor picks target for round effect
  | "offlineWordReveal"; // Offline: sequential private reveal on one device

export type GameMode = "online" | "offline";

export type GameState = {
  players: Player[];
  phase: GamePhase;
  currentRound: number;
  majorityWord: string;
  undercoverWord: string;
  votingResults?: Record<string, string>;
  speakingOrder?: string[];
  lastEliminatedId?: string;
  winner?: string;
  mrWhiteGuess?: string;
  roleDistribution: RoleDistribution;
  specialRoleConfig: SpecialRoleConfig;
  gameMode: GameMode;
  // Special role interaction state
  tieCandidates?: string[];
  revengerPlayerId?: string;
  falafelTargets?: string[];
  boomerangVictims?: string[];  // Voters who will be eliminated instead of Boomerang
  // Scoring helpers
  firstEliminatedId?: string;
  // Offline mode
  offlineCurrentPlayerIndex?: number;
  offlineVotingPlayerIndex?: number;
};
