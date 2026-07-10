import type { Rep } from "../interfaces";
import type { SyncTarget } from "../interfaces";
import { createOpenNorthScraper } from "../provincial/opennorth";
import { getBoundaryConfig, isMayorOffice, type WardRep } from "../boundaries/municipal";
import { normalizeElectedOffice } from "../boundaries";

const BASE = "https://python-scrapers.youcount.ca/represent/";

const SETS: { slug: string; herokSlug: string; province: string }[] = [
  // Alberta
  { slug: "airdrie-city-council", herokSlug: "ca_ab_airdrie", province: "Alberta" },
  { slug: "banff-town-council", herokSlug: "ca_ab_banff", province: "Alberta" },
  { slug: "calgary-city-council", herokSlug: "ca_ab_calgary", province: "Alberta"},
  { slug: "canmore-town-council", herokSlug: "ca_ab_canmore", province: "Alberta" },
  { slug: "cochrane-town-council", herokSlug: "ca_ab_cochrane", province: "Alberta" },
  { slug: "county-of-grande-prairie-no-1-council", herokSlug: "ca_ab_grande_prairie_county_no_1", province: "Alberta"},
  { slug: "edmonton-city-council", herokSlug: "ca_ab_edmonton", province: "Alberta" },
  { slug: "fort-saskatchewan-city-council", herokSlug: "ca_ab_fort_saskatchewan", province: "Alberta" },
  { slug: "grande-prairie-city-council", herokSlug: "ca_ab_grande_prairie", province: "Alberta" },
  { slug: "leduc-city-council", herokSlug: "ca_ab_leduc", province: "Alberta" },
  { slug: "lethbridge-city-council", herokSlug: "ca_ab_lethbridge", province: "Alberta" },
  { slug: "medicine-hat-city-council", herokSlug: "ca_ab_medicine_hat", province: "Alberta" },
  { slug: "okotoks-town-council", herokSlug: "ca_ab_okotoks", province: "Alberta" },
  { slug: "red-deer-city-council", herokSlug: "ca_ab_red_deer", province: "Alberta" },
  { slug: "spruce-grove-city-council", herokSlug: "ca_ab_spruce_grove", province: "Alberta" },
  { slug: "st-albert-city-council", herokSlug: "ca_ab_st_albert", province: "Alberta" },
  { slug: "strathcona-county-council", herokSlug: "ca_ab_strathcona_county", province: "Alberta" },
  { slug: "wood-buffalo-municipal-council", herokSlug: "ca_ab_wood_buffalo", province: "Alberta" },
  // British Columbia
  { slug: "abbotsford-city-council", herokSlug: "ca_bc_abbotsford", province: "British Columbia" },
  { slug: "burnaby-city-council", herokSlug: "ca_bc_burnaby", province: "British Columbia" },
  { slug: "campbell-river-city-council", herokSlug: "ca_bc_campbell_river", province: "British Columbia" },
  { slug: "chilliwack-city-council", herokSlug: "ca_bc_chilliwack", province: "British Columbia" },
  { slug: "coquitlam-city-council", herokSlug: "ca_bc_coquitlam", province: "British Columbia" },
  { slug: "courtenay-city-council", herokSlug: "ca_bc_courtenay", province: "British Columbia" },
  { slug: "delta-city-council", herokSlug: "ca_bc_delta", province: "British Columbia" },
  { slug: "kamloops-city-council", herokSlug: "ca_bc_kamloops", province: "British Columbia" },
  { slug: "kelowna-city-council", herokSlug: "ca_bc_kelowna", province: "British Columbia" },
  { slug: "langford-city-council", herokSlug: "ca_bc_langford", province: "British Columbia" },
  { slug: "langley-city-council", herokSlug: "ca_bc_langley_city", province: "British Columbia" },
  { slug: "langley-township-council", herokSlug: "ca_bc_langley", province: "British Columbia" },
  { slug: "maple-ridge-city-council", herokSlug: "ca_bc_maple_ridge", province: "British Columbia" },
  { slug: "mission-city-council", herokSlug: "ca_bc_mission", province: "British Columbia" },
  { slug: "nanaimo-city-council", herokSlug: "ca_bc_nanaimo", province: "British Columbia" },
  { slug: "new-westminster-city-council", herokSlug: "ca_bc_new_westminster", province: "British Columbia" },
  { slug: "north-vancouver-city-council", herokSlug: "ca_bc_north_vancouver_city", province: "British Columbia" },
  { slug: "north-vancouver-district-council", herokSlug: "ca_bc_north_vancouver", province: "British Columbia" },
  { slug: "penticton-city-council", herokSlug: "ca_bc_penticton", province: "British Columbia" },
  { slug: "port-coquitlam-city-council", herokSlug: "ca_bc_port_coquitlam", province: "British Columbia" },
  { slug: "port-moody-city-council", herokSlug: "ca_bc_port_moody", province: "British Columbia" },
  { slug: "prince-george-city-council", herokSlug: "ca_bc_prince_george", province: "British Columbia" },
  { slug: "richmond-city-council", herokSlug: "ca_bc_richmond", province: "British Columbia" },
  { slug: "saanich-district-council", herokSlug: "ca_bc_saanich", province: "British Columbia" },
  { slug: "surrey-city-council", herokSlug: "ca_bc_surrey", province: "British Columbia" },
  { slug: "tofino-district-council", herokSlug: "ca_bc_tofino", province: "British Columbia" },
  { slug: "vancouver-city-council", herokSlug: "ca_bc_vancouver", province: "British Columbia" },
  { slug: "vernon-city-council", herokSlug: "ca_bc_vernon", province: "British Columbia" },
  { slug: "victoria-city-council", herokSlug: "ca_bc_victoria", province: "British Columbia" },
  { slug: "west-kelowna-city-council", herokSlug: "ca_bc_west_kelowna", province: "British Columbia" },
  { slug: "west-vancouver-district-council", herokSlug: "ca_bc_west_vancouver", province: "British Columbia" },
  { slug: "whistler-municipal-council", herokSlug: "ca_bc_whistler", province: "British Columbia" },
  // Manitoba
  { slug: "brandon-city-council", herokSlug: "ca_mb_brandon", province: "Manitoba" },
  { slug: "winnipeg-city-council", herokSlug: "ca_mb_winnipeg", province: "Manitoba" },
  // New Brunswick
  { slug: "dieppe-city-council", herokSlug: "ca_nb_dieppe", province: "New Brunswick" },
  { slug: "fredericton-city-council", herokSlug: "ca_nb_fredericton", province: "New Brunswick" },
  { slug: "moncton-city-council", herokSlug: "ca_nb_moncton", province: "New Brunswick" },
  { slug: "saint-john-city-council", herokSlug: "ca_nb_saint_john", province: "New Brunswick" },
  // Newfoundland and Labrador
  { slug: "conception-bay-south-town-council", herokSlug: "ca_nl_conception_bay_south", province: "Newfoundland and Labrador" },
  { slug: "st-johns-city-council", herokSlug: "ca_nl_st_john_s", province: "Newfoundland and Labrador" },
  // Northwest Territories
  { slug: "yellowknife-city-council", herokSlug: "ca_nt_yellowknife", province: "Northwest Territories" },
  // Nova Scotia
  { slug: "cape-breton-regional-council", herokSlug: "ca_ns_cape_breton", province: "Nova Scotia" },
  { slug: "halifax-regional-council", herokSlug: "ca_ns_halifax", province: "Nova Scotia" },
  // Nunavut
  { slug: "iqaluit-city-council", herokSlug: "ca_nu_iqaluit", province: "Nunavut" },
  // Ontario
  { slug: "ajax-town-council", herokSlug: "ca_on_ajax", province: "Ontario" },
  { slug: "barrie-city-council", herokSlug: "ca_on_barrie", province: "Ontario" },
  { slug: "belleville-city-council", herokSlug: "ca_on_belleville", province: "Ontario" },
  { slug: "bradford-west-gwillimbury-town-council", herokSlug: "ca_on_bradford_west_gwillimbury", province: "Ontario" },
  { slug: "brantford-city-council", herokSlug: "ca_on_brantford", province: "Ontario" },
  { slug: "brampton-city-council", herokSlug: "ca_on_brampton", province: "Ontario" },
  { slug: "burlington-city-council", herokSlug: "ca_on_burlington", province: "Ontario" },
  { slug: "caledon-town-council", herokSlug: "ca_on_caledon", province: "Ontario" },
  { slug: "cambridge-city-council", herokSlug: "ca_on_cambridge", province: "Ontario" },
  { slug: "centre-wellington-township-council", herokSlug: "ca_on_centre_wellington", province: "Ontario" },
  { slug: "chatham-kent-municipal-council", herokSlug: "ca_on_chatham_kent", province: "Ontario" },
  { slug: "clarington-municipal-council", herokSlug: "ca_on_clarington", province: "Ontario" },
  { slug: "cornwall-city-council", herokSlug: "ca_on_cornwall", province: "Ontario" },
  { slug: "fort-erie-town-council", herokSlug: "ca_on_fort_erie", province: "Ontario" },
  { slug: "georgina-town-council", herokSlug: "ca_on_georgina", province: "Ontario" },
  { slug: "greater-sudbury-city-council", herokSlug: "ca_on_greater_sudbury", province: "Ontario" },
  { slug: "grimsby-town-council", herokSlug: "ca_on_grimsby", province: "Ontario" },
  { slug: "guelph-city-council", herokSlug: "ca_on_guelph", province: "Ontario" },
  { slug: "haldimand-county-council", herokSlug: "ca_on_haldimand_county", province: "Ontario" },
  { slug: "halton-hills-town-council", herokSlug: "ca_on_halton_hills", province: "Ontario" },
  { slug: "hamilton-city-council", herokSlug: "ca_on_hamilton", province: "Ontario" },
  { slug: "huron-county-council", herokSlug: "ca_on_huron", province: "Ontario" },
  { slug: "innisfil-town-council", herokSlug: "ca_on_innisfil", province: "Ontario" },
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
  { slug: "niagara-falls-city-council", herokSlug: "ca_on_niagara_falls", province: "Ontario" },
  { slug: "niagara-on-the-lake-town-council", herokSlug: "ca_on_niagara_on_the_lake", province: "Ontario" },
  { slug: "niagara-regional-council", herokSlug: "ca_on_niagara", province: "Ontario" },
  { slug: "norfolk-county-council", herokSlug: "ca_on_norfolk_county", province: "Ontario" },
  { slug: "north-bay-city-council", herokSlug: "ca_on_north_bay", province: "Ontario" },
  { slug: "north-dumfries-township-council", herokSlug: "ca_on_north_dumfries", province: "Ontario" },
  { slug: "oakville-town-council", herokSlug: "ca_on_oakville", province: "Ontario" },
  { slug: "orangeville-town-council", herokSlug: "ca_on_orangeville", province: "Ontario" },
  { slug: "orillia-city-council", herokSlug: "ca_on_orillia", province: "Ontario" },
  { slug: "oshawa-city-council", herokSlug: "ca_on_oshawa", province: "Ontario" },
  { slug: "ottawa-city-council", herokSlug: "ca_on_ottawa", province: "Ontario" },
  { slug: "peel-regional-council", herokSlug: "ca_on_peel", province: "Ontario" },
  { slug: "peterborough-city-council", herokSlug: "ca_on_peterborough", province: "Ontario" },
  { slug: "pickering-city-council", herokSlug: "ca_on_pickering", province: "Ontario" },
  { slug: "prince-edward-county-council", herokSlug: "ca_on_prince_edward_county", province: "Ontario" },
  { slug: "richmond-hill-town-council", herokSlug: "ca_on_richmond_hill", province: "Ontario" },
  { slug: "sarnia-city-council", herokSlug: "ca_on_sarnia", province: "Ontario" },
  { slug: "sault-ste-marie-city-council", herokSlug: "ca_on_sault_ste_marie", province: "Ontario" },
  { slug: "st-catharines-city-council", herokSlug: "ca_on_st_catharines", province: "Ontario" },
  { slug: "st-thomas-city-council", herokSlug: "ca_on_st_thomas", province: "Ontario" },
  { slug: "stratford-city-council", herokSlug: "ca_on_stratford", province: "Ontario" },
  { slug: "thunder-bay-city-council", herokSlug: "ca_on_thunder_bay", province: "Ontario" },
  { slug: "timmins-city-council", herokSlug: "ca_on_timmins", province: "Ontario" },
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
  { slug: "woodstock-city-council", herokSlug: "ca_on_woodstock", province: "Ontario" },
  { slug: "woolwich-township-council", herokSlug: "ca_on_woolwich", province: "Ontario" },
  // Prince Edward Island
  { slug: "charlottetown-city-council", herokSlug: "ca_pe_charlottetown", province: "Prince Edward Island" },
  { slug: "stratford-town-council", herokSlug: "ca_pe_stratford", province: "Prince Edward Island" },
  { slug: "summerside-city-council", herokSlug: "ca_pe_summerside", province: "Prince Edward Island" },
  // Quebec
  { slug: "conseil-municipal-de-alma", herokSlug: "ca_qc_alma", province: "Quebec" },
  { slug: "conseil-municipal-de-beaconsfield", herokSlug: "ca_qc_beaconsfield", province: "Quebec" },
  { slug: "conseil-municipal-de-blainville", herokSlug: "ca_qc_blainville", province: "Quebec" },
  { slug: "conseil-municipal-de-boisbriand", herokSlug: "ca_qc_boisbriand", province: "Quebec" },
  { slug: "conseil-municipal-de-brossard", herokSlug: "ca_qc_brossard", province: "Quebec" },
  { slug: "conseil-municipal-de-cote-saint-luc", herokSlug: "ca_qc_cote_saint_luc", province: "Quebec" },
  { slug: "conseil-municipal-de-dollard-des-ormeaux", herokSlug: "ca_qc_dollard_des_ormeaux", province: "Quebec" },
  { slug: "conseil-municipal-de-dorval", herokSlug: "ca_qc_dorval", province: "Quebec" },
  { slug: "conseil-municipal-de-drummondville", herokSlug: "ca_qc_drummondville", province: "Quebec" },
  { slug: "conseil-municipal-de-gatineau", herokSlug: "ca_qc_gatineau", province: "Quebec" },
  { slug: "conseil-municipal-de-granby", herokSlug: "ca_qc_granby", province: "Quebec" },
  { slug: "conseil-municipal-de-kirkland", herokSlug: "ca_qc_kirkland", province: "Quebec" },
  { slug: "conseil-municipal-de-laval", herokSlug: "ca_qc_laval", province: "Quebec" },
  { slug: "conseil-municipal-de-levis", herokSlug: "ca_qc_levis", province: "Quebec" },
  { slug: "conseil-municipal-de-longueuil", herokSlug: "ca_qc_longueuil", province: "Quebec" },
  { slug: "conseil-municipal-de-magog", herokSlug: "ca_qc_magog", province: "Quebec" },
  { slug: "conseil-municipal-de-mercier", herokSlug: "ca_qc_mercier", province: "Quebec" },
  { slug: "conseil-municipal-de-mirabel", herokSlug: "ca_qc_mirabel", province: "Quebec" },
  { slug: "conseil-municipal-de-montreal", herokSlug: "ca_qc_montreal", province: "Quebec" },
  { slug: "conseil-municipal-de-montreal-est", herokSlug: "ca_qc_montreal_est", province: "Quebec" },
  { slug: "conseil-municipal-de-pointe-claire", herokSlug: "ca_qc_pointe_claire", province: "Quebec" },
  { slug: "conseil-municipal-de-quebec", herokSlug: "ca_qc_quebec", province: "Quebec" },
  { slug: "conseil-municipal-de-repentigny", herokSlug: "ca_qc_repentigny", province: "Quebec" },
  { slug: "conseil-municipal-de-rimouski", herokSlug: "ca_qc_rimouski", province: "Quebec" },
  { slug: "conseil-municipal-de-rouyn-noranda", herokSlug: "ca_qc_rouyn_noranda", province: "Quebec" },
  { slug: "conseil-municipal-de-saguenay", herokSlug: "ca_qc_saguenay", province: "Quebec" },
  { slug: "conseil-municipal-de-saint-eustache", herokSlug: "ca_qc_saint_eustache", province: "Quebec" },
  { slug: "conseil-municipal-de-saint-georges", herokSlug: "ca_qc_saint_georges", province: "Quebec" },
  { slug: "conseil-municipal-de-saint-hyacinthe", herokSlug: "ca_qc_saint_hyacinthe", province: "Quebec" },
  { slug: "conseil-municipal-de-saint-jean-sur-richelieu", herokSlug: "ca_qc_saint_jean_sur_richelieu", province: "Quebec" },
  { slug: "conseil-municipal-de-saint-jerome", herokSlug: "ca_qc_saint_jerome", province: "Quebec" },
  { slug: "conseil-municipal-de-sainte-anne-de-bellevue", herokSlug: "ca_qc_sainte_anne_de_bellevue", province: "Quebec" },
  { slug: "conseil-municipal-de-sainte-julie", herokSlug: "ca_qc_sainte_julie", province: "Quebec" },
  { slug: "conseil-municipal-de-salaberry-de-valleyfield", herokSlug: "ca_qc_salaberry_de_valleyfield", province: "Quebec" },
  { slug: "conseil-municipal-de-senneville", herokSlug: "ca_qc_senneville", province: "Quebec" },
  { slug: "conseil-municipal-de-sept-iles", herokSlug: "ca_qc_sept_iles", province: "Quebec" },
  { slug: "conseil-municipal-de-shawinigan", herokSlug: "ca_qc_shawinigan", province: "Quebec" },
  { slug: "conseil-municipal-de-sherbrooke", herokSlug: "ca_qc_sherbrooke", province: "Quebec" },
  { slug: "conseil-municipal-de-sorel-tracy", herokSlug: "ca_qc_sorel_tracy", province: "Quebec" },
  { slug: "conseil-municipal-de-terrebonne", herokSlug: "ca_qc_terrebonne", province: "Quebec" },
  { slug: "conseil-municipal-de-thetford-mines", herokSlug: "ca_qc_thetford_mines", province: "Quebec" },
  { slug: "conseil-municipal-de-trois-rivieres", herokSlug: "ca_qc_trois_rivieres", province: "Quebec" },
  { slug: "conseil-municipal-de-val-dor", herokSlug: "ca_qc_val_dor", province: "Quebec" },
  { slug: "conseil-municipal-de-vaudreuil-dorion", herokSlug: "ca_qc_vaudreuil_dorion", province: "Quebec" },
  { slug: "conseil-municipal-de-victoriaville", herokSlug: "ca_qc_victoriaville", province: "Quebec" },
  { slug: "conseil-municipal-de-westmount", herokSlug: "ca_qc_westmount", province: "Quebec" },
  // Saskatchewan
  { slug: "regina-city-council", herokSlug: "ca_sk_regina", province: "Saskatchewan" },
  { slug: "saskatoon-city-council", herokSlug: "ca_sk_saskatoon", province: "Saskatchewan" },
  // Yukon
  { slug: "whitehorse-city-council", herokSlug: "ca_yt_whitehorse", province: "Yukon" },
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
          : config.ward(raw) || config.mayor || null;
      return {
        ...rep,
        elected_office: normalizeElectedOffice(rep.elected_office),
        gender: rep.gender === "M" ? "Male" : rep.gender === "F" ? "Female" : rep.gender,
        ...(boundary && {
          boundary,
          related: {
            ...rep.related,
            boundary_url: `/boundaries/${boundary}/`,
          },
        }),
      };
    });
  };
}

export const municipalRegistry: Record<string, () => Promise<Rep[]>> =
  Object.fromEntries(
    SETS.map(({ slug, herokSlug, province }) => [
      slug,
      withBoundaries(
        slug,
        createOpenNorthScraper(`${BASE}${herokSlug}/`, {
          province,
          gov_level: "municipal",
        }),
      ),
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
