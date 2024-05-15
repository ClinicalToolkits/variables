import { getPronounValue } from "../../../../gender";
import { VariableMap, SetVariableFunction } from "../../../../types";

export const handleAutoPronounUpdates = (
  genderValue: string,
  pronounKeys: string[],
  variableMap: VariableMap,
  setVariable: SetVariableFunction
): Record<string, string> => {
  const updatedPronounValues: Record<string, string> = {};
  pronounKeys?.forEach((pronounKey: string) => {
    const pronounVariable = variableMap.get(pronounKey);
    if (pronounVariable) {
      const pronounValue = getPronounValue(pronounVariable.abbreviatedName, genderValue);
      if (pronounValue) { 
        setVariable(pronounVariable.key, pronounValue ?? "");
        updatedPronounValues[pronounKey] = pronounValue;
      }
    } else {
      console.error(`Pronoun variable not found for key: ${pronounKey}`);
    }
  });
  return updatedPronounValues;
};
