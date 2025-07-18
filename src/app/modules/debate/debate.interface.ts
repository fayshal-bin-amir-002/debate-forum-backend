export interface ScoreboardParams {
  filter: "weekly" | "monthly" | "all-time";
  page?: number;
  limit?: number;
}

export interface DebateQueryParams {
  searchTerm?: string;
  sortBy?: "mostVoted" | "newest" | "endingSoon";
}

export const BANNED_WORDS = [
  "stupid",
  "idiot",
  "dumb",
  "fool",
  "moron",
  "loser",
  "ugly",
  "shut up",
  "nonsense",
  "trash",
  "garbage",
  "jerk",
  "douche",
  "bastard",
  "suck",
  "hate you",
  "kill yourself",
  "noob",
  "dumbass",
  "retard",
  "freak",
  "psycho",
  "worthless",
  "annoying",
  "lame",
  "crap",
];
