import fs from "node:fs/promises";
import path from "node:path";

import type { RepDiff } from "../diff";
import type { GovLevel, Rep } from "../interfaces";
import { normalizeSlug } from "../slug";
import type { ScraperRun } from "./runRecord";

export function getDataDir(): string {
  return process.env.DATA_DIR ?? path.join(process.cwd(), "data");
}

/** Legacy run files used `tier` instead of `gov_level` (same string values). */
function migrateRunJson(raw: unknown): ScraperRun {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("invalid run JSON");
  }
  const o = raw as Record<string, unknown>;
  if (o.gov_level == null && o.tier != null) {
    o.gov_level = o.tier;
  }
  delete o.tier;
  return o as unknown as ScraperRun;
}

/** `data/<gov_level>/<slug>.json` */
export function scraperDataPath(govLevel: GovLevel, slug: string): string {
  const s = normalizeSlug(slug);
  return path.join(getDataDir(), govLevel, `${s}.json`);
}

async function readRunFromDisk(
  govLevel: GovLevel,
  slug: string,
): Promise<ScraperRun | null> {
  const file = scraperDataPath(govLevel, slug);
  try {
    const raw = await fs.readFile(file, "utf8");
    return migrateRunJson(JSON.parse(raw));
  } catch (e) {
    const code = (e as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return null;
    throw e;
  }
}

export async function writeRunSuccess(
  govLevel: GovLevel,
  slug: string,
  startedAt: Date,
  finishedAt: Date,
  reps: Rep[],
  diffMeta: {
    currentSource: string;
    diff: RepDiff | null;
    diffError: string | null;
  },
): Promise<ScraperRun> {
  const s = normalizeSlug(slug);
  const dir = path.join(getDataDir(), govLevel);
  await fs.mkdir(dir, { recursive: true });

  const record: ScraperRun = {
    id: `${govLevel}/${s}`,
    gov_level: govLevel,
    slug: s,
    status: "success",
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    count: reps.length,
    data: reps,
    error: null,
    currentSource: diffMeta.currentSource,
    diff: diffMeta.diff,
    diffError: diffMeta.diffError,
  };

  const body = JSON.stringify(record, null, 2);
  await fs.writeFile(scraperDataPath(govLevel, s), body, "utf8");
  return record;
}

export async function writeRunError(
  govLevel: GovLevel,
  slug: string,
  startedAt: Date,
  finishedAt: Date,
  err: unknown,
): Promise<ScraperRun> {
  const s = normalizeSlug(slug);
  const dir = path.join(getDataDir(), govLevel);
  await fs.mkdir(dir, { recursive: true });

  const record: ScraperRun = {
    id: `${govLevel}/${s}`,
    gov_level: govLevel,
    slug: s,
    status: "error",
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    count: null,
    data: null,
    error: err instanceof Error ? `${err.message}\n${err.stack}` : String(err),
    currentSource: null,
    diff: null,
    diffError: null,
  };

  await fs.writeFile(
    scraperDataPath(govLevel, s),
    JSON.stringify(record, null, 2),
    "utf8",
  );
  return record;
}

export async function getStoredRun(
  govLevel: GovLevel,
  slug: string,
): Promise<ScraperRun | null> {
  return readRunFromDisk(govLevel, normalizeSlug(slug));
}

/** Counts `*.json` run files under `DATA_DIR` (excludes municipal `_aggregate-diff.json`). */
export async function countStoredRunFiles(): Promise<number> {
  const root = getDataDir();
  let count = 0;
  for (const level of ["federal", "provincial", "municipal"] as const) {
    const dir = path.join(root, level);
    let entries: string[];
    try {
      entries = await fs.readdir(dir);
    } catch (e) {
      const code = (e as NodeJS.ErrnoException).code;
      if (code === "ENOENT") continue;
      throw e;
    }
    for (const name of entries) {
      if (name.endsWith(".json") && name !== "_aggregate-diff.json") count++;
    }
  }
  return count;
}
