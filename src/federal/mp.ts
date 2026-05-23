import type { Rep } from "../interfaces";
import { http } from "../http";

const MP_CSV_URL = "https://www.ourcommons.ca/Members/en/search/csv";

export async function scrapeMps(): Promise<Rep[]> {
  const { data } = await http.get<string>(MP_CSV_URL, { responseType: "text" });
  const rows = parseCsv(data);

  return rows.map((row): Rep => {
    const first_name = row["First Name"] ?? "";
    const last_name = row["Last Name"] ?? "";
    return {
      name: `${first_name} ${last_name}`.trim(),
      first_name,
      last_name,
      email: "",
      district_name: row.Constituency ?? "",
      province: row["Province / Territory"] ?? "",
      party_name: row["Political Affiliation"] ?? "",
      elected_office: "MP",
      gov_level: "federal",
    };
  });
}

function parseCsv(csv: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];
    const next = csv[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      field += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i++;
      row.push(field);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  row.push(field);
  if (row.some((value) => value.trim())) rows.push(row);

  const [headers = [], ...records] = rows;
  return records.map((record) =>
    Object.fromEntries(
      headers.map((header, index) => [header.trim(), record[index]?.trim() ?? ""]),
    ),
  );
}
