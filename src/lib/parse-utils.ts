import DOMPurify from "dompurify";

/** Sanitize HTML via DOMPurify and return a parsed Document. */
export function safeParseDom(html: string): Document {
  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['a', 'div', 'span', 'p', 'td', 'tr', 'table', 'tbody', 'thead', 'th', 'li', 'ul', 'ol', 'br', 'img', 'h1', 'h2', 'h3', 'h4', 'html', 'head', 'body', 'title'],
    ALLOWED_ATTR: ['href', 'class', 'src', 'alt'],
    WHOLE_DOCUMENT: true
  });
  return new DOMParser().parseFromString(sanitized, "text/html");
}

/** Parse an Instagram-style date string (Korean or English) into a Unix timestamp. */
export function parseInstagramDate(str: string): number {
  if (!str) return 0;

  // Korean: "3월 16, 2026 6:41 오후"
  const ko = str.match(
    /(\d{1,2})월\s+(\d{1,2}),\s+(\d{4})\s+(\d{1,2}):(\d{2})\s+(오전|오후)/
  );
  if (ko) {
    const [, month, day, year, hour, minute, ampm] = ko;
    let h = parseInt(hour);
    if (ampm === "오후" && h !== 12) h += 12;
    if (ampm === "오전" && h === 12) h = 0;
    return Math.floor(
      new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        h,
        parseInt(minute)
      ).getTime() / 1000
    );
  }

  // English: "Dec 18, 2025 5:23 AM"
  const date = new Date(str);
  if (!isNaN(date.getTime())) {
    return Math.floor(date.getTime() / 1000);
  }

  return 0;
}
