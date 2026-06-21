import { DEFAULTS } from "./constants";
import { refreshMunicipalAggregateDiff } from "./municipal/diff";
import { runAll, runOne } from "./runner";
import { normalizeSlug } from "./slug";

export type ScrapeJobKind = "all" | "one";

export type ScrapeJobStatus = {
  running: boolean;
  kind: ScrapeJobKind | null;
  slug: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  error: string | null;
};

let job: ScrapeJobStatus = {
  running: false,
  kind: null,
  slug: null,
  startedAt: null,
  finishedAt: null,
  error: null,
};

export function getScrapeJobStatus(): ScrapeJobStatus {
  return { ...job };
}

function startJob(kind: ScrapeJobKind, slug: string | null): void {
  job = {
    running: true,
    kind,
    slug,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    error: null,
  };
}

function finishJob(err: unknown): void {
  job.running = false;
  job.finishedAt = new Date().toISOString();
  job.error = err instanceof Error ? err.message : err ? String(err) : null;
}

export type TriggerResult =
  | { accepted: true; message: string; slug?: string }
  | { accepted: false; message: string };

export function triggerScrapeAll(): TriggerResult {
  if (job.running) {
    return { accepted: false, message: "A scrape job is already running" };
  }

  startJob("all", null);
  void runAll()
    .then(() => finishJob(null))
    .catch((err) => {
      console.error("[scrapers] POST /scrape/all failed", err);
      finishJob(err);
    });

  return { accepted: true, message: "scrape:all started in background" };
}

export function triggerScrapeOne(rawSlug: string): TriggerResult | { notFound: true } {
  const slug = normalizeSlug(rawSlug);
  const target = DEFAULTS[slug];
  if (!target || target.enabled === false) {
    return { notFound: true };
  }

  if (job.running) {
    return { accepted: false, message: "A scrape job is already running" };
  }

  startJob("one", slug);
  void (async () => {
    try {
      await runOne(target);
      if (target.gov_level === "municipal") {
        await refreshMunicipalAggregateDiff();
      }
      finishJob(null);
    } catch (err) {
      console.error(`[scrapers] POST /scrape/${slug} failed`, err);
      finishJob(err);
    }
  })();

  return {
    accepted: true,
    message: `scrape:${slug} started in background`,
    slug,
  };
}
