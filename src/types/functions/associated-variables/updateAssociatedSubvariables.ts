import { isEmptyValue } from "@clinicaltoolkits/utility-functions";
import { getDescriptiveRatingFromParentVariable, getPercentileRankFromParentVariable, Variable, VariableId, VariableMap, VariableValue } from "../..";
import { AssociatedSubobjectProperties, DataType } from "@clinicaltoolkits/type-definitions";
import { VariableValuePatch, Enqueue } from "../automated-updates/deriveAutoVariableUpdates";
import { logger } from "@clinicaltoolkits/logger";
import { SCOPES } from "../../../scopes";

const log = logger.scope(SCOPES.types.functions.assosciated_variables.update_associated_subvariables);

type UpdateAssociatedSubvariablePropertiesParams = {
  variable: Variable;
  subvariableId: string;
  subVariableValue: VariableValue;
};

export const updateAssociatedSubvariableProperties = ({ variable, subvariableId, subVariableValue }: UpdateAssociatedSubvariablePropertiesParams): AssociatedSubobjectProperties[] => {
  let out: AssociatedSubobjectProperties[] = [];
  // Ensure metadata exists
  const variableMetadata = variable.getMetadata();
  if (variableMetadata) {
    // Initialize associatedSubvariable array if it doesn't exist
    let currentAssociatedSubvariableProperties = variableMetadata.associatedSubvariableProperties || [];

    // Determine if the subvariable value is null (or equivalent) and update accordingly
    const isValueNull = isEmptyValue(subVariableValue);

    // Update the associatedSubvariablePropertyMap
    // If subVariableValue is null, set the associated property to false, otherwise true
    currentAssociatedSubvariableProperties = currentAssociatedSubvariableProperties.map((subvariableProperty) => {
      if (subvariableProperty.id === subvariableId) {
        return {
          ...subvariableProperty,
          bValueEntered: !isValueNull,
        };
      }
      return subvariableProperty;
    });

    out = currentAssociatedSubvariableProperties;
    log.debug(`Updated associatedSubvariableProperties for ${subvariableId}: ${!isValueNull}`);
  } else {
    log.error("Variable metadata is missing");
  }

  return out;
};

export function applyValuePatch(next: VariableMap, patch: VariableValuePatch, enqueue: Enqueue): void {
  const cur = next.get(patch.id);
  if (!cur) return;

  const curVal = cur.getValue();
  if (Object.is(curVal, patch.value)) return;

  const updated = cur.withValue(patch.value);
  if (updated === cur) return;

  next.set(patch.id, updated);
  enqueue(patch.id);
}

export function applyMetadataPatch(next: VariableMap, id: VariableId, update: (v: Variable) => Variable, enqueue: Enqueue): void {
  const cur = next.get(id);
  if (!cur) return;

  const updated = update(cur);
  if (updated === cur) return;

  next.set(id, updated);
  enqueue(id);
}

/**
 * Immediate child derivation only.
 * Recursion is handled by the outer queue: if a child updates, it will be processed next.
 */
export function deriveChildValuePatches(parent: Variable, next: VariableMap): VariableValuePatch[] {
  const meta = parent.getMetadata();
  const childIds = meta?.childVariableIds ?? [];
  if (!childIds.length) return [];

  const out: VariableValuePatch[] = [];

  for (const childId of childIds) {
    const child = next.get(childId);
    if (!child) continue;

    switch (child.getDataType()) {
      case DataType.PERCENTILE_RANK: {
        const bAuto = meta?.bAutoCalculatePercentileRank ?? true;
        if (!bAuto) break;

        const nextVal = getPercentileRankFromParentVariable(parent);
        out.push({ id: childId, value: nextVal });
        break;
      }

      case DataType.DESCRIPTOR: {
        const bAuto = meta?.bAutoCalculateDescriptiveRating ?? true;
        if (!bAuto) break;

        const nextVal = getDescriptiveRatingFromParentVariable(
          parent,
          child.getMetadata()?.descriptiveRatings
        );
        out.push({ id: childId, value: nextVal });
        break;
      }

      default:
        // Ignore unknown child datatypes (do NOT abort)
        break;
    }
  }

  return out;
}