// Maps (boundary_set, normalized_opennorth_name) -> canonical district_name in boundaries.json.
// Add an entry when an OpenNorth riding name diverges from the canonical boundaries.json name
// for reasons other than quote/apostrophe variants (which are handled automatically).
export const ALIASES: Record<string, Record<string, string>> = {
  "alberta-2023-voting-areas": {
    "calgary-mccall": "Calgary-Bhullar-McCall",
  },
  // Scraper returns "Ward N"; data.json uses "Ward_num-N"
  "manitoba-brandon-wards": {
    "ward 1": "Ward_num-1",
    "ward 2": "Ward_num-2",
    "ward 3": "Ward_num-3",
    "ward 4": "Ward_num-4",
    "ward 5": "Ward_num-5",
    "ward 6": "Ward_num-6",
    "ward 7": "Ward_num-7",
    "ward 8": "Ward_num-8",
    "ward 9": "Ward_num-9",
    "ward 10": "Ward_num-10",
  },
  "northwest-territories-electoral-districts-2013": {
    // Scraper returns name with space; data.json uses hyphen
    "mackenzie delta": "Mackenzie-Delta",
    // Scraper returns no space; data.json has "Deh Cho"
    "dehcho": "Deh Cho",
  },
  // Scraper returns "Ward N"; data.json uses "Ward-N"
  "ontario-orillia-wards": {
    "ward 1": "Ward-1",
    "ward 2": "Ward-2",
    "ward 3": "Ward-3",
    "ward 4": "Ward-4",
  },
};
