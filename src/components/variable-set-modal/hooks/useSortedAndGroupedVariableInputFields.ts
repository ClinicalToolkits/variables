
import { InputField, InputFieldClassNames, InputFieldMap } from "@clinicaltoolkits/universal-react-components";
import { DataType } from "@clinicaltoolkits/type-definitions";
import { useMemo } from "react";
import { getInputElementSize } from "../utility";
import { input, inputCenter, calendarHeader } from "../styles";
import { getSubgroupNameForVariable, getVariableSubgroupsToDisplay, useVariableContext } from "../../../contexts";
import { Variable, VariableSet } from "../../../types";

interface UseSortedAndGroupedVariableInputFields {
  variableInputFieldGroups: [string, InputField[]][];
  variableInputFieldMap: InputFieldMap<InputField>;
}

export const useSortedAndGroupedVariableInputFields = (
  variableSet?: VariableSet | null
): UseSortedAndGroupedVariableInputFields => {
  const { variableMap, getChildVariables } = useVariableContext();

  return useMemo(() => {
    if (!variableSet) {
      return {
        variableInputFieldGroups: [],
        variableInputFieldMap: new Map(),
      };
    }

    const variableSubgroups = getVariableSubgroupsToDisplay(variableSet, variableMap);

    const groupedAndSorted = new Map<string, InputField[]>();
    const variableInputFieldMap = new Map<string, InputField>();

    Object.values(variableSubgroups)
      .flat()
      .forEach((variableKey) => {
        const variable = variableMap.get(variableKey);
        const bParentVariable =
          variable?.metadata?.childVariableIds !== undefined && variable.metadata?.childVariableIds.length > 0;
        const bChildVariable = variable?.metadata?.properties?.childVariable?.parentVariableId !== undefined;
        if (!variable) return;

        const inputField = convertVariableToInputField(variable);
        variableInputFieldMap.set(inputField.key, inputField);
        // Allows for adding all the necessary variables to the inputFieldMap in a single pass and ensures we don't have to create it from the entire variable map.
        if (bParentVariable) {
          const childVariables = getChildVariables(variable);
          const childInputFields = childVariables?.map(convertVariableToInputField);
          if (childInputFields) {
            childInputFields.forEach((childInputField) => {
              variableInputFieldMap.set(childInputField.key, childInputField);
            });
          }
        }

        if (bChildVariable) return;

        const subgroupName = getSubgroupNameForVariable(variable); // Implement this based on your logic
        const currentGroup = groupedAndSorted.get(subgroupName) || [];
        const insertionIndex = currentGroup.findIndex((v) => v.metadata?.orderWithinSet > variable.orderWithinSet);
        if (insertionIndex === -1) {
          currentGroup.push(inputField);
        } else {
          currentGroup.splice(insertionIndex, 0, inputField);
        }
        groupedAndSorted.set(subgroupName, currentGroup);
      });

    const variableInputFieldGroups = Array.from(groupedAndSorted).sort(([_, groupA], [__, groupB]) => {
      const minOrderA = groupA[0]?.metadata?.orderWithinSet ?? Number.MAX_SAFE_INTEGER;
      const minOrderB = groupB[0]?.metadata?.orderWithinSet ?? Number.MAX_SAFE_INTEGER;
      return minOrderA - minOrderB;
    });

    return {
      variableInputFieldGroups,
      variableInputFieldMap,
    };
  }, [variableSet, variableMap]);
};

const convertVariableToInputField = (variable: Variable): InputField => ({
  key: variable.idToken.id,
  value: variable.value,
  displayName: variable.fullName,
  type: variable.dataType,
  metadata: {
    childInputFieldKeys: variable.metadata?.childVariableIds,
    bHidden: variable.metadata?.bHidden,
    description: variable.metadata?.description,
    orderWithinSet: variable.orderWithinSet,
    bHidePlaceholderOnFocus: true,
    placeholder: variable.metadata?.placeholder,
    abbreviatedPlaceholder: variable.metadata?.abbreviatedPlaceholder,
    options: variable.metadata?.dropdownOptions,
    pronounKeys:
      variable.fullName === "Gender"
        ? variable.metadata?.associatedSubvariableProperties?.map((subvariableProperties) => subvariableProperties.id)
        : undefined,
  },
  props: {
    size: getInputElementSize(),
    classNames: getClassnames(variable.dataType),
  },
});

const getClassnames = (type: string): InputFieldClassNames => {
  switch (type) {
    case DataType.STANDARD_SCORE:
      return {
        inputElement: inputCenter,
      };
    case DataType.SCALED_SCORE:
      return {
        inputElement: inputCenter,
      };
    case DataType.T_SCORE:
      return {
        inputElement: inputCenter,
      };
    case DataType.PERCENTILE_RANK:
      return {
        inputElement: inputCenter,
      };
    case DataType.RAW_SCORE:
      return {
        inputElement: inputCenter,
      };
    case DataType.DATE:
      return {
        inputElement: input,
        calendarHeader: calendarHeader,
      };
    case DataType.DESCRIPTOR:
      return {
        inputElement: input,
      };
    default:
      return {
        inputElement: input,
      };
  }
};
