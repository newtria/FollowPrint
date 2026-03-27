import JSZip from "jszip";
import type { InstagramAccount, AnalysisResult, FullData } from "./types";
import { parseInsights } from "./insights-parser";
import { parseInstagramDate, safeParseDom } from "./parse-utils";

// ── HTML parsing ──

function parseHtmlAccounts(html: string): InstagramAccount[] {
  const doc = safeParseDom(html);
  const accounts: InstagramAccount[] = [];

  const links = doc.querySelectorAll('a[href*="instagram.com"]');

  for (const link of links) {
    // Skip logo/image links
    if (link.querySelector("img")) continue;

    const href = link.getAttribute("href") || "";
    const match = href.match(/instagram\.com\/(?:_u\/)?([^/?]+)/);
    const username = match?.[1] || "";
    if (!username) continue;

    // Date is in the next sibling div after the link's container
    const linkDiv = link.parentElement;
    const dateDiv = linkDiv?.nextElementSibling;
    const dateStr = dateDiv?.textContent?.trim() || "";

    accounts.push({
      username,
      profileUrl: `https://www.instagram.com/${username}`,
      timestamp: parseInstagramDate(dateStr),
    });
  }

  return accounts;
}

// ── JSON parsing ──

function unwrapJson(parsed: unknown): unknown[] {
  if (Array.isArray(parsed)) return parsed;
  if (typeof parsed === "object" && parsed !== null) {
    const values = Object.values(parsed);
    if (values.length === 1 && Array.isArray(values[0])) return values[0];
    return values.filter(Array.isArray).flat();
  }
  return [];
}

function parseJsonAccounts(content: string): InstagramAccount[] {
  const parsed = JSON.parse(content);
  const entries = unwrapJson(parsed);

  return entries
    .map((entry: unknown) => {
      const e = entry as Record<string, unknown>;
      const list = e?.string_list_data as
        | Array<Record<string, unknown>>
        | undefined;
      const info = list?.[0];
      if (!info?.value) return null;
      return {
        username: info.value as string,
        profileUrl:
          (info.href as string) ||
          `https://www.instagram.com/${info.value}`,
        timestamp: (info.timestamp as number) || 0,
      };
    })
    .filter((a): a is InstagramAccount => a !== null);
}

// ── ZIP traversal ──

async function findAccounts(
  zip: JSZip,
  pattern: string
): Promise<InstagramAccount[]> {
  const accounts: InstagramAccount[] = [];

  for (const [path, file] of Object.entries(zip.files)) {
    if (file.dir) continue;

    // Only match files in followers_and_following directory
    if (!path.toLowerCase().includes("followers_and_following")) continue;

    const filename = path.split("/").pop()?.toLowerCase() || "";
    if (!filename.includes(pattern.toLowerCase())) continue;

    try {
      const content = await file.async("string");

      if (filename.endsWith(".json")) {
        accounts.push(...parseJsonAccounts(content));
      } else if (filename.endsWith(".html")) {
        accounts.push(...parseHtmlAccounts(content));
      }
    } catch {
      // skip unparseable
    }
  }

  return accounts;
}

// ── Main entry ──

export async function parseInstagramZip(
  file: File
): Promise<AnalysisResult> {
  const zip = await JSZip.loadAsync(file);

  const paths = Object.keys(zip.files);
  const isInstagram = paths.some(
    (p) => p.includes("followers") || p.includes("following")
  );
  if (!isInstagram) throw new Error("INVALID_ZIP");

  const [
    followers,
    following,
    pending,
    unfollowed,
    closeFriends,
    blocked,
    restricted,
  ] = await Promise.all([
    findAccounts(zip, "followers"),
    findAccounts(zip, "following"),
    findAccounts(zip, "pending_follow"),
    findAccounts(zip, "unfollowed"),
    findAccounts(zip, "close_friends"),
    findAccounts(zip, "blocked"),
    findAccounts(zip, "restricted"),
  ]);

  const followerSet = new Set(followers.map((a) => a.username));
  const followingSet = new Set(following.map((a) => a.username));

  return {
    followers,
    following,
    pendingRequests: pending,
    recentlyUnfollowed: unfollowed,
    closeFriends,
    blockedAccounts: blocked,
    restrictedAccounts: restricted,
    nonMutual: following.filter((a) => !followerSet.has(a.username)),
    fansOnly: followers.filter((a) => !followingSet.has(a.username)),
    mutual: following.filter((a) => followerSet.has(a.username)),
  };
}

export async function parseFileFull(file: File): Promise<FullData> {
  if (!file.name.endsWith(".zip")) throw new Error("UNSUPPORTED_FORMAT");

  const zip = await JSZip.loadAsync(file);

  const paths = Object.keys(zip.files);
  const isInstagram = paths.some(
    (p) => p.includes("followers") || p.includes("following")
  );
  if (!isInstagram) throw new Error("INVALID_ZIP");

  const [analysis, insights] = await Promise.all([
    parseInstagramZipFromLoaded(zip),
    parseInsights(zip),
  ]);

  return { analysis, insights };
}

async function parseInstagramZipFromLoaded(
  zip: JSZip
): Promise<AnalysisResult> {
  const [
    followers,
    following,
    pending,
    unfollowed,
    closeFriends,
    blocked,
    restricted,
  ] = await Promise.all([
    findAccounts(zip, "followers"),
    findAccounts(zip, "following"),
    findAccounts(zip, "pending_follow"),
    findAccounts(zip, "unfollowed"),
    findAccounts(zip, "close_friends"),
    findAccounts(zip, "blocked"),
    findAccounts(zip, "restricted"),
  ]);

  const followerSet = new Set(followers.map((a) => a.username));
  const followingSet = new Set(following.map((a) => a.username));

  return {
    followers,
    following,
    pendingRequests: pending,
    recentlyUnfollowed: unfollowed,
    closeFriends,
    blockedAccounts: blocked,
    restrictedAccounts: restricted,
    nonMutual: following.filter((a) => !followerSet.has(a.username)),
    fansOnly: followers.filter((a) => !followingSet.has(a.username)),
    mutual: following.filter((a) => followerSet.has(a.username)),
  };
}
