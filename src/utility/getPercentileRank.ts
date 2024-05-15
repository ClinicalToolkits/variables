import { DataType } from "@clinicaltoolkits/type-definitions";
import { erf, getOrdinalSuffix } from "@clinicaltoolkits/utility-functions";
import { Variable } from "../types";

export function getPercentileRank(inScore: string | number, inDataType: DataType): string {
  const score = typeof inScore === "string" ? Number(inScore) : inScore;
  let meanScore: number, standardDeviation: number;
  let minScore = Number.NEGATIVE_INFINITY;
  let maxScore = Number.POSITIVE_INFINITY;
  let decimalCutoffMin = Number.POSITIVE_INFINITY;
  let decimalCutoffMax = Number.NEGATIVE_INFINITY;

  switch (inDataType) {
    case DataType.SCALED_SCORE:
      meanScore = 10;
      standardDeviation = 3;
      minScore = 1;
      maxScore = 19;
      decimalCutoffMin = 3;
      decimalCutoffMax = 17;
      break;
    case DataType.T_SCORE:
      meanScore = 50;
      standardDeviation = 10;
      break;
    default: // Default values use values meant for `case DataType.STANDARD_SCORE`
      meanScore = 100;
      standardDeviation = 15;
      minScore = 52;
      maxScore = 148;
      decimalCutoffMin = 62;
      decimalCutoffMax = 138;
  }

  const z = (score - meanScore) / standardDeviation;
  let percentileRank: number;

  if (score < minScore) {
    percentileRank = 0.0;
  } else if (score > maxScore) {
    percentileRank = 100.0;
  } else {
    percentileRank = (0.5 + 0.5 * erf(z / Math.sqrt(2))) * 100;
  }

  let result: string;
  const bTruncateDecimal = score >= decimalCutoffMin && score <= decimalCutoffMax;
  if (bTruncateDecimal) {
    percentileRank = parseFloat(Math.round(percentileRank).toFixed(0));
    result = percentileRank.toString(); // No decimal point
  } else {
    percentileRank = parseFloat(percentileRank.toFixed(1));
    result = percentileRank.toFixed(1).toString(); // Explicitly specify 1 decimal point
  }

  if (percentileRank === 0.0) {
    return "<0.1st";
  } else if (percentileRank === 100.0) {
    return ">99.9th";
  } else {
    // Add ordinal suffix to percentile rank
    const suffix = getOrdinalSuffix(percentileRank);
    return `${result}${suffix}`;
  }
}

export const getPercentileRankFromParentVariable = (parentVariable: Variable): string => {
  if (parentVariable.value === null || parentVariable.value === undefined || (typeof parentVariable.value !== "string" && typeof parentVariable.value !== "number")) {
    console.error("getPercentileRankFromVariable returning: Invalid score!");
    return "Invalid score!";
  } else if (parentVariable.metadata?.bNormallyDistributed === false) {
    return "N/A";
  }
  const score: string | number = parentVariable.value;
  const dataType = parentVariable.dataType;
  return getPercentileRank(score, dataType);
}