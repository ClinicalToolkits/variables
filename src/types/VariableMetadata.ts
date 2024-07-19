import { Age, AgeRangeString, PathsToFields, RowType, Visibility } from "@clinicaltoolkits/type-definitions";
import { DescriptiveRating } from "../descriptive-ratings/types/DescriptiveRating";
import { ContentBlock, getTextFromContentBlock } from "@clinicaltoolkits/content-blocks";
import { Variable } from "./Variable";

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
  interpretationBlock?: ContentBlock | null;
  descriptiveRatingId?: string;
  bNormallyDistributed?: boolean;
  visibility?: Visibility;
  bCreatePercentileRank?: boolean;
  bAutoCalculatePercentileRank?: boolean;
  percentileRankVisibility?: Visibility;
  bCreatePercentileRange?: boolean;
  percentileRangeVisibility?: Visibility;
  bCreateDescriptiveRating?: boolean;
  bAutoCalculateDescriptiveRating?: boolean;
  descriptiveRatingVisibility?: Visibility;
  bCreatePreviousScore?: boolean;
  previousScoreVisibility?: Visibility;
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
  visibility: Visibility.VISIBLE,
  bCreatePercentileRank: false,
  bAutoCalculatePercentileRank: false,
  percentileRankVisibility: Visibility.VISIBLE,
  bCreateDescriptiveRating: false,
  bAutoCalculateDescriptiveRating: false,
  descriptiveRatingVisibility: Visibility.VISIBLE,
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
 * @param {VariableMetadataProperties} properties - Holds various properties for the variable that helps programs determine how it should be used.
 */
export interface VariableMetadata extends Omit<DBVariableMetadata, "associatedCompositeVariableId"> {
  label?: string;
  childVariableIds?: string[];
  interpretation?: string;
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

export const getChildVariableIds = (inVariable: Variable): string[] => {
  return inVariable?.metadata?.childVariableIds || [];
};

export interface AssociatedSubvariableProperties {
  id: string;
  fullName: string;
  bValueEntered: boolean;
}

export type InterpretationData = {
  contentBlock: ContentBlock;
};

export const getVariableInterpretation = (value: string, interpretationBlock: ContentBlock, age?: number): string => {
  const interpretationText = getTextFromContentBlock(interpretationBlock, false, new Map<string, any>(), () => value, () => true) || "No interpretation available for this variable's value.";
  return interpretationText;

  /*
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
  */
};

/*
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
*/
