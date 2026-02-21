import { DataType } from "@clinicaltoolkits/type-definitions";
import { Variable } from "../../types";
import { universalDescriptiveRatings, DescriptiveRating } from "..";
import { logger } from "@clinicaltoolkits/logger";
import { SCOPES } from "../../scopes";


const log = logger.scope(SCOPES.descriptive_ratings.utility.get_descriptive_ratings);

export function getDescriptiveRating(
  inScore: string | number | null | undefined,
  inDataType: DataType,
  inDescriptiveRatings?: DescriptiveRating[]
): string {
  if (inScore === null || inScore === undefined || (typeof inScore !== "string" && typeof inScore !== "number")) {
    log.warn("getDescriptiveRating() - Passed in score is either null/undefined or not of type string/number. Returning: 'Invalid score!'. Passed in score: ", inScore);
    return "Invalid score!";
  }
  const score = typeof inScore === "string" ? Number(inScore) : inScore;
  const bValidScore = score >= 0;
  const cutoffs = inDescriptiveRatings !== undefined ? inDescriptiveRatings : universalDescriptiveRatings;
  let descriptor: string = "Unknown";

  if (!bValidScore) {
    log.warn("getDescriptiveRating() - Passed in score is less than 0. Returning: 'Invalid score!'. Passed in score: ", inScore);
    descriptor = "Invalid score!";
  } else {
    const matchedCutoff = cutoffs.find((cutoff) => score >= cutoff.cutoffScore && cutoff.dataType === inDataType);
    if (matchedCutoff) {
      descriptor = matchedCutoff.descriptor;
    }
  }

  return descriptor;
}

export function getDescriptiveRatingFromParentVariable(parentVariable: Variable, inDescriptiveRatings?: DescriptiveRating[]): string {
  const value = parentVariable.getValue();
  if (value === null || value === undefined || (typeof value !== "string" && typeof value !== "number")) {
    log.warn("getDescriptiveRatingFromParentVariable() - Passed a parent variable that was either null/undefined or not of type string/number. Returning: 'Invalid score!'. Passed in variable: ", parentVariable);
    return "Invalid scores!";
  }
  const score: string | number = value;
  const dataType = parentVariable.getDataType();
  return getDescriptiveRating(score, dataType, inDescriptiveRatings);
}