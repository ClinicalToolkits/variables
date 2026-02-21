import { calculateAgeInMonths } from "@clinicaltoolkits/type-definitions";
import { isEmptyValue, logger } from "@clinicaltoolkits/utility-functions";
import { VariableValue, VariableMap, DEMOGRAPHICS, getDemographicsId, VariableId } from "../..";
import { VariableValuePatch } from "./deriveAutoVariableUpdates";

export function deriveAssessmentAgePatches(
  triggerId: VariableId,
  updatedValue: VariableValue,
  snapshot: VariableMap
): VariableValuePatch[] {
  const dateOfBirthId = getDemographicsId(DEMOGRAPHICS.DATE_OF_BIRTH);
  const assessmentEndDateId = getDemographicsId(DEMOGRAPHICS.ASSESSMENT_END_DATE);
  const ageId = getDemographicsId(DEMOGRAPHICS.AGE);

  const bUpdateDoB = triggerId === dateOfBirthId;
  const bUpdateEndDate = triggerId === assessmentEndDateId;
  if (!bUpdateDoB && !bUpdateEndDate) return [];

  const dob = bUpdateDoB ? updatedValue : snapshot.get(dateOfBirthId)?.getValue();
  const endDate = bUpdateEndDate ? updatedValue : snapshot.get(assessmentEndDateId)?.getValue();
  if (isEmptyValue(dob) || isEmptyValue(endDate)) return [];

  const ageInMonths = calculateAgeInMonths(dob as string, endDate as string);
  if (typeof ageInMonths !== "number") {
    logger.error("Error calculating age in months", { dob, endDate, ageInMonths });
    return [];
  }

  return [{ id: ageId, value: ageInMonths }];
};

/* // TODO: Considering deprecating in favour of the above pure function
import { calculateAgeInMonths } from "@clinicaltoolkits/type-definitions";
import { isEmptyValue, logger } from "@clinicaltoolkits/utility-functions";
import { VariableValue, VariableMap, SetVariableFunction, DEMOGRAPHICS, getDemographicsId } from "../..";

export const handleAutoAssessmentAgeUpdates = (variableId: string, updatedValue: VariableValue, variableMap: VariableMap, setVariable: SetVariableFunction) => {
  const dateOfBirthId = getDemographicsId(DEMOGRAPHICS.DATE_OF_BIRTH);
  const assessmentEndDateId = getDemographicsId(DEMOGRAPHICS.ASSESSMENT_END_DATE);
  const ageId = getDemographicsId(DEMOGRAPHICS.AGE);

  const bDateOfBirthUpdated = variableId === dateOfBirthId;
  const bAssessmentEndDateUpdated = variableId === assessmentEndDateId;

  if (bDateOfBirthUpdated || bAssessmentEndDateUpdated) {
    const dateOfBirth = bDateOfBirthUpdated ? updatedValue : variableMap.get(dateOfBirthId)?.getValue();
    const assessmentEndDate = bAssessmentEndDateUpdated ? updatedValue : variableMap.get(assessmentEndDateId)?.getValue();
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
*/
