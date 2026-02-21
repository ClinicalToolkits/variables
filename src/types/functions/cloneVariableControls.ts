import { generateUUID } from "@clinicaltoolkits/type-definitions";
import {
  createVariableControl,
  createVariableControlTarget,
  type VariableControl,
  type VariableControlTarget,
} from "../VariableControl";
import { controlStore } from "../../state";
import { VariableMap } from "../Variable";

export interface CloneControlsInput {
  sourceEntityVersionId: string;
  nextEntityVersionId: string;
  variableIdMap: Record<string, string>; // oldVarId -> newVarId
  mirrorToStore?: boolean;
  idFactory?: () => string;
  keepEmptyControls?: boolean; // skip controls with zero remapped targets by default
}

export interface CloneControlsOutput {
  controls: VariableControl[];
  targets: VariableControlTarget[];
  controlIdMap: Record<string, string>; // oldControlId -> newControlId
}

/** Rebuild full targets for a control from current store shape. */
function getTargetsForControlId(controlId: string): VariableControlTarget[] {
  const { targetIdsByControlId, targetsByVariableId } = controlStore.snapshot;
  const vids = targetIdsByControlId.get(controlId) ?? [];
  const out: VariableControlTarget[] = [];
  for (const vid of vids) {
    const arr = targetsByVariableId.get(vid) ?? [];
    for (const t of arr) if (t.getControlId() === controlId) out.push(t);
  }
  return out;
}

export function cloneVariableControlBatch({
  sourceEntityVersionId,
  nextEntityVersionId,
  variableIdMap,
  mirrorToStore = true,
  idFactory = generateUUID,
  keepEmptyControls = false,
}: CloneControlsInput): CloneControlsOutput {
  const { controlsById, controlIdsByVariableId } = controlStore.snapshot;

  // 1) which controls touch any cloned variable?
  const affectedControlIds = new Set<string>();
  for (const oldVid of Object.keys(variableIdMap)) {
    const cids = controlIdsByVariableId.get(oldVid) ?? [];
    for (const cid of cids) affectedControlIds.add(cid);
  }

  const controlIdMap: Record<string, string> = {};
  const newControls: VariableControl[] = [];
  const newTargets: VariableControlTarget[] = [];
  const dedupe = new Set<string>(); // `${newControlId}::${newVid}` to protect PK (control_id, variable_id)

  // 2) clone controls (scope-checked), only if at least one target remaps (unless keepEmptyControls)
  for (const oldControlId of affectedControlIds) {
    const ctrl = controlsById.get(oldControlId);
    if (!ctrl) continue;

    const scope = ctrl.getEntityVersionId?.();
    if (scope && scope !== sourceEntityVersionId) continue;

    const oldTargets = getTargetsForControlId(oldControlId);
    const remappable = oldTargets.filter(t => variableIdMap[t.getVariableId()] != null);

    if (!remappable.length && !keepEmptyControls) continue;

    const newControlId = idFactory();
    const base = ctrl.toJSON();
    const clonedControl = createVariableControl({
      ...base,
      id: newControlId,
      entity_version_id: nextEntityVersionId,
    });
    controlIdMap[oldControlId] = newControlId;
    newControls.push(clonedControl);

    // 3) clone targets — NO target id; preserve config only; retarget var + scope
    for (const oldT of remappable) {
      const tJson = (oldT as any).toJSON ? (oldT as any).toJSON() : {};
      const newVid = variableIdMap[oldT.getVariableId()];
      const key = `${newControlId}::${newVid}`;
      if (dedupe.has(key)) continue;
      dedupe.add(key);

      const clonedTarget = createVariableControlTarget({
        control_id: newControlId,
        variable_id: newVid,
        entity_version_id: nextEntityVersionId,
        config: tJson.config ?? null,
        created_at: new Date().toISOString(),
      });
      newTargets.push(clonedTarget);
    }
  }

  if (mirrorToStore && (newControls.length || newTargets.length)) {
    controlStore.upsertControls(newControls);
    controlStore.upsertControlTargets(newTargets);
  }

  return { controls: newControls, targets: newTargets, controlIdMap };
}
