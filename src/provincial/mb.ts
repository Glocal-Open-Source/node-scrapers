import { createOpenNorthScraper } from "./opennorth";

const URL = "https://python-scrapers.youcount.ca/represent/ca_mb/";

export const scrapeMbMla = createOpenNorthScraper(URL, {
  province: "Manitoba",
  gov_level: "provincial",
  elected_office: "MLA",
});
