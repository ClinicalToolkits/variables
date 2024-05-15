import { abbreviateString, createLabel } from "@clinicaltoolkits/utility-functions";
import { createVariableSet } from "./createVariableSet";
import { VariableSetDB, VariableSet, VariableSetMetadataDB, VariableSetMetadata } from "../../types";

export function convertVariableSetDBToVariableSet(variableSetDB: VariableSetDB): VariableSet {
  const variableSet = createVariableSet({
    id: variableSetDB.entity_version_id,
    entityId: variableSetDB.entity_id,
    abbreviatedName: variableSetDB.abbreviated_name,
    version: variableSetDB.version,
    subversion: variableSetDB.subversion,
    variableIds: variableSetDB.variable_ids,
    metadata: {
      label: createLabel({ abbreviatedName: variableSetDB.abbreviated_name, version: variableSetDB.version, subversion: variableSetDB.subversion ? abbreviateString(variableSetDB.subversion) : undefined }),
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

export function convertDBVariableSubsetArrayToVariableSubsetArray(dbVariableSubsetArray: VariableSetDB[]): VariableSet[] {
  return dbVariableSubsetArray.map(convertVariableSetDBToVariableSet);
};