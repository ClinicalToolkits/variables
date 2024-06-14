import { Variable, VariableMap } from "../../../types";

export const getChildVariablesHelper = (variable: Variable, variableMap: VariableMap): Variable[] | null => {
  const bChildVariablesExist = variable.metadata?.childVariableIds && variable.metadata?.childVariableIds.length > 0;
  if (!bChildVariablesExist) {
    return null;
  }
  const childVariables: Variable[] = [];
  variable.metadata?.childVariableIds?.forEach((id) => {
    const childVariable = variableMap.get(id);
    if (childVariable) {
      childVariables.push(childVariable);
    }
  });
  return childVariables;
};
