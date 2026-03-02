/**
 * Server-side URL fetcher for website analysis.
 *
 * Fetches a target URL, follows redirects, and extracts meaningful
 * text content (title, meta description, visible body text).
 * This gives Claude actual page content to analyze, even when
 * web_search can't find the site in search results.
 *
 * Designed to fail gracefully — returns { ok: false } on any error
 * so the caller can fall back to web_search-only mode.
 */

const MAX_BODY_CHARS = 15000;
const FETCH_TIMEOUT_MS = 5000;

/**
 * Strip HTML tags and collapse whitespace.
 */
function stripTags(html) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Remove <script>, <style>, <noscript>, <svg>, and <head> blocks.
 */
function removeNonVisible(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
    .replace(/<svg[\s\S]*?<\/svg>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");
}

/**
 * Extract the <title> text from HTML.
 */
function extractTitle(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? stripTags(match[1]).substring(0, 300) : "";
}

/**
 * Extract meta description content.
 */
function extractMetaDescription(html) {
  const match = html.match(
    /<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["'][^>]*>/i
  );
  if (match) return match[1].substring(0, 500);

  // Try reversed attribute order (content before name)
  const match2 = html.match(
    /<meta[^>]*content=["']([\s\S]*?)["'][^>]*name=["']description["'][^>]*>/i
  );
  return match2 ? match2[1].substring(0, 500) : "";
}

/**
 * Extract visible body text from HTML.
 */
function extractBodyText(html) {
  // Get body content only
  const bodyMatch = html.match(/<body[\s\S]*?>([\s\S]*)<\/body>/i);
  const bodyHtml = bodyMatch ? bodyMatch[1] : html;

  const cleaned = removeNonVisible(bodyHtml);
  const text = stripTags(cleaned);

  // Truncate to limit
  if (text.length > MAX_BODY_CHARS) {
    return text.substring(0, MAX_BODY_CHARS) + "…[truncated]";
  }
  return text;
}

/**
 * Fetch a URL and extract text content for analysis.
 *
 * @param {string} url - The URL to fetch
 * @returns {Promise<{ok: boolean, title?: string, description?: string, bodyText?: string, finalUrl?: string, error?: string}>}
 */
export async function fetchSite(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; VibeZapBot/1.0; +https://vibezap.dev)",
        Accept: "text/html,application/xhtml+xml,*/*",
      },
      redirect: "follow",
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return { ok: false, error: `HTTP ${response.status}` };
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      return { ok: false, error: `Not HTML (${contentType.split(";")[0]})` };
    }

    const html = await response.text();

    if (!html || html.length < 100) {
      return { ok: false, error: "Empty or minimal HTML response" };
    }

    const title = extractTitle(html);
    const description = extractMetaDescription(html);
    const bodyText = extractBodyText(html);

    if (!bodyText || bodyText.length < 50) {
      return { ok: false, error: "Could not extract meaningful text content" };
    }

    return {
      ok: true,
      title,
      description,
      bodyText,
      finalUrl: response.url,
    };
  } catch (err) {
    const msg =
      err.name === "AbortError"
        ? "Timeout (10s)"
        : err.message || "Unknown fetch error";
    return { ok: false, error: msg };
  }
}
