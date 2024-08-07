import { Tag, generateUUID, convertStringToTag, tags as tagsRecord, CURLY_BRACE_ENCLOSURE } from "@clinicaltoolkits/type-definitions";
import { FetchVariablesParams } from "../fetchVariable";
import { getAbbreviatedVariablePlaceholder, getVariablePlaceholder } from "./getPlaceholders";
import { RegexRuleArray, applyRegexRules, batchApplyRegexRules, isEmptyValue, isStringArray } from "@clinicaltoolkits/utility-functions";
import { DBVariable, DBVariableMetadata, InterpretationData, Variable, VariableIdToken, VariableMetadata } from "../../types";
import { appendPrefixToVariablesRule, removePrefixesFromVariablesRule } from "../../utility";
import { AffixParams, cleanContentBlockData } from "@clinicaltoolkits/content-blocks";

const convertActionParamIds = (actionParams: { name: string, label?: string, [key: string]: any }, rules: RegexRuleArray): { name: string, [key: string]: any } => {
  return Object.entries(actionParams).reduce((acc, [key, value]) => {
    if (key === "ids" && isStringArray(value)) {
      acc[key] = batchApplyRegexRules(value, rules);
    } else {
      acc[key] = value;  // Preserve the original key-value pair
    }
    return acc;
  }, {} as { name: string, label?: string, [key: string]: any });
};

export function convertDBVariableToVariable(dbVariable: DBVariable, entityId?: string, entityVersionId?: string, labelPrefix?: string, variableSetParams?: FetchVariablesParams['variableSetParams']): Variable {
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
  const variableIdToken = new VariableIdToken({ variableId: id, entityId, entityVersionId });
  const affixParams: AffixParams = {
    inPrefixToApply: `${entityId}:${entityVersionId}`,
    inEnclosure: ['', ''],
  }

  const convertedVariable: Variable = {
    idToken: variableIdToken,
    value: metadata?.initialValue ?? undefined,
    fullName: full_name,
    abbreviatedName: abbreviated_name,
    label: labelPrefix || associated_entity_abbreviated_name ? `${labelPrefix || associated_entity_abbreviated_name} - ${full_name}` : full_name,
    variableSetId: variableSetParams?.idToken.id,
    tagIds: tag_ids,
    tags: tags,
    dataType: data_type,
    subgroupTag: convertStringToTag(subgroup_tag),
    orderWithinSet: order_within_set,
    metadata: {
      ...metadata,
      associatedCompositeVariableId: metadata?.associatedCompositeVariableId ? variableIdToken.cloneWithChanges({ variableId: metadata.associatedCompositeVariableId }).id : undefined,
      associatedSubvariableProperties: metadata?.associatedSubvariableIds?.map((subvarId: string) => ({
        id: variableIdToken.cloneWithChanges({ variableId: subvarId }).id,
        key: variableIdToken.cloneWithChanges({ variableId: subvarId }).id,
        fullName: "placeholder", // Must be set after the subvariable is created
        bValueEntered: false,
      })),
      placeholder: getVariablePlaceholder(data_type),
      abbreviatedPlaceholder: getAbbreviatedVariablePlaceholder(data_type),
      actionParams: metadata?.actionParams ? convertActionParamIds(metadata.actionParams, [appendPrefixToVariablesRule({ inPrefixToApply: `${entityId}:${entityVersionId}`, inEnclosure: ['', ''] })]) : undefined,
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

  if (variable.idToken !== undefined) dbVariable.id = isEmptyValue(variable.idToken.databaseId) ? generateUUID() : variable.idToken.databaseId;
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

  const affixParams: AffixParams = {
    inEnclosure: CURLY_BRACE_ENCLOSURE,
  }

  const metadataProperties: DBVariableMetadata = {
    description: getDBVariableMetadataProperty(metadata?.description), // TODO: Possibly deprecating this field
    descriptiveRatingId: getDBVariableMetadataProperty(metadata?.descriptiveRatingId),
    bNormallyDistributed: getDBVariableMetadataProperty(metadata?.bNormallyDistributed),
    visibility: getDBVariableMetadataProperty(metadata?.visibility),
    bCreatePercentileRank: getDBVariableMetadataProperty(metadata?.bCreatePercentileRank),
    bAutoCalculatePercentileRank: getDBVariableMetadataProperty(metadata?.bAutoCalculatePercentileRank),
    percentileRankVisibility: getDBVariableMetadataProperty(metadata?.percentileRankVisibility),
    bCreateDescriptiveRating: getDBVariableMetadataProperty(metadata?.bCreateDescriptiveRating),
    bAutoCalculateDescriptiveRating: getDBVariableMetadataProperty(metadata?.bAutoCalculateDescriptiveRating),
    descriptiveRatingVisibility: getDBVariableMetadataProperty(metadata?.descriptiveRatingVisibility),
    associatedCompositeVariableId: getDBVariableMetadataProperty(metadata?.associatedCompositeVariableId),
    associatedSubvariableIds: getDBVariableMetadataProperty(metadata?.associatedSubvariableIds),
    bOptional: getDBVariableMetadataProperty(metadata?.bOptional),
    bIncludeInDynamicTable: getDBVariableMetadataProperty(metadata?.bIncludeInDynamicTable),
    actionParams: metadata?.actionParams ? convertActionParamIds(metadata?.actionParams || {}, [removePrefixesFromVariablesRule(affixParams)]) : undefined,
  }

  return metadataProperties;
};

const getDBVariableMetadataProperty = (property: any) => {
  let bShouldAddProperty = !isEmptyValue(property);
  return bShouldAddProperty ? property : undefined;
}

/*
const parseInterpretationData = (data: Omit<InterpretationData, "bInterpretationDataType">, rules: RegexRuleArray): InterpretationData => {
  const transform = (input: Interpretation): Interpretation => {
    return Object.entries(input).reduce((acc, [key, value]) => {
      const newKey = applyRegexRules(key, rules);
      const newValue = applyRegexRules(value, rules);
      acc[newKey] = newValue;
      return acc;
    }, {} as Interpretation);
  };

  return {
    default: transform(data.default),
    intro: data.intro ? applyRegexRules(data.intro, rules) : undefined,
    ageGroups: data.ageGroups ? Object.fromEntries(
      Object.entries(data.ageGroups).map(([ageRange, interpretations]) => [
        applyRegexRules(ageRange, rules), // Transform the ageRange keys too
        transform(interpretations)
      ])
    ) : undefined,
    bInterpretationDataType: true,
  };
};

const parseInterpretationDataForDB = (data: InterpretationData | undefined | null): Omit<InterpretationData, "bInterpretationDataType"> | null => {
  if (!data) return null;
  const updatedData = parseInterpretationData(data, [removePrefixesFromVariablesRule({ inEnclosure: ['{', '}']})]);
  return {
    default: updatedData.default,
    intro: updatedData?.intro,
    ageGroups: updatedData.ageGroups,
  };
};
*/
/*

const parseInterpretationData = (inContentBlock: ContentBlock | undefined, entityId?: string, entityVersionId?: string, bInFetching?: boolean): ContentBlock | undefined => {
  if (!inContentBlock) return undefined;

  let prefix = "";
  if (entityId && entityVersionId) {
    prefix = `${entityId}:${entityVersionId}`;
  } else if (entityId) {
    prefix = entityId;
  } else if (entityVersionId) {
    prefix = entityVersionId;
  }

  let affixParams: AffixParams = { inEnclosure: ['{', '}'] };
  bInFetching ? affixParams.inPrefixToApply = prefix : affixParams.inPrefixToRemove = prefix;
  const regexRules = bInFetching ? [appendPrefixToVariablesRule(affixParams)] : [removePrefixesFromVariablesRule(affixParams)];

  return cleanContentBlockData({
    inContentBlock,
    inAffixParams: affixParams,
    inRegexRules: regexRules,
    bInFetching,
  });
};
*/
