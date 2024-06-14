import React, { useEffect, useState } from "react";
import { useVariableContext } from "../../contexts";
import { Variable, VariableSet } from "../../types";
import { ComboboxData } from "@clinicaltoolkits/type-definitions";
import { getVariableSetsAsComboboxData } from "./utility";
import { GenericTable, SingleSelectDropdown, TableColumn } from "@clinicaltoolkits/universal-react-components";
import { VariableSetModal } from "./VariableSetModal";
import { Anchor, Button } from "@mantine/core";
import { generateUnifiedTableData } from "../../utility";
import { VariableResultsTable } from "../VariableResultsTable";

export const VariableSetSelector: React.FC = () => {
  const { variableSetMap, getRelatedVariablesBySet } = useVariableContext();
  const [selectedVariableSet, setSelectedVariableSet] = useState<VariableSet | null>(null);
  const [variableSetComboboxData, setVariableSetComboboxData] = useState<ComboboxData[]>([]);
  const [bOpened, setOpened] = useState(false);

  useEffect(() => {
    const comboData = getVariableSetsAsComboboxData(Array.from(variableSetMap.values()));
    setVariableSetComboboxData(comboData);
  }, [variableSetMap]);

  const handleVariableSetSelection = (selectedId: string) => {
    setSelectedVariableSet(variableSetMap.get(selectedId) || null);
  };

  const handleClose = () => {
    setSelectedVariableSet(null);
    setOpened(false);
  };

  return (
    <>
      <VariableSetModal
        opened={bOpened}
        onClose={() => setOpened(false)}
        variableSet={selectedVariableSet}
        headingProps={{ 
          headingProps: { order: 4, ta: "left" },
        }}
        headingChildren={[
          <SingleSelectDropdown
            key={0}
            label="Select Variable Set"
            options={variableSetComboboxData}
            onChange={handleVariableSetSelection}
          />,
          selectedVariableSet && <Button onClick={() => console.log("VariableSetSelector - Variables from set: ", getRelatedVariablesBySet(selectedVariableSet, true, true))}>Log Variables</Button>,
          <VariableResultsTable selectedVariableSet={selectedVariableSet} />
        ]}
      />
      <Anchor type='button' onClick={() => setOpened(!bOpened)}>Variable Input Fields</Anchor>
    </>

  );
};
