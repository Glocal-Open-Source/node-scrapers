import type { Rep } from "../interfaces";
import type { SyncTarget } from "../interfaces";
import { createOpenNorthScraper } from "../provincial/opennorth";
import { getBoundaryConfig, isMayorOffice, type WardRep } from "./boundaries";

const BASE = "https://scrapers.herokuapp.com/represent/";

const SETS: { slug: string; herokSlug: string; province: string }[] = [
  // Alberta
  { slug: "calgary-city-council", herokSlug: "ca_ab_calgary", province: "Alberta"},
  { slug: "county-of-grande-prairie-no-1-council", herokSlug: "ca_ab_grande_prairie_county_no_1", province: "Alberta"},
  { slug: "edmonton-city-council", herokSlug: "ca_ab_edmonton", province: "Alberta" },
  { slug: "grande-prairie-city-council", herokSlug: "ca_ab_grande_prairie", province: "Alberta" },
  { slug: "lethbridge-city-council", herokSlug: "ca_ab_lethbridge", province: "Alberta" },
  { slug: "strathcona-county-council", herokSlug: "ca_ab_strathcona_county", province: "Alberta" },
  { slug: "wood-buffalo-municipal-council", herokSlug: "ca_ab_wood_buffalo", province: "Alberta" },
  // British Columbia
  { slug: "abbotsford-city-council", herokSlug: "ca_bc_abbotsford", province: "British Columbia" },
  { slug: "burnaby-city-council", herokSlug: "ca_bc_burnaby", province: "British Columbia" },
  { slug: "coquitlam-city-council", herokSlug: "ca_bc_coquitlam", province: "British Columbia" },
  { slug: "kelowna-city-council", herokSlug: "ca_bc_kelowna", province: "British Columbia" },
  { slug: "langley-city-council", herokSlug: "ca_bc_langley_city", province: "British Columbia" },
  { slug: "langley-township-council", herokSlug: "ca_bc_langley", province: "British Columbia" },
  { slug: "new-westminster-city-council", herokSlug: "ca_bc_new_westminster", province: "British Columbia" },
  { slug: "richmond-city-council", herokSlug: "ca_bc_richmond", province: "British Columbia" },
  { slug: "saanich-district-council", herokSlug: "ca_bc_saanich", province: "British Columbia" },
  { slug: "surrey-city-council", herokSlug: "ca_bc_surrey", province: "British Columbia" },
  { slug: "vancouver-city-council", herokSlug: "ca_bc_vancouver", province: "British Columbia" },
  { slug: "victoria-city-council", herokSlug: "ca_bc_victoria", province: "British Columbia" },
  // Manitoba
  { slug: "winnipeg-city-council", herokSlug: "ca_mb_winnipeg", province: "Manitoba" },
  // New Brunswick
  { slug: "fredericton-city-council", herokSlug: "ca_nb_fredericton", province: "New Brunswick" },
  { slug: "moncton-city-council", herokSlug: "ca_nb_moncton", province: "New Brunswick" },
  { slug: "saint-john-city-council", herokSlug: "ca_nb_saint_john", province: "New Brunswick" },
  // Newfoundland and Labrador
  { slug: "st-johns-city-council", herokSlug: "ca_nl_st_john_s", province: "Newfoundland and Labrador" },
  // Nova Scotia
  { slug: "cape-breton-regional-council", herokSlug: "ca_ns_cape_breton", province: "Nova Scotia" },
  { slug: "halifax-regional-council", herokSlug: "ca_ns_halifax", province: "Nova Scotia" },
  // Ontario
  { slug: "ajax-town-council", herokSlug: "ca_on_ajax", province: "Ontario" },
  { slug: "belleville-city-council", herokSlug: "ca_on_belleville", province: "Ontario" },
  { slug: "brantford-city-council", herokSlug: "ca_on_brantford", province: "Ontario" },
  { slug: "brampton-city-council", herokSlug: "ca_on_brampton", province: "Ontario" },
  { slug: "burlington-city-council", herokSlug: "ca_on_burlington", province: "Ontario" },
  { slug: "caledon-town-council", herokSlug: "ca_on_caledon", province: "Ontario" },
  { slug: "cambridge-city-council", herokSlug: "ca_on_cambridge", province: "Ontario" },
  { slug: "chatham-kent-municipal-council", herokSlug: "ca_on_chatham_kent", province: "Ontario" },
  { slug: "clarington-municipal-council", herokSlug: "ca_on_clarington", province: "Ontario" },
  { slug: "fort-erie-town-council", herokSlug: "ca_on_fort_erie", province: "Ontario" },
  { slug: "georgina-town-council", herokSlug: "ca_on_georgina", province: "Ontario" },
  { slug: "greater-sudbury-city-council", herokSlug: "ca_on_greater_sudbury", province: "Ontario" },
  { slug: "grimsby-town-council", herokSlug: "ca_on_grimsby", province: "Ontario" },
  { slug: "guelph-city-council", herokSlug: "ca_on_guelph", province: "Ontario" },
  { slug: "haldimand-county-council", herokSlug: "ca_on_haldimand_county", province: "Ontario" },
  { slug: "hamilton-city-council", herokSlug: "ca_on_hamilton", province: "Ontario" },
  { slug: "huron-county-council", herokSlug: "ca_on_huron", province: "Ontario" },
  { slug: "kawartha-lakes-city-council", herokSlug: "ca_on_kawartha_lakes", province: "Ontario" },
  { slug: "king-township-council", herokSlug: "ca_on_king", province: "Ontario" },
  { slug: "kingston-city-council", herokSlug: "ca_on_kingston", province: "Ontario" },
  { slug: "kitchener-city-council", herokSlug: "ca_on_kitchener", province: "Ontario" },
  { slug: "lambton-county-council", herokSlug: "ca_on_lambton", province: "Ontario" },
  { slug: "lasalle-town-council", herokSlug: "ca_on_lasalle", province: "Ontario" },
  { slug: "lincoln-town-council", herokSlug: "ca_on_lincoln", province: "Ontario" },
  { slug: "london-city-council", herokSlug: "ca_on_london", province: "Ontario" },
  { slug: "markham-city-council", herokSlug: "ca_on_markham", province: "Ontario" },
  { slug: "milton-town-council", herokSlug: "ca_on_milton", province: "Ontario" },
  { slug: "mississauga-city-council", herokSlug: "ca_on_mississauga", province: "Ontario" },
  { slug: "newmarket-town-council", herokSlug: "ca_on_newmarket", province: "Ontario" },
  { slug: "niagara-on-the-lake-town-council", herokSlug: "ca_on_niagara_on_the_lake", province: "Ontario" },
  { slug: "niagara-regional-council", herokSlug: "ca_on_niagara", province: "Ontario" },
  { slug: "north-dumfries-township-council", herokSlug: "ca_on_north_dumfries", province: "Ontario" },
  { slug: "oakville-town-council", herokSlug: "ca_on_oakville", province: "Ontario" },
  { slug: "oshawa-city-council", herokSlug: "ca_on_oshawa", province: "Ontario" },
  { slug: "ottawa-city-council", herokSlug: "ca_on_ottawa", province: "Ontario" },
  { slug: "peel-regional-council", herokSlug: "ca_on_peel", province: "Ontario" },
  { slug: "pickering-city-council", herokSlug: "ca_on_pickering", province: "Ontario" },
  { slug: "richmond-hill-town-council", herokSlug: "ca_on_richmond_hill", province: "Ontario" },
  { slug: "sault-ste-marie-city-council", herokSlug: "ca_on_sault_ste_marie", province: "Ontario" },
  { slug: "st-catharines-city-council", herokSlug: "ca_on_st_catharines", province: "Ontario" },
  { slug: "thunder-bay-city-council", herokSlug: "ca_on_thunder_bay", province: "Ontario" },
  { slug: "toronto-city-council", herokSlug: "ca_on_toronto", province: "Ontario" },
  { slug: "uxbridge-township-council", herokSlug: "ca_on_uxbridge", province: "Ontario" },
  { slug: "vaughan-city-council", herokSlug: "ca_on_vaughan", province: "Ontario" },
  { slug: "waterloo-city-council", herokSlug: "ca_on_waterloo", province: "Ontario" },
  { slug: "waterloo-regional-council", herokSlug: "ca_on_waterloo_region", province: "Ontario" },
  { slug: "welland-city-council", herokSlug: "ca_on_welland", province: "Ontario" },
  { slug: "wellesley-township-council", herokSlug: "ca_on_wellesley", province: "Ontario" },
  { slug: "whitby-town-council", herokSlug: "ca_on_whitby", province: "Ontario" },
  { slug: "whitchurch-stouffville-town-council", herokSlug: "ca_on_whitchurch_stouffville", province: "Ontario" },
  { slug: "wilmot-township-council", herokSlug: "ca_on_wilmot", province: "Ontario" },
  { slug: "windsor-city-council", herokSlug: "ca_on_windsor", province: "Ontario" },
  { slug: "woolwich-township-council", herokSlug: "ca_on_woolwich", province: "Ontario" },
  // Prince Edward Island
  { slug: "charlottetown-city-council", herokSlug: "ca_pe_charlottetown", province: "Prince Edward Island" },
  { slug: "stratford-town-council", herokSlug: "ca_pe_stratford", province: "Prince Edward Island" },
  { slug: "summerside-city-council", herokSlug: "ca_pe_summerside", province: "Prince Edward Island" },
  // Quebec
  { slug: "conseil-municipal-de-beaconsfield", herokSlug: "ca_qc_beaconsfield", province: "Quebec" },
  { slug: "conseil-municipal-de-brossard", herokSlug: "ca_qc_brossard", province: "Quebec" },
  { slug: "conseil-municipal-de-cote-saint-luc", herokSlug: "ca_qc_cote_saint_luc", province: "Quebec" },
  { slug: "conseil-municipal-de-dollard-des-ormeaux", herokSlug: "ca_qc_dollard_des_ormeaux", province: "Quebec" },
  { slug: "conseil-municipal-de-dorval", herokSlug: "ca_qc_dorval", province: "Quebec" },
  { slug: "conseil-municipal-de-gatineau", herokSlug: "ca_qc_gatineau", province: "Quebec" },
  { slug: "conseil-municipal-de-kirkland", herokSlug: "ca_qc_kirkland", province: "Quebec" },
  { slug: "conseil-municipal-de-laval", herokSlug: "ca_qc_laval", province: "Quebec" },
  { slug: "conseil-municipal-de-levis", herokSlug: "ca_qc_levis", province: "Quebec" },
  { slug: "conseil-municipal-de-longueuil", herokSlug: "ca_qc_longueuil", province: "Quebec" },
  { slug: "conseil-municipal-de-mercier", herokSlug: "ca_qc_mercier", province: "Quebec" },
  { slug: "conseil-municipal-de-montreal", herokSlug: "ca_qc_montreal", province: "Quebec" },
  { slug: "conseil-municipal-de-montreal-est", herokSlug: "ca_qc_montreal_est", province: "Quebec" },
  { slug: "conseil-municipal-de-pointe-claire", herokSlug: "ca_qc_pointe_claire", province: "Quebec" },
  { slug: "conseil-municipal-de-quebec", herokSlug: "ca_qc_quebec", province: "Quebec" },
  { slug: "conseil-municipal-de-saguenay", herokSlug: "ca_qc_saguenay", province: "Quebec" },
  { slug: "conseil-municipal-de-saint-jean-sur-richelieu", herokSlug: "ca_qc_saint_jean_sur_richelieu", province: "Quebec" },
  { slug: "conseil-municipal-de-saint-jerome", herokSlug: "ca_qc_saint_jerome", province: "Quebec" },
  { slug: "conseil-municipal-de-sainte-anne-de-bellevue", herokSlug: "ca_qc_sainte_anne_de_bellevue", province: "Quebec" },
  { slug: "conseil-municipal-de-senneville", herokSlug: "ca_qc_senneville", province: "Quebec" },
  { slug: "conseil-municipal-de-sherbrooke", herokSlug: "ca_qc_sherbrooke", province: "Quebec" },
  { slug: "conseil-municipal-de-terrebonne", herokSlug: "ca_qc_terrebonne", province: "Quebec" },
  { slug: "conseil-municipal-de-trois-rivieres", herokSlug: "ca_qc_trois_rivieres", province: "Quebec" },
  { slug: "conseil-municipal-de-westmount", herokSlug: "ca_qc_westmount", province: "Quebec" },
  // Saskatchewan
  { slug: "regina-city-council", herokSlug: "ca_sk_regina", province: "Saskatchewan" },
  { slug: "saskatoon-city-council", herokSlug: "ca_sk_saskatoon", province: "Saskatchewan" },
];

function withBoundaries(
  slug: string,
  scraper: () => Promise<Rep[]>,
): () => Promise<Rep[]> {
  const config = getBoundaryConfig(slug);
  return async () => {
    const reps = await scraper();
    return reps.map((rep) => {
      const raw = rep as unknown as WardRep;
      const boundary = config.getBoundary
        ? config.getBoundary(raw)
        : isMayorOffice(rep.elected_office)
          ? config.mayor || null
          : config.ward(raw);
      return boundary ? { ...rep, boundary } : rep;
    });
  };
}

export const municipalRegistry: Record<string, () => Promise<Rep[]>> =
  Object.fromEntries(
    SETS.map(({ slug, herokSlug }) => [
      slug,
      withBoundaries(slug, createOpenNorthScraper(`${BASE}${herokSlug}/`)),
    ]),
  );

export const municipalTargets: Record<string, SyncTarget> =
  Object.fromEntries(
    SETS.map(({ slug, herokSlug, province }) => [
      slug,
      {
        gov_level: "municipal" as const,
        slug,
        currentUrl: "",
        opennorthUrl: `${BASE}${herokSlug}/`,
        elected_office: "Councillor",
        province,
        enabled: true,
      } satisfies SyncTarget,
    ]),
  );
