import { Variable } from "../../../types";

export const isVariableHidden = (variable: Variable): boolean => {
  return variable.metadata?.bHidden || false;
};
