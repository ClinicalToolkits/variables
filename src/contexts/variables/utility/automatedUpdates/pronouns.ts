import { getPronounValue } from "../../../../gender";
import { VariableMap, SetVariableFunction } from "../../../../types";

export const handleAutoPronounUpdates = (
  genderValue: string,
  pronounIds: string[],
  variableMap: VariableMap,
  setVariable: SetVariableFunction
): Record<string, string> => {
  const updatedPronounValues: Record<string, string> = {};
  pronounIds?.forEach((pronounId: string) => {
    const pronounVariable = variableMap.get(pronounId);
    if (pronounVariable) {
      const pronounValue = getPronounValue(pronounVariable.abbreviatedName, genderValue);
      if (pronounValue) { 
        setVariable(pronounVariable.idToken.id, pronounValue ?? "");
        updatedPronounValues[pronounId] = pronounValue;
      }
    } else {
      console.error(`Pronoun variable not found for id: ${pronounId}`);
    }
  });
  return updatedPronounValues;
};
