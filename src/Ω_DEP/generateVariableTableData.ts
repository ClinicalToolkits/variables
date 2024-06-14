/*
import { Variable } from "../../types";

export function generateVariableTableData(variables: Variable[]): string[][] {
  // First, determine if any variable uses percentile ranks or descriptors
  const usesPercentileRank = variables.some((variable) => variable.metadata?.bCreatePercentileRank);
  const usesDescriptors = variables.some((variable) => variable.metadata?.bCreateDescriptiveRating);

  // Function to create a content array for each variable, including only necessary columns
  const createContentArray = (variable: Variable): string[] => {
    const contentArray = [variable.fullName, `v${variable.key}v`];

    if (usesPercentileRank) {
      contentArray.push(variable.metadata?.bCreatePercentileRank ? `v${variable.key}_percentile_rankv` : " ");
    }
    if (usesDescriptors) {
      contentArray.push(variable.metadata?.bCreateDescriptiveRating ? `v${variable.key}_descriptorv` : " ");
    }

    return contentArray;
  };

  // Generate the column headers dynamically based on the usage of percentile ranks and descriptors
  const generateColumnHeaders = (): string[] => {
    let headers = ["Name", "Score"]; // Basic headers for all tables
    if (usesPercentileRank) headers.push("Percentile Rank");
    if (usesDescriptors) headers.push("Descriptor");
    return headers;
  };

  // Initialize result with title row and dynamically generated column headers
  let result: string[][] = [generateColumnHeaders()];

  // Sort variables by their orderWithinSet for proper sequencing
  variables.sort((a, b) => a.orderWithinSet - b.orderWithinSet);

  // Append each variable's content array to the result
  variables.forEach((variable) => {
    result.push(createContentArray(variable));
  });

  return result;
}
*/