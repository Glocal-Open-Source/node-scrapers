/** Lowercase slug for CLI, URLs, and filenames (e.g. `senator`, `bc`). */
export function normalizeSlug(raw: string): string {
  return raw.trim().toLowerCase();
}
