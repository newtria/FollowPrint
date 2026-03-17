export interface InstagramAccount {
  username: string;
  profileUrl: string;
  timestamp: number;
}

export interface InstagramData {
  pendingRequests: InstagramAccount[];
  followers: InstagramAccount[];
  following: InstagramAccount[];
  recentlyUnfollowed: InstagramAccount[];
  closeFriends: InstagramAccount[];
  blockedAccounts: InstagramAccount[];
  restrictedAccounts: InstagramAccount[];
}

export interface AnalysisResult extends InstagramData {
  nonMutual: InstagramAccount[];
  fansOnly: InstagramAccount[];
  mutual: InstagramAccount[];
}

export type TabKey =
  | "pending"
  | "nonMutual"
  | "fansOnly"
  | "mutual"
  | "unfollowed"
  | "closeFriends"
  | "blocked"
  | "restricted";

export interface RankedItem {
  name: string;
  count: number;
}

export interface TimestampedItem {
  name: string;
  timestamp: number;
}

export interface InsightsData {
  topLikedAccounts: RankedItem[];
  topSavedAccounts: RankedItem[];
  profileSearches: TimestampedItem[];
  wordSearches: TimestampedItem[];
  loginHours: number[]; // 24 elements
  chatNames: string[];
}

export interface FullData {
  analysis: AnalysisResult;
  insights: InsightsData;
}
