import { getPronounValue } from "../../../gender";
import { VariableMap, VariableId, VariableValue } from "../..";
import { VariableValuePatch } from "./deriveAutoVariableUpdates";

export function derivePronounPatches(
  genderValue: string,
  pronounIds: VariableId[],
  snapshot: VariableMap
): VariableValuePatch[] {
  const out: VariableValuePatch[] = [];
  for (const pid of pronounIds) {
    const v = snapshot.get(pid);
    if (!v) continue;
    const pronounValue = getPronounValue(v.getAbbreviatedName(), genderValue);
    if (pronounValue) out.push({ id: v.getId() as VariableId, value: pronounValue as VariableValue });
  }
  return out;
}

/* // TODO: Considering deprecating in favour of the above pure function
import { getPronounValue } from "../../../gender";
import { VariableMap, SetVariableFunction } from "../..";

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
      const pronounValue = getPronounValue(pronounVariable.getAbbreviatedName(), genderValue);
      if (pronounValue) { 
        setVariable(pronounVariable.getId(), pronounValue ?? "");
        updatedPronounValues[pronounId] = pronounValue;
      }
    } else {
      console.error(`Pronoun variable not found for id: ${pronounId}`);
    }
  });
  return updatedPronounValues;
};
*/
