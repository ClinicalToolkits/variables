import { Variable, VariableMap } from "../../../types";

export const getChildVariablesHelper = (variable: Variable, variableMap: VariableMap): Variable[] | null => {
  const childVariableIds = variable.getMetadata()?.childVariableIds;
  const bChildVariablesExist = childVariableIds && childVariableIds.length > 0;
  if (!bChildVariablesExist) {
    return null;
  }
  const childVariables: Variable[] = [];
  childVariableIds?.forEach((id) => {
    const childVariable = variableMap.get(id);
    if (childVariable) {
      childVariables.push(childVariable);
    }
  });
  return childVariables;
};
