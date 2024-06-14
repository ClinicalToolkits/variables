import { ComboboxData, convertObjectArrayToComboboxDataArray } from "@clinicaltoolkits/type-definitions";
import { VariableSet } from "../../../types";

export const getVariableSetsAsComboboxData = (variableSets: VariableSet[]): ComboboxData[] => {
  const data = convertObjectArrayToComboboxDataArray({ array: variableSets, idPath: "idToken.id", labelPath: "label", bUppercase: true });
  return data;
};