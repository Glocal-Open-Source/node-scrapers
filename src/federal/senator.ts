import { parse } from "node-html-parser";
import type { Rep } from "../interfaces";
import { http } from "../http";

const URL_LIST =
  "https://sencanada.ca/umbraco/surface/SenatorsAjax/GetSenators?displayFor=senatorslist&Lang=en";
const URL_CONTACT =
  "https://sencanada.ca/umbraco/surface/SenatorsAjax/GetSenators?displayFor=senatorscontactinformation&Lang=en";

const PARTY_MAP = new Map<string, string>([
  ["C", "Conservative Party of Canada"],
  ["PSG", "Progressive Senate Group"],
  ["ISG", "Independent Senators Group"],
  ["CSG", "Canadian Senators Group"],
  ["GRO", "Government Representative's Office"],
  ["Non-affiliated", "Non-affiliated"],
]);

type RowAgg = {
  name: string;
  party_name: string;
  province: string;
  email?: string;
};

export async function scrapeSenators(): Promise<Rep[]> {
  const [res1, res2] = await Promise.all([
    http.get<string>(URL_LIST, { responseType: "text" }),
    http.get<string>(URL_CONTACT, { responseType: "text" }),
  ]);

  const dom1 = parse(res1.data);
  const dom2 = parse(res2.data);

  const obj: Record<string, RowAgg> = {};
  let count = 0;

  const nodes1 = dom1.querySelectorAll("tbody tr");
  for (const node of nodes1) {
    count++;
    const td1 = node.querySelector("td:nth-child(1)");
    const td2 = node.querySelector("td:nth-child(2)");
    const td3 = node.querySelector("td:nth-child(3)");
    if (!td1 || !td2 || !td3) continue;
    const name = td1.textContent.trim();
    const party_name = td2.textContent.trim();
    const province = td3.textContent.trim();
    obj[name] = { name, party_name, province };
  }

  const nodes2 = dom2.querySelectorAll("tbody tr");
  for (const node of nodes2) {
    count--;
    const td1 = node.querySelector("td:nth-child(1)");
    const td5 = node.querySelector("td:nth-child(5)");
    if (!td1 || !td5) continue;
    const name = td1.textContent.trim();
    const row = obj[name];
    if (row) {
      row.email = td5.textContent.trim();
    }
  }

  if (count !== 0) {
    console.warn(
      "Senator length does not match between list and contact tables; delta:",
      count,
    );
  }

  return Object.values(obj).map((x) => {
    const parts = x.name.split(",");
    const last_name = (parts[0] ?? "").trim();
    const first_name = (parts[1] ?? "").trim();
    const mapped = PARTY_MAP.get(x.party_name);
    if (!mapped) {
      console.warn("Unknown party abbreviation:", x.party_name);
    }
    return {
      name: `${first_name} ${last_name}`.trim(),
      first_name,
      last_name,
      elected_office: "Senator",
      party_name: mapped ?? x.party_name,
      province: x.province,
      district_name: x.province,
      email: x.email ?? "",
    };
  });
}
