import { useMemo } from "react";
import { useVariableContext } from "../VariableContext";
import { getSubgroupNameForVariable, getVariableSubgroupsToDisplay } from "../utility";
import { VariableMap, VariableSet, Variable } from "../../../types";
import { isHidden } from "@clinicaltoolkits/type-definitions";

interface UseSortAndGroupVariablesProps {
  variableGroups: Record<string, VariableMap>;
}

export const useSortAndGroupVariables = (
  variables?: Variable[] | null
): UseSortAndGroupVariablesProps => {
  const { variableMap, getChildVariables } = useVariableContext();

  return useMemo(() => {
    if (!variables) {
      return {
        variableGroups: {},
      };
    }

    //const variableSubgroups = getVariableSubgroupsToDisplay(variables, variableMap);
    const groupedAndSorted: Record<string, VariableMap> = {};

    //Object.values(variableSubgroups)
      //.flat()
    variables.forEach((variable) => {
      //const variable = variableMap.get(variableKey);
      if (!variable) return;

      const subgroupName = getSubgroupNameForVariable(variable); // Define this function based on your business logic
      if (!groupedAndSorted[subgroupName]) {
        groupedAndSorted[subgroupName] = new Map<string, Variable>();
      }

      const isChildVariable = variable?.metadata?.properties?.childVariable?.parentVariableId !== undefined;
      if (isChildVariable) return;

      groupedAndSorted[subgroupName].set(variable.idToken.id, variable);

      const childVariables = getChildVariables(variable);
      childVariables?.forEach(childVariable => {
        groupedAndSorted[subgroupName].set(childVariable.idToken.id, childVariable);
      });
    });

    // Optionally sort groups by the order within each group
    Object.keys(groupedAndSorted).forEach(groupName => {
      const sortedMap = new Map([...groupedAndSorted[groupName]].sort((a, b) => {
        return a[1].orderWithinSet - b[1].orderWithinSet;
      }));
      groupedAndSorted[groupName] = sortedMap;
    });

    // Remove empty groups or groups where all variables have metadata.visibility === Visibility.HIDDEN
    Object.keys(groupedAndSorted).forEach(groupName => {
      if (groupedAndSorted[groupName].size === 0) {
        delete groupedAndSorted[groupName];
      } else {
        const bAllVariablesHidden = Array.from(groupedAndSorted[groupName].values()).every(variable => isHidden(variable.metadata?.visibility));
        if (bAllVariablesHidden) {
          delete groupedAndSorted[groupName];
        }
      }
    });

    return {
      variableGroups: groupedAndSorted,
    };
  }, [variables, getChildVariables]);
};

export const sortVariables = (variables: Variable[]): Variable[] => {
  return variables.sort((a, b) => a.orderWithinSet - b.orderWithinSet);
};
