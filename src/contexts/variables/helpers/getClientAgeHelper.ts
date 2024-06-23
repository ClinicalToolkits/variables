import { VariableMap, DEMOGRAPHICS, getDemographicsId } from "../../../types";

export const getClientAgeHelper = (variableMap: VariableMap): number | null => {
  const clientAgeVariable = variableMap.get(getDemographicsId(DEMOGRAPHICS.AGE));
  return clientAgeVariable ? (clientAgeVariable.value as number) : null;
};
