import fs from "node:fs/promises";
import path from "node:path";

import { isMayorOffice } from "../boundaries/municipal";
import { normalizeElectedOffice } from "../boundaries";
import { emptyRepDiff, getDiff, type RepDiff } from "../diff";
import { http } from "../http";
import type { Rep } from "../interfaces";
import { getDataDir, getStoredRun } from "../storage/runStore";
import { normalizeSlug } from "../slug";
import { municipalTargets } from "./index";

const YOUCOUNT_BASE = "https://www.youcount.ca/representatives";
const AGGREGATE_FILE = "_aggregate-diff.json";

export type MunicipalRoleDiff = {
  status: "success" | "error" | "missing";
  scrapeCount: number;
  youcountCount: number;
  councilsQueried: number;
  currentSource: string;
  diff: RepDiff;
  diffError: string | null;
};

export type MunicipalCouncilStatus = {
  slug: string;
  status: "success" | "error" | "missing";
  finishedAt: string | null;
  scrapeCount: number;
  diffError: string | null;
  counts: { added: number; deleted: number; changed: number } | null;
  /** Per-council diff vs YouCount (mayor + councillor roles merged). */
  diff: RepDiff | null;
};

export type MunicipalAggregateDiff = {
  generatedAt: string;
  scope: {
    councils: number;
    councilsWithData: number;
    councilsQueried: number;
  };
  currentSource: string;
  /** All 108 councils: scraped reps vs YouCount (mayors + councillors). */
  combined: RepDiff;
  mayors: MunicipalRoleDiff;
  councillors: MunicipalRoleDiff;
  councils: MunicipalCouncilStatus[];
};

export const MUNICIPAL_YOUCOUNT_SOURCE =
  `${YOUCOUNT_BASE}?gov_level=municipal&province=<province>&organization=<slug>`;

type TaggedRep = Rep & { organization: string };

const MUNICIPAL_PRIMARY = ["name", "organization"] as const;
const MUNICIPAL_SECONDARY = [
  "email",
  "party_name",
  "district_name",
  "elected_office",
  "organization",
] as const;

export function emptyMunicipalRepDiff(): RepDiff {
  return emptyRepDiff({
    primaryFields: [...MUNICIPAL_PRIMARY],
    secondaryFields: [...MUNICIPAL_SECONDARY],
  });
}

function normalizeMunicipalAggregate(
  record: MunicipalAggregateDiff,
): MunicipalAggregateDiff {
  const empty = emptyMunicipalRepDiff();
  return {
    ...record,
    combined: record.combined ?? empty,
    mayors: { ...record.mayors, diff: record.mayors.diff ?? empty },
    councillors: { ...record.councillors, diff: record.councillors.diff ?? empty },
    councils: (record.councils ?? []).map((council) => ({
      ...council,
      diff: council.diff ?? null,
      counts: council.counts ?? council.diff?.counts ?? null,
    })),
  };
}

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

function normalizeOffice(office: string | undefined): string {
  return normalizeElectedOffice(office)?.trim() ?? office?.trim() ?? "";
}

/** Offices present in the scrape define which YouCount rows are in scope (excludes city staff). */
function allowedOfficesFromScrape(reps: Rep[]): Set<string> {
  const allowed = new Set<string>();
  for (const rep of reps) {
    const office = normalizeOffice(rep.elected_office);
    if (office) allowed.add(office);
  }
  return allowed;
}

function filterByAllowedOffices(reps: Rep[], allowed: Set<string>): Rep[] {
  return reps.filter((rep) => {
    const office = normalizeOffice(rep.elected_office);
    return office !== "" && allowed.has(office);
  });
}

function youCountMunicipalUrl(province: string, organization: string): string {
  const params = new URLSearchParams({
    gov_level: "municipal",
    province,
    organization,
    limit: "1000",
  });
  return `${YOUCOUNT_BASE}?${params}`;
}

async function fetchYouCountPage(url: string): Promise<Rep[]> {
  const { data } = await http.get<{ objects?: Rep[] }>(url);
  return data.objects ?? [];
}

async function fetchYouCountMunicipal(
  province: string,
  organization: string,
): Promise<{ total: number; reps: Rep[] }> {
  const reps = await fetchYouCountPage(youCountMunicipalUrl(province, organization));
  const filtered = reps.filter(
    (rep) => rep.organization?.trim() === organization,
  );
  return { total: filtered.length, reps: filtered };
}

function tagOrganization(reps: Rep[], organization: string): TaggedRep[] {
  return reps.map((r) => ({ ...r, organization }));
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

function readField(rep: Rep, field: string): string {
  const v = (rep as unknown as Record<string, unknown>)[field];
  if (v === undefined || v === null) return "";
  return String(v);
}

function computeRoleDiff(
  scrapeReps: TaggedRep[],
  youcountReps: Rep[],
  organizationSlug?: string,
): RepDiff {
  return getDiff({
    currentReps: youcountReps,
    latestReps: scrapeReps,
    primaryFields: [...MUNICIPAL_PRIMARY],
    secondaryFields: [...MUNICIPAL_SECONDARY],
    ...(organizationSlug && {
      // Scrape side always has organization = council slug (tagOrganization).
      // Use slug for identity matching; secondary compare keeps raw YouCount values.
      matchField: (rep, field) => {
        if (field === "organization") return organizationSlug;
        return readField(rep, field);
      },
    }),
  });
}

function mergeDiffs(diffs: RepDiff[]): RepDiff {
  if (diffs.length === 0) return emptyMunicipalRepDiff();
  const added = diffs.flatMap((d) => d.added);
  const deleted = diffs.flatMap((d) => d.deleted);
  const changed = diffs.flatMap((d) => d.changed);
  return {
    added,
    deleted,
    changed,
    counts: {
      added: added.length,
      deleted: deleted.length,
      changed: changed.length,
    },
    primaryFields: [...diffs[0]!.primaryFields],
    secondaryFields: [...diffs[0]!.secondaryFields],
    date: new Date().toISOString(),
  };
}

async function loadCouncilStatuses(): Promise<MunicipalCouncilStatus[]> {
  return Promise.all(
    Object.values(municipalTargets).map(async (target) => {
      const run = await getStoredRun("municipal", target.slug);
      if (!run) {
        return {
          slug: target.slug,
          status: "missing" as const,
          finishedAt: null,
          scrapeCount: 0,
          diffError: null,
          counts: null,
          diff: null,
        };
      }
      if (run.status === "error") {
        return {
          slug: target.slug,
          status: "error" as const,
          finishedAt: run.finishedAt,
          scrapeCount: 0,
          diffError: run.error,
          counts: null,
          diff: null,
        };
      }
      return {
        slug: target.slug,
        status: "success" as const,
        finishedAt: run.finishedAt,
        scrapeCount: run.count ?? run.data?.length ?? 0,
        diffError: run.diffError ?? null,
        counts: null,
        diff: null,
      };
    }),
  );
}

function attachCouncilDiffs(
  councils: MunicipalCouncilStatus[],
  councilDiffs: Map<string, RepDiff>,
): MunicipalCouncilStatus[] {
  return councils.map((council) => {
    const diff = councilDiffs.get(council.slug);
    if (!diff) return council;
    return { ...council, diff, counts: diff.counts };
  });
}

export async function computeMunicipalAggregateDiff(): Promise<MunicipalAggregateDiff> {
  const [scrapedByCouncil, councils] = await Promise.all([
    loadScrapedByCouncil(),
    loadCouncilStatuses(),
  ]);
  const scrapeMayors: TaggedRep[] = [];
  const scrapeCouncillors: TaggedRep[] = [];
  const youcountMayors: TaggedRep[] = [];
  const youcountCouncillors: TaggedRep[] = [];
  const councilDiffs = new Map<string, RepDiff>();
  let councilsQueried = 0;
  let fetchError: string | null = null;

  for (const [slug, { province, reps }] of scrapedByCouncil) {
    const taggedScrape = tagOrganization(reps, slug);
    const allowedOffices = allowedOfficesFromScrape(reps);
    const { mayors: sMayors, councillors: sCouncillors } = splitByRole(taggedScrape);
    scrapeMayors.push(...sMayors);
    scrapeCouncillors.push(...sCouncillors);

    try {
      const municipalFetch = await fetchYouCountMunicipal(province, slug);
      const youcountFiltered = filterByAllowedOffices(
        municipalFetch.reps,
        allowedOffices,
      );
      const youcountTagged = tagOrganization(youcountFiltered, slug);
      const { mayors: yMayors, councillors: yCouncillors } =
        splitByRole(youcountTagged);
      youcountMayors.push(...yMayors);
      youcountCouncillors.push(...yCouncillors);

      councilDiffs.set(slug, computeRoleDiff(taggedScrape, youcountFiltered, slug));
      councilsQueried++;
    } catch (e) {
      fetchError = e instanceof Error ? e.message : String(e);
      console.warn(`[municipal/diff] YouCount fetch failed for ${slug}:`, fetchError);
    }
  }

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
        currentSource: MUNICIPAL_YOUCOUNT_SOURCE,
        diff: emptyMunicipalRepDiff(),
        diffError: "No municipal scrape data on disk yet",
      };
    }
    if (fetchError && youcountReps.length === 0) {
      return {
        status: "error",
        scrapeCount: scrapeReps.length,
        youcountCount: 0,
        councilsQueried,
        currentSource: MUNICIPAL_YOUCOUNT_SOURCE,
        diff: emptyMunicipalRepDiff(),
        diffError: fetchError,
      };
    }
    return {
      status: "success",
      scrapeCount: scrapeReps.length,
      youcountCount: youcountReps.length,
      councilsQueried,
      currentSource: MUNICIPAL_YOUCOUNT_SOURCE,
      diff: computeRoleDiff(scrapeReps, youcountReps),
      diffError: fetchError,
    };
  };

  const mayors = buildRole(scrapeMayors, youcountMayors);
  const councillors = buildRole(scrapeCouncillors, youcountCouncillors);

  return normalizeMunicipalAggregate({
    generatedAt: new Date().toISOString(),
    scope: {
      councils: Object.keys(municipalTargets).length,
      councilsWithData: scrapedByCouncil.size,
      councilsQueried,
    },
    currentSource: MUNICIPAL_YOUCOUNT_SOURCE,
    combined: mergeDiffs([mayors.diff, councillors.diff]),
    mayors,
    councillors,
    councils: attachCouncilDiffs(councils, councilDiffs),
  });
}

export type MunicipalCouncilDiffResponse = {
  generatedAt: string;
  gov_level: "municipal";
  slug: string;
  status: MunicipalCouncilStatus["status"];
  finishedAt: string | null;
  scrapeCount: number;
  diffError: string | null;
  currentSource: string;
  diff: RepDiff;
};

/** Per-council diff (not the national combined aggregate). */
export async function getMunicipalCouncilDiff(
  rawSlug: string,
): Promise<MunicipalCouncilDiffResponse | null> {
  const slug = normalizeSlug(rawSlug);
  if (!Object.values(municipalTargets).some((t) => t.slug === slug)) {
    return null;
  }

  let aggregate = await readMunicipalAggregateDiff();
  if (!aggregate) {
    aggregate = await refreshMunicipalAggregateDiff();
  }

  const council = aggregate.councils.find((c) => c.slug === slug);
  if (!council) return null;

  return {
    generatedAt: aggregate.generatedAt,
    gov_level: "municipal",
    slug,
    status: council.status,
    finishedAt: council.finishedAt,
    scrapeCount: council.scrapeCount,
    diffError: council.diffError,
    currentSource: aggregate.currentSource,
    diff: council.diff ?? emptyMunicipalRepDiff(),
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
    return normalizeMunicipalAggregate(
      JSON.parse(raw) as MunicipalAggregateDiff,
    );
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
