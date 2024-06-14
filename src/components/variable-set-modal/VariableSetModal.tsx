import React, { useEffect } from "react";
import { HeadingProps, InfoFieldModal } from "@clinicaltoolkits/universal-react-components";
import { MantineSize } from "@mantine/core";
import { InfoFieldClassNames, PathsToFields } from "@clinicaltoolkits/type-definitions";
import { getOptionalVariableSubgroups, handleAutoVariableUpdates, useSortAndGroupVariables, useVariableContext } from "../../contexts";
import { Variable, VariableSet, getVariableInputConfig } from "../../types";
import { VariableCheckboxGroup } from "./VariableCheckboxGroup";
import { ActionCheckboxProvider, ActionCheckboxes } from "./ActionCheckbox";
import styles from "./styles.module.css";

export interface VariableSetModalProps {
  variableSet?: VariableSet | null;
  headingChildren?: React.ReactNode[];
  opened: boolean;
  onClose: () => void;
  headingProps?: Partial<Omit<HeadingProps, "children">>;
  inputSize?: MantineSize;
  classNames?: {
    infoField?: InfoFieldClassNames;
  }
}

/**
 * A modal that displays a list of variable sets as a dropdown and allows the user to select a variable set to display.
 * Once a variable set is selected, the modal will display the variables in the set as input fields.
 * Requires the VariableContextProvider to be a parent component and the variableMap and variableSetMap to be initialized.
 * @param titleChildren - Array of React nodes to display in the title section of the modal.
 */
export const VariableSetModal: React.FC<VariableSetModalProps> = ({ variableSet, headingChildren = [], opened, onClose, headingProps, inputSize = "sm", classNames }) => {
  const { variableMap, setVariable, getVariablesArray } = useVariableContext();
  const { variableGroups } = useSortAndGroupVariables(variableSet);
  console.log("variableSet: ", variableSet);
  console.log("variableGroups: ", variableGroups);
  const handleVariableUpdate = (id: string | number, propertyPath: PathsToFields<Variable>, value: any) => {
    if (typeof id !== "string") return;
    console.log("variable updated: ", id, propertyPath, value);
    setVariable(id, value);
    handleAutoVariableUpdates(id, value, variableMap, setVariable);
  };

  const defaultHeadingProps: HeadingProps = {
    headingProps: { order: 4, ta: "left" },
    headingText: variableSet?.label ? variableSet.label : "Variable Set Viewer",
    bPaper: true,
    children: [
      headingChildren,
      variableSet && <VariableCheckboxGroup key={headingChildren.length} subgroups={getOptionalVariableSubgroups(variableSet)} />,
      variableSet && <ActionCheckboxes key={variableSet.idToken.id} inOwningId={variableSet.idToken.id} inIds={variableSet.variableIds.all} />,
    ],
    classNames: {
      root: styles.headingRoot,
      heading: styles.headingText,
    },
  };

  // Merge the default classNames with the provided classNames
  const infoFieldClassNames = {
    ...defaultClassNames,
    ...classNames?.infoField,
  };

  console.log("variableGroups: ", variableGroups);

  return (
    <ActionCheckboxProvider>
      <InfoFieldModal
        fullScreen
        opened={opened}
        onClose={onClose}
        headingProps={{...defaultHeadingProps, ...headingProps}}
        subgroupOrder={5}
        objectGroups={variableGroups}
        infoFieldConfig={getVariableInputConfig(inputSize)}
        onUpdate={handleVariableUpdate}
        gap={0}
        classNames={infoFieldClassNames}
      />
    </ActionCheckboxProvider>
  );
};

const defaultClassNames = {
  root: styles.infoFieldComponentGroup,
  componentGroup: styles.infoFieldComponentGroup,
  labelFlex: styles.infoFieldLabelFlex,
  labelText: styles.infoFieldLabelText,
  inputElement: styles.infoFieldInputElement,
}
