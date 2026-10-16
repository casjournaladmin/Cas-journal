/**
 * ORCID Utility Functions
 *
 * Normalization, validation, and URL generation for academic ORCID iDs.
 * Supports bare 16-character identifiers (with or without hyphens)
 * as well as full canonical URLs (http/https://orcid.org/...).
 */

const ORCID_REGEX =
  /^(?:https?:\/\/orcid\.org\/)?(\d{4})[- ]?(\d{4})[- ]?(\d{4})[- ]?(\d{3}[\dX])$/i;

/**
 * Validates whether the given string is a plausible ORCID iD or ORCID URL.
 * Also performs ISO 7021 / MOD 11-2 check digit verification.
 */
export function isValidOrcid(raw: string | null | undefined): boolean {
  if (!raw) return false;
  const trimmed = raw.trim();
  const match = trimmed.match(ORCID_REGEX);
  if (!match) return false;

  const digits = `${match[1]}${match[2]}${match[3]}${match[4].toUpperCase()}`;
  return verifyOrcidCheckDigit(digits);
}

/**
 * Normalizes an ORCID iD into canonical hyphenated format:
 * `0000-0000-0000-000X`.
 * Returns null if invalid or empty.
 */
export function normalizeOrcid(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  const match = trimmed.match(ORCID_REGEX);
  if (!match) return null;

  const formatted = `${match[1]}-${match[2]}-${match[3]}-${match[4].toUpperCase()}`;
  const digits = `${match[1]}${match[2]}${match[3]}${match[4].toUpperCase()}`;

  if (!verifyOrcidCheckDigit(digits)) {
    return null;
  }

  return formatted;
}

/**
 * Returns the canonical public URL for an ORCID iD.
 * e.g. "https://orcid.org/0000-0002-1825-0097"
 */
export function getOrcidUrl(raw: string | null | undefined): string | null {
  const normalized = normalizeOrcid(raw);
  if (!normalized) return null;
  return `https://orcid.org/${normalized}`;
}

/**
 * ISO 7021, MOD 11-2 Check Digit calculation for ORCID.
 * @see https://support.orcid.org/hc/en-us/articles/360006897674-Structure-of-the-ORCID-Identifier
 */
function verifyOrcidCheckDigit(digits16: string): boolean {
  if (digits16.length !== 16) return false;

  let total = 0;
  for (let i = 0; i < 15; i++) {
    const digit = Number.parseInt(digits16[i], 10);
    if (Number.isNaN(digit)) return false;
    total = (total + digit) * 2;
  }

  const remainder = total % 11;
  const result = (12 - remainder) % 11;
  const expectedCheckDigit = result === 10 ? "X" : result.toString();

  return digits16[15] === expectedCheckDigit;
}
