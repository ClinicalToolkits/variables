import { UUID, DataType, Tag, InfoFieldConfig, ComboboxData, ObjectInfoConfig, Age, emptyTag } from "@clinicaltoolkits/type-definitions";
import { DBVariableMetadata, VariableMetadata, emptyVariableMetadata } from "./VariableMetadata";

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
  id: string;
  key: string;
  fullName: string;
  abbreviatedName: string;
  variableSetKey?: string;
  tagIds?: number[];
  tags?: Tag[];
  dataType: DataType;
  value: VariableValue;
  subgroupTag: Tag | null;
  orderWithinSet: number;
  metadata?: VariableMetadata | null;
  associatedEntityAbbreviatedName?: string;
}

export const emptyVariable: Variable = {
  id: "",
  key: "",
  fullName: "",
  abbreviatedName: "",
  variableSetKey: "",
  tagIds: [],
  dataType: DataType.UNKNOWN,
  value: "",
  subgroupTag: emptyTag,
  orderWithinSet: 0,
  metadata: emptyVariableMetadata,
  associatedEntityAbbreviatedName: "",
};

// Defines the configuration to be used when displaying the variable as an input element.
export const getVariableInputConfig = (size?: string): InfoFieldConfig<Variable> => ({ id: { path: "key" }, propertyPath: "value", displayName: { path: "fullName" }, type: { path: "dataType" }, metadata: { path: "metadata" }, props: { size } });

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
    { id: "13", propertyPath: "metadata.bHidden", displayName: "Hidden", type: "checkbox" },
    { id: "14", propertyPath: "metadata.bOptional", displayName: "Optional", type: "checkbox" },
    { id: "15", propertyPath: "metadata.bCreatePercentileRank", displayName: "Create Percentile Rank", type: "checkbox" },
    { id: "16", propertyPath: "metadata.bAutoCalculatePercentileRank", displayName: "Auto Calculate Percentile Rank", type: "checkbox" },
    { id: "17", propertyPath: "metadata.bHidePercentileRank", displayName: "Hide Percentile Rank", type: "checkbox" },
    { id: "18", propertyPath: "metadata.bCreateDescriptiveRating", displayName: "Create Descriptive Rating", type: "checkbox" },
    { id: "19", propertyPath: "metadata.bAutoCalculateDescriptiveRating", displayName: "Auto Calculate Descriptive Rating", type: "checkbox" },
    { id: "20", propertyPath: "metadata.bHideDescriptiveRating", displayName: "Hide Descriptive Rating", type: "checkbox" },
    { id: "21", propertyPath: "metadata.bIncludeInDynamicTable", displayName: "Include In Dynamic Table", type: "checkbox" },
  ]
);

export const variablePropertiesComboboxData: ComboboxData[] = [
  { id: "id", label: "ID" },
  { id: "key", label: "Key" },
  { id: "fullName", label: "Full Name" },
  { id: "abbreviatedName", label: "Abbreviated Name" },
  { id: "value", label: "Value" },
  { id: "metadata.description", label: "Description" },
  { id: "associatedEntityAbbreviatedName", label: "Associated Entity Abbreviated Name" },
];

export function convertVariablesToComboboxData(variables: Variable[]): ComboboxData[] {
  return variables.map(({ id, key, fullName, associatedEntityAbbreviatedName }) => {
    // Retrieve the subversion text using the variable key
    const subversionText = getVariableSubversionText(key);
    // Construct the label starting with associatedEntityAbbreviatedName if available
    let fullLabel = associatedEntityAbbreviatedName ? `${associatedEntityAbbreviatedName} - ` : '';
    // Add subversionText if it exists, otherwise skip to fullName
    fullLabel += subversionText ? `${subversionText} - ${fullName}` : fullName;

    return {
      id: key || id.toString(),
      label: fullLabel,
    };
  });
}

export function getVariableSubversionText(variableKey: string): string {
  const parts = variableKey.split("_");
  for (let i = 1; i < parts.length; i++) {
    if (parts[i].charAt(0) === parts[i].charAt(0).toUpperCase() && isNaN(parseInt(parts[i].charAt(0), 10))) {
      return parts[i];
    }
  }
  return '';
}

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
    bHidden: false,
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