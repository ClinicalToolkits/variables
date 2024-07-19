import { calculateAgeInMonths } from "@clinicaltoolkits/type-definitions";
import { isEmptyValue, logger } from "@clinicaltoolkits/utility-functions";
import { VariableValue, VariableMap, SetVariableFunction, DEMOGRAPHICS, getDemographicsId } from "../../../../types";

export const handleAutoAssessmentAgeUpdates = (variableId: string, updatedValue: VariableValue, variableMap: VariableMap, setVariable: SetVariableFunction) => {
  const dateOfBirthId = getDemographicsId(DEMOGRAPHICS.DATE_OF_BIRTH);
  const assessmentEndDateId = getDemographicsId(DEMOGRAPHICS.ASSESSMENT_END_DATE);
  const ageId = getDemographicsId(DEMOGRAPHICS.AGE);

  const bDateOfBirthUpdated = variableId === dateOfBirthId;
  const bAssessmentEndDateUpdated = variableId === assessmentEndDateId;

  if (bDateOfBirthUpdated || bAssessmentEndDateUpdated) {
    const dateOfBirth = bDateOfBirthUpdated ? updatedValue : variableMap.get(dateOfBirthId)?.value;
    const assessmentEndDate = bAssessmentEndDateUpdated ? updatedValue : variableMap.get(assessmentEndDateId)?.value;
    if (!isEmptyValue(dateOfBirth) && !isEmptyValue(assessmentEndDate)) {
      const ageInMonths = calculateAgeInMonths(dateOfBirth as string, assessmentEndDate as string);
      if (typeof ageInMonths === "number") {
        setVariable(ageId, ageInMonths);
      } else {
        logger.error("Error calculating age in months", { dateOfBirth, assessmentEndDate, ageInMonths });
      }
    }
  }
};