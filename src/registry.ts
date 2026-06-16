import type { Rep } from "./interfaces";
import { withBoundary } from "./boundaries/index";
import { scrapeMps } from "./federal/mp";
import { scrapeSenators } from "./federal/senator";
import { municipalRegistry } from "./municipal";
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
  mp: withBoundary(scrapeMps, "fed-ca-2023-districts"),
  senator: withBoundary(scrapeSenators, "canada-provinces-territories"),
  ab: withBoundary(scrapeAbMla, "alberta-2023-voting-areas"),
  bc: withBoundary(scrapeBcMla, "bc-2023-districts"),
  mb: withBoundary(scrapeMbMla, "manitoba-electoral-districts"),
  nb: withBoundary(scrapeNbMla, "nb-2024-districts"),
  nl: withBoundary(scrapeNlMha, "newfoundland-and-labrador-electoral-districts"),
  ns: withBoundary(scrapeNsMla, "nova-scotia-electoral-districts"),
  nu: withBoundary(scrapeNuMla, "nunavut-electoral-districts"),
  nt: withBoundary(scrapeNtMla, "northwest-territories-electoral-districts-2013"),
  on: withBoundary(scrapeOnMpp, "ontario-2022-districts"),
  pei: withBoundary(scrapePeiMla, "pei-2017-electoral-districts"),
  qc: withBoundary(scrapeQcMna, "quebec-electoral-districts-2017"),
  sk: withBoundary(scrapeSkMla, "sk-2024-districts"),
  yt: withBoundary(scrapeYtMla, "yukon-electoral-districts"),
  ...municipalRegistry,
};
