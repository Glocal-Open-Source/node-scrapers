import { createOpenNorthScraper } from "./opennorth";

const URL = "https://scrapers.herokuapp.com/represent/ca_on/";

export const scrapeOnMpp = createOpenNorthScraper(URL);
