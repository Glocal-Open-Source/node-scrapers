import { createOpenNorthScraper } from "./opennorth";

const URL = "https://scrapers.herokuapp.com/represent/ca_ns/";

export const scrapeNsMla = createOpenNorthScraper(URL, {
  province: "Nova Scotia",
  gov_level: "provincial",
  elected_office: "MLA",
});
