import type { Rep } from "../interfaces";

/** Honourable/Honorable titles and "Hon." — not bare "Hon" (a valid given name). */
const HONORIFIC_PREFIX =
  /^(?:(?:the\s+)?(?:honourable|honorable)(?:\s+|$)|hon\.\s+)/i;

/** Remove leading honorifics (e.g. "Honourable", "Hon.", "The Honourable"). */
export function stripHonorific(name: string): string {
  let out = name.trim();
  while (HONORIFIC_PREFIX.test(out)) {
    out = out.replace(HONORIFIC_PREFIX, "").trim();
  }
  return out;
}

export function normalizeRepHonorifics(rep: Rep): Rep {
  let first_name = stripHonorific(rep.first_name);
  let last_name = rep.last_name?.trim() ?? "";
  let name = stripHonorific(rep.name) || `${first_name} ${last_name}`.trim();

  if ((!first_name || !last_name) && name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      if (!first_name) first_name = parts.slice(0, -1).join(" ");
      if (!last_name) last_name = parts[parts.length - 1] ?? "";
    } else if (parts.length === 1 && !first_name) {
      first_name = parts[0] ?? "";
    }
  }

  name = name || `${first_name} ${last_name}`.trim();
  return { ...rep, name, first_name, last_name };
}
