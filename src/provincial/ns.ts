import { createOpenNorthScraper } from "./opennorth";

const URL = "https://scrapers.herokuapp.com/represent/ca_ns/";

export const scrapeNsMla = createOpenNorthScraper(URL);
