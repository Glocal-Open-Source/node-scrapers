import { parse } from "node-html-parser";

import type { Rep } from "../interfaces";
import { http } from "../http";
import { sleep } from "../util/sleep";

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

/** Plain email from "Email: …" lines (mailto links, styled spans, or raw text). */
function emailFromFieldHtml(html: string): string {
  const stripped = html.replace(/^Email:\s*/i, "").trim();
  if (!stripped) return "";
  if (!stripped.includes("<")) {
    const direct = stripped.match(EMAIL_RE);
    return direct?.[0] ?? stripped;
  }
  const root = parse(`<div>${stripped}</div>`);
  const mailto = root.querySelector('a[href^="mailto:"]');
  if (mailto) {
    return (
      mailto
        .getAttribute("href")
        ?.replace(/^mailto:/i, "")
        .split("?")[0]
        ?.trim() ?? ""
    );
  }
  const text = root.textContent.trim();
  return text.match(EMAIL_RE)?.[0] ?? text;
}

function plainOfficeLine(html: string): string {
  const trimmed = html.trim();
  if (!trimmed.includes("<")) return trimmed;
  return parse(`<div>${trimmed}</div>`).textContent.trim();
}

/** Nunavut MLAs (skips Premier; ported from admin-amplify `repsScrapperFn`). */
export async function scrapeNuMla(): Promise<Rep[]> {
  const { data: listHtml } = await http.get<string>(
    "https://www.assembly.nu.ca/members/mla",
    { responseType: "text" },
  );
  const listDoc = parse(listHtml);

  const repsMap = new Map<string, Rep>();
  const detailUrls: string[] = [];

  for (const node of listDoc.querySelectorAll(".view-member .views-row")) {
    const imgWrap = node.querySelector(".views-field-field-member-photo");
    const img = imgWrap?.querySelector("img");
    const link = imgWrap?.querySelector("a");
    const picSrc = img?.getAttribute("src")?.trim();
    const href = link?.getAttribute("href")?.trim();
    if (!href) continue;
    const detailUrl = `https://www.assembly.nu.ca${href}`;
    detailUrls.push(detailUrl);
    const photo_url = picSrc ? `https://www.assembly.nu.ca${picSrc}` : undefined;
    const name = node.querySelector(".views-field-field-member-name")?.textContent.trim() ?? "";
    const nameSplit = name.split(/\s+/).filter(Boolean);
    const first_name = nameSplit[0]?.trim() ?? "";
    const last_name = nameSplit[nameSplit.length - 1]?.trim() ?? "";
    const district_name =
      node.querySelector(".views-field-field-member-mla div")?.textContent.trim() ??
      "";

    repsMap.set(detailUrl, {
      name,
      first_name,
      last_name,
      photo_url,
      district_name,
      province: "Nunavut",
      elected_office: "MLA",
      party_name: "",
      email: "",
      quick_links: [{ title: "Official Website", url: detailUrl }],
    });
  }

  const detailNodes: { url: string; html: string }[] = [];
  for (const detailUrl of detailUrls) {
    await sleep(100);
    const { data: html } = await http.get<string>(detailUrl, {
      responseType: "text",
    });
    detailNodes.push({ url: detailUrl, html });
  }

  const reps: Rep[] = [];
  for (const { url, html } of detailNodes) {
    const rep = repsMap.get(url);
    if (!rep) continue;

    const doc = parse(html);
    const duties = doc.querySelectorAll(
      ".field--name-field-member-duties .field__item p",
    );
    const isPremier = Array.from(duties).some(
      (x) => x.textContent === "Premier of Nunavut",
    );
    if (isPremier) {
      rep.elected_office = "Premier";
      continue;
    }

    const legP = doc.querySelector(
      ".field--name-field-member-legislative .field__item p",
    );
    const legHtml = legP?.innerHTML ?? "";
    const legOfficeNodes = legHtml.split("<br>");
    const legPhone = plainOfficeLine(legOfficeNodes[0]?.replace("Phone: ", "") ?? "");
    const legFax = plainOfficeLine(legOfficeNodes[1]?.replace("Fax: ", "") ?? "");
    const legEmail = emailFromFieldHtml(legOfficeNodes[2] ?? "");

    const consP = doc.querySelector(
      ".field--name-field-member-constituency .field__item p",
    );
    const consHtml = consP?.innerHTML ?? "";
    const consOfficeNodes = consHtml.split("<br>");
    const consAddrArr: string[] = [];
    let consPhone = "";
    let consFax = "";
    let consEmail = "";

    for (const node of consOfficeNodes) {
      if (node.includes("Phone: ")) {
        consPhone = plainOfficeLine(node.replace("Phone: ", ""));
      } else if (node.includes("Fax: ")) {
        consFax = plainOfficeLine(node.replace("Fax: ", ""));
      } else if (node.includes("Email: ")) {
        consEmail = emailFromFieldHtml(node);
      } else {
        const t = plainOfficeLine(node);
        if (t) consAddrArr.push(t);
      }
    }
    const consAddr = consAddrArr.join("\n");

    const offices = [
      { type: "legislature", tel: legPhone, fax: legFax, email: legEmail },
      {
        type: "constituency",
        tel: consPhone,
        fax: consFax,
        postal: consAddr,
        email: consEmail,
      },
    ];

    const bioNodes = doc.querySelectorAll(".field--name-body p");
    const bioArr: string[] = [];
    for (const node of bioNodes) {
      bioArr.push(node.textContent.trim());
    }
    const bio = bioArr.join("\n\n");

    rep.email = legEmail;
    rep.offices = offices;
    rep.bio = bio.trim() || undefined;

    reps.push(rep);
  }

  return reps;
}
