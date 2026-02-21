// auto/deriveAutoVariableUpdates.ts
import { isEmptyValue } from "@clinicaltoolkits/utility-functions";
import {
  VariableValue,
  VariableMap,
  SetVariableFunction,
  DEMOGRAPHICS,
  getDemographicsId,
  VariableId,
  applyValuePatch,
  updateAssociatedSubvariableProperties,
  applyMetadataPatch,
  deriveChildValuePatches,
} from "../../";
import { derivePronounPatches } from "./pronouns";            // updated below
import { deriveAssessmentAgePatches } from "./assessmentAge"; // updated below
import { logger } from "@clinicaltoolkits/logger";
import { SCOPES } from "../../../scopes";

const log = logger.scope(SCOPES.types.functions.automated_updates.derive_auto_variable_updates);

export type VariableValuePatch = { id: VariableId; value: VariableValue };
export type DeriveCtx = { snapshot: VariableMap; updatedId: VariableId; updatedValue: VariableValue };
export type Enqueue = (id: VariableId) => void;

type AutoVariableHandler = (ctx: DeriveCtx) => VariableValuePatch[];

// --- static table (closed set for now; can evolve to register() later) -----
const AUTO_VARIABLE_HANDLERS: Record<string, AutoVariableHandler> = {
  [getDemographicsId(DEMOGRAPHICS.GENDER)]: ({ snapshot, updatedId, updatedValue }) => {
    log.debug("AUTO_VARIABLE_HANDLERS - Updating gender:", { updatedId, updatedValue });
    if (typeof updatedValue !== "string") return [];
    const updatedVar = snapshot.get(updatedId);
    const pronounIds: VariableId[] =
      updatedVar?.getMetadata()?.associatedSubvariableProperties?.map((p: { id: VariableId }) => p.id) ?? [];
    if (!pronounIds.length) return [];
    return derivePronounPatches(updatedValue, pronounIds, snapshot);
  },

  [getDemographicsId(DEMOGRAPHICS.DATE_OF_BIRTH)]: ({ snapshot, updatedId, updatedValue }) =>
    deriveAssessmentAgePatches(updatedId, updatedValue, snapshot),

  [getDemographicsId(DEMOGRAPHICS.ASSESSMENT_END_DATE)]: ({ snapshot, updatedId, updatedValue }) =>
    deriveAssessmentAgePatches(updatedId, updatedValue, snapshot),
};

/**
 * Single deterministic propagation pipeline:
 * - composite metadata propagation (subvariable -> composite metadata)
 * - child derivations
 * - auto handlers
 *
 * Runs until stable or maxIterations reached.
 */
export function propagateVariableUpdates(opts: {
  base: VariableMap;
  changedIds: readonly VariableId[];
  maxIterations?: number;
}): VariableMap {
  const { base, changedIds, maxIterations = 50 } = opts;

  // Work on a fresh map, keep Variable instances immutable.
  const next: VariableMap = new Map(base);

  const queue: VariableId[] = [];
  const inQueue = new Set<VariableId>();

  const enqueue: Enqueue = (id) => {
    if (inQueue.has(id)) return;
    inQueue.add(id);
    queue.push(id);
  };

  for (const id of changedIds) enqueue(id);

  let iterations = 0;

  while (queue.length) {
    if (++iterations > maxIterations) {
      // Cycle / runaway safeguard (don’t silently infinite-loop).
      // Keep it as a console.warn because you already use console logs here and there.
      log.warn("propagateVariableUpdates: maxIterations reached. Potential cycle?", { maxIterations });
      break;
    }

    const id = queue.shift()!;
    inQueue.delete(id);

    const v = next.get(id);
    if (!v) continue;

    // 1) If this variable contributes to a composite, update composite metadata
    const compositeId = v.getAssociatedCompositeVariableId?.();
    if (compositeId) {
      const cid = compositeId as VariableId;
      const compositeVar = next.get(cid);
      if (compositeVar) {
        const updatedAssociated = updateAssociatedSubvariableProperties({
          variable: compositeVar,
          subvariableId: v.getId(),
          subVariableValue: v.getValue(),
        });

        applyMetadataPatch(
          next,
          cid,
          (prev) =>
            prev.withMetadata({
              ...prev.getMetadata(),
              associatedSubvariableProperties: updatedAssociated,
            }),
          enqueue
        );
      }
    }

    // 2) Child derivations (immediate)
    for (const patch of deriveChildValuePatches(v, next)) {
      applyValuePatch(next, patch, enqueue);
    }

    // 3) Auto handlers
    // NOTE: This uses your existing deriveAutoVariableUpdates, including its empty-value behavior.
    // If you decide empty values should propagate too, we’ll tweak deriveAutoVariableUpdates (see below).
    if (!isEmptyValue(v.getValue())) {
      const autoPatches = deriveAutoVariableUpdates(v.getId(), v.getValue(), next);
      for (const patch of autoPatches) {
        applyValuePatch(next, patch, enqueue);
      }
    }
  }

  return next;
}

// --- PURE: compute patches only --------------------------------------------
export function deriveAutoVariableUpdates(
  updatedVariableId: VariableId,
  updatedValue: VariableValue,
  snapshot: VariableMap
): VariableValuePatch[] {
  log.debug("deriveAutoVariableUpdates: ", { updatedVariableId, updatedValue });
  if (isEmptyValue(updatedValue)) return [];
  if (!snapshot.get(updatedVariableId)) return [];
  const updateHandler = AUTO_VARIABLE_HANDLERS[updatedVariableId];
  return updateHandler ? updateHandler({ snapshot, updatedId: updatedVariableId, updatedValue }) : [];
}

// --- IMPURE adapter (back-compat): applies patches via setVariable ----------
export function handleAutoVariableUpdates(
  updatedVariableId: VariableId,
  updatedValue: VariableValue,
  variableMap: VariableMap,
  setVariable: SetVariableFunction
): void {
  const patches = deriveAutoVariableUpdates(updatedVariableId, updatedValue, variableMap);
  if (!patches.length) return;
  // batch() if your store supports it
  for (const { id, value } of patches) setVariable(id, value);
}

/* // TODO: Considering deprecating in favour of the above pure function
import { handleAutoPronounUpdates } from "./pronouns";
import { handleAutoAssessmentAgeUpdates } from "./assessmentAge";
import { isEmptyValue } from "@clinicaltoolkits/utility-functions";
import { VariableValue, VariableMap, SetVariableFunction, DEMOGRAPHICS, getDemographicsId, VariableId } from "../../";

// TODO: This should be a pure function that returns a list of variable updates to make, rather than making the updates itself
export const handleAutoVariableUpdates =(updatedVariableId: string, updatedValue: VariableValue, variableMap: VariableMap, setVariable: SetVariableFunction) => {
  const updatedVariable = variableMap.get(updatedVariableId);
  if (updatedVariable && !isEmptyValue(updatedValue)) {
    switch (updatedVariableId) {
      case getDemographicsId(DEMOGRAPHICS.GENDER): {
        const pronounIds = updatedVariable.getMetadata()?.associatedSubvariableProperties?.map((subvariableProperty) => {
          return subvariableProperty.id;
        });
        if (pronounIds && typeof updatedValue === "string") handleAutoPronounUpdates(updatedValue, pronounIds, variableMap, setVariable);
        break;
      }
      case getDemographicsId(DEMOGRAPHICS.ASSESSMENT_END_DATE):
      case getDemographicsId(DEMOGRAPHICS.DATE_OF_BIRTH):
        handleAutoAssessmentAgeUpdates(updatedVariableId, updatedValue, variableMap, setVariable);
        break;
    }
  }
};
*/