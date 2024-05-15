import { DataType } from "@clinicaltoolkits/type-definitions";
import { DescriptiveRating } from "../types";

export const universalDescriptiveRatings: DescriptiveRating[] = [
  // Standard score cutoffs
  { cutoffScore: 130, descriptor: "Extremely High", dataType: DataType.STANDARD_SCORE },
  { cutoffScore: 120, descriptor: "Very High", dataType: DataType.STANDARD_SCORE },
  { cutoffScore: 110, descriptor: "High Average", dataType: DataType.STANDARD_SCORE },
  { cutoffScore: 90, descriptor: "Average", dataType: DataType.STANDARD_SCORE },
  { cutoffScore: 80, descriptor: "Low Average", dataType: DataType.STANDARD_SCORE },
  { cutoffScore: 70, descriptor: "Very Low", dataType: DataType.STANDARD_SCORE },
  { cutoffScore: 0, descriptor: "Extremely Low", dataType: DataType.STANDARD_SCORE },

  // Scaled score cutoffs
  { cutoffScore: 16, descriptor: "Extremely High", dataType: DataType.SCALED_SCORE },
  { cutoffScore: 14, descriptor: "Very High", dataType: DataType.SCALED_SCORE },
  { cutoffScore: 12, descriptor: "High Average", dataType: DataType.SCALED_SCORE },
  { cutoffScore: 8, descriptor: "Average", dataType: DataType.SCALED_SCORE },
  { cutoffScore: 6, descriptor: "Low Average", dataType: DataType.SCALED_SCORE },
  { cutoffScore: 4, descriptor: "Very Low", dataType: DataType.SCALED_SCORE },
  { cutoffScore: 0, descriptor: "Extremely Low", dataType: DataType.SCALED_SCORE },

  // T-score cutoffs
  { cutoffScore: 70, descriptor: "Clinically Significant", dataType: DataType.T_SCORE },
  { cutoffScore: 60, descriptor: "At-Risk", dataType: DataType.T_SCORE },
  { cutoffScore: 0, descriptor: "Average", dataType: DataType.T_SCORE },
];

export function getUniversalDescriptiveRatings(): DescriptiveRating[] {
  return universalDescriptiveRatings;
}