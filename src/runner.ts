import { DEFAULTS } from "./constants";
import { getDiff, type RepDiff } from "./diff";
import { http } from "./http";
import type { Rep, SyncTarget } from "./interfaces";
import { refreshMunicipalAggregateDiff } from "./municipal/diff";
import { registry } from "./registry";
import { writeRunError, writeRunSuccess } from "./storage/runStore";

export async function runOne(target: SyncTarget): Promise<void> {
  const { gov_level: govLevel, slug } = target;
  const startedAt = new Date();
  try {
    const scrape = registry[slug];
    if (!scrape) {
      throw new Error(`No scraper registered for slug: ${slug}`);
    }
    const reps = await scrape();
    const finishedAt = new Date();

    let diff: RepDiff | null = null;
    let diffError: string | null = null;
    const currentUrl = target.currentUrl.trim();
    if (currentUrl) {
      try {
        const { data } = await http.get<{ objects?: Rep[] }>(currentUrl);
        const currentReps = data?.objects ?? [];
        diff = getDiff({
          currentReps,
          latestReps: reps,
          primaryFields: target.diffFields?.primary,
          secondaryFields: target.diffFields?.secondary,
        });
      } catch (e) {
        diffError = e instanceof Error ? e.message : String(e);
        console.warn(`[${govLevel}/${slug}] YouCount diff failed:`, diffError);
      }
    }

    await writeRunSuccess(govLevel, slug, startedAt, finishedAt, reps, {
      currentSource: currentUrl || target.opennorthUrl,
      diff,
      diffError,
    });
  } catch (err) {
    const finishedAt = new Date();
    try {
      await writeRunError(govLevel, slug, startedAt, finishedAt, err);
    } catch (persistErr) {
      console.error(
        `[${govLevel}/${slug}] scrape failed and error record could not be written`,
        persistErr,
      );
    }
  }
}

/**
 * Runs every enabled scraper **one after another**. Each replaces its JSON only when that
 * scrape finishes, so reads keep serving the previous file until then.
 */
export async function runAll(): Promise<void> {
  const targets = Object.values(DEFAULTS).filter((t) => t.enabled !== false);
  for (const target of targets) {
    try {
      await runOne(target);
    } catch (err) {
      console.error(
        `[${target.gov_level}/${target.slug}] runOne rejected unexpectedly`,
        err,
      );
    }
  }

  try {
    await refreshMunicipalAggregateDiff();
  } catch (err) {
    console.error("[municipal] aggregate diff refresh failed", err);
  }
}
