import { parse } from "node-html-parser";

import type { Rep } from "../interfaces";
import { http } from "../http";

/** Saskatchewan MLAs (ported from admin-amplify `repsScrapperFn`). */
export async function scrapeSkMla(): Promise<Rep[]> {
  const { data: listHtml } = await http.get<string>(
    "https://www.legassembly.sk.ca/mlas",
    { responseType: "text" },
  );
  const listDoc = parse(listHtml);

  const reps: Rep[] = [];
  const detailUrls: string[] = [];

  const rows = listDoc.querySelectorAll("#mla-table tr:not(:first-child)");
  for (const row of rows) {
    const nameNode = row.querySelector(".mla-name a");
    if (!nameNode) continue;
    const fullName = nameNode.textContent.trim();
    const titleSplit = fullName.split(". ");
    const nameWithoutTitle =
      titleSplit.length > 1 ? titleSplit.slice(1).join(". ") : fullName;
    const nameSplit = nameWithoutTitle.split(/\s+/).filter(Boolean);
    const last_name = nameSplit[nameSplit.length - 1]?.trim() ?? "";
    const first_name = nameSplit.slice(0, -1).join(" ").trim();
    const name = `${first_name} ${last_name}`.trim();

    const partyNode = row.querySelector(".mla-party");
    let party_name = partyNode?.textContent.trim() ?? "";
    if (party_name === "Government Caucus") {
      party_name = "Government Party";
    } else if (party_name === "Opposition Caucus") {
      party_name = "Opposition Party";
    }

    const constituencyNode = row.querySelector("td:nth-child(3) a");
    const district_name = constituencyNode?.textContent.trim() ?? "";

    const baseUrl = "https://www.legassembly.sk.ca";
    const href = nameNode.getAttribute("href");
    if (!href) continue;
    const detailUrl = baseUrl + href;
    detailUrls.push(detailUrl);

    reps.push({
      name,
      first_name,
      last_name,
      bio: "",
      elected_office: "MLA",
      province: "Saskatchewan",
      gov_level: "provincial",
      party_name,
      email: "",
      offices: [],
      photo_url: "",
      quick_links: [{ title: "Official Website", url: detailUrl }],
      district_name,
      boundary: "",
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

    const photoNode = doc.querySelector(".mla-image-cell img");
    if (photoNode) {
      const src = photoNode.getAttribute("src");
      if (src) rep.photo_url = `https://www.legassembly.sk.ca${src}`;
    }

    const bioNode = doc.querySelector(".biography-cell div:nth-child(2)");
    if (bioNode) {
      rep.bio = bioNode.textContent.trim();
    }

    const emailNode = doc.querySelector('a[href^="mailto:"]');
    if (emailNode) {
      rep.email =
        emailNode.getAttribute("href")?.replace("mailto:", "").trim() ?? rep.email;
    }

    const legislativeAddressNodes = doc.querySelectorAll(
      ".col-md-3:nth-child(1) div:not(.mla-contact-heading)",
    );
    const constituencyAddressNodes = doc.querySelectorAll(
      ".col-md-3:nth-child(2) div:not(.mla-contact-heading)",
    );

    const legislativePostal: string[] = [];
    for (const node of legislativeAddressNodes) {
      const part = node.textContent.trim();
      if (part) legislativePostal.push(part);
    }

    const constituencyPostal: string[] = [];
    let constituencyTel = "";
    for (const node of constituencyAddressNodes) {
      const part = node.textContent.trim();
      if (part.includes("Phone:")) {
        constituencyTel = part.replace("Phone:", "").trim();
      } else if (part) {
        constituencyPostal.push(part);
      }
    }

    rep.offices = [
      { type: "legislature", postal: legislativePostal.join("\n") },
      {
        type: "constituency",
        postal: constituencyPostal.join("\n"),
        tel: constituencyTel,
        fax: "",
        email: "",
      },
    ];
  }

  return reps;
}
