import { lookupBoundary } from ".";

export interface WardRep {
  elected_office?: string;
  district_name: string;
  district_id?: string;
  personal_url?: string | null;
  boundary_url?: string;
}

export interface BoundaryConfig {
  mayor: string;
  ward: (rep: WardRep) => string | null;
  getBoundary?: (rep: WardRep) => string | null;
}

function wardByName(boundarySet: string) {
  return (rep: WardRep): string | null => lookupBoundary(boundarySet, rep.district_name);
}

function wardFromBoundaryUrl(rep: WardRep): string | null {
  const m = rep.boundary_url?.match(/^\/boundaries\/(.*?)\/?$/);
  return m ? m[1] : null;
}

const BOUNDARY_OVERRIDES: Partial<Record<string, Partial<BoundaryConfig>>> = {
  // Alberta
  "calgary-city-council": {
    mayor: "census-subdivisions/4806016",
    ward: wardByName("alberta-calgary-wards"),
  },
  "county-of-grande-prairie-no-1-council": {
    mayor: "census-subdivisions/4819006",
    ward: wardByName("grande-prairie-county-no-1-divisions"),
  },
  "edmonton-city-council": {
    mayor: "census-subdivisions/4811061",
    ward: wardByName("alberta-edmonton-wards"),
  },
  "grande-prairie-city-council": {
    mayor: "census-subdivisions/4819012",
    ward: () => null,
  },
  "lethbridge-city-council": {
    mayor: "census-subdivisions/4802012",
    ward: () => null,
  },
  "strathcona-county-council": {
    mayor: "census-subdivisions/4811052",
    ward: wardByName("strathcona-county-wards"),
  },
  "wood-buffalo-municipal-council": {
    mayor: "census-subdivisions/4816037",
    ward: wardByName("alberta-wood-buffalo-wards"),
  },
  // British Columbia
  "abbotsford-city-council": {
    mayor: "census-subdivisions/5909052",
    ward: () => null,
  },
  "burnaby-city-council": {
    mayor: "census-subdivisions/5915025",
    ward: () => null,
  },
  "coquitlam-city-council": {
    mayor: "census-subdivisions/5915034",
    ward: () => null,
  },
  "kelowna-city-council": {
    mayor: "census-subdivisions/5935010",
    ward: () => null,
  },
  "langley-city-council": {
    mayor: "census-subdivisions/5915002",
    ward: () => null,
  },
  "langley-township-council": {
    mayor: "census-subdivisions/5915001",
    ward: () => null,
  },
  "new-westminster-city-council": {
    mayor: "census-subdivisions/5915029",
    ward: () => null,
  },
  "richmond-city-council": {
    mayor: "census-subdivisions/5915015",
    ward: () => null,
  },
  "saanich-district-council": {
    mayor: "census-subdivisions/5917021",
    ward: () => null,
  },
  "surrey-city-council": {
    mayor: "census-subdivisions/5915004",
    ward: () => null,
  },
  "vancouver-city-council": {
    mayor: "census-subdivisions/5915022",
    ward: () => null,
  },
  "victoria-city-council": {
    mayor: "census-subdivisions/5917034",
    ward: () => null,
  },
  // Manitoba
  "winnipeg-city-council": {
    mayor: "census-subdivisions/4611040",
    ward: wardByName("winnipeg-wards"),
  },
  // New Brunswick
  "fredericton-city-council": {
    mayor: "census-subdivisions/1310032",
    ward: wardByName("fredericton-wards"),
  },
  "moncton-city-council": {
    mayor: "census-subdivisions/1307022",
    ward: wardByName("moncton-wards"),
  },
  "saint-john-city-council": {
    mayor: "census-subdivisions/1301006",
    ward: wardByName("saint-john-wards"),
  },
  // Newfoundland and Labrador
  "st-johns-city-council": {
    mayor: "census-subdivisions/1001519",
    ward: wardByName("st-johns-wards"),
  },
  // Nova Scotia
  "cape-breton-regional-council": {
    mayor: "census-subdivisions/1217030",
    ward: wardByName("cape-breton-districts"),
  },
  "halifax-regional-council": {
    mayor: "census-subdivisions/1209034",
    ward: wardByName("nova-scotia-halifax-wards"),
  },
  // Ontario
  "ajax-town-council": {
    mayor: "census-subdivisions/3518005",
    ward: wardByName("ajax-wards"),
  },
  "belleville-city-council": {
    mayor: "census-subdivisions/3512005",
    ward: () => null,
  },
  "brantford-city-council": {
    mayor: "census-subdivisions/3529006",
    ward: wardByName("brantford-wards"),
  },
  "brampton-city-council": {
    mayor: "census-subdivisions/3521010",
    ward: wardByName("brampton-wards"),
  },
  "burlington-city-council": {
    mayor: "census-subdivisions/3524002",
    ward: wardByName("burlington-wards"),
  },
  "caledon-town-council": {
    mayor: "census-subdivisions/3521024",
    ward: wardByName("caledon-wards"),
  },
  "cambridge-city-council": {
    mayor: "census-subdivisions/3530010",
    ward: wardByName("cambridge-wards"),
  },
  "chatham-kent-municipal-council": {
    mayor: "census-subdivisions/3536020",
    ward: wardByName("chatham-kent-wards"),
  },
  "clarington-municipal-council": {
    mayor: "census-subdivisions/3518017",
    ward: () => null,
  },
  "fort-erie-town-council": {
    mayor: "census-subdivisions/3526003",
    ward: wardByName("fort-erie-wards"),
  },
  "georgina-town-council": {
    mayor: "census-subdivisions/3519070",
    ward: () => null,
  },
  "greater-sudbury-city-council": {
    mayor: "census-subdivisions/3553005",
    ward: wardByName("greater-sudbury-wards"),
  },
  "grimsby-town-council": {
    mayor: "census-subdivisions/3526065",
    ward: wardByName("grimsby-wards"),
  },
  "guelph-city-council": {
    mayor: "census-subdivisions/3523008",
    ward: wardByName("guelph-wards"),
  },
  "haldimand-county-council": {
    mayor: "census-subdivisions/3528018",
    ward: wardByName("haldimand-county-wards"),
  },
  "hamilton-city-council": {
    mayor: "census-subdivisions/3525005",
    ward: wardByName("hamilton-wards"),
  },
  "huron-county-council": {
    mayor: "",
    ward: () => null,
  },
  "kawartha-lakes-city-council": {
    mayor: "census-subdivisions/3516010",
    ward: () => null,
  },
  "king-township-council": {
    mayor: "census-subdivisions/3519049",
    ward: wardByName("king-wards"),
  },
  "kingston-city-council": {
    mayor: "census-subdivisions/3510010",
    ward: wardByName("kingston-wards"),
  },
  "kitchener-city-council": {
    mayor: "census-subdivisions/3530013",
    ward: wardByName("kitchener-wards"),
  },
  "lambton-county-council": {
    mayor: "",
    ward: wardFromBoundaryUrl,
  },
  "lasalle-town-council": {
    mayor: "census-subdivisions/3537034",
    ward: () => null,
  },
  "lincoln-town-council": {
    mayor: "census-subdivisions/3526057",
    ward: wardByName("lincoln-wards"),
  },
  "london-city-council": {
    mayor: "census-subdivisions/3539036",
    ward: wardByName("london-wards"),
  },
  "markham-city-council": {
    mayor: "census-subdivisions/3519036",
    ward: wardByName("markham-wards"),
  },
  "milton-town-council": {
    mayor: "census-subdivisions/3524009",
    ward: wardByName("milton-wards"),
  },
  "mississauga-city-council": {
    mayor: "census-subdivisions/3521005",
    ward: wardByName("mississauga-wards"),
  },
  "newmarket-town-council": {
    mayor: "census-subdivisions/3519048",
    ward: wardByName("newmarket-wards"),
  },
  "niagara-on-the-lake-town-council": {
    mayor: "census-subdivisions/3526047",
    ward: () => null,
  },
  "niagara-regional-council": {
    mayor: "",
    ward: () => null,
  },
  "north-dumfries-township-council": {
    mayor: "census-subdivisions/3530004",
    ward: wardByName("north-dumfries-wards"),
  },
  "oakville-town-council": {
    mayor: "census-subdivisions/3524001",
    ward: wardByName("oakville-wards"),
  },
  "oshawa-city-council": {
    mayor: "census-subdivisions/3518013",
    ward: wardByName("oshawa-wards"),
  },
  "ottawa-city-council": {
    mayor: "census-subdivisions/3506008",
    ward: wardByName("ottawa-wards"),
  },
  "peel-regional-council": {
    mayor: "",
    ward: () => null,
    getBoundary: wardFromBoundaryUrl,
  },
  "pickering-city-council": {
    mayor: "census-subdivisions/3518001",
    ward: wardByName("pickering-wards"),
  },
  "richmond-hill-town-council": {
    mayor: "census-subdivisions/3519038",
    ward: () => null,
  },
  "sault-ste-marie-city-council": {
    mayor: "census-subdivisions/3557061",
    ward: () => null,
  },
  "st-catharines-city-council": {
    mayor: "census-subdivisions/3526053",
    ward: wardByName("st-catharines-wards"),
  },
  "thunder-bay-city-council": {
    mayor: "census-subdivisions/3558004",
    ward: wardByName("thunder-bay-wards"),
  },
  "toronto-city-council": {
    mayor: "census-subdivisions/3520005",
    ward: wardByName("toronto-wards-2018"),
  },
  "uxbridge-township-council": {
    mayor: "census-subdivisions/3518029",
    ward: wardByName("uxbridge-wards"),
  },
  "vaughan-city-council": {
    mayor: "census-subdivisions/3519028",
    ward: () => null,
  },
  "waterloo-city-council": {
    mayor: "census-subdivisions/3530016",
    ward: wardByName("waterloo-wards"),
  },
  "waterloo-regional-council": {
    mayor: "census-divisions/3530",
    ward: () => null,
  },
  "welland-city-council": {
    mayor: "census-subdivisions/3526032",
    ward: wardByName("welland-wards"),
  },
  "wellesley-township-council": {
    mayor: "census-subdivisions/3530027",
    ward: wardByName("wellesley-wards"),
  },
  "whitby-town-council": {
    mayor: "census-subdivisions/3518009",
    ward: wardByName("whitby-wards"),
  },
  "whitchurch-stouffville-town-council": {
    mayor: "census-subdivisions/3519044",
    ward: () => null,
  },
  "wilmot-township-council": {
    mayor: "census-subdivisions/3530020",
    ward: () => null,
  },
  "windsor-city-council": {
    mayor: "census-subdivisions/3537039",
    ward: wardByName("windsor-wards"),
  },
  "woolwich-township-council": {
    mayor: "census-subdivisions/3530035",
    ward: () => null,
  },
  // Prince Edward Island
  "charlottetown-city-council": {
    mayor: "census-subdivisions/1102075",
    ward: wardByName("charlottetown-wards"),
  },
  "stratford-town-council": {
    mayor: "census-subdivisions/1102080",
    ward: () => null,
  },
  "summerside-city-council": {
    mayor: "census-subdivisions/1103025",
    ward: () => null,
  },
  // Quebec
  "conseil-municipal-de-beaconsfield": {
    mayor: "census-subdivisions/2466107",
    ward: wardByName("beaconsfield-districts"),
  },
  "conseil-municipal-de-brossard": {
    mayor: "census-subdivisions/2458007",
    ward: wardByName("brossard-districts"),
  },
  "conseil-municipal-de-cote-saint-luc": {
    mayor: "census-subdivisions/2466058",
    ward: wardByName("cote-saint-luc-districts"),
  },
  "conseil-municipal-de-dollard-des-ormeaux": {
    mayor: "census-subdivisions/2466142",
    ward: wardByName("dollard-des-ormeaux-districts"),
  },
  "conseil-municipal-de-dorval": {
    mayor: "census-subdivisions/2466087",
    ward: wardByName("dorval-districts"),
  },
  "conseil-municipal-de-gatineau": {
    mayor: "census-subdivisions/2481017",
    ward: wardByName("gatineau-districts"),
  },
  "conseil-municipal-de-kirkland": {
    mayor: "census-subdivisions/2466102",
    ward: wardByName("kirkland-districts"),
  },
  "conseil-municipal-de-laval": {
    mayor: "census-subdivisions/2465005",
    ward: wardByName("laval-districts"),
  },
  "conseil-municipal-de-levis": {
    mayor: "census-subdivisions/2425213",
    ward: wardByName("levis-districts"),
  },
  "conseil-municipal-de-longueuil": {
    mayor: "census-subdivisions/2458227",
    ward: wardByName("longueuil-districts"),
  },
  "conseil-municipal-de-mercier": {
    mayor: "census-subdivisions/2467045",
    ward: wardByName("mercier-districts"),
  },
  "conseil-municipal-de-montreal-est": {
    mayor: "census-subdivisions/2466007",
    ward: wardByName("montreal-est-districts"),
  },
  "conseil-municipal-de-montreal": {
    mayor: "census-subdivisions/2466023",
    ward: wardByName("quebec-montreal-wards"),
  },
  "conseil-municipal-de-pointe-claire": {
    mayor: "census-subdivisions/2466097",
    ward: wardByName("pointe-claire-districts"),
  },
  "conseil-municipal-de-quebec": {
    mayor: "census-subdivisions/2423027",
    ward: wardFromBoundaryUrl,
  },
  "conseil-municipal-de-saguenay": {
    mayor: "census-subdivisions/2494068",
    ward: wardFromBoundaryUrl,
  },
  "conseil-municipal-de-saint-jean-sur-richelieu": {
    mayor: "census-subdivisions/2456083",
    ward: wardByName("saint-jean-sur-richelieu-districts"),
  },
  "conseil-municipal-de-saint-jerome": {
    mayor: "census-subdivisions/2475017",
    ward: wardByName("saint-jerome-districts"),
  },
  "conseil-municipal-de-sainte-anne-de-bellevue": {
    mayor: "census-subdivisions/2466117",
    ward: wardByName("sainte-anne-de-bellevue-districts"),
  },
  "conseil-municipal-de-senneville": {
    mayor: "census-subdivisions/2466127",
    ward: () => null,
  },
  "conseil-municipal-de-sherbrooke": {
    mayor: "census-subdivisions/2443027",
    ward: wardByName("sherbrooke-districts"),
  },
  "conseil-municipal-de-terrebonne": {
    mayor: "census-subdivisions/2464008",
    ward: () => null,
  },
  "conseil-municipal-de-trois-rivieres": {
    mayor: "census-subdivisions/2437067",
    ward: wardByName("quebec-trois-rivieres-wards"),
  },
  "conseil-municipal-de-westmount": {
    mayor: "census-subdivisions/2466032",
    ward: () => null,
  },
  // Saskatchewan
  "regina-city-council": {
    mayor: "census-subdivisions/4706027",
    ward: wardByName("regina-wards"),
  },
  "saskatoon-city-council": {
    mayor: "census-subdivisions/4711066",
    ward: wardByName("saskatoon-wards"),
  },
};

const MAYOR_OFFICES = new Set([
  "Mayor",
  "Lord Mayor",
  "Chair",
  "Reeve",
]);

export function isMayorOffice(office: string | undefined): boolean {
  if (!office) return false;
  return MAYOR_OFFICES.has(office) || office.startsWith("Maire") || office === "Mairesse";
}

function cityFromSlug(slug: string): string {
  return slug
    .replace(/^conseil-municipal-de-/, "")
    .replace(
      /-(city|town|municipal|district|township|regional|county|village|no-\d+)-council$/,
      "",
    )
    .replace(/-council$/, "");
}

export function getBoundaryConfig(slug: string): BoundaryConfig {
  const city = cityFromSlug(slug);
  const override = BOUNDARY_OVERRIDES[slug] ?? {};
  return {
    mayor: override.mayor ?? city,
    ward: override.ward ?? wardFromBoundaryUrl,
    getBoundary: override.getBoundary,
  };
}
