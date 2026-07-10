import { createOpenNorthScraper } from "./opennorth";

const URL = "https://scrapers.herokuapp.com/represent/ca_ab/";

export const scrapeAbMla = createOpenNorthScraper(URL, {
  province: "Alberta",
  gov_level: "provincial",
  elected_office: "MLA",
});
