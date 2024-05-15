import { DataType, asUUID } from "@clinicaltoolkits/type-definitions";
import { DescriptiveRatingSet } from "../types";


export const basc3AdaptiveDescriptiveRatings: DescriptiveRatingSet = {
  id: asUUID("646e3875-1206-4328-b6d5-e3d881124982"),
  fullName: "Behavior Assessment System for Children, 3rd Edition - Adaptive",
  ratings: [
    {
      dataType: DataType.T_SCORE,
      descriptor: "Average",
      cutoffScore: 40
    },
    {
      dataType: DataType.T_SCORE,
      descriptor: "At-Risk",
      cutoffScore: 30
    },
    {
      dataType: DataType.T_SCORE,
      descriptor: "Clinically Significant",
      cutoffScore: 0
    }
  ]
};