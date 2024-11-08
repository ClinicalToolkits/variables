import React, { useEffect, useState } from "react";
import { GenericTable, GenericTableProps } from "@clinicaltoolkits/universal-react-components";
import { Button, Container, useMantineTheme } from "@mantine/core";
import { VariableModal } from "./VariableEditor";
import { convertObjectArrayToComboboxDataArray, tags, ObjectInfoConfig, ComboboxData, entityRecords } from "@clinicaltoolkits/type-definitions";
import { fetchVariables, fetchVariablesComboboxData } from "../api";
import { Variable, getVariableObjectConfig, convertVariablesToComboboxData, SetWholeVariableFunction } from "../types";
import { fetchDescriptiveRatingsComboboxData, fetchDescriptiveRatingSets } from "../descriptive-ratings/api";
import { useRichTextEditor } from "@clinicaltoolkits/content-blocks";
import { getVariablesArray, useVariableContext } from "../contexts";


export const VariableTable = () => {
  //const [variables, setVariables] = useState<Variable[]>([]);
  const [selectedVariable, setSelectedVariable] = useState<Variable | null>(null);
  const [bOpenedVariableModal, setOpenedVariableModal] = React.useState(false);
  
  const { variableMap, setWholeVariable } = useVariableContext();
  const variablesArray = getVariablesArray({ inVariableMap: variableMap });
  const theme = useMantineTheme();

  console.log("variablesArray: ", variablesArray);

  useEffect(() => {
    if (selectedVariable) {
      setOpenedVariableModal(true);
    } else {
      setOpenedVariableModal(false);
    }
  }, [selectedVariable]);

  const handleVariableModalClose = () => {
    setOpenedVariableModal(false);
    setSelectedVariable(null);
  };

  const variableTableProps: GenericTableProps<Variable> = {
    data: variablesArray,
    columns: [
      { path: "associatedEntityAbbreviatedName", bFilterable: true },
      { path: "fullName" }, 
      { path: "abbreviatedName" },
      { path: "subgroupTag.displayName", label: "Subgroup", bFilterable: true },
      { path: "orderWithinSet" },
      { path: "dataType" },
      { path: "metadata.bNormallyDistributed", label: "Normally Distributed" },
    ],
    headingText: "Variables",
    onRowClick: (variable) => setSelectedVariable(variable),
  };

  return (
    <Container fluid w={"100vw"} p={"xs"} bg={theme.colors.dark[7]}>
      <GenericTable {...variableTableProps} />
      <Button onClick={() => setOpenedVariableModal(true)}>Create Variable</Button>
      <VariableModal variable={selectedVariable} bOpened={bOpenedVariableModal} onClose={handleVariableModalClose} mode={selectedVariable ? 'update' : 'create'} onVariableUpdated={setWholeVariable} />
    </Container>
  );
};

  /*const handleSelectedVariableUpdate = (updatedVariable: Variable) => {
    let bFoundVariable = false;
    const updatedVariables = variablesArray.map(variable => {
      if (variable.idToken.id === updatedVariable.idToken.id) {
        bFoundVariable = true;
        return { ...variable, ...updatedVariable };
      }
      return variable;
    });

    setVariables(bFoundVariable ? updatedVariables : [...variables, updatedVariable]);
  };*/

      /*
    const variables = await fetchVariables({ bIncludeAutoGeneratedVariables: false });
    if (!variables) return;
    setVariables(variables);
    

    const descriptiveRatingSets = await fetchDescriptiveRatingSets();
    */