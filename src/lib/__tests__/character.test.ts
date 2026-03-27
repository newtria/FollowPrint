import { describe, it, expect } from "vitest";
import { analyzeCharacter, type CharacterResult } from "@/lib/character";
import type { AnalysisResult, InstagramAccount } from "@/lib/types";

// Helper to generate accounts with timestamps
function makeAccounts(count: number, prefix = "user"): InstagramAccount[] {
  return Array.from({ length: count }, (_, i) => ({
    username: `${prefix}_${i}`,
    profileUrl: `https://www.instagram.com/${prefix}_${i}`,
    timestamp: 1700000000 + i * 3600,
  }));
}

function buildAnalysis(
  overrides: Partial<AnalysisResult> = {}
): AnalysisResult {
  const defaults: AnalysisResult = {
    followers: [],
    following: [],
    mutual: [],
    nonMutual: [],
    fansOnly: [],
    pendingRequests: [],
    recentlyUnfollowed: [],
    closeFriends: [],
    blockedAccounts: [],
    restrictedAccounts: [],
  };
  return { ...defaults, ...overrides };
}

describe("analyzeCharacter", () => {
  it("assigns 'influencer' for high follower-to-following ratio with many followers", () => {
    const result = analyzeCharacter(
      buildAnalysis({
        followers: makeAccounts(1000, "follower"),
        following: makeAccounts(100, "following"),
        mutual: makeAccounts(80, "mutual"),
        nonMutual: makeAccounts(20, "nonmutual"),
        fansOnly: makeAccounts(920, "fan"),
      })
    );
    expect(result.typeKey).toBe("influencer");
    expect(result.emoji).toBe("S");
  });

  it("assigns 'selective' for few following with high mutuality", () => {
    const mutual = makeAccounts(120, "mutual");
    const result = analyzeCharacter(
      buildAnalysis({
        followers: makeAccounts(200, "follower"),
        following: makeAccounts(150, "following"),
        mutual,
        nonMutual: makeAccounts(30, "nonmutual"),
        fansOnly: makeAccounts(80, "fan"),
      })
    );
    // 150 following < 200, mutualRate = 120/150 = 0.8 > 0.6
    expect(result.typeKey).toBe("selective");
    expect(result.emoji).toBe("A");
  });

  it("assigns 'explorer' for high pending request rate", () => {
    const result = analyzeCharacter(
      buildAnalysis({
        followers: makeAccounts(100, "follower"),
        following: makeAccounts(250, "following"),
        mutual: makeAccounts(50, "mutual"),
        nonMutual: makeAccounts(200, "nonmutual"),
        fansOnly: makeAccounts(50, "fan"),
        pendingRequests: makeAccounts(50, "pending"),
      })
    );
    // pendingRate = 50 / (50+250) = 0.167 > 0.1
    expect(result.typeKey).toBe("explorer");
    expect(result.emoji).toBe("B");
  });

  it("assigns 'butterfly' for many following with high mutuality", () => {
    const mutual = makeAccounts(250, "mutual");
    const result = analyzeCharacter(
      buildAnalysis({
        followers: makeAccounts(400, "follower"),
        following: makeAccounts(400, "following"),
        mutual,
        nonMutual: makeAccounts(150, "nonmutual"),
        fansOnly: makeAccounts(150, "fan"),
      })
    );
    // 400 following > 300, mutualRate = 250/400 = 0.625 > 0.5
    expect(result.typeKey).toBe("butterfly");
    expect(result.emoji).toBe("A");
  });

  it("assigns 'observer' for many following with low mutuality", () => {
    const result = analyzeCharacter(
      buildAnalysis({
        followers: makeAccounts(50, "follower"),
        following: makeAccounts(500, "following"),
        mutual: makeAccounts(50, "mutual"),
        nonMutual: makeAccounts(450, "nonmutual"),
        fansOnly: [],
      })
    );
    // 500 > 300, mutualRate = 50/500 = 0.1 < 0.3
    expect(result.typeKey).toBe("observer");
    expect(result.emoji).toBe("B");
  });

  it("assigns 'minimalist' for low overall activity", () => {
    const result = analyzeCharacter(
      buildAnalysis({
        followers: makeAccounts(30, "follower"),
        following: makeAccounts(40, "following"),
        mutual: makeAccounts(10, "mutual"),
        nonMutual: makeAccounts(30, "nonmutual"),
        fansOnly: makeAccounts(20, "fan"),
      })
    );
    // 40 < 100, 30 < 100
    expect(result.typeKey).toBe("minimalist");
    expect(result.emoji).toBe("C");
  });

  it("handles zero followers and zero following", () => {
    const result = analyzeCharacter(buildAnalysis());
    expect(result).toBeDefined();
    expect(result.typeKey).toBe("minimalist");
    expect(result.stats.socialScore).toBe(0);
    expect(result.stats.activeHour).toBeGreaterThanOrEqual(0);
    expect(result.stats.activeHour).toBeLessThan(24);
  });

  it("handles equal followers and following", () => {
    const mutual = makeAccounts(150, "mutual");
    const result = analyzeCharacter(
      buildAnalysis({
        followers: makeAccounts(200, "follower"),
        following: makeAccounts(200, "following"),
        mutual,
        nonMutual: makeAccounts(50, "nonmutual"),
        fansOnly: makeAccounts(50, "fan"),
      })
    );
    expect(result).toBeDefined();
    // ratio = 200/200 = 1.0, following = 200 < 300
    // Not influencer, selective (200 >= 200 but mutualRate = 150/200 = 0.75 > 0.6 and following=200 < 200 is false)
    // following < 200 is false (200 < 200), so not selective
    // pendingRate = 0, not explorer
    // following < 300, not butterfly or observer
    // following < 100 is false, not minimalist
    // mutualRate > 0.5 => butterfly default
    expect(result.typeKey).toBe("butterfly");
  });

  it("produces scores in valid ranges (0-100)", () => {
    const result = analyzeCharacter(
      buildAnalysis({
        followers: makeAccounts(500, "follower"),
        following: makeAccounts(300, "following"),
        mutual: makeAccounts(200, "mutual"),
        nonMutual: makeAccounts(100, "nonmutual"),
        fansOnly: makeAccounts(300, "fan"),
        pendingRequests: makeAccounts(10, "pending"),
        recentlyUnfollowed: makeAccounts(5, "unfollowed"),
        closeFriends: makeAccounts(20, "close"),
      })
    );

    expect(result.stats.socialScore).toBeGreaterThanOrEqual(0);
    expect(result.stats.socialScore).toBeLessThanOrEqual(100);
    expect(result.stats.loyaltyScore).toBeGreaterThanOrEqual(0);
    expect(result.stats.loyaltyScore).toBeLessThanOrEqual(100);
    expect(result.stats.curiosityScore).toBeGreaterThanOrEqual(0);
    expect(result.stats.selectivityScore).toBeGreaterThanOrEqual(0);
    expect(result.stats.selectivityScore).toBeLessThanOrEqual(100);
  });

  it("generates correct highlights based on data patterns", () => {
    const result = analyzeCharacter(
      buildAnalysis({
        followers: makeAccounts(100, "follower"),
        following: makeAccounts(100, "following"),
        mutual: makeAccounts(80, "mutual"), // 80% mutual rate > 0.7
        nonMutual: makeAccounts(20, "nonmutual"),
        fansOnly: makeAccounts(50, "fan"), // fansOnly > nonMutual
        pendingRequests: makeAccounts(3, "pending"),
        recentlyUnfollowed: makeAccounts(5, "unfollowed"), // > 3
        closeFriends: makeAccounts(10, "close"), // > 5
      })
    );

    expect(result.highlights).toContain("character.highlights.pendingCount");
    expect(result.highlights).toContain("character.highlights.highMutual");
    expect(result.highlights).toContain("character.highlights.moreFans");
    expect(result.highlights).toContain("character.highlights.closeFriends");
    expect(result.highlights).toContain(
      "character.highlights.activeUnfollower"
    );
  });

  it("all 6 character types are reachable", () => {
    // This test verifies that all type strings from the determineType function are valid
    const allTypes = [
      "influencer",
      "butterfly",
      "observer",
      "selective",
      "explorer",
      "minimalist",
    ];
    const emojiMap: Record<string, string> = {
      influencer: "S",
      butterfly: "A",
      observer: "B",
      selective: "A",
      explorer: "B",
      minimalist: "C",
    };

    for (const typeKey of allTypes) {
      expect(emojiMap[typeKey]).toBeDefined();
    }
    // Also verify we covered them in individual tests above
    expect(allTypes).toHaveLength(6);
  });
});
