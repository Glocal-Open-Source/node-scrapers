/** Stored under `data/federal/`, `data/provincial/`, or `data/municipal/`. */
export type GovLevel = "federal" | "provincial" | "municipal";

export interface SyncTarget {
  gov_level: GovLevel;
  /** Short code: CLI key, registry key, URL segment, filename stem (e.g. `senator`, `bc`). */
  slug: string;
  enabled?: boolean;
  /** YouCount API snapshot URL (`{ objects: Rep[] }`) for post-run diff vs scrape. */
  currentUrl: string;
  opennorthUrl: string;
  elected_office: string;
  province: string;
  /** Optional; defaults match admin-amplify `getDiff`. */
  diffFields?: { primary?: string[]; secondary?: string[] };
}

export interface OfficeRecord {
  type: string;
  tel?: string;
  fax?: string;
  email?: string;
  postal?: string;
  addr?: string;
}

export interface QuickLink {
  title: string;
  url: string;
}

/** Shape stored in run JSON (core fields + optional legislature metadata). */
export interface Rep {
  /** YouCount representative id (present on API snapshots used for diff). */
  id?: number;
  email: string;
  name: string;
  last_name: string;
  first_name: string;
  district_name: string;
  district_id?: string;
  province: string;
  party_name: string;
  related?: { boundary_url?: string };
  photo_url?: string;
  bio?: string;
  elected_office?: string;
  gov_level?: string;
  offices?: OfficeRecord[];
  quick_links?: QuickLink[];
  facebook?: string;
  twitter?: string;
  boundary?: string;
  organization?: string;
}
