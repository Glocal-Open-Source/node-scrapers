import { createOpenNorthScraper } from "./opennorth";

const URL = "https://python-scrapers.youcount.ca/represent/ca_qc/";

export const scrapeQcMna = createOpenNorthScraper(URL, {
  province: "Quebec",
  gov_level: "provincial",
  elected_office: "MNA",
});
