import { isEmptyValue } from "@clinicaltoolkits/utility-functions";
import { Variable, VariableMap, VariableSet } from "../types";
import { shouldDisplayVariable, shouldDisplayVariables } from "../contexts";

export interface IsVariableSetCompletedParams {
  variables?: Variable[];
}

export const isVariableSetCompleted = ({ variables }: IsVariableSetCompletedParams): boolean => {
  let bSectionCompleted = true;

  if (variables) {
    variables.forEach((variable) => {
      const { value } = variable;
      if (shouldDisplayVariable(variable) && (isEmptyValue(value) || value === "-")) {
        bSectionCompleted = false;
      }
    });
  }




/*

    // Iterate through each subgroup
    Object.entries(variableSet.variableIds.subgroups).forEach(([_subgroupTag, { required, optional }]) => {
      const processVariables = (variables: string[] | undefined) => {
        variables?.forEach((variableKey) => {
          const variable = variableMap.get(variableKey);
          if (variable && shouldDisplayVariable(variable)) {
            const { value } = variable;
            if (isEmptyValue(value) || value === "-") {
              bSectionCompleted = false;
            }
          }
        });
      };

      // Always process 'required' variables
      processVariables(required);

      // Check if the optional variables for the current subgroup should be considered
      if (optional && shouldDisplayVariables(optional, variableMap)) {
        processVariables(optional);
      }
    });
  }
*/
  return bSectionCompleted;
};
