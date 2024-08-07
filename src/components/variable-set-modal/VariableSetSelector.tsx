import React, { useEffect, useState } from "react";
import { useVariableContext } from "../../contexts";
import { Variable, VariableSet } from "../../types";
import { ComboboxData, generateUUID } from "@clinicaltoolkits/type-definitions";
import { getVariableSetsAsComboboxData } from "./utility";
import { GenericTable, SingleSelectDropdown, TableColumn } from "@clinicaltoolkits/universal-react-components";
import { VariableSetModal } from "./VariableSetModal";
import { Anchor, Button } from "@mantine/core";
import { generateUnifiedTableData } from "../../utility";
import { VariableResultsTable } from "../VariableResultsTable";

// TODO: Figure out why VariableSetSelector requires a key prop placed on every return element (runtime is claiming it's a list of elements with no key prop when omitted)
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
    <div key={generateUUID()}>
      <VariableSetModal
        key={generateUUID()}
        opened={bOpened}
        onClose={() => setOpened(false)}
        variableSet={selectedVariableSet}
        headingProps={{ 
          headingProps: { order: 4, ta: "left" },
        }}
        headingChildren={[
          <SingleSelectDropdown
            key={generateUUID()}
            label="Select Variable Set"
            options={variableSetComboboxData}
            onChange={handleVariableSetSelection}
          />,
          selectedVariableSet && <Button onClick={() => console.log("VariableSetSelector - Variables from set: ", getRelatedVariablesBySet(selectedVariableSet, true, true))} key={generateUUID()}>Log Variables</Button>,
          <VariableResultsTable key={generateUUID()} selectedVariableSet={selectedVariableSet} />
        ]}
      />
      <Anchor type='button' onClick={() => setOpened(!bOpened)} key={generateUUID()}>Variable Input Fields</Anchor>
    </div>
  );
};
