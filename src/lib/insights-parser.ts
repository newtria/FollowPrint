import JSZip from "jszip";
import type { InsightsData, RankedItem, TimestampedItem } from "./types";
import { parseInstagramDate, safeParseDom } from "./parse-utils";

// ── Liked Posts: extract owner usernames ──

function parseLikedPosts(html: string): string[] {
  // Regex is applied to outerHTML after DOMPurify sanitization in safeParseDom,
  // so the content is already sanitized against XSS before pattern matching.
  const sanitized = safeParseDom(html);
  const usernames: string[] = [];
  const regex =
    /(?:사용자 이름|Username)<\/td><td class="_2piu _a6_r">([^<]+)<\/td>/g;
  let m;
  while ((m = regex.exec(sanitized.documentElement.outerHTML)) !== null) {
    usernames.push(m[1].trim());
  }
  return usernames;
}

// ── Extract usernames from h2 elements (used by liked comments & saved posts) ──

function parseH2Usernames(html: string): string[] {
  const doc = safeParseDom(html);
  const usernames: string[] = [];
  const h2s = doc.querySelectorAll("h2");
  for (const h2 of h2s) {
    const name = h2.textContent?.trim();
    if (name && !name.includes(" ") && name.length < 50) {
      usernames.push(name);
    }
  }
  return usernames;
}

// ── Profile Searches ──

function parseProfileSearches(html: string): TimestampedItem[] {
  const doc = safeParseDom(html);
  const results: TimestampedItem[] = [];
  const h2s = doc.querySelectorAll("h2");

  for (const h2 of h2s) {
    const name = h2.textContent?.trim();
    if (!name || name.length > 50) continue;

    const container = h2.parentElement;
    const divs = container?.querySelectorAll("div > div");
    let dateStr = "";
    if (divs) {
      for (const div of divs) {
        const text = div.textContent?.trim() || "";
        if (text.match(/\d+월|20\d{2}/) && !text.includes("instagram")) {
          dateStr = text;
          break;
        }
      }
    }

    results.push({ name, timestamp: parseInstagramDate(dateStr) });
  }

  return results;
}

// ── Word Searches ──

function parseWordSearches(html: string): TimestampedItem[] {
  const doc = safeParseDom(html);
  const results: TimestampedItem[] = [];

  const tables = doc.querySelectorAll("table");
  for (const table of tables) {
    const cells = table.querySelectorAll("td");
    let query = "";
    let dateStr = "";

    for (const cell of cells) {
      const text = cell.textContent?.trim() || "";
      if (text.startsWith("검색") || text.startsWith("Search")) {
        const innerDiv = cell.querySelector("div > div");
        query = innerDiv?.textContent?.trim() || "";
      }
      if (cell.classList.contains("_2piu")) {
        dateStr = text;
      }
    }

    if (query) {
      results.push({ name: query, timestamp: parseInstagramDate(dateStr) });
    }
  }

  return results;
}

// ── Login Activity: extract hours ──

function parseLoginActivity(html: string): number[] {
  const hours = new Array(24).fill(0);
  const doc = safeParseDom(html);

  const h2s = doc.querySelectorAll("h2");
  for (const h2 of h2s) {
    const text = h2.textContent?.trim() || "";
    const isoMatch = text.match(/^\d{4}-\d{2}-\d{2}T(\d{2}):/);
    if (isoMatch) {
      const hour = parseInt(isoMatch[1]);
      hours[hour]++;
    }
  }

  const dateCells = doc.querySelectorAll("td._2piu._a6_r");
  for (const cell of dateCells) {
    const text = cell.textContent?.trim() || "";
    const ko = text.match(/(\d{1,2}):(\d{2})\s+(오전|오후)/);
    if (ko) {
      let h = parseInt(ko[1]);
      if (ko[3] === "오후" && h !== 12) h += 12;
      if (ko[3] === "오전" && h === 12) h = 0;
      hours[h]++;
    }
  }

  return hours;
}

// ── Chat names ──

function parseChatList(html: string): string[] {
  const doc = safeParseDom(html);
  const names: string[] = [];
  const links = doc.querySelectorAll("h2 a");
  for (const link of links) {
    const name = link.textContent?.trim();
    if (name) names.push(name);
  }
  return names;
}

// ── Helpers ──

function countAndRank(items: string[], limit = 20): RankedItem[] {
  const map = new Map<string, number>();
  for (const item of items) {
    map.set(item, (map.get(item) || 0) + 1);
  }
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

async function readFile(zip: JSZip, path: string): Promise<string | null> {
  const file = zip.files[path];
  if (!file) return null;
  return file.async("string");
}

async function findFile(
  zip: JSZip,
  pattern: string
): Promise<string | null> {
  for (const path of Object.keys(zip.files)) {
    if (path.toLowerCase().includes(pattern.toLowerCase())) {
      if (!zip.files[path].dir) {
        return zip.files[path].async("string");
      }
    }
  }
  return null;
}

// ── Main ──

export async function parseInsights(zip: JSZip): Promise<InsightsData> {
  const [
    likedPostsHtml,
    likedCommentsHtml,
    savedPostsHtml,
    profileSearchHtml,
    wordSearchHtml,
    loginHtml,
    chatsHtml,
  ] = await Promise.all([
    findFile(zip, "likes/liked_posts"),
    findFile(zip, "likes/liked_comments"),
    findFile(zip, "saved/saved_posts"),
    findFile(zip, "recent_searches/profile_searches"),
    findFile(zip, "recent_searches/word_or_phrase"),
    findFile(zip, "login_activity"),
    readFile(zip, "your_instagram_activity/messages/chats.html"),
  ]);

  const likedUsernames = [
    ...(likedPostsHtml ? parseLikedPosts(likedPostsHtml) : []),
    ...(likedCommentsHtml ? parseH2Usernames(likedCommentsHtml) : []),
  ];

  const savedUsernames = savedPostsHtml
    ? parseH2Usernames(savedPostsHtml)
    : [];

  return {
    topLikedAccounts: countAndRank(likedUsernames),
    topSavedAccounts: countAndRank(savedUsernames),
    profileSearches: profileSearchHtml
      ? parseProfileSearches(profileSearchHtml)
      : [],
    wordSearches: wordSearchHtml
      ? parseWordSearches(wordSearchHtml)
      : [],
    loginHours: loginHtml ? parseLoginActivity(loginHtml) : new Array(24).fill(0),
    chatNames: chatsHtml ? parseChatList(chatsHtml) : [],
  };
}
