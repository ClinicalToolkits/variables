import { DataType, asUUID } from "@clinicaltoolkits/type-definitions";
import { DescriptiveRatingSet } from "../types";


export const celfDescriptiveRatings: DescriptiveRatingSet = {
  id: asUUID("af1f7985-a062-470e-9eb6-0e16a8878d92"),
  fullName: "Clinical Evaluation of Language Fundamentals",
  ratings: [
    {
      dataType: DataType.STANDARD_SCORE,
      descriptor: "Above Average",
      cutoffScore: 115
    },
    {
      dataType: DataType.STANDARD_SCORE,
      descriptor: "Average",
      cutoffScore: 86
    },
    {
      dataType: DataType.STANDARD_SCORE,
      descriptor: "Mild",
      cutoffScore: 78
    },
    {
      dataType: DataType.STANDARD_SCORE,
      descriptor: "Moderate",
      cutoffScore: 71
    },
    {
      dataType: DataType.STANDARD_SCORE,
      descriptor: "Severe",
      cutoffScore: 0
    },
    {
      dataType: DataType.SCALED_SCORE,
      descriptor: "Above Average",
      cutoffScore: 13
    },
    {
      dataType: DataType.SCALED_SCORE,
      descriptor: "Average",
      cutoffScore: 8
    },
    {
      dataType: DataType.SCALED_SCORE,
      descriptor: "Below Average",
      cutoffScore: 0
    }
  ]
};