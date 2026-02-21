import { VariableMap, DEMOGRAPHICS, getDemographicsId } from "..";

export const getClientAge = (variableMap: VariableMap): number | null => {
  const clientAgeVariable = variableMap.get(getDemographicsId(DEMOGRAPHICS.AGE));
  return clientAgeVariable ? (clientAgeVariable.getValue() as number) : null;
};
