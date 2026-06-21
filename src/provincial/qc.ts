import { createOpenNorthScraper } from "./opennorth";

const URL = "https://scrapers.herokuapp.com/represent/ca_qc/";

export const scrapeQcMna = createOpenNorthScraper(URL, {
  province: "Quebec",
  gov_level: "provincial",
  elected_office: "MNA",
});
