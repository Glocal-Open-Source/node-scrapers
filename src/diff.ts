import type { Rep } from "./interfaces";

export interface RepDiff {
  added: Rep[];
  deleted: Rep[];
  changed: Array<{
    name: string;
    first_name: string;
    last_name: string;
    updated: string[];
  }>;
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

export interface GetDiffParams {
  currentReps: Rep[];
  latestReps: Rep[];
  primaryFields?: string[];
  secondaryFields?: string[];
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
    .filter((x) => !excludedRepkeys.has(getKey(x)));

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
    const updated: string[] = [];
    for (const f of secondaryFields) {
      if (
        (getField(currRep, f) || "").toLowerCase() !==
        (getField(newRep, f) || "").toLowerCase()
      ) {
        updated.push(
          `${f}: [old]: ${getField(currRep, f)}, [new]: ${getField(newRep, f)}`,
        );
      }
    }
    if (updated.length > 0) {
      changed.push({
        name: currRep.name,
        first_name: currRep.first_name,
        last_name: currRep.last_name,
        updated,
      });
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
