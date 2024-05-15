import { DataType, ObjectInfoConfig } from "@clinicaltoolkits/type-definitions";

export interface DescriptiveRating {
  cutoffScore: number;
  descriptor: string;
  dataType: DataType;
}

export const emptyDescriptiveRating: DescriptiveRating = {
    cutoffScore: 0,
    descriptor: "",
    dataType: DataType.UNKNOWN,
}

export const getDescriptiveRatingObjectConfig = (): ObjectInfoConfig<DescriptiveRating> => {
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
}

export type DescriptiveRatingSet = {
  id: string;
  fullName: string;
  ratings: DescriptiveRating[];
}

export const emptyDescriptiveRatingSet: DescriptiveRatingSet = {
  id: "",
  fullName: "",
  ratings: [emptyDescriptiveRating],
}

export const getOptionsFromDescriptiveRatings = (descriptiveRatings?: DescriptiveRating[], dataType?: DataType): string[] | undefined => {
  if (!descriptiveRatings || !dataType) {
    return undefined;
  }

  return descriptiveRatings
    .filter((rating) => rating.dataType === dataType)
    .map((rating) => rating.descriptor);
}
