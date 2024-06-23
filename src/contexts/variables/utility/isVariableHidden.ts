import { isHidden } from "@clinicaltoolkits/type-definitions";
import { Variable } from "../../../types";

export const isVariableHidden = (variable: Variable): boolean => {
  return isHidden(variable.metadata?.visibility);
};
