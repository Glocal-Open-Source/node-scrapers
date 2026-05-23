import { http } from "../http";
import type { Rep } from "../interfaces";

function parseMaybeJson(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

export function createOpenNorthScraper(url: string): () => Promise<Rep[]> {
  return async () => {
    const { data } = await http.get<unknown[]>(url);
    return data.map((raw) => {
      const rep = { ...(raw as Record<string, unknown>) };
      rep.offices = parseMaybeJson(rep.offices);
      rep.extra = parseMaybeJson(rep.extra);
      return rep as unknown as Rep;
    });
  };
}
