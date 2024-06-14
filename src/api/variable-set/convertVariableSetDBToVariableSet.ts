import { abbreviateString, createLabel } from "@clinicaltoolkits/utility-functions";
import { createVariableSet } from "./createVariableSet";
import { VariableSetDB, VariableSet, VariableSetMetadataDB, VariableSetMetadata, VariableIdToken } from "../../types";

interface CreateVariableSetDBLabelParams {
  abbreviatedName: string;
  version?: number;
  subversion?: string;
  abbreviatedSubversion?: string;
}
export function createVariableSetLabel(variableSetDBOrParams: VariableSetDB): string;
export function createVariableSetLabel(variableSetDBOrParams: CreateVariableSetDBLabelParams): string;
export function createVariableSetLabel(variableSetDBOrParams: VariableSetDB | CreateVariableSetDBLabelParams): string {
  const { abbreviated_name, version, subversion, metadata } = variableSetDBOrParams as VariableSetDB;
  const { abbreviatedName, version: versionParam, subversion: subversionParam, abbreviatedSubversion: abbreviatedSubversionParam } = variableSetDBOrParams as CreateVariableSetDBLabelParams;
  return createLabel({ abbreviatedName: abbreviatedName || abbreviated_name, version: version || versionParam, subversion: metadata?.abbreviated_subversion ? metadata.abbreviated_subversion : abbreviatedSubversionParam ? abbreviatedSubversionParam : subversion ? abbreviateString(subversion) : subversionParam ? abbreviateString(subversionParam) : undefined});
}

export function convertVariableSetDBToVariableSet(variableSetDB: VariableSetDB): VariableSet {
  const variableSet = createVariableSet({
    idToken: new VariableIdToken({ variableId: variableSetDB.entity_version_id, entityId: variableSetDB.entity_id, entityVersionId: variableSetDB.entity_version_id }),
    label: createVariableSetLabel(variableSetDB),
    variableIds: variableSetDB.variable_ids,
    metadata: {
      descriptiveRatingId: variableSetDB?.metadata?.descriptive_rating_id,
      bUniversallyAccessible: variableSetDB?.metadata?.b_universally_accessible,
    },
  })
  
  return variableSet;
}

export const convertVariableSetMetadataDBToVariableSetMetadata = (variableSetMetadataDB: VariableSetMetadataDB): VariableSetMetadata => {
  return {
    descriptiveRatingId: variableSetMetadataDB.descriptive_rating_id,
    bUniversallyAccessible: variableSetMetadataDB.b_universally_accessible,
  }
}

export function convertDBVariableSetArrayToVariableSetArray(dbVariableSetArray: VariableSetDB[]): VariableSet[] {
  return dbVariableSetArray.map(convertVariableSetDBToVariableSet);
};