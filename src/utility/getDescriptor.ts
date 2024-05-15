import { DataType } from "@clinicaltoolkits/type-definitions";
import { Variable } from "../types";
import { universalDescriptiveRatings, DescriptiveRating } from "../descriptive-ratings";

export function getDescriptor(
  inScore: string | number | null | undefined,
  inDataType: DataType,
  inDescriptiveRatings?: DescriptiveRating[]
): string {
  if (inScore === null || inScore === undefined || (typeof inScore !== "string" && typeof inScore !== "number")) {
    console.error("getDescriptor returning: Invalid score!");
    return "Invalid score!";
  }
  const score = typeof inScore === "string" ? Number(inScore) : inScore;
  const bValidScore = score >= 0;
  const cutoffs = inDescriptiveRatings !== undefined ? inDescriptiveRatings : universalDescriptiveRatings;
  let descriptor: string = "Unknown";

  if (!bValidScore) {
    console.error("getDescriptor returning: Invalid score!");
    descriptor = "Invalid score!";
  } else {
    const matchedCutoff = cutoffs.find((cutoff) => score >= cutoff.cutoffScore && cutoff.dataType === inDataType);
    if (matchedCutoff) {
      descriptor = matchedCutoff.descriptor;
    }
  }

  return descriptor;
}

export function getDescriptorFromParentVariable(parentVariable: Variable, inDescriptiveRatings?: DescriptiveRating[]): string {
  if (parentVariable.value === null || parentVariable.value === undefined || (typeof parentVariable.value !== "string" && typeof parentVariable.value !== "number")) {
    console.error("getDescriptorFromVariable returning: Invalid score!");
    return "Invalid scores!";
  }
  const score: string | number = parentVariable.value;
  const dataType = parentVariable.dataType;
  return getDescriptor(score, dataType, inDescriptiveRatings);
}