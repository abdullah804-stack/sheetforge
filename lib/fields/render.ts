/**
 * Returns true if the given URL is safe to render as a clickable link.
 * Blocks javascript:, data:, vbscript:, and other dangerous schemes.
 */
export function isSafeUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim().toLowerCase();
  if (!/^https?:\/\//i.test(trimmed)) return false;
  // Belt-and-suspenders: ensure no scheme smuggling
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Returns a shortened display version of a URL.
 * E.g. "https://www.example.com/foo/bar" → "example.com/foo/bar"
 */
export function prettyUrl(url: string): string {
  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.replace(/^www\./, "");
    const path =
      parsed.pathname && parsed.pathname !== "/" ? parsed.pathname : "";
    const combined = host + path;
    return combined.length > 50 ? combined.slice(0, 47) + "..." : combined;
  } catch {
    return url;
  }
}

/**
 * Escapes HTML-sensitive characters in a string.
 * Used when injecting text into dangerouslySetInnerHTML.
 */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Converts a plain text string into HTML with any URLs/emails turned into
 * anchor tags. All other content is escaped.
 * Returns an HTML string safe for dangerouslySetInnerHTML.
 */
export function linkifyText(text: string): string {
  if (!text) return "";
  const escaped = escapeHtml(text);

  // Regexes are conservative: only obvious http/https URLs and emails
  const urlRegex = /\b(https?:\/\/[^\s<>"]+)/g;
  const emailRegex = /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g;

  let result = escaped;

  // Replace URLs first (they might contain @ that would match the email regex)
  result = result.replace(urlRegex, (match) => {
    const trimmed = match.replace(/[.,;:!?]+$/, "");
    const trailing = match.slice(trimmed.length);
    return `<a href="${trimmed}" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline hover:text-blue-800">${trimmed}</a>${trailing}`;
  });

  // Then replace emails
  result = result.replace(emailRegex, (match) => {
    return `<a href="mailto:${match}" class="text-blue-600 underline hover:text-blue-800">${match}</a>`;
  });

  return result;
}

/**
 * Converts a plain text string into "rich" HTML: URLs, emails, and bare
 * newlines all become properly formatted. Safe for dangerouslySetInnerHTML.
 */
export function richText(text: string): string {
  if (!text) return "";
  return linkifyText(text).replace(/\n/g, "<br />");
}