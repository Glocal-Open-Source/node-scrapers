import type { SyncTarget } from "./interfaces";

/**
 * Registered scrapers: object key === `slug` (CLI + registry).
 * Files live under `data/federal/<slug>.json` or `data/provincial/<slug>.json`.
 */
export const DEFAULTS: Record<string, SyncTarget> = {
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
