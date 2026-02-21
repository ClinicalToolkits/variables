import React, { useEffect } from "react";
import { GenericTable, TableColumn } from "@clinicaltoolkits/universal-react-components";
import { filterVariablesForTable, filterVariablesForTableInternal, generateTableData, getContentBlocksFromVariableInterpretation, getVariableValueAsString } from "../types/functions/utility";
import { Stack, Text } from "@mantine/core";
import { Variable, VariableMap } from "../types";

interface VariableResultsTableProps {
  inVariables: Variable[] | null;
  inVariableMap: VariableMap;
}

export const VariableResultsTable: React.FC<VariableResultsTableProps> = ({ inVariables, inVariableMap }) => {
  const [testColumns, setTestColumns] = React.useState<TableColumn<any>[]>([]);
  const [testTableData, setTestTableData] = React.useState<string[][]>([]);
  const [footerData, setFooterData] = React.useState<React.ReactNode>(null);

  const bVariablesPresent = inVariables && inVariables.length > 0;

  useEffect(() => {
    if (bVariablesPresent) {
      const selectedVariables = inVariables;
      console.log("VariableResultsTable::useEffect() - Generating Variable Results Table for variables: ", selectedVariables);
      const { tableDataVariables, tableFooterVariables, tableMetadata } = filterVariablesForTableInternal(selectedVariables);
      console.log("VariableResultsTable::useEffect() - Filtered table data variables: ", tableDataVariables);
      const { tableData: unmodifiedTableData, formattingMaps } = generateTableData({ variables: tableDataVariables, bUnifiedTable: true, tableMetadata});
      const columns = createColumnsFromStringArray(
        unmodifiedTableData[0],
        (value: string) => {
          const variableId = value.split(".")?.[0];
          const variable = inVariableMap.get(variableId);
          let variableValue = variable?.getValue() ? getVariableValueAsString(variable.getValue(), variable.getDataType()) : value;
          return variableValue;
        }
      );
      setTestColumns(columns);
      // Generate table data, removing the first row (i.e., column headers)
      const tableData = unmodifiedTableData.slice(1);
      setTestTableData(tableData);

      // Generate the footer data
      const footerDisplayComponent = () => {
        return tableFooterVariables ? (
          <Stack>
            {tableFooterVariables.map((variable) => {
              const recentVariable = inVariableMap.get(variable.getId());
              const variableValue = recentVariable?.getValue()
              const dataType = recentVariable?.getDataType();
              if (variableValue && dataType) {
                const value = getVariableValueAsString(variableValue, dataType);
                return (
                  <Text fs={"italic"} ta={"right"}>
                    {variable.getFullName()}: {value}
                  </Text>
                );
              }
            })}
          </Stack>
        ) : null;
      }
      setFooterData(footerDisplayComponent);

      tableDataVariables.forEach((variable) => {
        const interpretationBlocks = getContentBlocksFromVariableInterpretation(variable, inVariableMap, false);
        interpretationBlocks?.forEach(block => console.log("content interpretation block: ", block));
      })
    }
  }, [inVariableMap]);

  const variableTableProps = {
    data: testTableData,
    columns: testColumns,
    headingText: "Test Variables",
    footer: footerData
  };

  return bVariablesPresent ? <GenericTable {...variableTableProps} /> : null;
};

export function createColumnsFromStringArray(columnNames: string[], render?: (value: string) => string): TableColumn<any>[] {
  return columnNames.map((columnName) => ({
    label: columnName,
    path: columnName.toLowerCase(),  // path should match the key in your data objects
    render
  }));
}
