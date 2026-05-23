import { parse } from "node-html-parser";

import type { Rep } from "../interfaces";
import { http } from "../http";
import { sleep } from "../util/sleep";

/** Same rot13 as legacy Lambda (for obfuscated NT emails). */
function rot13(str: string): string {
  return str.replace(/[a-zA-Z]/g, (ch) => {
    const c = ch.charCodeAt(0) + 13;
    return String.fromCharCode(
      (ch <= "Z" ? 90 : 122) >= c ? c : c - 26,
    );
  });
}

function normalizeEncryptEmail(str: string): string {
  let s = rot13(str);
  s = s.replace(/\/dot\//g, ".");
  s = s.replace(/\/at\//g, "@");
  return s;
}

function getMailAddress(element: { getAttribute: (n: string) => string | undefined } | null): string {
  if (!element) return "";
  const raw = element.getAttribute("data-mail-to");
  if (!raw) return "";
  return normalizeEncryptEmail(raw);
}

/** Northwest Territories MLAs (ported from admin-amplify `repsScrapperFn`). */
export async function scrapeNtMla(): Promise<Rep[]> {
  const { data: listHtml } = await http.get<string>(
    "https://www.ntlegislativeassembly.ca/members/members-legislative-assembly/members",
    { responseType: "text" },
  );
  const listDoc = parse(listHtml);

  const repsMap = new Map<string, Rep>();
  const detailUrls: string[] = [];

  for (const node of listDoc.querySelectorAll(".view-member .views-row")) {
    const titleEl = node.querySelector(".title-container .field--name-title");
    const name = titleEl?.textContent.trim() ?? "";
    const pic = node.querySelector(".field--name-field-picture img");
    const picSrc = pic?.getAttribute("src")?.trim();
    const photo_url = picSrc
      ? `https://www.ntlegislativeassembly.ca${picSrc}`
      : undefined;
    const art = node.querySelector("article>a");
    const href = art?.getAttribute("href")?.trim();
    if (!href) continue;
    const detailUrl = `https://www.ntlegislativeassembly.ca${href}`;
    detailUrls.push(detailUrl);
    const nameSplit = name.split(/\s+/).filter(Boolean);
    const first_name = nameSplit[0]?.trim() ?? "";
    const last_name = nameSplit[nameSplit.length - 1]?.trim() ?? "";
    const district_name =
      node
        .querySelector(".title-container .field--name-field-constituency")
        ?.textContent.trim() ?? "";

    repsMap.set(detailUrl, {
      name,
      first_name,
      last_name,
      photo_url,
      district_name,
      province: "Northwest Territories",
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
    const base = repsMap.get(url);
    if (!base) continue;
    const doc = parse(html);

    const partyEl =
      doc.querySelector(".field--name-field-party .field__item") ??
      doc.querySelector(".field--name-field-political-affiliation .field__item");
    const party_name = partyEl?.textContent.trim() ?? "";

    const pNodes = doc.querySelectorAll(".field--name-body > p:not(:first-child)");
    const bioArr: string[] = [];
    for (const pNode of pNodes) {
      bioArr.push(pNode.textContent.replace(/\u00a0/g, "").trim());
    }
    const bio = bioArr.join("\n\n");

    const emailElement = doc.querySelector(".field--paragraph--field-email a");
    const email = getMailAddress(emailElement);

    const quick_links = [...(base.quick_links ?? [])];
    const personalWebsite = doc
      .querySelector(".field--name-field-website a")
      ?.getAttribute("href");
    if (personalWebsite) {
      quick_links.push({ title: "Personal Website", url: personalWebsite });
    }

    const addr =
      doc.querySelector(".office-address-wrapper .address")?.textContent
        .split("\n")
        .filter(Boolean)
        .join(" ") ?? "";
    const post =
      doc
        .querySelector(".field--name-field-po-box")
        ?.textContent.split("\n")
        .filter((x) => x.trim())
        .map((x) => x.trim())
        .join(" ") ?? "";
    const phone =
      doc.querySelector(".field--name-field-phone-number a")?.textContent.trim() ??
      "";
    const offices = [{ type: "legislature", addr: `${addr} ${post}`.trim(), tel: phone }];

    reps.push({
      ...base,
      party_name,
      email,
      bio: bio.trim() || undefined,
      quick_links,
      offices,
    });
  }

  return reps;
}
