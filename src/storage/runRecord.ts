import type { RepDiff } from "../diff";
import type { GovLevel, Rep } from "../interfaces";

export type ScraperRunStatus = "success" | "error";

/** One persisted scrape result at `data/<gov_level>/<slug>.json`. */
export interface ScraperRun {
  /** Stable path id, e.g. `federal/senator`, `provincial/bc`. */
  id: string;
  gov_level: GovLevel;
  slug: string;
  status: ScraperRunStatus;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  count: number | null;
  data: Rep[] | null;
  error: string | null;
  /** YouCount URL used when computing `diff` (success runs). */
  currentSource?: string | null;
  /** Populated after a successful scrape when diff vs YouCount succeeded. */
  diff?: RepDiff | null;
  /** Set when YouCount fetch or diff computation failed (scrape may still succeed). */
  diffError?: string | null;
}
