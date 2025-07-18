export interface ScoreboardParams {
  filter: "weekly" | "monthly" | "all-time";
  page?: number;
  limit?: number;
}
