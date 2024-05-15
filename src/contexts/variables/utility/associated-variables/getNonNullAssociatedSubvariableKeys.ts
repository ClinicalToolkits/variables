import { Variable, VariableMap } from "../../../../types";

export const getNonNullAssociatedSubvariableKeys = (variable: Variable): string[] => {
  let nonNullKeys: string[] = [];
  if (variable.metadata?.associatedSubvariableProperties) {
    variable.metadata.associatedSubvariableProperties.forEach((subvariable) => {
      if (subvariable.bValueEntered) {
        nonNullKeys.push(subvariable.key);
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
    return variableMap.get(key)?.fullName || "Unknown";
  });
};
