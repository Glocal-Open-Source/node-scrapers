import { parse } from "node-html-parser";
import { execFile } from "child_process";
import { promisify } from "util";

import type { Rep } from "../interfaces";

const execFileAsync = promisify(execFile);

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// yukonassembly.ca blocks Node.js's TLS fingerprint; curl (Windows SChannel) passes.
async function ytGet(url: string): Promise<string> {
  const { stdout } = await execFileAsync("curl", ["-s", "-A", UA, url]);
  return stdout;
}

function parseCsvRow(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function normalizeName(name: string): string {
  return name.replace(/^Hon\.\s*/i, "").trim().toLowerCase();
}

/** Yukon MLAs */
export async function scrapeYtMla(): Promise<Rep[]> {
  const [listHtml, csvText] = await Promise.all([
    ytGet("https://yukonassembly.ca/mlas"),
    ytGet("https://yukonassembly.ca/export-mla-list"),
  ]);

  // CSV columns: Title, District, Party, Phone, Fax, Email
  const emailMap = new Map<string, { email: string; phone: string }>();
  for (const line of csvText.trim().split("\n").slice(1)) {
    const cols = parseCsvRow(line);
    const title = cols[0] ?? "";
    const phone = cols[3]?.trim() ?? "";
    const email = cols[5]?.trim() ?? "";
    if (title) emailMap.set(normalizeName(title), { email, phone });
  }

  const listDoc = parse(listHtml);
  const reps: Rep[] = [];

  for (const row of listDoc.querySelectorAll(".views-row")) {
    const link = row.querySelector("a");
    if (!link) continue;

    const href = link.getAttribute("href")?.trim() ?? "";
    const detailUrl = href ? `https://yukonassembly.ca${href}` : undefined;

    const rawName = link.querySelector("h3")?.textContent.trim() ?? "";
    const name = rawName.replace(/^Hon\.\s*/i, "").trim();
    if (!name) continue;

    const nameParts = name.split(/\s+/).filter(Boolean);
    const first_name = nameParts[0] ?? "";
    const last_name = nameParts[nameParts.length - 1] ?? "";

    const photo_url = row.querySelector("img")?.getAttribute("src") ?? undefined;

    const paras = row.querySelectorAll("p");
    const district_name =
      paras[0]?.querySelector("strong")?.textContent.trim() ?? "";
    const party_name = paras[1]?.textContent.trim() ?? "";

    const csv = emailMap.get(normalizeName(name));

    reps.push({
      name,
      first_name,
      last_name,
      province: "Yukon",
      district_name,
      party_name,
      email: csv?.email ?? "",
      photo_url,
      elected_office: "MLA",
      gov_level: "provincial",
      offices: csv?.phone
        ? [{ type: "legislature", tel: csv.phone }]
        : undefined,
      quick_links: detailUrl
        ? [{ title: "Official Website", url: detailUrl }]
        : [],
    });
  }

  if (reps.length === 0) {
    throw new Error(
      "scrapeYtMla: 0 reps parsed — site may have blocked the request or changed its HTML structure",
    );
  }

  return reps;
}
