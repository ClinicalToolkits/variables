import { addUnique, isEmptyValue } from "@clinicaltoolkits/utility-functions";
import { Variable, VariableMap, VariableSet } from "../types";
import { getVariableSubgroupsToDisplay, shouldDisplayVariable } from "../contexts";
import { Colour, HorizontalAlignment, RowFormatting, RowType, VerticalAlignment, ColumnFormatting, RowFormattingMap, ColumnFormattingMap } from "@clinicaltoolkits/type-definitions";

const getRowFormatting = (headerColour?: string): Record<string, RowFormatting> => ({
  header: {
    rowType: RowType.HEADER,
    backgroundColour: headerColour || Colour.White,
    bold: true,
    fontColour: headerColour ? Colour.White : Colour.Black,
  },
  default: {
    rowType: RowType.DEFAULT,
    verticalAlignment: VerticalAlignment.Center,
    horizontalAlignment: HorizontalAlignment.Centered,
    height: 0.5,
  },
  subheader: {
    rowType: RowType.SUBHEADER,
    bold: true,
  },
});

const getRowFormattingFromRowType = (rowType?: RowType, headerColour?: string): RowFormatting => {
  let formatting = getRowFormatting(headerColour).default;

  switch (rowType) {
    case RowType.HEADER:
      formatting = getRowFormatting(headerColour).header;
      break;
    case RowType.SUBHEADER:
      formatting = getRowFormatting(headerColour).subheader;
      break;
    default:
      break;
  }

  return formatting;
};

// Function to create a content array for each variable, including only necessary columns
const createContentArray = (variable: Variable, enclosure: [string, string], tableMetadata?: VariableTableMetadata): string[] => {
  const contentArray = [variable.fullName, `${enclosure[0]}${variable.idToken.id}.value${enclosure[1]}`];
  const bIncludePercentileRank = tableMetadata?.bIncludePercentileRanks;
  const bIncludePercentileRange = tableMetadata?.bIncludePercentileRanges;
  const bIncludeDescriptor = tableMetadata?.bIncludeDescriptors;
  const bIncludePreviousScore = tableMetadata?.bIncludePreviousScores;

  if (bIncludePercentileRank) {
    contentArray.push(
      variable.metadata?.bCreatePercentileRank
        ? `${enclosure[0]}${variable.idToken.id}_percentile_rank.value${enclosure[1]}`
        : " "
    );
  }
  if (bIncludePercentileRange) {
    contentArray.push(
      variable.metadata?.bCreatePercentileRange
        ? `${enclosure[0]}${variable.idToken.id}_percentile_range.value${enclosure[1]}`
        : " "
    );
  }
  if (bIncludeDescriptor) {
    contentArray.push(
      variable.metadata?.bCreateDescriptiveRating
        ? `${enclosure[0]}${variable.idToken.id}_descriptor.value${enclosure[1]}`
        : " "
    );
  }
  if (bIncludePreviousScore) {
    contentArray.push(
      variable.metadata?.bCreatePreviousScore
        ? `${enclosure[0]}${variable.idToken.id}_previous_score.value${enclosure[1]}`
        : " "
    );
  }

  return contentArray;
};

// Generate the column headers dynamically based on the usage of percentile ranks and descriptors
const generateColumnHeaders = (tableMetadata?: VariableTableMetadata): string[] => {
  let headers = ["Name", "Score"]; // Basic headers for all tables
  const bIncludePercentileRank = tableMetadata?.bIncludePercentileRanks;
  const bIncludePercentileRange = tableMetadata?.bIncludePercentileRanges;
  const bIncludeDescriptor = tableMetadata?.bIncludeDescriptors;
  const bIncludePreviousScore = tableMetadata?.bIncludePreviousScores;

  if (bIncludePercentileRank) headers.push("Percentile Rank");
  if (bIncludePercentileRange) headers.push("Percentile Range");
  if (bIncludeDescriptor) headers.push("Descriptor");
  if (bIncludePreviousScore) headers.push("Previous Score");
  return headers;
};

interface GenerateTableDataParams {
  variables: Variable[];
  enclosure?: [string, string];
  bUnifiedTable?: boolean;
  tableMetadata?: VariableTableMetadata;
}

interface GenerateTableDataReturn {
  tableData: string[][];
  formattingMaps?: {
    rowFormattingMap?: RowFormattingMap;
    columnFormattingMap?: ColumnFormattingMap;
  }
}

/**
 * Generates table data for a given array of variables, including the variable name and key.
 * Optionally includes percentile rank and descriptor columns if any variable uses them.
 * @param variables - An array of variables to generate table data for
 * @param enclosure  - An optional tuple of strings to enclose the variable key in (e.g., ["", ""] or ["{", "}"])
 * @returns 
 */
export function generateTableData({ variables, enclosure, bUnifiedTable, tableMetadata }: GenerateTableDataParams): GenerateTableDataReturn {
  const { tableData, formattingMaps } = bUnifiedTable ? generateUnifiedTableData({ variables, enclosure, tableMetadata }) : generateSeparatedTableData({ variables, enclosure, tableMetadata });
  return { tableData, formattingMaps };
}

export function generateSeparatedTableData({ variables, enclosure = ['', ''], tableMetadata }: GenerateTableDataParams): GenerateTableDataReturn {
  // Get table metadata and determine if any variable uses percentile ranks, descriptors, or previous scores
  const headerColour = tableMetadata?.headerColour;

  // Initialize result with title row and dynamically generated column headers
  let result: string[][] = [generateColumnHeaders(tableMetadata)];
  let rowFormattingMap = new RowFormattingMap([[0, getRowFormattingFromRowType(RowType.HEADER, headerColour)]]);

  // Sort variables by their orderWithinSet for proper sequencing
  variables.sort((a, b) => a.orderWithinSet - b.orderWithinSet);

  // Append each variable's content array to the result
  variables.forEach((variable) => {
    const pushedIndex = result.push(createContentArray(variable, enclosure, tableMetadata)) - 1;
    rowFormattingMap.set(pushedIndex, getRowFormattingFromRowType(RowType.DEFAULT, headerColour));
  });

  const columnFormattingMap = new ColumnFormattingMap([
    [0, { horizontalAlignment: HorizontalAlignment.Left }],
  ])

  return { tableData: result, formattingMaps: { rowFormattingMap, columnFormattingMap } };
}

export function generateUnifiedTableData({ variables, enclosure = ['', ''], tableMetadata }: GenerateTableDataParams): GenerateTableDataReturn {
  const groups = groupVariablesByComposite(variables);

  // Get table metadata and determine if any variable uses percentile ranks, descriptors, or previous scores
  const headerColour = tableMetadata?.headerColour;

  let result: string[][] = [generateColumnHeaders(tableMetadata)];
  let rowFormattingMap = new RowFormattingMap([[0, getRowFormattingFromRowType(RowType.HEADER, headerColour)]]);

  Object.values(groups).forEach((group, index, array) => {
      group.sort((a, b) => a.orderWithinSet - b.orderWithinSet);
      group.forEach(variable => {
        const pushedIndex = result.push(createContentArray(variable, enclosure, tableMetadata)) - 1;
        rowFormattingMap.set(pushedIndex, getRowFormattingFromRowType(variable.metadata?.tableRowType, headerColour));
      });
      // Add an empty row after each group, but not after the last group
      if (index < array.length - 1) {
          result.push(Array(result[0].length).fill(" "));
      }
  });

  const columnFormattingMap = new ColumnFormattingMap([
    [0, { horizontalAlignment: HorizontalAlignment.Left }],
  ])

  return { tableData: result, formattingMaps: { rowFormattingMap, columnFormattingMap } };
}

interface VariableTableMetadata {
  headerColour?: string;
  bIncludePercentileRanks?: boolean;
  bIncludePercentileRanges?: boolean;
  bIncludeDescriptors?: boolean;
  bIncludePreviousScores?: boolean;
}

interface FilterVariablesForTableReturn {
  tableDataVariables: Variable[];
  tableFooterVariables: Variable[];
  tableMetadata: VariableTableMetadata;
}

export const filterVariablesForTable = (variables: Variable[], bRemoveUnusedVariableRows = false): FilterVariablesForTableReturn => {
  const tableDataVariables: Variable[] = [];
  const tableFooterVariables: Variable[] = [];
  const tableMetadata = {
    bIncludePercentileRanks: variables.some((variable) => variable.metadata?.bCreatePercentileRank),
    bIncludePercentileRanges: variables.some((variable) => variable.metadata?.bCreatePercentileRange),
    bIncludeDescriptors: variables.some((variable) => variable.metadata?.bCreateDescriptiveRating),
    bIncludePreviousScores: variables.some((variable) => variable.metadata?.bCreatePreviousScore),
  };

  variables.forEach((variable) => {
    if (
      (!bRemoveUnusedVariableRows || !isEmptyValue(variable.value)) &&
      variable.metadata?.bIncludeInDynamicTable !== false && shouldDisplayVariable(variable)
    ) {
      tableDataVariables.push(variable);
    } else if (shouldDisplayVariable(variable) && variable.metadata?.bIncludeInTableFooter === true) {
      tableFooterVariables.push(variable);
    } else if (variable.metadata?.actionParams?.tableMetadataPath) {
      const tableMetadataPath = variable.metadata.actionParams.tableMetadataPath;
      const value = variable.value;

      if (typeof value === "boolean") {
        switch (tableMetadataPath) {
          case "bIncludePercentileRanks":
            tableMetadata.bIncludePreviousScores = value;
            break;
          case "bIncludePercentileRanges":
            tableMetadata.bIncludePercentileRanges = value;
            break;
          case "bIncludeDescriptors":
            tableMetadata.bIncludeDescriptors = value;
            break;
          case "bIncludePreviousScores":
            tableMetadata.bIncludePreviousScores = value;
            break;
          default:
            break;
        }
      }
    }
  });

  return { tableDataVariables, tableFooterVariables, tableMetadata };
};

export const generateFooterData = (variables: Variable[], enclosure: [string, string] = ['', '']): string[] => {
  const footerData: string[] = [];

  variables.forEach((variable) => {
    footerData.push(`${variable.fullName}: ${enclosure[0]}${variable.idToken.id}.value${enclosure[1]}`);
  });

  return footerData;
};

interface FilterVariableSetForTableReturn {
  tableDataBySubgroup: Record<string, { tableDataVariables: Variable[], tableMetadata: VariableTableMetadata}>;
  variablesForFooter: Variable[];
}

export const filterVariableSetForTable = (variableSet: VariableSet, variableMap: VariableMap, getVariablesArray: (variableKeys?: string[] | undefined) => Variable[], bRemoveUnusedVariableRows = false, bUnifiedTable?: boolean): FilterVariableSetForTableReturn => {
  const tableDataBySubgroup: Record<string, { tableDataVariables: Variable[], tableMetadata: VariableTableMetadata}> = {};
  const variablesForFooter: Variable[] = [];

  if (bUnifiedTable) {
    const variables = getVariablesArray(variableSet.variableIds.all);
    const { tableDataVariables, tableFooterVariables, tableMetadata } = filterVariablesForTable(variables,  bRemoveUnusedVariableRows);
    tableDataBySubgroup['all'] = { tableDataVariables, tableMetadata };
    variablesForFooter.push(...tableFooterVariables);
  } else {
    const variableSubgroupsToDisplay = getVariableSubgroupsToDisplay(variableSet, variableMap);

    for (const [subgroupKey, variableKeys] of Object.entries(variableSubgroupsToDisplay)) {
      const variables = getVariablesArray(variableKeys);
      const { tableDataVariables, tableFooterVariables, tableMetadata } = filterVariablesForTable(variables, bRemoveUnusedVariableRows);
      tableDataBySubgroup[subgroupKey] = { tableDataVariables, tableMetadata };
      variablesForFooter.push(...tableFooterVariables);
    }
  }
  
  return { tableDataBySubgroup, variablesForFooter };
}

export function groupVariablesByComposite(variables: Variable[]): Record<string, Variable[]> {
  const groups: Record<string, Variable[]> = {};
  let standaloneVariables: Variable[] = [];

  variables.forEach(variable => {
      if (variable.metadata?.associatedCompositeVariableId || variable.metadata?.associatedSubvariableIds?.length) {
          const groupId = variable.metadata.associatedCompositeVariableId || variable.idToken.id;
          if (!groups[groupId]) {
              groups[groupId] = [];
          }
          groups[groupId] = addUnique(groups[groupId], variable);
      } else {
          standaloneVariables = addUnique(standaloneVariables, variable);
      }
  });

  // Append standalone variables at the end of the collection
  if (standaloneVariables.length > 0) {
      groups['standalone'] = standaloneVariables;
  }

  return groups;
}
