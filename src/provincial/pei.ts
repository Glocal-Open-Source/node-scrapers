import { createOpenNorthScraper } from "./opennorth";

const URL = "https://python-scrapers.youcount.ca/represent/ca_pe/";

export const scrapePeiMla = createOpenNorthScraper(URL, {
  province: "Prince Edward Island",
  gov_level: "provincial",
  elected_office: "MLA",
});
