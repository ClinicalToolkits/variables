import { Tag, asUUID, generateUUID, convertStringToTag, tags as tagsRecord } from "@clinicaltoolkits/type-definitions";
import { FetchVariablesParams } from "../fetchVariable";
import { getAbbreviatedVariablePlaceholder, getVariablePlaceholder } from "./getPlaceholders";
import { isEmptyValue } from "@clinicaltoolkits/utility-functions";
import { DBVariable, DBVariableMetadata, Variable, VariableMetadata } from "../../types";

export function convertDBVariableToVariable(dbVariable: DBVariable, uniqueSuffix?: string, variableSetParams?: FetchVariablesParams['variableSetParams']): Variable {
  const {
    id,
    full_name,
    abbreviated_name,
    data_type,
    subgroup_tag,
    tag_ids,
    order_within_set,
    metadata,
    associated_entity_abbreviated_name,
  } = dbVariable;

  const tags: Tag[] = tag_ids?.map((tagId) => tagsRecord[tagId]) ?? [];

  const convertedVariable: Variable = {
    id: id,
    key: uniqueSuffix ? `${id}_${uniqueSuffix}` : id,
    value: undefined,
    fullName: full_name,
    abbreviatedName: abbreviated_name,
    variableSetKey: variableSetParams?.key,
    tagIds: tag_ids,
    tags: tags,
    dataType: data_type,
    subgroupTag: convertStringToTag(subgroup_tag),
    orderWithinSet: order_within_set,
    metadata: {
      ...metadata,
      properties: variableSetParams?.subversion ? {
        sectionSubversion: variableSetParams.subversion,
      } : undefined,
      associatedCompositeVariableKey: metadata?.associatedCompositeVariableId ? uniqueSuffix ? `${metadata.associatedCompositeVariableId}_${uniqueSuffix}` : metadata.associatedCompositeVariableId : undefined,
      associatedSubvariableProperties: metadata?.associatedSubvariableIds?.map((subvarId: string) => ({
        id: subvarId,
        key: uniqueSuffix ? `${subvarId}_${uniqueSuffix}` : subvarId,
        fullName: "placeholder", // Must be set after the subvariable is created
        bValueEntered: false,
      })),
      placeholder: getVariablePlaceholder(data_type),
      abbreviatedPlaceholder: getAbbreviatedVariablePlaceholder(data_type),
    },
    associatedEntityAbbreviatedName: associated_entity_abbreviated_name,
  }

  return convertedVariable;
};

export function convertVariableToDBVariable(variable: Variable): DBVariable {
  let dbVariable: Partial<DBVariable> = convertVariablePropertiesToDB(variable);

  // Given that a full variable object is passed in, we can assume that all properties are defined and explicitly cast to DBVariable
  return dbVariable as DBVariable;
}

export function convertVariablePropertiesToDB(variable: Partial<Variable>): Partial<DBVariable> {
  let dbVariable: Partial<DBVariable> = {};

  if (variable.id !== undefined) dbVariable.id = isEmptyValue(variable.id) ? generateUUID() : asUUID(variable.id);
  if (variable.fullName !== undefined) dbVariable.full_name = variable.fullName;
  if (variable.abbreviatedName !== undefined) dbVariable.abbreviated_name = variable.abbreviatedName;
  if (variable.dataType !== undefined) dbVariable.data_type = variable.dataType;
  if (variable.subgroupTag?.name !== undefined) dbVariable.subgroup_tag = variable.subgroupTag.name; // Assuming subgroupTag is an object with a 'name' field
  if (variable.tagIds !== undefined) dbVariable.tag_ids = variable.tagIds;
  if (variable.orderWithinSet !== undefined) dbVariable.order_within_set = variable.orderWithinSet;
  if (variable.metadata !== undefined) dbVariable.metadata = getDBVariableMetadataProperties(variable.metadata);
  if (variable.associatedEntityAbbreviatedName !== undefined) dbVariable.associated_entity_abbreviated_name = variable.associatedEntityAbbreviatedName;

  // Ensure all conversions are applied
  // Note: This function assumes that each field of `Variable` has a direct or computed mapping to `DBVariable`
  // Adjust any field mapping logic as necessary to match your specific data structure and requirements
  
  return dbVariable as DBVariable; // Explicit cast to DBVariable
}

const getDBVariableMetadataProperties = (metadata?: VariableMetadata | null): DBVariableMetadata | undefined => {
  if (isEmptyValue(metadata)) return undefined;

  const metadataProperties: DBVariableMetadata = {
    description: getDBVariableMetadataProperty(metadata?.description),
    descriptiveRatingId: getDBVariableMetadataProperty(metadata?.descriptiveRatingId),
    bNormallyDistributed: getDBVariableMetadataProperty(metadata?.bNormallyDistributed),
    bHidden: getDBVariableMetadataProperty(metadata?.bHidden),
    bCreatePercentileRank: getDBVariableMetadataProperty(metadata?.bCreatePercentileRank),
    bAutoCalculatePercentileRank: getDBVariableMetadataProperty(metadata?.bAutoCalculatePercentileRank),
    bHidePercentileRank: getDBVariableMetadataProperty(metadata?.bHidePercentileRank),
    bCreateDescriptiveRating: getDBVariableMetadataProperty(metadata?.bCreateDescriptiveRating),
    bAutoCalculateDescriptiveRating: getDBVariableMetadataProperty(metadata?.bAutoCalculateDescriptiveRating),
    bHideDescriptiveRating: getDBVariableMetadataProperty(metadata?.bHideDescriptiveRating),
    associatedCompositeVariableId: getDBVariableMetadataProperty(metadata?.associatedCompositeVariableId),
    associatedSubvariableIds: getDBVariableMetadataProperty(metadata?.associatedSubvariableIds),
    bOptional: getDBVariableMetadataProperty(metadata?.bOptional),
    bIncludeInDynamicTable: getDBVariableMetadataProperty(metadata?.bIncludeInDynamicTable),
  }

  return metadataProperties;
};

const getDBVariableMetadataProperty = (property: any) => {
  let bShouldAddProperty = !isEmptyValue(property);
  return bShouldAddProperty ? property : undefined;
}
