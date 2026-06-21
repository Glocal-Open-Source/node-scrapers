import { http } from "../http";
import type { GovLevel, OfficeRecord, Rep } from "../interfaces";
import { normalizeRepHonorifics } from "../util/repName";

function parseMaybeJson(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

export type OpenNorthScraperMeta = {
  province?: string;
  gov_level?: GovLevel;
  elected_office?: string;
};

function asString(value: unknown): string {
  if (value === undefined || value === null) return "";
  return String(value);
}

function detailUrlFromRaw(raw: Record<string, unknown>): string {
  for (const key of ["personal_url", "url"] as const) {
    const value = asString(raw[key]).trim();
    if (value.startsWith("http")) return value;
  }
  return "";
}

function ensureNameParts(rep: Rep): Rep {
  const cleaned = normalizeRepHonorifics(rep);
  let first_name = cleaned.first_name?.trim() ?? "";
  let last_name = cleaned.last_name?.trim() ?? "";
  const name = cleaned.name?.trim() ?? "";

  if ((!first_name || !last_name) && name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      if (!first_name) first_name = parts.slice(0, -1).join(" ");
      if (!last_name) last_name = parts[parts.length - 1] ?? "";
    } else if (parts.length === 1 && !first_name) {
      first_name = parts[0] ?? "";
    }
  }

  const fullName = name || `${first_name} ${last_name}`.trim();
  return { ...rep, name: fullName, first_name, last_name };
}

function openNorthToRep(raw: Record<string, unknown>, meta: OpenNorthScraperMeta): Rep {
  const detailUrl = detailUrlFromRaw(raw);
  const offices = parseMaybeJson(raw.offices);
  const related =
    typeof raw.boundary_url === "string" && raw.boundary_url.trim()
      ? { boundary_url: raw.boundary_url.trim() }
      : (raw.related as Rep["related"]);

  const rep: Rep = {
    email: asString(raw.email),
    name: asString(raw.name),
    first_name: asString(raw.first_name),
    last_name: asString(raw.last_name),
    district_name: asString(raw.district_name),
    province: asString(raw.province),
    party_name: asString(raw.party_name),
    photo_url: asString(raw.photo_url) || undefined,
    bio: asString(raw.bio) || undefined,
    elected_office: asString(raw.elected_office) || undefined,
    gov_level: asString(raw.gov_level) as GovLevel | undefined,
    offices: Array.isArray(offices) ? (offices as OfficeRecord[]) : [],
    quick_links: detailUrl
      ? [{ title: "Official Website", url: detailUrl }]
      : [],
    related,
  };

  const boundary = asString(raw.boundary);
  if (boundary) rep.boundary = boundary;

  return ensureNameParts(rep);
}

function normalizeScrapedRep(rep: Rep, meta: OpenNorthScraperMeta): Rep {
  let out = ensureNameParts(rep);
  if (meta.province) out = { ...out, province: meta.province };
  if (meta.gov_level) out = { ...out, gov_level: meta.gov_level };
  if (meta.elected_office) {
    const office = out.elected_office?.trim();
    if (!office) out = { ...out, elected_office: meta.elected_office };
  }
  if (!out.quick_links) out = { ...out, quick_links: [] };
  return out;
}

export function createOpenNorthScraper(
  url: string,
  meta: OpenNorthScraperMeta = {},
): () => Promise<Rep[]> {
  return async () => {
    const { data } = await http.get<unknown[]>(url);
    return data.map((raw) => {
      const record = { ...(raw as Record<string, unknown>) };
      record.offices = parseMaybeJson(record.offices);
      return normalizeScrapedRep(openNorthToRep(record, meta), meta);
    });
  };
}
