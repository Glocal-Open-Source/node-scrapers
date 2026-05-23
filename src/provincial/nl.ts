import { parse } from "node-html-parser";

import type { Rep } from "../interfaces";
import { http } from "../http";

function extractBetween(
  text: string,
  startMarker: string,
  endMarker: string,
): string | null {
  const startIndex = text.indexOf(startMarker);
  if (startIndex === -1) return null;
  const endIndex = text.indexOf(endMarker, startIndex + startMarker.length);
  if (endIndex === -1) return null;
  return text
    .substring(startIndex + startMarker.length, endIndex)
    .trim();
}

/** Newfoundland and Labrador MHAs (ported from admin-amplify `repsScrapperFn`). */
export async function scrapeNlMha(): Promise<Rep[]> {
  const { data: scriptBody } = await http.get<string>(
    "https://www.assembly.nl.ca/js/members-index.js",
    { responseType: "text" },
  );
  const listJSON = extractBetween(
    scriptBody,
    "var members = ",
    "var membName = true;",
  );
  if (!listJSON) {
    throw new Error("NL: could not extract members object from members-index.js");
  }

  // Same approach as legacy Lambda: members file is a JS object literal, not JSON.parse-safe.
  // eslint-disable-next-line @typescript-eslint/no-implied-eval -- trusted legislature-controlled script shape
  const listArr = new Function(`return ${listJSON}`)() as Array<{
    name: string;
    district: string;
    party: string;
    phone: string;
    email: string;
  }>;

  const processItem = async (item: (typeof listArr)[0]): Promise<Rep | undefined> => {
    const nameMatch = item.name.match(/--(.*?)--/);
    const nameContent = nameMatch?.[1];
    if (!nameContent || nameContent === "Vacant") return undefined;

    const nameArr = nameContent.split(",");
    const last_name = nameArr[0]?.trim() ?? "";
    const first_name = nameArr[1]?.trim() ?? "";
    let name = `${first_name} ${last_name}`.trim();
    const urlMatch = item.name.match(/<a href='(.*?)'>/);
    const url = urlMatch ? `https://www.assembly.nl.ca${urlMatch[1]}` : "";
    let district_name = item.district;
    let party_name = item.party;
    const emailMatch = item.email?.match(/mailto:([^"']+)/);
    let email = emailMatch?.[1] ?? "";
    const quick_links = url
      ? [{ title: "Official Website" as const, url }]
      : undefined;

    const repBase: Rep = {
      name,
      first_name,
      last_name,
      province: "Newfoundland and Labrador",
      district_name,
      party_name,
      email,
      quick_links,
    };

    if (!url || url.includes("HaggieJohn")) {
      return repBase;
    }

    try {
      const { data: detailHtml } = await http.get<string>(url, {
        responseType: "text",
      });
      const doc = parse(detailHtml);
      name = doc.querySelector("h1.memberBio")?.textContent.trim() ?? name;
      district_name =
        doc.querySelector("h2.memberBio")?.textContent.trim() ?? district_name;
      party_name =
        doc.querySelector("h3.memberBio")?.textContent.trim() ?? party_name;
      const mailA = doc.querySelector('a[href*="mailto"]');
      email = mailA?.textContent.trim() ?? email;
      const img = doc.querySelector('img[src*="../YourMember/"]');
      const photo_src = img?.getAttribute("src");
      const photo_url = photo_src
        ? photo_src.replace("..", "https://www.assembly.nl.ca/Members")
        : undefined;
      const facebook =
        doc.querySelector('a[href*="https://facebook.com/"]')?.getAttribute("href") ??
        "";
      const twitter =
        doc.querySelector('a[href*="https://twitter.com/"]')?.getAttribute("href") ??
        "";

      let bio = "";
      const bioMatch = detailHtml.match(
        /<p><br \/><b>Profile<\/b><\/p>([\s\S]*?)<br \/><br \/>/,
      );
      if (bioMatch?.[1]) {
        const bioDoc = parse(bioMatch[1]);
        const parts: string[] = [];
        for (const node of bioDoc.querySelectorAll("p")) {
          parts.push(node.textContent.trim());
        }
        bio = parts.join("\n\n");
      }

      return {
        name,
        first_name,
        last_name,
        province: "Newfoundland and Labrador",
        district_name,
        party_name,
        email,
        photo_url,
        facebook: facebook || undefined,
        twitter: twitter || undefined,
        bio: bio || undefined,
        quick_links,
      };
    } catch {
      return repBase;
    }
  };

  const reps: Rep[] = [];
  for (const item of listArr) {
    const rep = await processItem(item);
    if (rep != null) reps.push(rep);
  }
  return reps;
}
