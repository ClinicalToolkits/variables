import { Variable, VariableMap } from "../../../types";

export const getChildVariablesHelper = (variable: Variable, variableMap: VariableMap): Variable[] | null => {
  const bChildVariablesExist = variable.metadata?.childVariableKeys && variable.metadata?.childVariableKeys.length > 0;
  if (!bChildVariablesExist) {
    return null;
  }
  const childVariables: Variable[] = [];
  variable.metadata?.childVariableKeys?.forEach((key) => {
    const childVariable = variableMap.get(key);
    if (childVariable) {
      childVariables.push(childVariable);
    }
  });
  return childVariables;
};
