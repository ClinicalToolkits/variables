
import { DataType } from "@clinicaltoolkits/type-definitions";
import { Variable } from "../../types";
import { getUniversalDescriptiveRatings } from "../../descriptive-ratings/utility/getUniversalRatings";
import { createDescriptorVariable, createPercentileRankVariable } from "./ChildVariables";
import { fetchDescriptiveRatingsArray, DescriptiveRating, getOptionsFromDescriptiveRatings } from "../../descriptive-ratings";

export const createAutoGeneratedVariables = (variable: Variable, accumulator?: Variable[], accumulatorPromises?: Promise<void>[], globallyAppliedDescriptiveRatings?: DescriptiveRating[]): void => {
  if (variable.metadata?.bCreatePercentileRank) {
    const percentileRankVariable = createPercentileRankVariable(variable);
    accumulator?.push(percentileRankVariable);
    if (variable.id === "09f96445-65b3-4bf0-b71e-41db7d4c561d") {
      console.log("percentileRankVariable", percentileRankVariable);
    }
  }

  if (variable.metadata?.bCreateDescriptiveRating) {
    const descriptorVariable = createDescriptorVariable(variable);
    applyDescriptiveRatings(descriptorVariable, variable.dataType, variable?.metadata?.descriptiveRatingId, globallyAppliedDescriptiveRatings, accumulatorPromises);
    accumulator?.push(descriptorVariable);
  }
};

export function applyDescriptiveRatings(variable: Variable, dataType: DataType, descriptiveRatingId?: string, globallyAppliedDescriptiveRatings?: DescriptiveRating[], additionalAccPromises?: Promise<void>[]): void {
  if (!variable.metadata) {
    variable.metadata = {
      descriptiveRatings: [],
    };
  }
  if (descriptiveRatingId) {
    const fetchPromise = fetchDescriptiveRatingsArray(descriptiveRatingId).then((ratings) => {
      variable.metadata!.descriptiveRatings = ratings;
      variable.metadata!.dropdownOptions = getOptionsFromDescriptiveRatings(ratings, dataType);
    });
    additionalAccPromises?.push(fetchPromise);
  } else if (globallyAppliedDescriptiveRatings) {
    variable.metadata!.descriptiveRatings = globallyAppliedDescriptiveRatings;
    variable.metadata!.dropdownOptions = getOptionsFromDescriptiveRatings(globallyAppliedDescriptiveRatings, dataType);
  } else {
    const universalDescriptiveRatings = getUniversalDescriptiveRatings();
    variable.metadata!.descriptiveRatings = universalDescriptiveRatings;
    variable.metadata!.dropdownOptions = getOptionsFromDescriptiveRatings(universalDescriptiveRatings, dataType);
  }
}