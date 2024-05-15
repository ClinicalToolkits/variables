
import { handleAutoPronounUpdates } from "./pronouns";
import { handleAutoAssessmentAgeUpdates } from "./assessmentAge";
import { isEmptyValue } from "@clinicaltoolkits/utility-functions";
import { VariableValue, VariableMap, SetVariableFunction, DEMOGRAPHICS } from "../../../../types";

export const handleAutoVariableUpdates =(updatedVariableKey: string, updatedValue: VariableValue, variableMap: VariableMap, setVariable: SetVariableFunction) => {
  const updatedVariable = variableMap.get(updatedVariableKey);
  if (updatedVariable && !isEmptyValue(updatedValue)) {
    switch (updatedVariableKey) {
      case DEMOGRAPHICS.GENDER: {
        const pronounKeys = updatedVariable.metadata?.associatedSubvariableProperties?.map((subvariableProperty) => {
          return subvariableProperty.key;
        });
        if (pronounKeys && typeof updatedValue === "string") handleAutoPronounUpdates(updatedValue, pronounKeys, variableMap, setVariable);
        break;
      }
      case DEMOGRAPHICS.DATE_OF_BIRTH:
        handleAutoAssessmentAgeUpdates(updatedVariableKey, updatedValue, variableMap, setVariable);
        break;
    }
  }
};
