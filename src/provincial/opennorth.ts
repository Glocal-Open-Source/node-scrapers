import { http } from "../http";
import type { GovLevel, Rep } from "../interfaces";

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

function ensureNameParts(rep: Rep): Rep {
  let first_name = rep.first_name?.trim() ?? "";
  let last_name = rep.last_name?.trim() ?? "";
  const name = rep.name?.trim() ?? "";

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

function normalizeScrapedRep(rep: Rep, meta: OpenNorthScraperMeta): Rep {
  let out = ensureNameParts(rep);
  if (meta.province) out = { ...out, province: meta.province };
  if (meta.gov_level) out = { ...out, gov_level: meta.gov_level };
  if (meta.elected_office) {
    const office = out.elected_office?.trim();
    if (!office) out = { ...out, elected_office: meta.elected_office };
  }
  return out;
}

export function createOpenNorthScraper(
  url: string,
  meta: OpenNorthScraperMeta = {},
): () => Promise<Rep[]> {
  return async () => {
    const { data } = await http.get<unknown[]>(url);
    return data.map((raw) => {
      const rep = { ...(raw as Record<string, unknown>) };
      rep.offices = parseMaybeJson(rep.offices);
      rep.extra = parseMaybeJson(rep.extra);
      return normalizeScrapedRep(rep as unknown as Rep, meta);
    });
  };
}
