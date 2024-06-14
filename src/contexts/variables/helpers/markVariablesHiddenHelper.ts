import { VariableMap } from "../../../types";

export const markVariablesHiddenHelper = (variableMap: VariableMap, ids: string[], bHidden: boolean): VariableMap => {
  const updatedVariableMap = new Map(variableMap);
  ids.forEach((id) => {
    const variable = updatedVariableMap.get(id);
    if (variable) {
      const updatedVariable = { ...variable, metadata: { ...variable.metadata, bHidden } };
      updatedVariableMap.set(id, updatedVariable);
    }
  });

  return updatedVariableMap;
};
