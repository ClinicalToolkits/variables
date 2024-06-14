import { useMemo } from "react";
import { useVariableContext } from "../VariableContext";
import { getSubgroupNameForVariable, getVariableSubgroupsToDisplay } from "../utility";
import { VariableMap, VariableSet, Variable } from "../../../types";

interface UseSortAndGroupVariablesProps {
  variableGroups: Record<string, VariableMap>;
}

export const useSortAndGroupVariables = (
  variableSet?: VariableSet | null
): UseSortAndGroupVariablesProps => {
  const { variableMap, getChildVariables } = useVariableContext();

  return useMemo(() => {
    if (!variableSet) {
      return {
        variableGroups: {},
      };
    }

    const variableSubgroups = getVariableSubgroupsToDisplay(variableSet, variableMap);
    const groupedAndSorted: Record<string, VariableMap> = {};

    Object.values(variableSubgroups)
      .flat()
      .forEach((variableKey) => {
        const variable = variableMap.get(variableKey);
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

    // Remove empty groups or groups where all variables have metadata.bHidden set to true
    Object.keys(groupedAndSorted).forEach(groupName => {
      if (groupedAndSorted[groupName].size === 0) {
        delete groupedAndSorted[groupName];
      } else {
        const allHidden = Array.from(groupedAndSorted[groupName].values()).every(variable => variable.metadata?.bHidden);
        if (allHidden) {
          delete groupedAndSorted[groupName];
        }
      }
    });

    return {
      variableGroups: groupedAndSorted,
    };
  }, [variableSet, variableMap, getChildVariables]);
};

export const sortVariables = (variables: Variable[]): Variable[] => {
  return variables.sort((a, b) => a.orderWithinSet - b.orderWithinSet);
};
