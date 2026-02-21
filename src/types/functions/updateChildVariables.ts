import { DataType } from "@clinicaltoolkits/type-definitions";
import { getDescriptiveRatingFromParentVariable, getPercentileRankFromParentVariable } from "./utility";
import { Variable, VariableId, VariableMap, VariableValue } from "../Variable";
import { VariableValuePatch } from "./automated-updates/deriveAutoVariableUpdates";

export function deriveChildVariablePatches(
  parentId: VariableId,
  parentValue: VariableValue,
  variableMapSnapshot: VariableMap
): VariableValuePatch[] {
  const parent = variableMapSnapshot.get(parentId);
  if (!parent) return [];

  const meta = parent.getMetadata();
  const childIds = meta?.childVariableIds ?? [];
  if (!childIds.length) return [];

  const patches: VariableValuePatch[] = [];

  for (const childId of childIds) {
    const child = variableMapSnapshot.get(childId);
    if (!child) continue;

    switch (child.getDataType()) {
      case DataType.PERCENTILE_RANK: {
        const bAuto = meta?.bAutoCalculatePercentileRank ?? true;
        if (!bAuto) break;

        const next = getPercentileRankFromParentVariable(parent);
        patches.push({ id: childId, value: next });
        break;
      }

      case DataType.DESCRIPTOR: {
        const bAuto = meta?.bAutoCalculateDescriptiveRating ?? true;
        if (!bAuto) break;

        const next = getDescriptiveRatingFromParentVariable(
          parent,
          child.getMetadata()?.descriptiveRatings
        );
        patches.push({ id: childId, value: next });
        break;
      }

      default:
        // unknown child type: ignore, don't abort the whole loop
        break;
    }
  }

  return patches;
}

export function updateChildVariables(
    parentVariable: Variable,
    currentVariableMap: VariableMap,
    updatedVariableMap: VariableMap
  ): VariableMap {
    if (!parentVariable) return updatedVariableMap;
    const parentVariableMetadata = parentVariable.getMetadata();
    const parentVariableChildVariableIds = parentVariableMetadata?.childVariableIds;
    if(!parentVariableMetadata || !parentVariableChildVariableIds) return updatedVariableMap;
  
    for (const childKey of parentVariableMetadata.childVariableIds) {
      let childVariable = currentVariableMap.get(childKey);
      if (childVariable) {
        // Update child variable value
        switch (childVariable.getDataType()) {
          case DataType.PERCENTILE_RANK: {
            const bAutoCalculate = parentVariableMetadata?.bAutoCalculatePercentileRank ?? true;
            if (bAutoCalculate) {
              const percentileRankFromParent = getPercentileRankFromParentVariable(parentVariable);
              childVariable = childVariable.withValue(percentileRankFromParent);
            }
            break;
          }
          case DataType.DESCRIPTOR: {
            const bAutoCalculate = parentVariableMetadata?.bAutoCalculateDescriptiveRating ?? true;
            if (bAutoCalculate) {
              const descriptorFromParent = getDescriptiveRatingFromParentVariable(parentVariable, childVariable.getMetadata()?.descriptiveRatings);
              childVariable = childVariable.withValue(descriptorFromParent);
            }
            break;
          }
          default:
            continue;
        }
  
        // Add updated childVariable (and value) to newVariables
        updatedVariableMap.set(childKey, childVariable);
  
        // Recursively update potential children of the child - currently not used, but may be beneficial in future
        updateChildVariables(childVariable, currentVariableMap, updatedVariableMap);
      }
    }
  return updatedVariableMap;
};
