import { Age, AgeRangeString, ComboboxData, RowType } from "@clinicaltoolkits/type-definitions";
import { DescriptiveRating } from "../descriptive-ratings/types/DescriptiveRating";
import { VariableIdToken, VariableMap } from "./Variable";
import { evaluateLogicalExpression, parseLogicalExpression } from "@clinicaltoolkits/utility-functions";
import { getVariablePropertyFromKeyPath } from "../contexts";
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
    parentVariableId: string;
  };
  sectionSubversion?: string;
  supportedSubversions?: string[];
  ageCutoff?: AgeRangeString;
}

export interface DBVariableMetadata {
  description?: string;
  interpretationData?: Omit<InterpretationData, "bInterpretationDataType"> | null;
  descriptiveRatingId?: string;
  bNormallyDistributed?: boolean;
  bHidden?: boolean;
  bCreatePercentileRank?: boolean;
  bAutoCalculatePercentileRank?: boolean;
  bHidePercentileRank?: boolean;
  bCreatePercentileRange?: boolean;
  bHidePercentileRange?: boolean;
  bCreateDescriptiveRating?: boolean;
  bAutoCalculateDescriptiveRating?: boolean;
  bHideDescriptiveRating?: boolean;
  bCreatePreviousScore?: boolean;
  bHidePreviousScore?: boolean;
  associatedCompositeVariableId?: string;
  associatedSubvariableIds?: string[];
  bOptional?: boolean;
  bIncludeInDynamicTable?: boolean;
  bIncludeInTableFooter?: boolean;
  tableRowType?: RowType;
  actionParams?: {
    name: string;
    label?: string;
    [key: string]: any
  };
  initialValue?: string;
  bOptionsMenu?: boolean;
}

export const emptyVariableMetadata: VariableMetadata = {
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
  bIncludeInTableFooter: false,
  tableRowType: RowType.DEFAULT,
};

/**
 * The metadata of a variable.
 * @param {string} label - The label of the variable.
 * @param {string[]} childVariableKeys - The unique strings for any dependent child variables of the parent variable (e.g., strings for the descriptor/percentile variables that are calculated based on the parent).
 * @param {boolean} bHidden - Whether the variable is hidden or not.
 * @param {VariableMetadataProperties} properties - Holds various properties for the variable that helps programs determine how it should be used.
 */
export interface VariableMetadata extends Omit<DBVariableMetadata, "associatedCompositeVariableId" | "interpretationData"> {
  label?: string;
  childVariableIds?: string[];
  interpretation?: string;
  interpretationData?: InterpretationData;
  descriptiveRatings?: DescriptiveRating[];
  properties?: VariableMetadataProperties;
  dropdownOptions?: string[];
  associatedCompositeVariableId?: string;
  associatedSubvariableProperties?: AssociatedSubvariableProperties[];
  bChild?: boolean;
  placeholder?: string;
  abbreviatedPlaceholder?: string;
  //variableSetID?: string; // TODO: Determine if this would be better set up as a Map<string, string[]> on the VariableContext.
}

export interface AssociatedSubvariableProperties {
  id: string;
  fullName: string;
  bValueEntered: boolean;
}

export interface Interpretation {
  [key: string]: string;
}

export type InterpretationData = {
  default: Interpretation;
  intro?: string;
  ageGroups?: { [ageRange: string]: Interpretation };
  bInterpretationDataType: true;
};

export const isInterpretationData = (data: any): data is InterpretationData => {
  return data?.bInterpretationDataType === true;
}

const findVariableInterpretationAgeGroup = (interpretationData: InterpretationData, age: number): string | undefined => {
  if (!interpretationData.ageGroups) return undefined;

  return Object.keys(interpretationData.ageGroups).find(ageRange => {
      const [minAge, maxAge] = ageRange.split('-').map(Number);
      return age >= minAge && age <= maxAge;
  });
}

export const getVariableInterpretation = (value: string, interpretationData: InterpretationData, age?: number): string => {
  const intro = interpretationData.intro;
  let interpretation = "No interpretation available for this value.";
  const ageGroup = age ? findVariableInterpretationAgeGroup(interpretationData, age) : undefined;
  const interpretationGroup = ageGroup ? interpretationData.ageGroups![ageGroup] : interpretationData.default;

  for (const condition of Object.keys(interpretationGroup)) {
    const logicalExpression = parseLogicalExpression(condition);
    const bLogicalExpressionResult = evaluateLogicalExpression({
      objectMap: new Map<string, any>(),
      expressions: logicalExpression,
      getValueFromObject: () => value,
    })
    if (bLogicalExpressionResult) {
      interpretation = interpretationGroup[condition];
      break;
    }
  }

  if (intro && interpretation !== "No interpretation available for this value.") {
    interpretation = `${intro} ${interpretation}`;
  }

  return interpretation;
}