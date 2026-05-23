import { parse } from "node-html-parser";

import type { Rep } from "../interfaces";
import { http } from "../http";

function findConstituencyOfficeTable(doc: ReturnType<typeof parse>) {
  for (const block of doc.querySelectorAll(".content-block")) {
    const h2 = block.querySelector("h2");
    if (h2?.textContent.includes("Constituency Office")) {
      return block.querySelector("table");
    }
  }
  return null;
}

function decodeCloudflareEmail(href: string): string {
  const hex = href.slice("/cdn-cgi/l/email-protection#".length);
  const bytes: number[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.slice(i, i + 2), 16));
  }
  const key = bytes[0];
  return bytes
    .slice(1)
    .map((b) => String.fromCharCode(b ^ key))
    .join("");
}

/** New Brunswick MLAs (ported from admin-amplify `repsScrapperFn`). */
export async function scrapeNbMla(): Promise<Rep[]> {
  const { data: html } = await http.get<string>(
    "https://www.legnb.ca/en/members/current",
    { responseType: "text" },
  );
  const listDoc = parse(html);

  const reps: Rep[] = [];
  const detailUrls: string[] = [];

  for (const card of listDoc.querySelectorAll(".member-card")) {
    const nameNode = card.querySelector(".member-card-description-name a h3");
    if (!nameNode) continue;
    const nameWithComma = nameNode.textContent.trim();
    const nameSplit = nameWithComma.split(",");
    const last_name = nameSplit[0]?.trim() ?? "";
    const first_name = nameSplit[1]?.trim() ?? "";
    const name = `${first_name} ${last_name}`.trim();

    const partyNode = card.querySelector(".member-card-description-party");
    let party_name = partyNode?.textContent.trim() ?? "";
    const dot = partyNode?.querySelector(".member-card-party-dot");
    if (dot) {
      party_name = party_name.replace(dot.textContent.trim(), "").trim();
    }

    const ridingNode = card.querySelector(
      ".member-card-description-riding span",
    );
    const district_name = ridingNode?.textContent.trim() ?? "";

    const img = card.querySelector(".member-card-avatar img");
    const src = img?.getAttribute("src")?.trim();
    const photo_url = src ? `https://www.legnb.ca${src}` : undefined;

    const nameLink = card.querySelector(".member-card-description-name a");
    const href = nameLink?.getAttribute("href");
    if (!href) continue;
    const detailUrl = `https://www.legnb.ca${href}`;
    detailUrls.push(detailUrl);

    reps.push({
      name,
      first_name,
      last_name,
      bio: "",
      elected_office: "MLA",
      province: "New Brunswick",
      gov_level: "provincial",
      party_name,
      email: "",
      offices: [],
      photo_url,
      quick_links: [{ title: "Official Website", url: detailUrl }],
      district_name,
    });
  }

  const detailNodes: { url: string; html: string }[] = [];
  for (const url of detailUrls) {
    const { data: html } = await http.get<string>(url, { responseType: "text" });
    detailNodes.push({ url, html });
  }

  for (const { url, html } of detailNodes) {
    const doc = parse(html);
    const rep = reps.find((r) => r.quick_links?.[0]?.url === url);
    if (!rep) continue;

    const emailNode = doc.querySelector(".member-details-contacts a");
    if (emailNode) {
      const href = emailNode.getAttribute("href") ?? "";
      rep.email = href.startsWith("/cdn-cgi/l/email-protection#")
        ? decodeCloudflareEmail(href)
        : href.replace("mailto:", "");
    }

    const constituencyOfficeTable = findConstituencyOfficeTable(doc);
    if (constituencyOfficeTable) {
      const rows = constituencyOfficeTable.querySelectorAll("tr");
      let tel = "";
      const postal: string[] = [];
      for (const row of rows) {
        const labelCell = row.querySelector("td:first-child");
        const valueCell = row.querySelector("td:last-child");
        if (!labelCell || !valueCell) continue;
        const label = labelCell.textContent.trim();
        const value = valueCell;
        if (label === "Mainline Phone") {
          const phoneLink = value.querySelector("a");
          if (phoneLink) {
            tel = phoneLink.getAttribute("href")?.replace("tel:", "") ?? "";
          }
        } else if (label === "Address") {
          for (const part of value.textContent.split("\n")) {
            const t = part.trim();
            if (t) postal.push(t);
          }
        }
      }
      rep.offices = [
        ...(rep.offices ?? []),
        { type: "constituency", tel, postal: postal.join("\n") },
      ];
    }
  }

  return reps;
}
