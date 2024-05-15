import { DataType, asUUID } from "@clinicaltoolkits/type-definitions";
import { DescriptiveRatingSet } from "../types";


export const spmDescriptiveRatings: DescriptiveRatingSet = {
  id: asUUID("ff7bccfa-37fd-4e82-a886-ea763abd278a"),
  fullName: "Sensory Processing Measure",
  ratings: [
    {
      dataType: DataType.T_SCORE,
      descriptor: "Severe",
      cutoffScore: 69
    },
    {
      dataType: DataType.T_SCORE,
      descriptor: "Moderate",
      cutoffScore: 59
    },
    {
      dataType: DataType.T_SCORE,
      descriptor: "Typical",
      cutoffScore: 0
    }
  ]
};