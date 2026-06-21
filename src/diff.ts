import type { Rep } from "./interfaces";

export interface RepDiffFieldChange {
  field: string;
  old: string;
  new: string;
}

export interface RepDiffChanged {
  /** YouCount representative id (from current snapshot). */
  id?: number;
  name: string;
  first_name: string;
  last_name: string;
  updated: RepDiffFieldChange[];
  /** Extra primary-key fields (e.g. `organization`, `district_name`) when used for matching. */
  [key: string]: string | RepDiffFieldChange[] | number | undefined;
}

export interface RepDiff {
  added: Rep[];
  deleted: Rep[];
  changed: RepDiffChanged[];
  counts: { added: number; deleted: number; changed: number };
  primaryFields: string[];
  secondaryFields: string[];
  date: string;
}

function getField(rep: Rep, f: string): string {
  const v = (rep as unknown as Record<string, unknown>)[f];
  if (v === undefined || v === null) return "";
  return String(v);
}

/** Fill missing first/last name from `name` (e.g. OpenNorth adds only `name`). */
function ensureNameParts(rep: Rep): Rep {
  let first_name = rep.first_name?.trim() ?? "";
  let last_name = rep.last_name?.trim() ?? "";
  const name = rep.name?.trim() ?? "";

  if ((!first_name || !last_name) && name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      if (!first_name) first_name = parts.slice(0, -1).join(" ");
      if (!last_name) last_name = parts[parts.length - 1] ?? "";
    } else if (parts.length === 1 && !first_name) {
      first_name = parts[0] ?? "";
    }
  }

  const fullName = name || `${first_name} ${last_name}`.trim();
  return { ...rep, name: fullName, first_name, last_name };
}

export interface GetDiffParams {
  currentReps: Rep[];
  latestReps: Rep[];
  primaryFields?: string[];
  secondaryFields?: string[];
}

export function emptyRepDiff(
  fields: { primaryFields?: string[]; secondaryFields?: string[] } = {},
): RepDiff {
  const primaryFields = fields.primaryFields ?? ["name", "district_name"];
  const secondaryFields = fields.secondaryFields ?? ["email", "party_name"];
  return {
    added: [],
    deleted: [],
    changed: [],
    counts: { added: 0, deleted: 0, changed: 0 },
    primaryFields,
    secondaryFields,
    date: new Date().toISOString(),
  };
}

/** Ported from admin-amplify `rep-sync/utils/diff.ts`; returns arrays (not JSON strings). */
export function getDiff({
  currentReps,
  latestReps,
  primaryFields = ["name", "district_name"],
  secondaryFields = ["email", "party_name"],
}: GetDiffParams): RepDiff {
  const filteredCurrentReps = currentReps.filter((x) => !!x.related?.boundary_url);

  const getKey = (rep: Rep) =>
    primaryFields.map((f) => `${f}: ${getField(rep, f)}`).join(" ## ");

  const excludedRepkeys = new Set(
    currentReps.filter((x) => !x.related?.boundary_url).map(getKey),
  );

  const currentKeys = new Set(filteredCurrentReps.map(getKey));
  const added = latestReps
    .filter((x) => !currentKeys.has(getKey(x)))
    .filter((x) => !excludedRepkeys.has(getKey(x)))
    .map(ensureNameParts);

  const latestKeys = new Set(latestReps.map(getKey));
  const deleted = filteredCurrentReps.filter((x) => !latestKeys.has(getKey(x)));

  const addedDeletedKeys = new Set(added.concat(deleted).map(getKey));
  const unchangedKeys = [
    ...new Set(
      [...currentKeys, ...latestKeys].filter((k) => !addedDeletedKeys.has(k)),
    ),
  ];

  const changed: RepDiff["changed"] = [];
  const currentRepsMap = new Map<string, Rep>();
  const latestRepsMap = new Map<string, Rep>();
  for (const rep of filteredCurrentReps) {
    currentRepsMap.set(getKey(rep), rep);
  }
  for (const rep of latestReps) {
    latestRepsMap.set(getKey(rep), rep);
  }

  for (const key of unchangedKeys) {
    const currRep = currentRepsMap.get(key);
    const newRep = latestRepsMap.get(key);
    if (excludedRepkeys.has(key)) continue;
    if (!currRep || !newRep) {
      console.warn(
        "[getDiff] missing pair for key:",
        key,
        currRep?.name ?? newRep?.name,
      );
      continue;
    }
    const updated: RepDiffFieldChange[] = [];
    for (const f of secondaryFields) {
      const oldVal = getField(currRep, f);
      const newVal = getField(newRep, f);
      if ((oldVal || "").toLowerCase() !== (newVal || "").toLowerCase()) {
        updated.push({ field: f, old: oldVal, new: newVal });
      }
    }
    if (updated.length > 0) {
      const entry: RepDiffChanged = {
        ...(currRep.id != null ? { id: currRep.id } : {}),
        name: currRep.name,
        first_name: currRep.first_name,
        last_name: currRep.last_name,
        updated,
      };
      for (const f of primaryFields) {
        if (f === "name" || f === "first_name" || f === "last_name") continue;
        entry[f] = getField(newRep, f);
      }
      changed.push(entry);
    }
  }

  const date = new Date().toISOString();
  return {
    added,
    deleted,
    changed,
    counts: {
      added: added.length,
      deleted: deleted.length,
      changed: changed.length,
    },
    primaryFields,
    secondaryFields,
    date,
  };
}
