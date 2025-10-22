import { Variable, VariableMap } from "../../../../types";

export const getNonNullAssociatedSubvariableKeys = (variable: Variable): string[] => {
  let nonNullKeys: string[] = [];
  const associatedSubvariableProperties = variable.getMetadata()?.associatedSubvariableProperties;
  if (associatedSubvariableProperties) {
    associatedSubvariableProperties.forEach((subvariable) => {
      if (subvariable.bValueEntered) {
        nonNullKeys.push(subvariable.id);
      }
    });
  } else {
    nonNullKeys = [];
  }
  return nonNullKeys;
};

export const getNonNullAssociatedSubvariableNames = (variable: Variable, variableMap: VariableMap): string[] => {
  const nonNullKeys = getNonNullAssociatedSubvariableKeys(variable);
  return nonNullKeys.map(key => {
    return variableMap.get(key)?.getFullName() || "Unknown";
  });
};
