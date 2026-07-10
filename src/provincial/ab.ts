import { createOpenNorthScraper } from "./opennorth";

const URL = "https://python-scrapers.youcount.ca/represent/ca_ab/";

export const scrapeAbMla = createOpenNorthScraper(URL, {
  province: "Alberta",
  gov_level: "provincial",
  elected_office: "MLA",
});
