import { createOpenNorthScraper } from "./opennorth";

const URL = "https://python-scrapers.youcount.ca/represent/ca_on/";

export const scrapeOnMpp = createOpenNorthScraper(URL, {
  province: "Ontario",
  gov_level: "provincial",
  elected_office: "MPP",
});
