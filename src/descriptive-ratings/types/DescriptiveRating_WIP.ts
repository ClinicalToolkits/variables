/*import { Database } from "@clinicaltoolkits/ct-supabase";
import { DataType, ObjectInfoConfig } from "@clinicaltoolkits/type-definitions";
import { defineModel, ModelInstance } from "@clinicaltoolkits/utility-functions";
import { ReactNode } from "react";

export type DescriptiveRatingData = {
    cutoffScore: number;
    descriptor: string;
    dataType: Database["public"]["Enums"]["data_type"];
};

const DESCRIPTIVE_RATING_DATA_KEYS: (keyof DescriptiveRatingData)[] = [
    "cutoffScore",
    "descriptor",
    "dataType",
];
const DESCRIPTIVE_RATING_MODEL_NAME = "DescriptiveRating";
const DESCRIPTIVE_RATING_MODE = "lax"; // TODO: switch to strict when object config is figured out


export interface IDescriptiveRatingFunctions {
    /** True if this rating applies to the provided score using >= semantics. *
    applies(score: number): boolean;
    /** Canonical option string for selects. *
    toOption(): string;
    /** Lightweight descriptor normalization (trim + single-space). *
    normalize(): DescriptiveRating;
}
export type DescriptiveRating = ModelInstance<DescriptiveRatingData, typeof DESCRIPTIVE_RATING_MODE, IDescriptiveRatingFunctions, typeof DESCRIPTIVE_RATING_MODEL_NAME>;

export const DescriptiveRatingModel = defineModel<DescriptiveRating>({
  name: DESCRIPTIVE_RATING_MODEL_NAME,
  mode: DESCRIPTIVE_RATING_MODE,
  immutable: true,
  allKeys: DESCRIPTIVE_RATING_DATA_KEYS,
  extras: {
    applies(this, score) {
      const c = this.getCutoffScore();
      return Number.isFinite(c) && score >= c;
    },
    toOption(this) {
      return this.getDescriptor();
    },
    normalize(this) {
      const d = this.getDescriptor().trim().replace(/\s+/g, " ");
      return d === this.getDescriptor() ? this : this.withDescriptor(d);
    },
  },
});

export const createDescriptiveRating = DescriptiveRatingModel.create;
export const isDescriptiveRating = DescriptiveRatingModel.is;

export const emptyDescriptiveRating = createDescriptiveRating({
    cutoffScore: 0,
    descriptor: "",
    dataType: DataType.UNKNOWN,
});

export const getDescriptiveRatingObjectConfig = (): ObjectInfoConfig<DescriptiveRating, ReactNode> => {
  return ([
    {
      id: "cutoffScore",
      propertyPath: "cutoffScore",
      displayName: "Cutoff Score",
      type: "number",
    },
    {
      id: "descriptor",
      propertyPath: "descriptor",
      displayName: "Descriptor",
      type: "text",
    },
    {
      id: "dataType",
      propertyPath: "dataType",
      displayName: "Data Type",
      type: "select",
      metadata: {
        options: Object.values(DataType).map(type => type),
      },
    },
  ])
};

export const getOptionsFromDescriptiveRatings = (descriptiveRatings?: DescriptiveRating[], dataType?: DataType): string[] | undefined => {
    if (!descriptiveRatings || !dataType) {
        return undefined;
    }

    return descriptiveRatings
        .filter((rating) => rating.getDataType() === dataType)
        .map((rating) => rating.toOption());

};
*/