import { DataType } from "@clinicaltoolkits/type-definitions";
import { Variable } from "../types";

interface OptionsMenuVariablesParams {
  variables: Variable[];
  dataType?: DataType;
}

export const getOptionsMenuVariables = ({ variables, dataType }: OptionsMenuVariablesParams): Variable[] => {
  return variables.filter((variable) => {
    if (variable.metadata?.bOptionsMenu && (!dataType || variable.dataType === dataType)) return variable;
  });
};

export const isOptionsMenuAvailable = ({ variables, dataType }: OptionsMenuVariablesParams): boolean => {
  return getOptionsMenuVariables({ variables, dataType }).length > 0;
};
