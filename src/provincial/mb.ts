import { createOpenNorthScraper } from "./opennorth";

const URL = "https://scrapers.herokuapp.com/represent/ca_mb/";

export const scrapeMbMla = createOpenNorthScraper(URL);
