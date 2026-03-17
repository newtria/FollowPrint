import type { AnalysisResult } from "./types";

export interface CharacterResult {
  type: string;
  typeKey: string;
  emoji: string;
  stats: {
    socialScore: number; // 0-100
    loyaltyScore: number;
    curiosityScore: number;
    selectivityScore: number;
    activeHour: number; // 0-23
    followsPerMonth: number;
  };
  highlights: string[]; // i18n keys
}

export function analyzeCharacter(data: AnalysisResult): CharacterResult {
  const {
    followers,
    following,
    mutual,
    nonMutual,
    fansOnly,
    pendingRequests,
    recentlyUnfollowed,
    closeFriends,
  } = data;

  const totalFollowing = following.length;
  const totalFollowers = followers.length;
  const mutualRate = totalFollowing > 0 ? mutual.length / totalFollowing : 0;
  const ratio =
    totalFollowing > 0 ? totalFollowers / totalFollowing : 0;
  const pendingRate =
    pendingRequests.length + totalFollowing > 0
      ? pendingRequests.length / (pendingRequests.length + totalFollowing)
      : 0;
  const closeFriendsRate =
    totalFollowers > 0 ? closeFriends.length / totalFollowers : 0;

  // Activity hour analysis from timestamps
  const allTimestamps = [
    ...followers.map((a) => a.timestamp),
    ...following.map((a) => a.timestamp),
    ...pendingRequests.map((a) => a.timestamp),
  ].filter((t) => t > 0);

  const hourCounts = new Array(24).fill(0);
  for (const ts of allTimestamps) {
    const hour = new Date(ts * 1000).getHours();
    hourCounts[hour]++;
  }
  const activeHour = hourCounts.indexOf(Math.max(...hourCounts));

  // Follows per month
  const now = Date.now() / 1000;
  const followTimestamps = following
    .map((a) => a.timestamp)
    .filter((t) => t > 0);
  const oldestFollow = Math.min(...followTimestamps, now);
  const monthsActive = Math.max(1, (now - oldestFollow) / (30 * 86400));
  const followsPerMonth = Math.round(totalFollowing / monthsActive);

  // Scores (0-100)
  const socialScore = Math.min(
    100,
    Math.round(
      (totalFollowers + totalFollowing) / 10 + mutualRate * 50
    )
  );
  const loyaltyScore = Math.round(
    mutualRate * 70 +
      (1 - Math.min(1, recentlyUnfollowed.length / Math.max(1, totalFollowing))) * 30
  );
  const curiosityScore = Math.min(
    100,
    Math.round(pendingRate * 200 + followsPerMonth * 3)
  );
  const selectivityScore = Math.round(
    (1 - Math.min(1, totalFollowing / Math.max(1, totalFollowing + 500))) * 50 +
      mutualRate * 50
  );

  // Determine type
  const typeKey = determineType(
    ratio,
    mutualRate,
    totalFollowing,
    totalFollowers,
    pendingRate,
    closeFriendsRate
  );

  const emojiMap: Record<string, string> = {
    influencer: "S",
    butterfly: "A",
    observer: "B",
    selective: "A",
    explorer: "B",
    minimalist: "C",
  };

  // Highlights
  const highlights: string[] = [];
  if (pendingRequests.length > 0)
    highlights.push("character.highlights.pendingCount");
  if (mutualRate > 0.7) highlights.push("character.highlights.highMutual");
  if (mutualRate < 0.3) highlights.push("character.highlights.lowMutual");
  if (fansOnly.length > nonMutual.length)
    highlights.push("character.highlights.moreFans");
  if (nonMutual.length > fansOnly.length)
    highlights.push("character.highlights.moreNonMutual");
  if (closeFriends.length > 5)
    highlights.push("character.highlights.closeFriends");
  if (recentlyUnfollowed.length > 3)
    highlights.push("character.highlights.activeUnfollower");

  return {
    type: typeKey,
    typeKey,
    emoji: emojiMap[typeKey] || "B",
    stats: {
      socialScore,
      loyaltyScore,
      curiosityScore,
      selectivityScore,
      activeHour,
      followsPerMonth,
    },
    highlights,
  };
}

function determineType(
  ratio: number,
  mutualRate: number,
  following: number,
  followers: number,
  pendingRate: number,
  closeFriendsRate: number
): string {
  // Influencer: much more followers than following
  if (ratio > 3 && followers > 500) return "influencer";

  // Selective: few following, high mutuality
  if (following < 200 && mutualRate > 0.6) return "selective";

  // Explorer: many pending requests, actively seeking connections
  if (pendingRate > 0.1) return "explorer";

  // Social Butterfly: high everything, high mutuality
  if (following > 300 && mutualRate > 0.5) return "butterfly";

  // Observer: follows many, few follow back
  if (following > 300 && mutualRate < 0.3) return "observer";

  // Minimalist: low overall activity
  if (following < 100 && followers < 100) return "minimalist";

  // Default
  if (mutualRate > 0.5) return "butterfly";
  return "observer";
}
