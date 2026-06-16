import { readFileSync } from "fs";
import { join } from "path";
import type { Rep } from "../interfaces";
import { ALIASES } from "./aliases";

interface BoundaryEntry {
  district_name: string;
  boundary_set: string;
  boundary: string;
}

const data: BoundaryEntry[] = JSON.parse(
  readFileSync(join(__dirname, "data.json"), "utf8"),
) as BoundaryEntry[];

// Fold apostrophe/quote variants and dash/separator variants so boundaries.json and scrapers
// compare equal regardless of curly vs straight quotes or em-dash vs " - " separators.
function normalizeKey(s: string): string {
  return s
    .normalize("NFC")
    .replace(/[\u2018\u2019\u201a\u201b\u02bc\u2032]/g, "'")
    .replace(/[—–]/g, "-")
    .replace(/\s+-\s+/g, "-")
    .toLowerCase()
    .trim();
}

const LOOKUP = new Map<string, Map<string, { boundary: string; name: string }>>();
for (const { district_name, boundary_set, boundary } of data) {
  if (!LOOKUP.has(boundary_set)) LOOKUP.set(boundary_set, new Map());
  LOOKUP.get(boundary_set)!.set(normalizeKey(district_name), {
    boundary: `${boundary_set}/${boundary}`,
    name: district_name,
  });
}

/** Resolves an OpenNorth district name to a canonical boundary slug + district name.
 *  Handles apostrophe normalization and explicit aliases. */
export function resolveDistrict(
  boundarySet: string,
  districtName: string,
): { boundary: string; district_name: string } | null {
  const map = LOOKUP.get(boundarySet);
  if (!map) return null;

  const key = normalizeKey(districtName);

  const direct = map.get(key);
  if (direct) return { boundary: direct.boundary, district_name: direct.name };

  const canonicalName = ALIASES[boundarySet]?.[key];
  if (canonicalName) {
    const aliased = map.get(normalizeKey(canonicalName));
    if (aliased) return { boundary: aliased.boundary, district_name: aliased.name };
  }

  return null;
}

/** Looks up a boundary slug only (used by the municipal ward resolver). */
export function lookupBoundary(boundarySet: string, districtName: string): string | null {
  return resolveDistrict(boundarySet, districtName)?.boundary ?? null;
}

const OFFICE_MAP: Record<string, string> = {
  "Maire": "Mayor",
  "Mairesse": "Mayor",
  "Maire d'arrondissement": "Mayor",
  "Mairesse d'arrondissement": "Mayor",
  "Maire de la Ville de Montréal": "Mayor",
  "Mairesse de la Ville de Montréal": "Mayor",
  "Lord Mayor": "Mayor",
  "Conseiller": "Councillor",
  "Conseillère": "Councillor",
  "Conseiller de la ville": "Councillor",
  "Conseillère de la ville": "Councillor",
  "Conseiller d'arrondissement": "Councillor",
  "Conseillère d'arrondissement": "Councillor",
};

export function normalizeElectedOffice(office: string | undefined): string | undefined {
  if (!office) return office;
  return OFFICE_MAP[office] ?? office;
}

/** Wraps a scraper to attach boundary + canonical district_name from boundaries.json,
 *  and normalizes elected_office to standard English. */
export function withBoundary(
  scraper: () => Promise<Rep[]>,
  boundarySet: string,
): () => Promise<Rep[]> {
  return async () => {
    const reps = await scraper();
    return reps.map((rep) => {
      const resolved = resolveDistrict(boundarySet, rep.district_name);
      return {
        ...rep,
        elected_office: normalizeElectedOffice(rep.elected_office),
        ...(resolved && { boundary: resolved.boundary, district_name: resolved.district_name }),
      };
    });
  };
}
