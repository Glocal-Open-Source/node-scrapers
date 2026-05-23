import type { Rep } from "./interfaces";
import { scrapeMps } from "./federal/mp";
import { scrapeSenators } from "./federal/senator";
import { scrapeAbMla } from "./provincial/ab";
import { scrapeBcMla } from "./provincial/bc";
import { scrapeMbMla } from "./provincial/mb";
import { scrapeNbMla } from "./provincial/nb";
import { scrapeNlMha } from "./provincial/nl";
import { scrapeNsMla } from "./provincial/ns";
import { scrapeNtMla } from "./provincial/nt";
import { scrapeNuMla } from "./provincial/nu";
import { scrapeOnMpp } from "./provincial/on";
import { scrapePeiMla } from "./provincial/pei";
import { scrapeQcMna } from "./provincial/qc";
import { scrapeSkMla } from "./provincial/sk";
import { scrapeYtMla } from "./provincial/yt";

/** Keys match `SyncTarget.slug` / `DEFAULTS` record keys. */
export const registry: Record<string, () => Promise<Rep[]>> = {
  mp: scrapeMps,
  senator: scrapeSenators,
  ab: scrapeAbMla,
  bc: scrapeBcMla,
  mb: scrapeMbMla,
  nb: scrapeNbMla,
  nl: scrapeNlMha,
  ns: scrapeNsMla,
  nu: scrapeNuMla,
  nt: scrapeNtMla,
  on: scrapeOnMpp,
  pei: scrapePeiMla,
  qc: scrapeQcMna,
  sk: scrapeSkMla,
  yt: scrapeYtMla,
};
