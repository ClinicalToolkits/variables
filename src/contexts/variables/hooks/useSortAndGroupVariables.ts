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

        const isChildVariable = variable?.metadata?.properties?.childVariable?.parentVariableKey !== undefined;
        if (isChildVariable) return;

        groupedAndSorted[subgroupName].set(variable.key, variable);

        const childVariables = getChildVariables(variable);
        childVariables?.forEach(childVariable => {
          groupedAndSorted[subgroupName].set(childVariable.key, childVariable);
        });
      });

    // Optionally sort groups by the order within each group
    Object.keys(groupedAndSorted).forEach(groupName => {
      const sortedMap = new Map([...groupedAndSorted[groupName]].sort((a, b) => {
        return a[1].orderWithinSet - b[1].orderWithinSet;
      }));
      groupedAndSorted[groupName] = sortedMap;
    });

    return {
      variableGroups: groupedAndSorted,
    };
  }, [variableSet, variableMap, getChildVariables]);
};
