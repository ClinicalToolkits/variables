
import { DataType, generateUUID } from "@clinicaltoolkits/type-definitions";
import { getAbbreviatedVariablePlaceholder, getVariablePlaceholder } from "./getPlaceholders";
import { Variable } from "../../types";

// Function to initialize metadata and childVariableKeys if they are not present
export function initializeVariableMetadata(variable: Variable) {
  if (variable.metadata === null || variable.metadata === undefined) {
    variable.metadata = {};
  }

  if (!variable.metadata.childVariableKeys) {
    variable.metadata.childVariableKeys = [];
  }
}

// Function to create a base variable template
function createBaseVariableTemplate(variable: Variable) {
  return {
    ...variable,
    metadata: { label: variable.metadata?.label },
  };
}

// Function to create the percentile rank variable
export function createPercentileRankVariable(parentVariable: Variable): Variable {
  const childKey = `${parentVariable.key}_percentile_rank`;

  // Initialize metadata and childVariableKeys
  initializeVariableMetadata(parentVariable);
  parentVariable.metadata?.childVariableKeys?.push(childKey);

  const newVariableTemplate = createBaseVariableTemplate(parentVariable);

  return {
    ...newVariableTemplate,
    id: generateUUID(),
    key: childKey,
    fullName: `${parentVariable.fullName} Percentile Rank`,
    abbreviatedName: `${parentVariable.abbreviatedName}_percentile_rank`,
    dataType: DataType.PERCENTILE_RANK,
    metadata: {
      label: `${parentVariable.metadata?.label}`,
      bHidden: parentVariable.metadata?.bHidePercentileRank,
      bOptional: parentVariable.metadata?.bOptional,
      bNormallyDistributed: parentVariable.metadata?.bNormallyDistributed,
      properties: {
        childVariable: {
          parentVariableKey: parentVariable.key,
        },
        sectionSubversion: parentVariable.metadata?.properties?.sectionSubversion,
      },
      placeholder: getVariablePlaceholder(DataType.PERCENTILE_RANK),
      abbreviatedPlaceholder: getAbbreviatedVariablePlaceholder(DataType.PERCENTILE_RANK),
      bChild: true,
    },
  };
}

// Function to create the descriptor variable
export function createDescriptorVariable(parentVariable: Variable): Variable {
  const childKey = `${parentVariable.key}_descriptor`;

  // Initialize metadata and childVariableKeys
  initializeVariableMetadata(parentVariable);
  parentVariable.metadata?.childVariableKeys?.push(childKey);

  const newVariableTemplate = createBaseVariableTemplate(parentVariable);

  return {
    ...newVariableTemplate,
    id: generateUUID(),
    key: childKey,
    fullName: `${parentVariable.fullName} Descriptor`,
    abbreviatedName: `${parentVariable.abbreviatedName}_descriptor`,
    dataType: DataType.DESCRIPTOR,
    metadata: {
      label: `${parentVariable.metadata?.label}`,
      bHidden: parentVariable.metadata?.bHideDescriptiveRating,
      bOptional: parentVariable.metadata?.bOptional,
      properties: {
        childVariable: {
          parentVariableKey: parentVariable.key,
        },
        sectionSubversion: parentVariable.metadata?.properties?.sectionSubversion,
      },
      descriptiveRatings: [],
      placeholder: getVariablePlaceholder(DataType.DESCRIPTOR),
      abbreviatedPlaceholder: getAbbreviatedVariablePlaceholder(DataType.DESCRIPTOR),
      bChild: true,
    },
  };
}

