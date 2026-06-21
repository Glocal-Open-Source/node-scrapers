import { createOpenNorthScraper } from "./opennorth";

const URL = "https://scrapers.herokuapp.com/represent/ca_on/";

export const scrapeOnMpp = createOpenNorthScraper(URL, {
  province: "Ontario",
  gov_level: "provincial",
  elected_office: "MPP",
});
