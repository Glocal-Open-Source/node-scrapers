import type { Rep } from "./interfaces";
import { scrapeMps } from "./federal/mp";
import { scrapeSenators } from "./federal/senator";
import { scrapeBcMla } from "./provincial/bc";
import { scrapeNbMla } from "./provincial/nb";
import { scrapeNlMha } from "./provincial/nl";
import { scrapeNtMla } from "./provincial/nt";
import { scrapeNuMla } from "./provincial/nu";
import { scrapeSkMla } from "./provincial/sk";
import { scrapeYtMla } from "./provincial/yt";

/** Keys match `SyncTarget.slug` / `DEFAULTS` record keys. */
export const registry: Record<string, () => Promise<Rep[]>> = {
  mp: scrapeMps,
  senator: scrapeSenators,
  bc: scrapeBcMla,
  nb: scrapeNbMla,
  nl: scrapeNlMha,
  nu: scrapeNuMla,
  nt: scrapeNtMla,
  sk: scrapeSkMla,
  yt: scrapeYtMla,
};
