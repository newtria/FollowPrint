import { describe, it, expect } from "vitest";
import JSZip from "jszip";
import { parseInstagramZip, parseFileFull } from "@/lib/parser";

// Helper to create a mock File from a JSZip instance
async function zipToFile(zip: JSZip, name = "export.zip"): Promise<File> {
  const blob = await zip.generateAsync({ type: "blob" });
  return new File([blob], name, { type: "application/zip" });
}

// ── Mock data builders ──

function buildJsonFollowers(usernames: string[]): string {
  return JSON.stringify(
    usernames.map((u) => ({
      string_list_data: [
        {
          value: u,
          href: `https://www.instagram.com/${u}`,
          timestamp: 1700000000,
        },
      ],
    }))
  );
}

function buildJsonFollowing(usernames: string[]): string {
  return JSON.stringify({
    relationships_following: usernames.map((u) => ({
      string_list_data: [
        {
          value: u,
          href: `https://www.instagram.com/${u}`,
          timestamp: 1700000000,
        },
      ],
    })),
  });
}

function buildHtmlFollowers(usernames: string[]): string {
  const items = usernames
    .map(
      (u) => `
      <div>
        <a href="https://www.instagram.com/${u}">${u}</a>
      </div>
      <div>3월 16, 2026 6:41 오후</div>
    `
    )
    .join("");
  return `<html><body>${items}</body></html>`;
}

describe("parseInstagramZip", () => {
  it("parses JSON format followers and following", async () => {
    const zip = new JSZip();
    zip.file(
      "followers_and_following/followers_1.json",
      buildJsonFollowers(["alice", "bob", "charlie"])
    );
    zip.file(
      "followers_and_following/following.json",
      buildJsonFollowing(["alice", "dave"])
    );

    const file = await zipToFile(zip);
    const result = await parseInstagramZip(file);

    expect(result.followers).toHaveLength(3);
    expect(result.following).toHaveLength(2);
    expect(result.followers.map((a) => a.username)).toContain("alice");
    expect(result.following.map((a) => a.username)).toContain("dave");
  });

  it("computes mutual, nonMutual, and fansOnly correctly", async () => {
    const zip = new JSZip();
    zip.file(
      "followers_and_following/followers_1.json",
      buildJsonFollowers(["alice", "bob", "charlie"])
    );
    zip.file(
      "followers_and_following/following.json",
      buildJsonFollowing(["alice", "dave"])
    );

    const file = await zipToFile(zip);
    const result = await parseInstagramZip(file);

    // alice is mutual (both follower and following)
    expect(result.mutual.map((a) => a.username)).toEqual(["alice"]);
    // dave is following but not a follower
    expect(result.nonMutual.map((a) => a.username)).toEqual(["dave"]);
    // bob and charlie are followers but not following
    expect(result.fansOnly.map((a) => a.username)).toContain("bob");
    expect(result.fansOnly.map((a) => a.username)).toContain("charlie");
    expect(result.fansOnly).toHaveLength(2);
  });

  it("parses HTML format followers", async () => {
    const zip = new JSZip();
    zip.file(
      "followers_and_following/followers_1.html",
      buildHtmlFollowers(["user_one", "user_two"])
    );
    zip.file(
      "followers_and_following/following.json",
      buildJsonFollowing([])
    );

    const file = await zipToFile(zip);
    const result = await parseInstagramZip(file);

    expect(result.followers).toHaveLength(2);
    expect(result.followers[0].username).toBe("user_one");
    expect(result.followers[0].profileUrl).toBe(
      "https://www.instagram.com/user_one"
    );
  });

  it("throws INVALID_ZIP for a zip without followers/following paths", async () => {
    const zip = new JSZip();
    zip.file("random/file.txt", "hello");

    const file = await zipToFile(zip);
    await expect(parseInstagramZip(file)).rejects.toThrow("INVALID_ZIP");
  });

  it("handles empty followers_and_following directory", async () => {
    const zip = new JSZip();
    // Directory marker exists but no actual data files inside
    zip.file("followers_and_following/readme.txt", "empty export");

    const file = await zipToFile(zip);
    const result = await parseInstagramZip(file);

    expect(result.followers).toHaveLength(0);
    expect(result.following).toHaveLength(0);
    expect(result.mutual).toHaveLength(0);
  });

  it("parses pending, unfollowed, closeFriends, blocked, restricted", async () => {
    const zip = new JSZip();
    zip.file(
      "followers_and_following/followers_1.json",
      buildJsonFollowers([])
    );
    zip.file(
      "followers_and_following/following.json",
      buildJsonFollowing([])
    );
    zip.file(
      "followers_and_following/pending_follow_requests.json",
      buildJsonFollowers(["pending_user"])
    );
    zip.file(
      "followers_and_following/unfollowed_users.json",
      buildJsonFollowers(["unfollowed_user"])
    );
    zip.file(
      "followers_and_following/close_friends.json",
      buildJsonFollowers(["close_user"])
    );
    zip.file(
      "followers_and_following/blocked_profiles.json",
      buildJsonFollowers(["blocked_user"])
    );
    zip.file(
      "followers_and_following/restricted_profiles.json",
      buildJsonFollowers(["restricted_user"])
    );

    const file = await zipToFile(zip);
    const result = await parseInstagramZip(file);

    expect(result.pendingRequests.map((a) => a.username)).toEqual([
      "pending_user",
    ]);
    expect(result.recentlyUnfollowed.map((a) => a.username)).toEqual([
      "unfollowed_user",
    ]);
    expect(result.closeFriends.map((a) => a.username)).toEqual([
      "close_user",
    ]);
    expect(result.blockedAccounts.map((a) => a.username)).toEqual([
      "blocked_user",
    ]);
    expect(result.restrictedAccounts.map((a) => a.username)).toEqual([
      "restricted_user",
    ]);
  });

  it("handles JSON entries with missing string_list_data gracefully", async () => {
    const zip = new JSZip();
    // Malformed entry that lacks string_list_data
    const malformed = JSON.stringify([
      { string_list_data: [{ value: "valid_user", timestamp: 1700000000 }] },
      { other_field: "no string_list_data" },
      { string_list_data: [] },
    ]);
    zip.file("followers_and_following/followers_1.json", malformed);
    zip.file(
      "followers_and_following/following.json",
      buildJsonFollowing([])
    );

    const file = await zipToFile(zip);
    const result = await parseInstagramZip(file);

    expect(result.followers).toHaveLength(1);
    expect(result.followers[0].username).toBe("valid_user");
  });
});

describe("parseFileFull", () => {
  it("throws UNSUPPORTED_FORMAT for non-zip files", async () => {
    const file = new File(["hello"], "data.txt", { type: "text/plain" });
    await expect(parseFileFull(file)).rejects.toThrow("UNSUPPORTED_FORMAT");
  });

  it("throws INVALID_ZIP for a zip missing Instagram data", async () => {
    const zip = new JSZip();
    zip.file("random/stuff.txt", "not instagram");
    const file = await zipToFile(zip, "data.zip");
    await expect(parseFileFull(file)).rejects.toThrow("INVALID_ZIP");
  });
});
