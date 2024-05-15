import { DescriptiveRating } from "../descriptive-ratings/types/DescriptiveRating";

export type VariableSetMetadataDB = {
  descriptive_rating_id?: string;
  b_universally_accessible?: boolean;
}

export type VariableSetMetadata = {
  label?: string;
  descriptiveRatingId?: string;
  descriptiveRatings?: DescriptiveRating[];
  bUniversallyAccessible?: boolean;
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
  id: string;
  entityId: string;
  key: string;
  abbreviatedName: string;
  version?: number;
  subversion?: string;
  variableIds: {
    all: string[]; // Here, specifying 'all' separately
    subgroups: VariableIdsBySubgroup; // And here, the rest of the subgroup categorization
  };
  variableKeys: {
    all: string[]; // Doing the same for variableKeys
    subgroups: VariableIdsBySubgroup;
  };
  metadata?: VariableSetMetadata;
}
