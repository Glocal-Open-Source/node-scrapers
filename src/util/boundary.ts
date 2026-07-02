import type { Rep } from "../interfaces";

/** Ensure `boundary` is set from the reps API (`boundary` or `related.boundary_url`). */
export function normalizeRepBoundary(rep: Rep): Rep {
  const boundary = rep.boundary?.trim();
  if (boundary) return rep;

  const url = rep.related?.boundary_url?.trim();
  if (!url) return rep;

  let slug = url.replace("/boundaries/", "");
  if (slug.endsWith("/")) slug = slug.slice(0, -1);
  return { ...rep, boundary: slug };
}
