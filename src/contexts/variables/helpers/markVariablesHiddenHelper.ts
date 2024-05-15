import { VariableMap } from "../../../types";

export const markVariablesHiddenHelper = (variableMap: VariableMap, keys: string[], bHidden: boolean): VariableMap => {
  const updatedVariableMap = new Map(variableMap);

  keys.forEach((key) => {
    const variable = updatedVariableMap.get(key);
    if (variable) {
      const updatedVariable = { ...variable, metadata: { ...variable.metadata, bHidden } };
      updatedVariableMap.set(key, updatedVariable);
    }
  });

  return updatedVariableMap;
};
