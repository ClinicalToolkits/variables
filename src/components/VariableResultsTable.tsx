import React, { useEffect } from "react";
import { GenericTable, TableColumn } from "@clinicaltoolkits/universal-react-components";
import { VariableSet } from "../types";
import { useVariableContext } from "../contexts";
import { filterVariablesForTable, generateTableData, getVariableValueAsString } from "../utility";
import { Stack, Text } from "@mantine/core";

interface VariableResultsTableProps {
  selectedVariableSet: VariableSet | null;
}

export const VariableResultsTable: React.FC<VariableResultsTableProps> = ({ selectedVariableSet }) => {
  const { getRelatedVariablesBySet, variableMap } = useVariableContext();
  const [testColumns, setTestColumns] = React.useState<TableColumn<any>[]>([]);
  const [testTableData, setTestTableData] = React.useState<string[][]>([]);
  const [footerData, setFooterData] = React.useState<React.ReactNode>(null);

  useEffect(() => {
    if (selectedVariableSet) {
      const selectedVariables = getRelatedVariablesBySet(selectedVariableSet);
      const { tableDataVariables, tableFooterVariables, tableMetadata } = filterVariablesForTable(selectedVariables);
      const { tableData: unmodifiedTableData, formattingMaps } = generateTableData({ variables: tableDataVariables, bUnifiedTable: true, tableMetadata});
      const columns = createColumnsFromStringArray(
        unmodifiedTableData[0],
        (value: string) => {
          const variableId = value.split(".")?.[0]; console.log("split value variableId: ", variableId);
          const variable = variableMap.get(variableId);
          let variableValue = variable?.value ? getVariableValueAsString(variable.value, variable.dataType) : value;
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
              const recentVariable = variableMap.get(variable.idToken.id);
              const variableValue = recentVariable?.value
              const dataType = recentVariable?.dataType;
              if (variableValue && dataType) {
                const value = getVariableValueAsString(variableValue, dataType);
                return (
                  <Text fs={"italic"} ta={"right"}>
                    {variable.fullName}: {value}
                  </Text>
                );
              }
            })}
          </Stack>
        ) : null;
      }
      setFooterData(footerDisplayComponent);
    }
  }, [variableMap]);

  const variableTableProps = {
    data: testTableData,
    columns: testColumns,
    headingText: "Test Variables",
    footer: footerData
  };

  return selectedVariableSet ? <GenericTable {...variableTableProps} /> : null;
};

export function createColumnsFromStringArray(columnNames: string[], render?: (value: string) => string): TableColumn<any>[] {
  return columnNames.map((columnName) => ({
    label: columnName,
    path: columnName.toLowerCase(),  // path should match the key in your data objects
    render
  }));
}
