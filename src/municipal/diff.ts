import fs from "node:fs/promises";
import path from "node:path";

import { isMayorOffice } from "../boundaries/municipal";
import { getDiff, type RepDiff } from "../diff";
import { http } from "../http";
import type { Rep } from "../interfaces";
import { getDataDir, getStoredRun } from "../storage/runStore";
import { municipalTargets } from "./index";

const YOUCOUNT_BASE = "https://www.youcount.ca/representatives";
const AGGREGATE_FILE = "_aggregate-diff.json";

export type MunicipalRoleDiff = {
  status: "success" | "error" | "missing";
  scrapeCount: number;
  youcountCount: number;
  councilsQueried: number;
  currentSource: string;
  diff: RepDiff | null;
  diffError: string | null;
};

export type MunicipalAggregateDiff = {
  generatedAt: string;
  scope: { councils: number };
  mayors: MunicipalRoleDiff;
  councillors: MunicipalRoleDiff;
};

type TaggedRep = Rep & { council: string };

const MUNICIPAL_PRIMARY = ["name", "council"] as const;
const MUNICIPAL_SECONDARY = [
  "email",
  "party_name",
  "district_name",
  "elected_office",
] as const;

function slugToDistrictGuess(slug: string): string {
  const raw = slug
    .replace(/^conseil-municipal-de-/, "")
    .replace(
      /-(city|town|municipal|district|township|regional|county|village|no-\d+)-council$/,
      "",
    )
    .replace(/-council$/, "")
    .replace(/-/g, " ");
  return raw.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function inferDistrictName(
  slug: string,
  reps: Pick<Rep, "elected_office" | "district_name">[],
): string {
  const mayor = reps.find((r) => isMayorOffice(r.elected_office));
  if (mayor?.district_name?.trim()) return mayor.district_name.trim();

  const counts = new Map<string, number>();
  for (const r of reps) {
    const d = r.district_name?.trim();
    if (!d || /^ward\s+\d+/i.test(d)) continue;
    counts.set(d, (counts.get(d) ?? 0) + 1);
  }
  if (counts.size > 0) {
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]![0];
  }
  return slugToDistrictGuess(slug);
}

function councillorOfficeForProvince(province: string): string {
  return province === "Quebec" ? "Conseiller" : "Councillor";
}

function youCountUrl(
  electedOffice: string,
  province: string,
  districtName: string,
): string {
  const params = new URLSearchParams({
    elected_office: electedOffice,
    province,
    district_name: districtName,
    limit: "1000",
  });
  return `${YOUCOUNT_BASE}?${params}`;
}

async function fetchYouCountRole(
  electedOffice: string,
  province: string,
  districtName: string,
): Promise<{ total: number; reps: Rep[] }> {
  const { data } = await http.get<{ objects?: Rep[]; meta?: { total_count?: number } }>(
    youCountUrl(electedOffice, province, districtName),
  );
  return {
    total: data.meta?.total_count ?? data.objects?.length ?? 0,
    reps: data.objects ?? [],
  };
}

function tagCouncil(reps: Rep[], council: string): TaggedRep[] {
  return reps.map((r) => ({ ...r, council }));
}

async function loadScrapedByCouncil(): Promise<
  Map<string, { province: string; reps: Rep[] }>
> {
  const byCouncil = new Map<string, { province: string; reps: Rep[] }>();
  for (const target of Object.values(municipalTargets)) {
    const run = await getStoredRun("municipal", target.slug);
    if (run?.status === "success" && run.data?.length) {
      byCouncil.set(target.slug, { province: target.province, reps: run.data });
    }
  }
  return byCouncil;
}

function splitByRole(reps: TaggedRep[]): {
  mayors: TaggedRep[];
  councillors: TaggedRep[];
} {
  const mayors: TaggedRep[] = [];
  const councillors: TaggedRep[] = [];
  for (const r of reps) {
    if (isMayorOffice(r.elected_office)) mayors.push(r);
    else councillors.push(r);
  }
  return { mayors, councillors };
}

function computeRoleDiff(
  scrapeReps: TaggedRep[],
  youcountReps: TaggedRep[],
): RepDiff {
  return getDiff({
    currentReps: youcountReps,
    latestReps: scrapeReps,
    primaryFields: [...MUNICIPAL_PRIMARY],
    secondaryFields: [...MUNICIPAL_SECONDARY],
  });
}

export async function computeMunicipalAggregateDiff(): Promise<MunicipalAggregateDiff> {
  const scrapedByCouncil = await loadScrapedByCouncil();
  const scrapeMayors: TaggedRep[] = [];
  const scrapeCouncillors: TaggedRep[] = [];
  const youcountMayors: TaggedRep[] = [];
  const youcountCouncillors: TaggedRep[] = [];
  let councilsQueried = 0;
  let fetchError: string | null = null;

  for (const [slug, { province, reps }] of scrapedByCouncil) {
    const districtName = inferDistrictName(slug, reps);
    const taggedScrape = tagCouncil(reps, slug);
    const { mayors: sMayors, councillors: sCouncillors } = splitByRole(taggedScrape);
    scrapeMayors.push(...sMayors);
    scrapeCouncillors.push(...sCouncillors);

    try {
      const councillorOffice = councillorOfficeForProvince(province);
      const [mayorFetch, councillorFetch] = await Promise.all([
        fetchYouCountRole("Mayor", province, districtName),
        fetchYouCountRole(councillorOffice, province, districtName),
      ]);
      youcountMayors.push(...tagCouncil(mayorFetch.reps, slug));
      youcountCouncillors.push(...tagCouncil(councillorFetch.reps, slug));
      councilsQueried++;
    } catch (e) {
      fetchError = e instanceof Error ? e.message : String(e);
      console.warn(`[municipal/diff] YouCount fetch failed for ${slug}:`, fetchError);
    }
  }

  const currentSource =
    `${YOUCOUNT_BASE}?province=<province>&district_name=<city>&elected_office=Mayor|Councillor|Conseiller`;

  const buildRole = (
    scrapeReps: TaggedRep[],
    youcountReps: TaggedRep[],
  ): MunicipalRoleDiff => {
    if (scrapedByCouncil.size === 0) {
      return {
        status: "missing",
        scrapeCount: 0,
        youcountCount: 0,
        councilsQueried: 0,
        currentSource,
        diff: null,
        diffError: "No municipal scrape data on disk yet",
      };
    }
    if (fetchError && youcountReps.length === 0) {
      return {
        status: "error",
        scrapeCount: scrapeReps.length,
        youcountCount: 0,
        councilsQueried,
        currentSource,
        diff: null,
        diffError: fetchError,
      };
    }
    return {
      status: "success",
      scrapeCount: scrapeReps.length,
      youcountCount: youcountReps.length,
      councilsQueried,
      currentSource,
      diff: computeRoleDiff(scrapeReps, youcountReps),
      diffError: fetchError,
    };
  };

  return {
    generatedAt: new Date().toISOString(),
    scope: { councils: Object.keys(municipalTargets).length },
    mayors: buildRole(scrapeMayors, youcountMayors),
    councillors: buildRole(scrapeCouncillors, youcountCouncillors),
  };
}

export function aggregateDiffPath(): string {
  return path.join(getDataDir(), "municipal", AGGREGATE_FILE);
}

export async function writeMunicipalAggregateDiff(
  record: MunicipalAggregateDiff,
): Promise<void> {
  const file = aggregateDiffPath();
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(record, null, 2), "utf8");
}

export async function readMunicipalAggregateDiff(): Promise<MunicipalAggregateDiff | null> {
  try {
    const raw = await fs.readFile(aggregateDiffPath(), "utf8");
    return JSON.parse(raw) as MunicipalAggregateDiff;
  } catch (e) {
    const code = (e as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return null;
    throw e;
  }
}

export async function refreshMunicipalAggregateDiff(): Promise<MunicipalAggregateDiff> {
  const record = await computeMunicipalAggregateDiff();
  await writeMunicipalAggregateDiff(record);
  return record;
}
