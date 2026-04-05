const AT_ENTITY = "&#64;";

function decimalEntities(str: string): string {
  return [...str].map((c) => `&#${c.charCodeAt(0)};`).join("");
}

/** `mailto:` as decimal HTML entities (Mortensen §2.2 style). */
const MAILTO_SCHEME_ENTITIES = "&#109;&#97;&#105;&#108;&#116;&#111;&#58;";

/**
 * Full `href` value using only decimal entities after `mailto:` — matches
 * https://spencermortensen.com/articles/email-obfuscation/ §2.2 (100% in author’s link tests).
 * Must be injected via `set:html` on the `<a>`; do not pass through Astro `href={…}` or `&`
 * becomes `&amp;` and breaks parsing.
 */
export function obfuscatedMailtoHrefEntities(email: string): string {
  const trimmed = email.trim();
  return MAILTO_SCHEME_ENTITIES + decimalEntities(trimmed);
}

function escapeHtmlAttr(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Visible link HTML: decimal entities for real characters, hidden `.eml-x` spans with decoy text (display:none in CSS).
 */
export function obfuscatedEmailInnerHtml(email: string): string {
  const trimmed = email.trim();
  const atIdx = trimmed.indexOf("@");
  if (atIdx < 1) {
    return decimalEntities(trimmed);
  }
  const local = trimmed.slice(0, atIdx);
  const domain = trimmed.slice(atIdx + 1);
  const domainParts = domain.split(".");
  const junkLocal = "noreply";
  const junkBetween = ".invalid";

  let inner = decimalEntities(local);
  inner += `<span class="eml-x">${junkLocal}</span>`;
  inner += AT_ENTITY;
  inner += decimalEntities(domainParts[0]!);
  for (let i = 1; i < domainParts.length; i++) {
    inner += `<span class="eml-x">${junkBetween}</span>`;
    inner += "&#46;";
    inner += decimalEntities(domainParts[i]!);
  }
  return inner;
}

export function obfuscatedEmailLink(email: string): {
  hrefEntities: string;
  innerHtml: string;
} {
  return {
    hrefEntities: obfuscatedMailtoHrefEntities(email),
    innerHtml: obfuscatedEmailInnerHtml(email),
  };
}

/**
 * Raw `<a …>…</a>` HTML with entity-encoded `href`. Use with `<Fragment set:html={…} />`.
 */
export function buildObfuscatedMailtoAnchorHtml(options: {
  email: string;
  class?: string;
  title?: string;
  /** Replaces default obfuscated text inner HTML (e.g. SVG icon-only link). */
  childrenHtml?: string;
}): string {
  const { hrefEntities, innerHtml } = obfuscatedEmailLink(options.email);
  const inner = options.childrenHtml ?? innerHtml;
  const cls = options.class ? ` class="${escapeHtmlAttr(options.class)}"` : "";
  const tit = options.title ? ` title="${escapeHtmlAttr(options.title)}"` : "";
  return `<a href="${hrefEntities}"${cls}${tit}>${inner}</a>`;
}
