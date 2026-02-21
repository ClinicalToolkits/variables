import React, { useEffect } from "react";
import { ExtendedHoverCardProps, IHeadingProps, InfoFieldModal, InfoFieldModalProps, useIsExtraSmallScreen, useIsSmallScreen } from "@clinicaltoolkits/universal-react-components";
import { MantineSize } from "@mantine/core";
import { EVisibility, PathsToFields } from "@clinicaltoolkits/type-definitions";
import { SetVariableFunction, Variable, VariableData, VariableFunctions, getVariableInputConfig } from "../../types";
import { VariableCheckboxGroup } from "./VariableCheckboxGroup";
import { ActionCheckboxProvider, ActionCheckboxes } from "./ActionCheckbox";
import { objectMapStore, /*useContentBlockWrapperOptions, useInfoFieldOptions,*/ useRichTextEditor } from "@clinicaltoolkits/content-blocks";
import { VariableControlMenu } from "./VariableControlMenu";
import { variableState } from "../..";
import { logger } from "@clinicaltoolkits/logger";
import { SCOPES } from "../../scopes";
import styles from "./styles.module.css";

const log = logger.scope(SCOPES.components.variable_group_modal.variable_group_modal);
/* ------------------------------ Type Utilities ----------------------------- */

/** Override utility: remove keys of R from T, then add R. */
type Override<T, R> = Omit<T, keyof R> & R;

/* ------------------------------- Props (lean) ------------------------------- */

/**
 * Start with the modal we wrap, then:
 * - Remove things that VariableSetModal computes internally (objectGroups, infoFieldConfig, onUpdate)
 * - Loosen headingProps to Partial<...> and exclude its original to avoid conflict
 * - Keep pass-through modal knobs you want (opened, onClose, id, size, fullScreen, classNames, actionComponent, subgroupOrder, gap)
 * - Add VariableSetModal-specific props (variableSet, headingChildren, inputSize, onVariableValueUpdated)
 */
export type VariableGroupModalProps = Override<
  Omit<
    InfoFieldModalProps<Variable>,
    "objectGroups" | "infoFieldConfig" | "onUpdate" | "headingProps"
  >,
  {
    /** Typically an entityVersionId */
    inOwningId: string;

    /** Text to show in the heading area as title. */
    inHeadingText: string;

    /** Optional override for the heading (you assemble defaults internally). */
    headingProps?: Partial<Omit<IHeadingProps, "children" | "title">>;

    /** VariableSet being displayed; when null/undefined, show default label. */
    inVariables: Variable[];

    /** Extra items to append to the heading area (to the right/under title). */
    headingChildren?: React.ReactNode[];

    /** Input size fed into getVariableInputConfig. */
    inputSize?: MantineSize;

    /** Merge-friendly class names; reuse exact shape from InfoFieldModal. */
    classNames?: InfoFieldModalProps<Variable>["classNames"];

    /** Handler to push variable value updates back to caller. */
    onVariableValueUpdated: SetVariableFunction;
  }
>;

/* ----------------------------- Label/ID selectors --------------------------- */

export const getVariableIdPathTest = (): PathsToFields<VariableData> =>
  "idToken.id";

export const getVariableLabelPathTest = (): PathsToFields<VariableData> =>
  "abbreviatedName";

export const variableDescriptionEditorId = "variableDescriptionEditor";
export const variableInterpretationEditorId = "variableInterpretationEditor";

/**
 * A modal that displays a list of variable sets as a dropdown and allows the user to select a variable set to display.
 * Once a variable set is selected, the modal will display the variables in the set as input fields.
 * Requires the VariableContextProvider to be a parent component and the variableMap and variableSetMap to be initialized.
 * @param titleChildren - Array of React nodes to display in the title section of the modal.
 */
export const VariableGroupModal: React.FC<VariableGroupModalProps> = ({
  inVariables,
  inOwningId,
  inHeadingText,
  headingChildren = [],
  opened,
  onClose,
  headingProps,
  inputSize = "sm",
  internalClassNames,
  onVariableValueUpdated,
  actionComponent,
  objectGroupPaperPropsByIndex
}) => {
  const { useCatalogState, controlStore, catalogStore } = variableState;
  //const { updateGetObjectFunction, updateGetObjectDisplayNameFunction } = useInfoFieldOptions(); // TODO: Variables module should be self-contained, that means that the InfoFieldOptionsProvider needs to be placed inside the VariablesProvider (or we need to allow the user to optionally pass in the InfoFieldProvider to the VariablesProvider, in order to allow them more control over Provider placement and nesting)
  //const { updateGetObjectMapFunction, updateGetObjectIdPathFunction, updateGetObjectLabelPathFunction } = useContentBlockWrapperOptions(); // TODO: Ditto
  const bVerticalTooltipContent = useIsSmallScreen();
  const variableMap = useCatalogState((state) => state.variableMap);
  const descriptionEditor = useRichTextEditor(variableDescriptionEditorId, false);
  const interpretationEditor = useRichTextEditor(variableInterpretationEditorId, false);

  useEffect(() => {
    objectMapStore.setIdPath(getVariableIdPathTest());
    objectMapStore.setLabelPath(getVariableLabelPathTest());
    //updateGetObjectIdPathFunction(getVariableIdPathTest);
    //updateGetObjectLabelPathFunction(getVariableILabelPathTest);
  },[]);

  useEffect(() => {
    /*const getObject = (id: string): RecordType | undefined => {
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
    updateGetObjectMapFunction(() => variableMap);*/
    objectMapStore.replace(variableMap);
    objectMapStore.setLabelPath(getVariableLabelPathTest());
    objectMapStore.setIdPath(getVariableIdPathTest());
  }, [variableMap]);

  const optionsMenuVariables = VariableFunctions.getOptionsMenuVariables(inVariables);
  const variableControls = controlStore.getControlsForVariables(inVariables);

  log.debug("VariableSetModal - variableControls: ", { variableControls, inVariables });
  const { builtGroups, optionalSubgroups } = VariableFunctions.buildVariableGroups(inVariables, variableMap, VariableFunctions.getChildVariables)
  const handleVariableUpdate = (id: string | number, propertyPath: PathsToFields<Variable>, value: any) => {
    if (typeof id !== "string") return;
    log.debug("VariableSetModal - Variable updated, id: ", id + " propertyPath: " + propertyPath + " value: " + value);
    onVariableValueUpdated(id, value);
  };

  const defaultHeadingProps: IHeadingProps = {
    headingProps: { order: 4, ta: "left" },
    headingText: inHeadingText || "Variable Set Viewer", // TODO: Should no longer require a default as inHeadingText is now required
    bPaper: true,
    children: [
      headingChildren,
      optionalSubgroups &&
        <VariableCheckboxGroup
          key={headingChildren.length}
          inSubgroups={optionalSubgroups}
          inVariableMap={variableMap}
          onChange={(variableIds, checked) => {
            const visibility = checked ? EVisibility.VISIBLE : EVisibility.HIDDEN;
            const updatedVariables: Variable[] = [];
            variableIds.forEach(id => {
              const variable = catalogStore.getVariable(id);
              const updatedVariable = variable?.withVisibility(visibility);
              if (updatedVariable) updatedVariables.push(updatedVariable);
            });
            catalogStore.addVariables(updatedVariables);
          }}
        />,
      optionsMenuVariables && <ActionCheckboxes key={inOwningId} inOwningId={inOwningId} inVariables={optionsMenuVariables} />,
      variableControls.length > 0 && <VariableControlMenu
        key={`${inOwningId}-variable-controls`}
        controls={variableControls}
        getControlState={controlStore.getControlState}
        onChange={controlStore.toggleControl}
      />
    ],
    classNames: {
      root: styles.headingRoot,
      heading: styles.headingText,
    },
  };

  // Merge the default classNames with the provided classNames
  const infoFieldClassNames = {
    ...defaultClassNames,
    ...internalClassNames?.infoField,
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
  const variableInputConfig = getVariableInputConfig(inputSize, variableMap, descriptionEditor, interpretationEditor, hoverCardProps, bVerticalTooltipContent);

  return (
    <ActionCheckboxProvider>
      <InfoFieldModal
        id="variable-set-modal"
        fullScreen
        opened={opened}
        onClose={onClose}
        headingProps={{...defaultHeadingProps, ...headingProps}}
        subgroupOrder={5}
        objectGroups={builtGroups}
        infoFieldConfig={variableInputConfig}
        onUpdate={handleVariableUpdate}
        gap={0}
        internalClassNames={{
          infoField: infoFieldClassNames,
          modal: internalClassNames?.modal
        }}
        actionComponent={actionComponent}
        objectGroupPaperPropsByIndex={objectGroupPaperPropsByIndex}
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
