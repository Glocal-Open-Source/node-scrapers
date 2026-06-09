import { municipalTargets } from "./municipal";
import type { SyncTarget } from "./interfaces";

/**
 * Registered scrapers: object key === `slug` (CLI + registry).
 * Files live under `data/federal/<slug>.json` or `data/provincial/<slug>.json`.
 */
export const DEFAULTS: Record<string, SyncTarget> = {
  ...municipalTargets,
  mp: {
    gov_level: "federal",
    slug: "mp",
    currentUrl:
      "https://www.youcount.ca/representatives?elected_office=MP&limit=1000",
    opennorthUrl: "",
    elected_office: "MP",
    province: "All",
    enabled: true,
    diffFields: {
      secondary: ["province", "party_name"],
    },
  },
  senator: {
    gov_level: "federal",
    slug: "senator",
    currentUrl:
      "https://www.youcount.ca/representatives?elected_office=Senator&limit=1000",
    opennorthUrl: "",
    elected_office: "Senator",
    province: "All",
    enabled: true,
    diffFields: {
      primary: ["name", "province"],
      secondary: ["email", "party_name"],
    },
  },
  ab: {
    gov_level: "provincial",
    slug: "ab",
    currentUrl:
      "https://www.youcount.ca/representatives?province=Alberta&elected_office=MLA&limit=1000",
    opennorthUrl: "https://scrapers.herokuapp.com/represent/ca_ab/",
    elected_office: "MLA",
    province: "Alberta",
    enabled: true,
  },
  bc: {
    gov_level: "provincial",
    slug: "bc",
    currentUrl:
      "https://www.youcount.ca/representatives?province=British Columbia&elected_office=MLA&limit=1000",
    opennorthUrl: "",
    elected_office: "MLA",
    province: "British Columbia",
    enabled: true,
  },
  mb: {
    gov_level: "provincial",
    slug: "mb",
    currentUrl:
      "https://www.youcount.ca/representatives?province=Manitoba&elected_office=MLA&limit=1000",
    opennorthUrl: "https://scrapers.herokuapp.com/represent/ca_mb/",
    elected_office: "MLA",
    province: "Manitoba",
    enabled: true,
  },
  nb: {
    gov_level: "provincial",
    slug: "nb",
    currentUrl:
      "https://www.youcount.ca/representatives?province=New Brunswick&elected_office=MLA&limit=1000",
    opennorthUrl: "",
    elected_office: "MLA",
    province: "New Brunswick",
    enabled: true,
  },
  nl: {
    gov_level: "provincial",
    slug: "nl",
    currentUrl:
      "https://www.youcount.ca/representatives?province=Newfoundland and Labrador&elected_office=MHA&limit=1000",
    opennorthUrl: "",
    elected_office: "MHA",
    province: "Newfoundland and Labrador",
    enabled: true,
  },
  ns: {
    gov_level: "provincial",
    slug: "ns",
    currentUrl:
      "https://www.youcount.ca/representatives?province=Nova Scotia&elected_office=MLA&limit=1000",
    opennorthUrl: "https://scrapers.herokuapp.com/represent/ca_ns/",
    elected_office: "MLA",
    province: "Nova Scotia",
    enabled: true,
  },
  nu: {
    gov_level: "provincial",
    slug: "nu",
    currentUrl:
      "https://www.youcount.ca/representatives?province=Nunavut&elected_office=MLA&limit=1000",
    opennorthUrl: "",
    elected_office: "MLA",
    province: "Nunavut",
    enabled: true,
  },
  nt: {
    gov_level: "provincial",
    slug: "nt",
    currentUrl:
      "https://www.youcount.ca/representatives?province=Northwest Territories&elected_office=MLA&limit=1000",
    opennorthUrl: "",
    elected_office: "MLA",
    province: "Northwest Territories",
    enabled: true,
  },
  on: {
    gov_level: "provincial",
    slug: "on",
    currentUrl:
      "https://www.youcount.ca/representatives?province=Ontario&elected_office=MPP&limit=1000",
    opennorthUrl: "https://scrapers.herokuapp.com/represent/ca_on/",
    elected_office: "MPP",
    province: "Ontario",
    enabled: true,
  },
  pei: {
    gov_level: "provincial",
    slug: "pei",
    currentUrl:
      "https://www.youcount.ca/representatives?province=Prince Edward Island&elected_office=MLA&limit=1000",
    opennorthUrl: "https://scrapers.herokuapp.com/represent/ca_pe/",
    elected_office: "MLA",
    province: "Prince Edward Island",
    enabled: true,
  },
  qc: {
    gov_level: "provincial",
    slug: "qc",
    currentUrl:
      "https://www.youcount.ca/representatives?province=Quebec&elected_office=MNA&limit=1000",
    opennorthUrl: "https://scrapers.herokuapp.com/represent/ca_qc/",
    elected_office: "MNA",
    province: "Quebec",
    enabled: true,
  },
  sk: {
    gov_level: "provincial",
    slug: "sk",
    currentUrl:
      "https://www.youcount.ca/representatives?province=Saskatchewan&elected_office=MLA&limit=1000",
    opennorthUrl: "",
    elected_office: "MLA",
    province: "Saskatchewan",
    enabled: true,
  },
  yt: {
    gov_level: "provincial",
    slug: "yt",
    currentUrl:
      "https://www.youcount.ca/representatives?province=Yukon&elected_office=MLA&limit=1000",
    opennorthUrl: "",
    elected_office: "MLA",
    province: "Yukon",
    enabled: true,
  },
};
