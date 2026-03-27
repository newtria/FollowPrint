import { describe, it, expect } from "vitest";
import { parseInstagramDate, safeParseDom } from "@/lib/parse-utils";

describe("parseInstagramDate", () => {
  it("parses Korean afternoon date", () => {
    const ts = parseInstagramDate("3월 16, 2026 6:41 오후");
    const date = new Date(ts * 1000);
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(2); // March = 2
    expect(date.getDate()).toBe(16);
    expect(date.getHours()).toBe(18);
    expect(date.getMinutes()).toBe(41);
  });

  it("parses Korean morning date", () => {
    const ts = parseInstagramDate("1월 5, 2025 9:30 오전");
    const date = new Date(ts * 1000);
    expect(date.getFullYear()).toBe(2025);
    expect(date.getMonth()).toBe(0); // January = 0
    expect(date.getDate()).toBe(5);
    expect(date.getHours()).toBe(9);
    expect(date.getMinutes()).toBe(30);
  });

  it("handles Korean 12 오후 (noon) correctly", () => {
    const ts = parseInstagramDate("6월 1, 2025 12:00 오후");
    const date = new Date(ts * 1000);
    expect(date.getHours()).toBe(12);
  });

  it("handles Korean 12 오전 (midnight) correctly", () => {
    const ts = parseInstagramDate("6월 1, 2025 12:00 오전");
    const date = new Date(ts * 1000);
    expect(date.getHours()).toBe(0);
  });

  it("parses English date format", () => {
    const ts = parseInstagramDate("Dec 18, 2025 5:23 AM");
    const date = new Date(ts * 1000);
    expect(date.getFullYear()).toBe(2025);
    expect(date.getMonth()).toBe(11); // December = 11
    expect(date.getDate()).toBe(18);
  });

  it("parses English PM date", () => {
    const ts = parseInstagramDate("Jan 1, 2026 11:59 PM");
    const date = new Date(ts * 1000);
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(0);
    expect(date.getHours()).toBe(23);
    expect(date.getMinutes()).toBe(59);
  });

  it("returns 0 for empty string", () => {
    expect(parseInstagramDate("")).toBe(0);
  });

  it("returns 0 for null-like input", () => {
    expect(parseInstagramDate("")).toBe(0);
    // The function checks !str, so empty string returns 0
  });

  it("returns 0 for unparseable string", () => {
    expect(parseInstagramDate("not a date at all")).toBe(0);
  });
});

describe("safeParseDom", () => {
  it("parses basic HTML and returns a Document", () => {
    const doc = safeParseDom("<div>Hello</div>");
    expect(doc).toBeDefined();
    expect(doc.querySelector("div")?.textContent).toBe("Hello");
  });

  it("strips disallowed tags (script)", () => {
    const doc = safeParseDom('<div>Safe</div><script>alert("xss")</script>');
    expect(doc.querySelector("script")).toBeNull();
    expect(doc.querySelector("div")?.textContent).toBe("Safe");
  });

  it("strips disallowed attributes (onclick)", () => {
    const doc = safeParseDom('<div onclick="alert(1)" class="ok">Text</div>');
    const div = doc.querySelector("div");
    expect(div?.getAttribute("onclick")).toBeNull();
    expect(div?.getAttribute("class")).toBe("ok");
  });

  it("preserves allowed tags and attributes", () => {
    const doc = safeParseDom(
      '<a href="https://instagram.com/user">Link</a>'
    );
    const link = doc.querySelector("a");
    expect(link).not.toBeNull();
    expect(link?.getAttribute("href")).toBe("https://instagram.com/user");
    expect(link?.textContent).toBe("Link");
  });

  it("handles empty string input", () => {
    const doc = safeParseDom("");
    expect(doc).toBeDefined();
    expect(doc.body.innerHTML).toBe("");
  });

  it("handles malformed HTML gracefully", () => {
    const doc = safeParseDom("<div><p>unclosed");
    expect(doc).toBeDefined();
    // The parser should still produce a usable document
    expect(doc.querySelector("div")).not.toBeNull();
  });
});
