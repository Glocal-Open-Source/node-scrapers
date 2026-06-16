// Maps (boundary_set, normalized_opennorth_name) -> canonical district_name in boundaries.json.
// Add an entry when an OpenNorth riding name diverges from the canonical boundaries.json name
// for reasons other than quote/apostrophe variants (which are handled automatically).
export const ALIASES: Record<string, Record<string, string>> = {
  "alberta-2023-voting-areas": {
    "calgary-mccall": "Calgary-Bhullar-McCall",
  },
  "northwest-territories-electoral-districts-2013": {
    // Scraper returns name with space; data.json uses hyphen
    "mackenzie delta": "Mackenzie-Delta",
    // Scraper returns no space; data.json has "Deh Cho"
    "dehcho": "Deh Cho",
  },
};
