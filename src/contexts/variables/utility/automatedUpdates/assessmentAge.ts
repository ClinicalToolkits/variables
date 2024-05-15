import { calculateAgeInMonths } from "@clinicaltoolkits/type-definitions";
import { isEmptyValue, logger } from "@clinicaltoolkits/utility-functions";
import { VariableValue, VariableMap, SetVariableFunction, DEMOGRAPHICS } from "../../../../types";

export const handleAutoAssessmentAgeUpdates = (variableKey: string, updatedValue: VariableValue, variableMap: VariableMap, setVariable: SetVariableFunction) => {
  const bDateOfBirthUpdated = variableKey === DEMOGRAPHICS.DATE_OF_BIRTH;
  const bAssessmentEndDateUpdated = variableKey === DEMOGRAPHICS.ASSESSMENT_END_DATE;
  if (bDateOfBirthUpdated || bAssessmentEndDateUpdated) {
    const dateOfBirth = bDateOfBirthUpdated ? updatedValue : variableMap.get(DEMOGRAPHICS.DATE_OF_BIRTH)?.value;
    const assessmentEndDate = bAssessmentEndDateUpdated ? updatedValue : variableMap.get(DEMOGRAPHICS.ASSESSMENT_END_DATE)?.value;
    if (!isEmptyValue(dateOfBirth) && !isEmptyValue(assessmentEndDate)) {
      const ageInMonths = calculateAgeInMonths(dateOfBirth as string, assessmentEndDate as string);
      if (typeof ageInMonths === "number") {
        setVariable(DEMOGRAPHICS.AGE, ageInMonths);
      } else {
        logger.error("Error calculating age in months", { dateOfBirth, assessmentEndDate, ageInMonths });
      }
    }
  }
};