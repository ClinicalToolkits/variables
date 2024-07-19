
import { handleAutoPronounUpdates } from "./pronouns";
import { handleAutoAssessmentAgeUpdates } from "./assessmentAge";
import { isEmptyValue } from "@clinicaltoolkits/utility-functions";
import { VariableValue, VariableMap, SetVariableFunction, DEMOGRAPHICS, getDemographicsId } from "../../../../types";

export const handleAutoVariableUpdates =(updatedVariableId: string, updatedValue: VariableValue, variableMap: VariableMap, setVariable: SetVariableFunction) => {
  const updatedVariable = variableMap.get(updatedVariableId);
  if (updatedVariable && !isEmptyValue(updatedValue)) {
    switch (updatedVariableId) {
      case getDemographicsId(DEMOGRAPHICS.GENDER): {
        const pronounIds = updatedVariable.metadata?.associatedSubvariableProperties?.map((subvariableProperty) => {
          return subvariableProperty.id;
        });
        if (pronounIds && typeof updatedValue === "string") handleAutoPronounUpdates(updatedValue, pronounIds, variableMap, setVariable);
        break;
      }
      case getDemographicsId(DEMOGRAPHICS.ASSESSMENT_END_DATE):
      case getDemographicsId(DEMOGRAPHICS.DATE_OF_BIRTH):
        handleAutoAssessmentAgeUpdates(updatedVariableId, updatedValue, variableMap, setVariable);
        break;
    }
  }
};
