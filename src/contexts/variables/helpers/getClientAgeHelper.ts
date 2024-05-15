import { VariableMap, DEMOGRAPHICS } from "../../../types";

export const getClientAgeHelper = (variableMap: VariableMap): number | null => {
  const clientAgeVariable = variableMap.get(DEMOGRAPHICS.AGE);
  return clientAgeVariable ? (clientAgeVariable.value as number) : null;
};
