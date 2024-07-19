import React from "react";
import { Text } from "@mantine/core";
import { UUID, DataType, Tag, InfoFieldConfig, ComboboxData, ObjectInfoConfig, Age, emptyTag, asUUID, ID_SEPERATOR, UniversalIdToken } from "@clinicaltoolkits/type-definitions";
import { DBVariableMetadata, VariableMetadata, emptyVariableMetadata } from "./VariableMetadata";
import { ContentBlock, ContentBlockEditor, convertBlocksToTipTapDoc } from "@clinicaltoolkits/content-blocks";
import { getVariableDescription } from "../utility/getVariableContent";
import { renderVariableTooltipContent } from "../contexts/variables/utility/child-variables/test";

export class VariableIdToken {
  variableId: string;
  entityId?: string;
  entityVersionId?: string;

  constructor(params: { variableId: string; entityId?: string; entityVersionId?: string }) {
    this.variableId = params.variableId;
    this.entityId = params.entityId;
    this.entityVersionId = params.entityVersionId;
  }

  cloneWithChanges(changes: Partial<{ variableId: string; entityId?: string; entityVersionId?: string }>): VariableIdToken {
    return new VariableIdToken({...this, ...changes});
  }

  get id(): string {
    return `${this.entityId}${ID_SEPERATOR}${this.entityVersionId}${ID_SEPERATOR}${this.variableId}`;
  }

  get databaseId(): UUID {
    return asUUID(this.variableId);
  }
}

export const getVariableIdAsString = (idToken: VariableIdToken): string => `${idToken.entityId}${ID_SEPERATOR}${idToken.entityVersionId}${ID_SEPERATOR}${idToken.variableId}`;
export const getVariableIdTokenFromString = (id: string): VariableIdToken => {
  const parts = id.split(`${ID_SEPERATOR}`);
  return new VariableIdToken({
    entityId: parts[0],
    entityVersionId: parts[1],
    variableId: parts[2],
  });
};
export const getVariableIdFromString = (id: string): string => id.split(`${ID_SEPERATOR}`)[2];
export const isVariableIdString = (id: string): boolean => id.split(`${ID_SEPERATOR}`).length === 3;

export interface DBVariable {
  id: UUID;
  //variable_set_tag: string;
  full_name: string;
  abbreviated_name: string;
  data_type: DataType;
  subgroup_tag?: string | null;
  order_within_set: number;
  metadata?: DBVariableMetadata | null;
  tag_ids?: number[];
  associated_entity_abbreviated_name?: string;
}

/**
 * A variable is a key-value pair that can be used to store data that will be used in the report.
 * @param {UUID} id - The unique UUID of the variable. Acts as a key for `variableMap`.
 * @param {string} key - The unique key of the variable. This is a combination of the variable's id and any subvariant specifiers it may have (e.g., `${variable.id}_percentile_rank` or `${variable.id}_${section.subversion}_descriptor"`, etc.).
 * @param {string} fullName - The full name of the variable.
 * @param {string} abbreviatedName - The abbreviated name of the variable.
 * @param {Tag} variableSetTag - The tag of the variable set that the variable belongs to.
 * @param {Tag[]} tags - Other general sorting/filtering tags associated with the variable.
 * @param {DataType} dataType - The data type of the variable (e.g., t_score, date, qualitative, etc.). Full list of data types can be found in `src/utility/enums/DataType.tsx`.
 * @param {VariableValue} value - The current value of the variable. Starts off as an empty string.
 * @param {VariableMetadata | null} metadata - The metadata of the variable, can be left null in the database so must check before use.
 */
export interface Variable {
  idToken: VariableIdToken;
  fullName: string;
  abbreviatedName: string;
  label: string;
  variableSetId?: string;
  tagIds?: number[];
  tags?: Tag[];
  dataType: DataType;
  value: VariableValue;
  subgroupTag: Tag | null;
  orderWithinSet: number;
  content?: VariableContent | null;
  metadata?: VariableMetadata | null;
  associatedEntityAbbreviatedName?: string;
}
export const getVariableFullName = (variable: Variable): string => variable.fullName;
export const getVariableValue = (variable: Variable): VariableValue => variable.value;
export const getVariableMetadata = (variable: Variable): VariableMetadata | null | undefined => variable.metadata;
export const emptyVariable: Variable = {
  idToken: new VariableIdToken({ variableId: "", entityId: "", entityVersionId: "" }),
  fullName: "",
  abbreviatedName: "",
  label: "",
  variableSetId: "",
  tagIds: [],
  dataType: DataType.UNKNOWN,
  value: "",
  subgroupTag: emptyTag,
  orderWithinSet: 0,
  metadata: emptyVariableMetadata,
  associatedEntityAbbreviatedName: "",
};

export const getTooltipContentFromVariable = (item?: Variable): React.ReactNode => {
  const descriptionContent = item ? getVariableDescription(item) : [];
  const tipTapContent = convertBlocksToTipTapDoc(descriptionContent);
  console.log("descriptionContent: ", tipTapContent);
  return (
    <ContentBlockEditor content={ tipTapContent } />
  );
};

// Defines the configuration to be used when displaying the variable as an input element.
export const getVariableInputConfig = (size?: string, mapTest?: Map<string | number, Variable>): InfoFieldConfig<Variable> => {
  return (
    {
      id: { path: "idToken.id" },
      propertyPath: "value",
      displayName: { path: "fullName" },
      type: { path: "dataType" },
      metadata: { path: "metadata" },
      props: { size },
      tooltipContent: (item?: Variable) => item && renderVariableTooltipContent(item, mapTest),
    }
  )
};

// Defines the configuration to be used when displaying a single variable as a form (e.g., for editing it's properties and/or creating new variables).
export const getVariableObjectConfig = (tagsComboboxData: ComboboxData[], entitiesComboboxData: ComboboxData[], descriptiveRatingSetComboxData: ComboboxData[], variablesComboboxData: ComboboxData[]): ObjectInfoConfig<Variable> => (
  [
    { id: "0", propertyPath: "fullName", displayName: "Full Name", type: "text" },
    { id: "1", propertyPath: "abbreviatedName", displayName: "Abbreviated Name", type: "text" },
    { id: "2", propertyPath: "dataType", displayName: "Data Type", type: "select", metadata: { options: Object.values(DataType).map(type => type) } },
    { id: "4", propertyPath: "subgroupTag.id", displayName: "Subgroup Tag", type: "select", metadata: { options: tagsComboboxData } },
    { id: "5", propertyPath: "orderWithinSet", displayName: "Order Within Set", type: "number" },
    { id: "6", propertyPath: "tagIds", displayName: "Tag IDs", type: "multiSelect", metadata: { options: tagsComboboxData } },
    { id: "7", propertyPath: "associatedEntityAbbreviatedName", displayName: "Associated Entity Abbreviated Name", type: "select",  metadata: { options: entitiesComboboxData } },
    { id: "8", propertyPath: "metadata.description", displayName: "Description", type: "textArea" },
    { id: "9", propertyPath: "metadata.descriptiveRatingId", displayName: "Descriptive Ratings", type: "select",  metadata: { options: descriptiveRatingSetComboxData } },
    { id: "10", propertyPath: "metadata.associatedCompositeVariableId", displayName: "Associated Composite Variable", type: "select",  metadata: { options: variablesComboboxData } },
    { id: "11", propertyPath: "metadata.associatedSubvariableIds", displayName: "Associated Subvariables", type: "multiSelect",  metadata: { options: variablesComboboxData } },
    { id: "12", propertyPath: "metadata.bNormallyDistributed", displayName: "Normally Distributed", type: "checkbox" },
    { id: "13", propertyPath: "metadata.visibility", displayName: "Visibility", type: "checkbox" },
    { id: "14", propertyPath: "metadata.bOptional", displayName: "Optional", type: "checkbox" },
    { id: "15", propertyPath: "metadata.bCreatePercentileRank", displayName: "Create Percentile Rank", type: "checkbox" },
    { id: "16", propertyPath: "metadata.bAutoCalculatePercentileRank", displayName: "Auto Calculate Percentile Rank", type: "checkbox" },
    { id: "17", propertyPath: "metadata.percentileRankVisibility", displayName: "Percentile Rank Visibility", type: "checkbox" },
    { id: "18", propertyPath: "metadata.bCreateDescriptiveRating", displayName: "Create Descriptive Rating", type: "checkbox" },
    { id: "19", propertyPath: "metadata.bAutoCalculateDescriptiveRating", displayName: "Auto Calculate Descriptive Rating", type: "checkbox" },
    { id: "20", propertyPath: "metadata.descriptiveRatingVisibility", displayName: "Descriptive Rating Visibility", type: "checkbox" },
    { id: "21", propertyPath: "metadata.bIncludeInDynamicTable", displayName: "Include In Dynamic Table", type: "checkbox" },
  ]
);

export const variablePropertiesComboboxData: ComboboxData[] = [
  { id: "idToken.id", label: "ID" },
  { id: "key", label: "Key" },
  { id: "fullName", label: "Full Name" },
  { id: "abbreviatedName", label: "Abbreviated Name" },
  { id: "value", label: "Value" },
  { id: "metadata.description", label: "Description" },
  { id: "associatedEntityAbbreviatedName", label: "Associated Entity Abbreviated Name" },
];

export function convertVariablesToComboboxData(variables: Variable[]): ComboboxData[] {
  return variables.map(({ idToken, label }) => {
    return {
      id: idToken.id,
      label: label,
    };
  });
}

export interface VariableContent {
  [key: string]: ContentBlock[];
}

// Takes in an array of property names and a variable object and returns an array of content blocks whereby each block is a value from content corresponding to the property path. // TODO: Needs updating, not currently used.
/*export const getVariableContent = (variable: Variable, propertyPaths: string[]): ContentBlock[] => {
  const contentBlocks: ContentBlock[] = [];
  for (const propertyPath of propertyPaths) {
    const content = variable.content;
    if (!content) continue;
    const contentBlock = content[propertyPath];
    if (contentBlock) contentBlocks.push(contentBlock);
  }
  return contentBlocks;
};*/

/*
export function getVariableSubversionText(variableKey: string): string {
  const parts = variableKey.split("_");
  for (let i = 1; i < parts.length; i++) {
    if (parts[i].charAt(0) === parts[i].charAt(0).toUpperCase() && isNaN(parseInt(parts[i].charAt(0), 10))) {
      return parts[i];
    }
  }
  return '';
}
*/

/* CLASS BASED APPROACH
type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

function createDefaultObject<T>(type: { new(): T }): DeepPartial<T> {
  return new type();
}

class VariableClass {
  id: string = "";
  key: string = "";
  fullName: string = "";
  abbreviatedName: string = "";
  variableSetKey: string = "";
  tagIds: number[] = [];
  tags: Tag[] = [];
  dataType: DataType = DataType.UNKNOWN;
  value: VariableValue = "";
  subgroupTag: Tag | null = null;
  orderWithinSet: number = 0;
  metadata: VariableMetadata | null = emptyVariableMetadata;
  associatedEntityAbbreviatedName: string = "";
}

const variable = createDefaultObject(VariableClass);
*/

/*const emptyVariable: Variable = {
  id: generateUUID(),
  key: '',
  fullName: '',
  abbreviatedName: '',
  variableSetKey: '',
  tagIds: [],
  dataType: DataType.UNKNOWN,
  value: '',
  subgroupTag: null,
  orderWithinSet: 0,
  metadata: {
    bNormallyDistributed: false,
    bCreatePercentileRank: false,
    bHidePercentileRank: false,
    bAutoCalculatePercentileRank: false,
    bCreateDescriptiveRating: false,
    bHideDescriptiveRating: false,
    bAutoCalculateDescriptiveRating: false,
  },
  associatedEntityAbbreviatedName: undefined,
};*/


// Defines the value types that can be stored in a variable.
export type VariableValue = string | number | boolean | Age | null | undefined;

/**
 * A variable map is a map of variables. It uses the unique UUID of the variable as the key and the variable object as the value.
 * @param {string} key - The unique string of the variable (i.e., `variable.key`).
 * @param {Variable} value - The variable object.
 */
export type VariableMap = Map<string, Variable>;