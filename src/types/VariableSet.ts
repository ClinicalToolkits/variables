import { DescriptiveRating } from "../descriptive-ratings/types/DescriptiveRating";
import { VariableIdToken } from "./Variable";

export type VariableSetMetadataDB = {
  abbreviated_subversion?: string;
  descriptive_rating_id?: string;
  b_universally_accessible?: boolean;
}

export type VariableSetMetadata = {
  descriptiveRatingId?: string;
  descriptiveRatings?: DescriptiveRating[];
  bUniversallyAccessible?: boolean;
  abbreviatedSubversion?: string;
}

export type VariableSubgroup = {
  required?: string[];
  optional?: string[];
}

export type VariableIdsBySubgroup = {
  [subgroupTag: string]: VariableSubgroup;
}

export type VariableSetDB = {
  entity_version_id: string;
  entity_id: string;
  abbreviated_name: string;
  version?: number;
  subversion?: string;
  variable_ids: VariableIdsBySubgroup;
  metadata?: VariableSetMetadataDB;
}

export type VariableSet = {
  idToken: VariableIdToken;
  label: string;
  variableIds: {
    all: string[]; // Here, specifying 'all' separately
    subgroups: VariableIdsBySubgroup; // And here, the rest of the subgroup categorization
  };
  metadata?: VariableSetMetadata;
}
