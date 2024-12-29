import React, { useEffect } from "react";
import { ExtendedHoverCardProps, HeadingProps, InfoFieldModal, useIsExtraSmallScreen, useIsSmallScreen } from "@clinicaltoolkits/universal-react-components";
import { MantineSize } from "@mantine/core";
import { InfoFieldClassNames, PathsToFields, RecordType } from "@clinicaltoolkits/type-definitions";
import { getOptionalVariableSubgroups, handleAutoVariableUpdates, useSortAndGroupVariables, useVariableContext } from "../../contexts";
import { SetVariableFunction, Variable, VariableSet, getVariableInputConfig } from "../../types";
import { VariableCheckboxGroup } from "./VariableCheckboxGroup";
import { ActionCheckboxProvider, ActionCheckboxes } from "./ActionCheckbox";
import { useContentBlockWrapperOptions, useInfoFieldOptions, useRichTextEditor } from "@clinicaltoolkits/content-blocks";
import { logger } from "@clinicaltoolkits/utility-functions";
import styles from "./styles.module.css";

export interface VariableSetModalProps {
  title: string;
  variables?: Variable[] | null;
  headingChildren?: React.ReactNode[];
  opened: boolean;
  onClose: () => void;
  headingProps?: Partial<Omit<HeadingProps, "children">>;
  inputSize?: MantineSize;
  classNames?: {
    infoField?: InfoFieldClassNames;
  };
  onVariableValueUpdated: SetVariableFunction;
  actionComponent?: React.ReactNode;
}

export const getObjectIdPathTest = <Variable extends RecordType>(): PathsToFields<Variable> => {
  return "idToken.id" as PathsToFields<Variable>;
}

export const getObjectLabelPathTest = <Variable extends RecordType>(): PathsToFields<Variable> => {
  return "abbreviatedName" as PathsToFields<Variable>;
}

export const variableDescriptionEditorId = "variableDescriptionEditor";
export const variableInterpretationEditorId = "variableInterpretationEditor";

/**
 * A modal that displays a list of variable sets as a dropdown and allows the user to select a variable set to display.
 * Once a variable set is selected, the modal will display the variables in the set as input fields.
 * Requires the VariableContextProvider to be a parent component and the variableMap and variableSetMap to be initialized.
 * @param titleChildren - Array of React nodes to display in the title section of the modal.
 */
export const VariableSetModal: React.FC<VariableSetModalProps> = ({ title = "Variable Set Viewer", variables, headingChildren = [], opened, onClose, headingProps, inputSize = "sm", classNames, onVariableValueUpdated, actionComponent }) => {
  const { updateGetObjectFunction, updateGetObjectDisplayNameFunction } = useInfoFieldOptions(); // TODO: Variables module should be self-contained, that means that the InfoFieldOptionsProvider needs to be placed inside the VariablesProvider (or we need to allow the user to optionally pass in the InfoFieldProvider to the VariablesProvider, in order to allow them more control over Provider placement and nesting)
  const { updateGetObjectMapFunction, updateGetObjectIdPathFunction, updateGetObjectLabelPathFunction } = useContentBlockWrapperOptions(); // TODO: Ditto
  const bVerticalTooltipContent = useIsSmallScreen();

  const { variableMap } = useVariableContext();
  const descriptionEditor = useRichTextEditor(variableDescriptionEditorId, false);
  const interpretationEditor = useRichTextEditor(variableInterpretationEditorId, false);

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

  const { variableGroups } = useSortAndGroupVariables(variables);
  const handleVariableUpdate = (id: string | number, propertyPath: PathsToFields<Variable>, value: any) => {
    if (typeof id !== "string") return;
    logger.debug("VariableSetModal - Variable updated, id: ", id + " propertyPath: " + propertyPath + " value: " + value);
    onVariableValueUpdated(id, value);
    handleAutoVariableUpdates(id, value, variableMap, onVariableValueUpdated);
  };

  const defaultHeadingProps: HeadingProps = {
    headingProps: { order: 4, ta: "left" },
    headingText: title,
    bPaper: true,
    children: [
      headingChildren,
      //variables && <VariableCheckboxGroup key={headingChildren.length} subgroups={getOptionalVariableSubgroups(variableSet)} />,
      //variables && <ActionCheckboxes key={variableSet.idToken.id} inOwningId={variableSet.idToken.id} inIds={variableSet.variableIds.all} />,
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

  // Added delay to hover card to prevent unpleasant/accidental hover card popups and to allow the editors to update their content
  const hoverCardProps: ExtendedHoverCardProps = {
    closeDelay: 100,
    openDelay: 400,
    bInPinnable: true,
    dropdownProps: {
      // TODO: Would be better to set this in the MS Word Add-In as the only reason we need this max width is because the hover card is too wide for the Add-In's default opening width (which doesn't allow manual specification on opening).
      //maw: "325px"
    }
  }

  return (
    <ActionCheckboxProvider>
      <InfoFieldModal
        fullScreen
        opened={opened}
        onClose={onClose}
        headingProps={{...defaultHeadingProps, ...headingProps}}
        subgroupOrder={5}
        objectGroups={variableGroups}
        infoFieldConfig={getVariableInputConfig(inputSize, variableMap, descriptionEditor, interpretationEditor, hoverCardProps, bVerticalTooltipContent)}
        onUpdate={handleVariableUpdate}
        gap={0}
        classNames={infoFieldClassNames}
        actionComponent={actionComponent}
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
