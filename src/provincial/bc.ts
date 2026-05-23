import type { Rep } from "../interfaces";
import { http } from "../http";

const GRAPHQL_URL = "https://lims.leg.bc.ca/graphql";

function buildPayload(parliamentId: number) {
  return {
    operationName: "GetAllMLAs",
    variables: { parliamentId },
    query: `query GetAllMLAs($parliamentId: Int!) {
    allMemberParliaments(condition: {active: true, parliamentId: $parliamentId}) {
      nodes {
        image: imageByMediumImageId {
          path
          description
          __typename
        }
          party: partyByPartyId {
            abbreviation
            __typename
          }
        memberByMemberId {
          firstName
          lastName
          legislativeEmail
          memberTypeId
          middleName
          officePhone
          primaryConstituencyOfficeId
          primaryRoleId
          prefix
          __typename
        }
          constituency: constituencyByConstituencyId {
            offices: constituencyOfficesByConstituencyId(
              first: 5
              condition: {active: true}
            ) {
              nodes {
                name
                __typename
              }
              __typename
            }
            name
            __typename
          }

        __typename
      }
      __typename
    }
  }`,
  };
}

/** BC MLAs via LIMS GraphQL (ported from admin-amplify `repsScrapperFn`). */
export async function scrapeBcMla(): Promise<Rep[]> {
  const parliamentId = Number(process.env.BC_PARLIAMENT_ID ?? "43");
  const { data } = await http.post<{
    data?: {
      allMemberParliaments?: {
        nodes?: Array<{
          image?: { path?: string };
          party?: { abbreviation?: string };
          memberByMemberId?: {
            firstName?: string;
            lastName?: string;
            legislativeEmail?: string | null;
          };
          constituency?: { name?: string };
        }>;
      };
    };
  }>(GRAPHQL_URL, buildPayload(parliamentId), {
    headers: { "Content-Type": "application/json" },
  });

  const nodes = data.data?.allMemberParliaments?.nodes;
  if (!nodes?.length) {
    throw new Error("BC GraphQL: empty or missing allMemberParliaments.nodes");
  }

  return nodes.map((x) => {
    const m = x.memberByMemberId;
    const firstName = m?.firstName ?? "";
    const lastName = m?.lastName ?? "";
    const email =
      m?.legislativeEmail ??
      `${firstName}.${lastName}.MLA@leg.bc.ca`.replace(/\s+/g, "");
    const path = x.image?.path ?? "";
    const photo_url = path ? `https://lims.leg.bc.ca/public${path}` : undefined;
    const slug = `${lastName}-${firstName}`;
    const rep: Rep = {
      first_name: firstName,
      last_name: lastName,
      name: `${firstName} ${lastName}`.trim(),
      district_name: x.constituency?.name ?? "",
      elected_office: "MLA",
      province: "British Columbia",
      email,
      party_name: x.party?.abbreviation ?? "",
      photo_url,
      offices: [],
      quick_links: [
        {
          title: "Official Website",
          url: `https://www.leg.bc.ca/members/43rd-Parliament/${encodeURIComponent(slug)}`,
        },
      ],
      bio: "",
    };
    return rep;
  });
}
