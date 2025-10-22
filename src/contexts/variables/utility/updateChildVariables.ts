import { DataType } from "@clinicaltoolkits/type-definitions";
import { getDescriptorFromParentVariable, getPercentileRankFromParentVariable } from "../../../utility";
import { Variable, VariableMap } from "../../../types";
import { VariableSetMap } from "../VariableContextTypes";

export function updateChildVariables(
    parentVariable: Variable,
    currentVariables: VariableMap,
    updatedVariables: VariableMap,
    variableSetMap: VariableSetMap
  ) {
    if (!parentVariable) return;
    const parentVariableMetadata = parentVariable.getMetadata();
    const parentVariableChildVariableIds = parentVariableMetadata?.childVariableIds;
    if(!parentVariableMetadata || !parentVariableChildVariableIds) return;
  
    for (const childKey of parentVariableMetadata.childVariableIds) {
      let childVariable = currentVariables.get(childKey);
      if (childVariable) {
        const bAutoCalculate = parentVariableMetadata?.bAutoCalculatePercentileRank ?? true;
        // Update child variable value
        switch (childVariable.getDataType()) {
          case DataType.PERCENTILE_RANK: {
            if (bAutoCalculate) {
                const percentileRankFromParent = getPercentileRankFromParentVariable(parentVariable);
                childVariable = childVariable.withValue(percentileRankFromParent);
            }
            break;
          }
          case DataType.DESCRIPTOR: {
            if (bAutoCalculate) {
                const descriptorFromParent = getDescriptorFromParentVariable(parentVariable, childVariable.getMetadata()?.descriptiveRatings);
                childVariable = childVariable.withValue(descriptorFromParent);
            }
            break;
          }
          default:
            return;
        }
  
        // Add updated childVariable (and value) to newVariables
        updatedVariables.set(childKey, { ...childVariable });
  
        // Recursively update potential children of the child - currently not used, but may be beneficial in future
        updateChildVariables(childVariable, currentVariables, updatedVariables, variableSetMap);
      }
    }
};
