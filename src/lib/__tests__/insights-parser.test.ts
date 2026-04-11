// Regression guards for the insights HTML parsers. The Instagram export
// format is not stable — class names and label text change every few months —
// and these parsers are the most fragile surface in the project. Any test
// that goes red here is a strong signal that IG changed their layout.
//
// The fixtures below are minimal extracts of real exports, simplified to the
// shape that each parser actually walks. They intentionally include the
// extra wrapper divs and class noise that IG ships, so that selector changes
// (e.g. dropping `_2piu`) are caught.

import { describe, it, expect } from "vitest";
import JSZip from "jszip";
import { parseInsights } from "@/lib/insights-parser";

async function buildZip(files: Record<string, string>): Promise<JSZip> {
  const zip = new JSZip();
  for (const [path, content] of Object.entries(files)) {
    zip.file(path, content);
  }
  // Round-trip through generateAsync so that the resulting JSZip behaves the
  // same as one loaded from disk (file metadata, not just in-memory shortcut).
  const blob = await zip.generateAsync({ type: "blob" });
  return JSZip.loadAsync(blob);
}

describe("parseInsights — likedPosts (KO label)", () => {
  it("extracts usernames from `사용자 이름` rows", async () => {
    const html = `
      <html><body>
        <div>
          <table>
            <tr><td>사용자 이름</td><td class="_2piu _a6_r">alice</td></tr>
          </table>
        </div>
        <div>
          <table>
            <tr><td>사용자 이름</td><td class="_2piu _a6_r">bob</td></tr>
          </table>
        </div>
      </body></html>
    `;
    const zip = await buildZip({
      "your_instagram_activity/likes/liked_posts.html": html,
    });
    const insights = await parseInsights(zip);
    const names = insights.topLikedAccounts.map((r) => r.name).sort();
    expect(names).toEqual(["alice", "bob"]);
  });
});

describe("parseInsights — likedPosts (EN label)", () => {
  it("extracts usernames from `Username` rows", async () => {
    const html = `
      <html><body>
        <table>
          <tr><td>Username</td><td class="_2piu _a6_r">carol</td></tr>
          <tr><td>Username</td><td class="_2piu _a6_r">dave</td></tr>
        </table>
      </body></html>
    `;
    const zip = await buildZip({
      "your_instagram_activity/likes/liked_posts.html": html,
    });
    const insights = await parseInsights(zip);
    const names = insights.topLikedAccounts.map((r) => r.name).sort();
    expect(names).toEqual(["carol", "dave"]);
  });
});

describe("parseInsights — savedPosts (h2 usernames)", () => {
  it("collects single-token h2 entries", async () => {
    const html = `
      <html><body>
        <h2>spaceship_one</h2>
        <h2>not a username</h2>
        <h2>cometchaser</h2>
        <h2>this_is_too_long_to_be_a_real_instagram_handle_xxxxxxxx</h2>
      </body></html>
    `;
    const zip = await buildZip({
      "your_instagram_activity/saved/saved_posts.html": html,
    });
    const insights = await parseInsights(zip);
    const names = insights.topSavedAccounts.map((r) => r.name).sort();
    // "not a username" rejected (whitespace), 50+ char string rejected.
    expect(names).toEqual(["cometchaser", "spaceship_one"]);
  });
});

describe("parseInsights — profileSearches", () => {
  it("returns h2 names with extracted timestamps", async () => {
    const html = `
      <html><body>
        <div>
          <h2>searched_user_1</h2>
          <div><div>3월 16, 2026 6:41 오후</div></div>
        </div>
        <div>
          <h2>searched_user_2</h2>
          <div><div>4월 1, 2026 9:00 오전</div></div>
        </div>
      </body></html>
    `;
    const zip = await buildZip({
      "your_instagram_activity/recent_searches/profile_searches.html": html,
    });
    const insights = await parseInsights(zip);
    expect(insights.profileSearches).toHaveLength(2);
    expect(insights.profileSearches[0].name).toBe("searched_user_1");
    expect(insights.profileSearches[0].timestamp).toBeGreaterThan(0);
  });
});

describe("parseInsights — wordSearches", () => {
  it("extracts query text from 검색 / Search rows", async () => {
    const html = `
      <html><body>
        <table>
          <tbody>
            <tr><td>검색<div><div>코딩</div></div></td><td class="_2piu">3월 16, 2026 6:41 오후</td></tr>
          </tbody>
        </table>
        <table>
          <tbody>
            <tr><td>Search<div><div>music</div></div></td><td class="_2piu">4월 1, 2026 9:00 오전</td></tr>
          </tbody>
        </table>
      </body></html>
    `;
    const zip = await buildZip({
      "your_instagram_activity/recent_searches/word_or_phrase_searches.html": html,
    });
    const insights = await parseInsights(zip);
    const queries = insights.wordSearches.map((r) => r.name).sort();
    expect(queries).toEqual(["music", "코딩"]);
  });
});

describe("parseInsights — loginActivity", () => {
  it("counts ISO timestamps in h2 elements per hour", async () => {
    const html = `
      <html><body>
        <h2>2026-04-01T09:23:00Z</h2>
        <h2>2026-04-01T09:45:00Z</h2>
        <h2>2026-04-01T18:01:00Z</h2>
      </body></html>
    `;
    const zip = await buildZip({
      "security_and_login_information/login_activity.html": html,
    });
    const insights = await parseInsights(zip);
    expect(insights.loginHours[9]).toBe(2);
    expect(insights.loginHours[18]).toBe(1);
    expect(insights.loginHours.reduce((a, b) => a + b, 0)).toBe(3);
  });

  it("counts KO 오전/오후 cells in 12-hour clock", async () => {
    const html = `
      <html><body>
        <table><tbody>
          <tr><td class="_2piu _a6_r">3월 16, 2026 6:41 오후</td></tr>
          <tr><td class="_2piu _a6_r">3월 16, 2026 6:50 오후</td></tr>
          <tr><td class="_2piu _a6_r">3월 16, 2026 9:00 오전</td></tr>
        </tbody></table>
      </body></html>
    `;
    const zip = await buildZip({
      "security_and_login_information/login_activity.html": html,
    });
    const insights = await parseInsights(zip);
    expect(insights.loginHours[18]).toBe(2);
    expect(insights.loginHours[9]).toBe(1);
  });
});

describe("parseInsights — chats", () => {
  it("extracts chat partner names from h2 a", async () => {
    const html = `
      <html><body>
        <h2><a href="messages/inbox/alice">alice</a></h2>
        <h2><a href="messages/inbox/bob">bob</a></h2>
      </body></html>
    `;
    const zip = await buildZip({
      "your_instagram_activity/messages/chats.html": html,
    });
    const insights = await parseInsights(zip);
    expect(insights.chatNames.sort()).toEqual(["alice", "bob"]);
  });
});

describe("parseInsights — empty / missing files", () => {
  it("returns zeros when none of the source files exist", async () => {
    const zip = await buildZip({
      "followers_and_following/followers_1.html": "<html></html>",
    });
    const insights = await parseInsights(zip);
    expect(insights.topLikedAccounts).toEqual([]);
    expect(insights.topSavedAccounts).toEqual([]);
    expect(insights.profileSearches).toEqual([]);
    expect(insights.wordSearches).toEqual([]);
    expect(insights.chatNames).toEqual([]);
    expect(insights.loginHours).toEqual(new Array(24).fill(0));
  });
});
