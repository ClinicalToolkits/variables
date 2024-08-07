import React, { useEffect } from "react";
import { HeadingProps, InfoFieldModal } from "@clinicaltoolkits/universal-react-components";
import { MantineSize } from "@mantine/core";
import { InfoFieldClassNames, PathsToFields, RecordType } from "@clinicaltoolkits/type-definitions";
import { getOptionalVariableSubgroups, handleAutoVariableUpdates, useSortAndGroupVariables, useVariableContext } from "../../contexts";
import { Variable, VariableSet, getVariableInputConfig } from "../../types";
import { VariableCheckboxGroup } from "./VariableCheckboxGroup";
import { ActionCheckboxProvider, ActionCheckboxes } from "./ActionCheckbox";
import { useEditor } from "@tiptap/react";
import { RichTextEditor as MantineRichTextEditor } from '@mantine/tiptap';
import { defaultExtensions, useContentBlockWrapperOptions, useInfoFieldOptions } from "@clinicaltoolkits/content-blocks";
import { logger } from "@clinicaltoolkits/utility-functions";
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

export const getObjectIdPathTest = <Variable extends RecordType>(): PathsToFields<Variable> => {
  return "idToken.id" as PathsToFields<Variable>;
}

export const getObjectLabelPathTest = <Variable extends RecordType>(): PathsToFields<Variable> => {
  return "abbreviatedName" as PathsToFields<Variable>;
}

/**
 * A modal that displays a list of variable sets as a dropdown and allows the user to select a variable set to display.
 * Once a variable set is selected, the modal will display the variables in the set as input fields.
 * Requires the VariableContextProvider to be a parent component and the variableMap and variableSetMap to be initialized.
 * @param titleChildren - Array of React nodes to display in the title section of the modal.
 */
export const VariableSetModal: React.FC<VariableSetModalProps> = ({ variableSet, headingChildren = [], opened, onClose, headingProps, inputSize = "sm", classNames }) => {
  const { updateGetObjectFunction, updateGetObjectDisplayNameFunction } = useInfoFieldOptions(); // TODO: Variables module should be self-contained, that means that the InfoFieldOptionsProvider needs to be placed inside the VariablesProvider (or we need to allow the user to optionally pass in the InfoFieldProvider to the VariablesProvider, in order to allow them more control over Provider placement and nesting)
  const { updateGetObjectMapFunction, updateGetObjectIdPathFunction, updateGetObjectLabelPathFunction } = useContentBlockWrapperOptions(); // TODO: Ditto
  const { variableMap, setVariable } = useVariableContext();
  const descriptionEditor = useEditor({ extensions: defaultExtensions, editable: false });
  const interpretationEditor = useEditor({ extensions: defaultExtensions, editable: false });

  useEffect(() => {
    updateGetObjectIdPathFunction(getObjectIdPathTest);
    updateGetObjectLabelPathFunction(getObjectLabelPathTest);
  },[]);

  useEffect(() => {
    const getObject = (id: string): RecordType | undefined => {
      const object = variableMap.get(id);
      return object;
    };

    const getObjectDisplayName = (id: string): string => {
      const object = getObject(id);
      const displayName = object?.abbreviatedName || "NOTHIN HERE, SOMETHIN WRONG";
      return displayName;
    };

    updateGetObjectFunction(getObject);
    updateGetObjectDisplayNameFunction(getObjectDisplayName);
    updateGetObjectMapFunction(() => variableMap);
  }, [variableMap]);

  const { variableGroups } = useSortAndGroupVariables(variableSet);
  const handleVariableUpdate = (id: string | number, propertyPath: PathsToFields<Variable>, value: any) => {
    if (typeof id !== "string") return;
    logger.debug("VariableSetModal - Variable updated, id: ", id + " propertyPath: " + propertyPath + " value: " + value);
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

  return (
    <ActionCheckboxProvider>
      <InfoFieldModal
        fullScreen
        opened={opened}
        onClose={onClose}
        headingProps={{...defaultHeadingProps, ...headingProps}}
        subgroupOrder={5}
        objectGroups={variableGroups}
        infoFieldConfig={getVariableInputConfig(inputSize, variableMap, descriptionEditor, interpretationEditor)}
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
