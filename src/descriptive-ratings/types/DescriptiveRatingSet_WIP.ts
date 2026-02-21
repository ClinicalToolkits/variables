/*
import { DataType } from "@clinicaltoolkits/type-definitions";
import { defineModel, ModelInstance } from "@clinicaltoolkits/utility-functions";
import { Database } from "@clinicaltoolkits/ct-supabase";

export type DescriptiveRatingSetData = Database["report_generator"]["Tables"]["descriptive_rating_sets"]["Row"];

const DESCRIPTIVE_RATING_SET_DATA_KEYS: (keyof DescriptiveRatingSetData)[] = [
    "id",
    "full_name",
    "ratings"
];
const DESCRIPTIVE_RATING_SET_MODEL_NAME = "DescriptiveRating";
const DESCRIPTIVE_RATING_SET_MODE = "lax"; // TODO: switch to strict when object config is figured out


export interface IDescriptiveRatingSetFunctions {
    /** Return ratings for a given DataType, sorted by cutoffScore ascending. *
    ratingsByType(type: DataType): DescriptiveRatingSetData["ratings"];
    /** Find the "best match" descriptor for a score within a given DataType. *
    describeScore(score: number, type: DataType): string | undefined;
    /** Convenience: strings for a select (unique, stable order). *
    toOptions(type?: DataType): string[];
}
export type DescriptiveRatingSet = ModelInstance<DescriptiveRatingSetData, typeof DESCRIPTIVE_RATING_SET_MODE, IDescriptiveRatingSetFunctions, typeof DESCRIPTIVE_RATING_SET_MODEL_NAME>;

export const DescriptiveRatingModel = defineModel<DescriptiveRatingSet>({
  name: DESCRIPTIVE_RATING_SET_MODEL_NAME,
  mode: DESCRIPTIVE_RATING_SET_MODE,
  immutable: true,
  allKeys: DESCRIPTIVE_RATING_SET_DATA_KEYS,
  extras: {
    ratingsByType(type) {
        const ratings = this.getRatings();
        return ratings
            .filter((rating) => rating.dataType === type)
            .sort((a, b) => a.cutoffScore - b.cutoffScore);
  },
});

export const createDescriptiveRating = DescriptiveRatingModel.create;
export const isDescriptiveRating = DescriptiveRatingModel.is;
*/