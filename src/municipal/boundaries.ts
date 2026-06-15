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

function wardById(prefix: string) {
  return (rep: WardRep) =>
    rep.district_id ? `${prefix}/ward-${rep.district_id}` : null;
}

function wardFromBoundaryUrl(rep: WardRep): string | null {
  const m = rep.boundary_url?.match(/^\/boundaries\/(.*?)\/?$/);
  return m ? m[1] : null;
}

export const BOUNDARY_OVERRIDES: Partial<Record<string, Partial<BoundaryConfig>>> = {
  "calgary-city-council": {
    mayor: "census-subdivisions/4806016",
    ward: (rep) => rep.district_id ? `alberta-calgary-wards/ward-${rep.district_id}` : null,
  },

  "edmonton-city-council": {
    mayor: "census-subdivisions/4811061",
    ward: (rep) => {
      const slug = rep.district_name
        .normalize("NFD").replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/['']/g, "")
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-");
      return `alberta-edmonton-wards/${slug}`;
    },
  },
  "grande-prairie-city-council": {
    mayor: "census-subdivisions/4819012",
    ward: () => "census-subdivisions/4819012",
  },
  "lethbridge-city-council": {
    mayor: "census-subdivisions/4802012",
    ward: () => "census-subdivisions/4802012",
  },
  "strathcona-county-council": {
    mayor: "census-subdivisions/4811052",
    ward: wardById("alberta-strathcona-county-wards"),
  },
  "wood-buffalo-municipal-council": {
    mayor: "census-subdivisions/4816037",
    ward: wardById("alberta-wood-buffalo-wards"),
  },
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
  "winnipeg-city-council": {
    mayor: "census-subdivisions/4611040",
    ward: () => null,
  },
  "fredericton-city-council": {
    mayor: "census-subdivisions/1310032",
    ward: wardById("fredericton-wards"),
  },
  "moncton-city-council": {
    mayor: "census-subdivisions/1307022",
    ward: wardById("moncton-wards"),
  },
  "saint-john-city-council": {
    mayor: "census-subdivisions/1301006",
    ward: wardById("saint-john-wards"),
  },
  "st-johns-city-council": {
    mayor: "census-subdivisions/1001519",
    ward: wardById("st-johns-wards"),
  },
  "cape-breton-regional-council": {
    mayor: "census-subdivisions/1217030",
    ward: wardById("cape-breton-wards"),
  },
  "halifax-regional-council": {
    mayor: "census-subdivisions/1209034",
    ward: () => null,
  },
  "ajax-town-council": {
    mayor: "census-subdivisions/3518005",
    ward: wardById("ajax-wards"),
  },
  "belleville-city-council": {
    mayor: "census-subdivisions/3512005",
    ward: wardById("belleville-wards"),
  },
  "brampton-city-council": {
    mayor: "census-subdivisions/3521010",
    ward: wardById("brampton-wards"),
  },
  "brantford-city-council": {
    mayor: "census-subdivisions/3529006",
    ward: wardById("brantford-wards"),
  },
  "burlington-city-council": {
    mayor: "census-subdivisions/3524002",
    ward: wardById("burlington-wards"),
  },
  "caledon-town-council": {
    mayor: "census-subdivisions/3521024",
    ward: wardById("caledon-wards"),
  },
  "cambridge-city-council": {
    mayor: "census-subdivisions/3530010",
    ward: wardById("cambridge-wards"),
  },
  "chatham-kent-municipal-council": {
    mayor: "census-subdivisions/3536020",
    ward: wardById("chatham-kent-wards"),
  },
  "clarington-municipal-council": {
    mayor: "census-subdivisions/3518017",
    ward: wardById("clarington-wards"),
  },
  "fort-erie-town-council": {
    mayor: "census-subdivisions/3526003",
    ward: wardById("fort-erie-wards"),
  },
  "georgina-town-council": {
    mayor: "census-subdivisions/3519070",
    ward: () => null,
  },
  "greater-sudbury-city-council": {
    mayor: "census-subdivisions/3553005",
    ward: wardById("greater-sudbury-wards"),
  },
  "grimsby-town-council": {
    mayor: "census-subdivisions/3526065",
    ward: wardById("grimsby-wards"),
  },
  "guelph-city-council": {
    mayor: "census-subdivisions/3523008",
    ward: wardById("guelph-wards"),
  },
  "haldimand-county-council": {
    mayor: "census-subdivisions/3528018",
    ward: wardById("haldimand-county-wards"),
  },
  "hamilton-city-council": {
    mayor: "census-subdivisions/3525005",
    ward: wardById("hamilton-wards"),
  },
  "huron-county-council": {
    mayor: "",
    ward: () => null,
  },
  "kawartha-lakes-city-council": {
    mayor: "census-subdivisions/3516010",
    ward: wardById("kawartha-lakes-wards"),
  },
  "king-township-council": {
    mayor: "census-subdivisions/3519049",
    ward: wardById("king-wards"),
  },
  "kingston-city-council": {
    mayor: "census-subdivisions/3510010",
    ward: () => null,
  },
  "kitchener-city-council": {
    mayor: "census-subdivisions/3530013",
    ward: wardById("kitchener-wards"),
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
    ward: wardById("lincoln-wards"),
  },
  "london-city-council": {
    mayor: "census-subdivisions/3539036",
    ward: wardById("london-wards"),
  },
  "markham-city-council": {
    mayor: "census-subdivisions/3519036",
    ward: wardById("markham-wards"),
  },
  "milton-town-council": {
    mayor: "census-subdivisions/3524009",
    ward: wardById("milton-wards"),
  },
  "mississauga-city-council": {
    mayor: "census-subdivisions/3521005",
    ward: wardById("mississauga-wards"),
  },
  "newmarket-town-council": {
    mayor: "census-subdivisions/3519048",
    ward: wardById("newmarket-wards"),
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
    ward: wardById("north-dumfries-wards"),
  },
  "oakville-town-council": {
    mayor: "census-subdivisions/3524001",
    ward: wardById("oakville-wards"),
  },
  "oshawa-city-council": {
    mayor: "census-subdivisions/3518013",
    ward: wardById("oshawa-wards"),
  },
  "ottawa-city-council": {
    mayor: "census-subdivisions/3506008",
    ward: () => null,
  },
  "peel-regional-council": {
    mayor: "",
    ward: () => null,
    getBoundary: wardFromBoundaryUrl,
  },
  "pickering-city-council": {
    mayor: "census-subdivisions/3518001",
    ward: wardById("pickering-wards"),
  },
  "richmond-hill-town-council": {
    mayor: "census-subdivisions/3519038",
    ward: wardById("richmond-hill-wards"),
  },
  "sault-ste-marie-city-council": {
    mayor: "census-subdivisions/3557061",
    ward: wardById("sault-ste-marie-wards"),
  },
  "st-catharines-city-council": {
    mayor: "census-subdivisions/3526053",
    ward: () => null,
  },
  "thunder-bay-city-council": {
    mayor: "census-subdivisions/3558004",
    ward: () => null,
  },
  "toronto-city-council": {
    mayor: "census-subdivisions/3520005",
    ward: (rep) => {
      const m = rep.personal_url?.match(/councillor-ward-(\d+)/);
      return m ? `toronto-municipal/ward-${m[1]}` : null;
    },
  },
  "uxbridge-township-council": {
    mayor: "census-subdivisions/3518029",
    ward: wardById("uxbridge-wards"),
  },
  "vaughan-city-council": {
    mayor: "census-subdivisions/3519028",
    ward: wardById("vaughan-wards"),
  },
  "waterloo-city-council": {
    mayor: "census-subdivisions/3530016",
    ward: wardById("waterloo-wards"),
  },
  "waterloo-regional-council": {
    mayor: "census-divisions/3530",
    ward: () => null,
  },
  "welland-city-council": {
    mayor: "census-subdivisions/3526032",
    ward: wardById("welland-wards"),
  },
  "wellesley-township-council": {
    mayor: "census-subdivisions/3530027",
    ward: wardById("wellesley-wards"),
  },
  "whitby-town-council": {
    mayor: "census-subdivisions/3518009",
    ward: () => null,
  },
  "whitchurch-stouffville-town-council": {
    mayor: "census-subdivisions/3519044",
    ward: () => null,
  },
  "wilmot-township-council": {
    mayor: "census-subdivisions/3530020",
    ward: wardById("wilmot-wards"),
  },
  "windsor-city-council": {
    mayor: "census-subdivisions/3537039",
    ward: wardById("windsor-wards"),
  },
  "woolwich-township-council": {
    mayor: "census-subdivisions/3530035",
    ward: wardById("woolwich-wards"),
  },
  "charlottetown-city-council": {
    mayor: "census-subdivisions/1102075",
    ward: wardById("charlottetown-wards"),
  },
  "stratford-town-council": {
    mayor: "census-subdivisions/1102080",
    ward: () => null,
  },
  "summerside-city-council": {
    mayor: "census-subdivisions/1103025",
    ward: () => null,
  },
  "conseil-municipal-de-beaconsfield": {
    mayor: "census-subdivisions/2466107",
    ward: wardById("beaconsfield-wards"),
  },
  "conseil-municipal-de-brossard": {
    mayor: "census-subdivisions/2458007",
    ward: wardById("brossard-wards"),
  },
  "conseil-municipal-de-cote-saint-luc": {
    mayor: "census-subdivisions/2466058",
    ward: wardById("cote-saint-luc-wards"),
  },
  "conseil-municipal-de-dollard-des-ormeaux": {
    mayor: "census-subdivisions/2466142",
    ward: wardById("dollard-des-ormeaux-wards"),
  },
  "conseil-municipal-de-dorval": {
    mayor: "census-subdivisions/2466087",
    ward: wardById("dorval-wards"),
  },
  "conseil-municipal-de-gatineau": {
    mayor: "census-subdivisions/2481017",
    ward: wardById("gatineau-wards"),
  },
  "conseil-municipal-de-kirkland": {
    mayor: "census-subdivisions/2466102",
    ward: wardById("kirkland-wards"),
  },
  "conseil-municipal-de-laval": {
    mayor: "",
    ward: () => null,
  },
  "conseil-municipal-de-levis": {
    mayor: "census-subdivisions/2425213",
    ward: wardById("levis-wards"),
  },
  "conseil-municipal-de-longueuil": {
    mayor: "census-subdivisions/2458227",
    ward: () => null,
  },
  "conseil-municipal-de-mercier": {
    mayor: "census-subdivisions/2467045",
    ward: wardById("mercier-wards"),
  },
  "conseil-municipal-de-montreal-est": {
    mayor: "census-subdivisions/2466007",
    ward: wardById("montreal-est-wards"),
  },
  "conseil-municipal-de-montreal": {
    mayor: "census-subdivisions/2466023",
    ward: () => null,
  },
  "conseil-municipal-de-pointe-claire": {
    mayor: "census-subdivisions/2466097",
    ward: wardById("pointe-claire-wards"),
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
    ward: wardById("saint-jean-sur-richelieu-wards"),
  },
  "conseil-municipal-de-saint-jerome": {
    mayor: "census-subdivisions/2475017",
    ward: wardById("saint-jerome-wards"),
  },
  "conseil-municipal-de-sainte-anne-de-bellevue": {
    mayor: "",
    ward: wardById("sainte-anne-de-bellevue-wards"),
  },
  "conseil-municipal-de-senneville": {
    mayor: "census-subdivisions/2466127",
    ward: wardById("senneville-wards"),
  },
  "conseil-municipal-de-sherbrooke": {
    mayor: "census-subdivisions/2443027",
    ward: () => null,
  },
  "conseil-municipal-de-terrebonne": {
    mayor: "census-subdivisions/2464008",
    ward: wardById("terrebonne-wards"),
  },
  "conseil-municipal-de-trois-rivieres": {
    mayor: "census-subdivisions/2437067",
    ward: () => null,
  },
  "conseil-municipal-de-westmount": {
    mayor: "census-subdivisions/2466032",
    ward: wardById("westmount-wards"),
  },
  "regina-city-council": {
    mayor: "census-subdivisions/4706027",
    ward: wardById("regina-wards"),
  },
  "saskatoon-city-council": {
    mayor: "census-subdivisions/4711066",
    ward: wardById("saskatoon-wards"),
  },
};

const MAYOR_OFFICES = new Set([
  "Mayor",
  "Lord Mayor",
  "Chair",
]);

/** Returns true for any head-of-council office title, including French variants. */
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

/**
 * Returns the resolved BoundaryConfig for a given slug.
 * Merges BOUNDARY_OVERRIDES on top of the default derivation.
 */
export function getBoundaryConfig(slug: string): BoundaryConfig {
  const city = cityFromSlug(slug);
  const override = BOUNDARY_OVERRIDES[slug] ?? {};
  return {
    mayor: override.mayor ?? city,
    ward:
      override.ward ??
      ((rep) =>
        rep.district_id ? `${city}-municipal/ward-${rep.district_id}` : null),
    getBoundary: override.getBoundary,
  };
}
