import { Age, AgeRangeString } from "@clinicaltoolkits/type-definitions";
import { DescriptiveRating } from "../descriptive-ratings/types/DescriptiveRating";
// TODO: A large swath of these properties are not being used. We should consider removing them.
export interface VersionProperties {
  ageCutoff?: {
    maxAge: Age;
    minAge: Age;
  };
}

export interface VariableMetadataProperties {
  //versions?: Record<string, VersionProperties>;
  childVariable?: {
    parentVariableKey: string;
  };
  sectionSubversion?: string;
  supportedSubversions?: string[];
  ageCutoff?: AgeRangeString;
}

export interface DBVariableMetadata {
  description?: string;
  descriptiveRatingId?: string;
  bNormallyDistributed?: boolean;
  bHidden?: boolean;
  bCreatePercentileRank?: boolean;
  bAutoCalculatePercentileRank?: boolean;
  bHidePercentileRank?: boolean;
  bCreateDescriptiveRating?: boolean;
  bAutoCalculateDescriptiveRating?: boolean;
  bHideDescriptiveRating?: boolean;
  associatedCompositeVariableId?: string;
  associatedSubvariableIds?: string[];
  bOptional?: boolean;
  bIncludeInDynamicTable?: boolean;
}

export const emptyVariableMetadata: DBVariableMetadata = {
  description: "",
  descriptiveRatingId: "",
  bNormallyDistributed: true,
  bHidden: false,
  bCreatePercentileRank: false,
  bAutoCalculatePercentileRank: false,
  bHidePercentileRank: false,
  bCreateDescriptiveRating: false,
  bAutoCalculateDescriptiveRating: false,
  bHideDescriptiveRating: false,
  associatedCompositeVariableId: "",
  associatedSubvariableIds: [],
  bOptional: false,
  bIncludeInDynamicTable: false,
};

/**
 * The metadata of a variable.
 * @param {string} label - The label of the variable.
 * @param {string[]} childVariableKeys - The unique strings for any dependent child variables of the parent variable (e.g., strings for the descriptor/percentile variables that are calculated based on the parent).
 * @param {boolean} bHidden - Whether the variable is hidden or not.
 * @param {VariableMetadataProperties} properties - Holds various properties for the variable that helps programs determine how it should be used.
 */
export interface VariableMetadata extends DBVariableMetadata {
  label?: string;
  childVariableKeys?: string[];

  descriptiveRatings?: DescriptiveRating[];
  properties?: VariableMetadataProperties;
  dropdownOptions?: string[];
  associatedCompositeVariableKey?: string;
  associatedSubvariableProperties?: AssociatedSubvariableProperties[];
  bChild?: boolean;
  placeholder?: string;
  abbreviatedPlaceholder?: string;
  //variableSetID?: string; // TODO: Determine if this would be better set up as a Map<string, string[]> on the VariableContext.
}

export interface AssociatedSubvariableProperties {
  id: string;
  key: string;
  fullName: string;
  bValueEntered: boolean;
}
