import React, { useEffect, useState } from "react";
import { useVariableContext } from "../../contexts";
import { VariableSet } from "../../types";
import { ComboboxData } from "@clinicaltoolkits/type-definitions";
import { getVariableSetsAsComboboxData } from "./utility";
import { SingleSelectDropdown } from "@clinicaltoolkits/universal-react-components";
import { VariableSetModal } from "./VariableSetModal";
import { Anchor } from "@mantine/core";

export const VariableSetSelector: React.FC = () => {
  const { variableSetMap } = useVariableContext();
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
        headingChildren={[<SingleSelectDropdown
          label="Select Variable Set"
          options={variableSetComboboxData}
          onChange={handleVariableSetSelection}
        />]}
      />
      <Anchor type='button' onClick={() => setOpened(!bOpened)}>Variable Input Fields</Anchor>
    </>

  );
};
