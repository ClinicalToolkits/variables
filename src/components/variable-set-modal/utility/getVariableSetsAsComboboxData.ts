import { ComboboxData, convertObjectArrayToComboboxDataArray } from "@clinicaltoolkits/type-definitions";
import { VariableSet } from "../../../types";

export const getVariableSetsAsComboboxData = (variableSets: VariableSet[]): ComboboxData[] => {
  return convertObjectArrayToComboboxDataArray(variableSets, "key", "metadata.label");
};