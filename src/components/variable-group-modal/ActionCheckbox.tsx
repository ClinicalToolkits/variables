import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { textStyles } from '@clinicaltoolkits/universal-react-components';
import { Anchor, Checkbox, Stack, rem } from '@mantine/core';
import { logger } from '@clinicaltoolkits/utility-functions';
import { DataType, PathsToFields } from '@clinicaltoolkits/type-definitions';
import { getOptionsMenuVariables } from '../../types/functions/utility';
import { Variable, VariableData, VariableFunctions } from '../../types';
import { createGenericContext, State } from '@clinicaltoolkits/universal-react-components';
import { catalogStore } from '../../state';
import styles from "./styles.module.css";

interface ActionCheckboxState extends State {
  owningId: string;
  bShowAll: boolean;
};
export const { Provider, useGenericContext } = createGenericContext<ActionCheckboxState>({
  name: "ActionCheckboxContext",
  initialState: { owningId: "", bShowAll: false }
});
export const ActionCheckboxProvider = Provider;
export const useActionCheckboxContext = () => {
  const { state, updateState } = useGenericContext();

  const setShowAll = (bShowAll: boolean) => {
    updateState('bShowAll', bShowAll);
  };

  const setOwningId = (owningEntityVersionId: string) => {
    updateState('owningId', owningEntityVersionId);
  };

  return {
    state,
    updateState,
    bShowAll: state.bShowAll,
    setShowAll,
    owningId: state.owningId,
    setOwningId
  };
}

interface ActionCheckboxProps {
  inVariable: Variable;
}

export const ActionCheckbox: React.FC<ActionCheckboxProps> = ({ inVariable }) => {
  const variable = inVariable;
  if (!variable) return null;

  const label = variable.getMetadata()?.actionParams?.label || variable.getFullName();
  const bChecked = typeof variable.getValue() === 'boolean' ? variable.getValue() as boolean : false; // TODO: Ideally wouldn't need cast

  const handleChange = () => {
    logger.debug("ActionCheckbox::handleChange()", { variable, bChecked });
    setValueFromOptionsMenuVariable({ value: !bChecked, optionsMenuVariable: variable });
    catalogStore.addVariables([variable.withValue(!bChecked)]);
  };

  return (
    <Checkbox
      id={variable.getId()}
      label={label}
      checked={bChecked}
      onChange={handleChange}
      size="xs"
      classNames={{ root: styles.optionalVariablesCheckbox, label: textStyles.generalText }}
    />
  );
};

interface ActionCheckboxesProps {
  inVariables: Variable[];
  inOwningId: string;
}

export const ActionCheckboxes: React.FC<ActionCheckboxesProps> = ({ inVariables, inOwningId }) => {
  const { owningId, setOwningId, bShowAll, setShowAll } = useActionCheckboxContext();
  const actionCheckboxVariables = getOptionsMenuVariables({ variables: inVariables, dataType: DataType.CHECKBOX });
  const sortedActionCheckboxVariables = VariableFunctions.sortVariables(actionCheckboxVariables);
  const actionCheckboxes: React.ReactNode[] = sortedActionCheckboxVariables.map((variable) => {
    const id = variable.getId();
    return (
      <ActionCheckbox
        key={id}
        inVariable={variable}
      />
    );
  });

  useEffect(() => {
    if (inOwningId !== owningId) {
      setOwningId(inOwningId);
      setShowAll(false);
    }
  }, [inOwningId]);

  return (
    <Stack gap={rem("5px")}>
      {bShowAll ? actionCheckboxes : actionCheckboxes.slice(0, 1)}
      {/* Render the Anchor at the end */}
      {actionCheckboxes.length > 1 && (
        <Anchor onClick={() => setShowAll(!bShowAll)} size="xs">
          {bShowAll ? "Hide options" : "Show more options"}
        </Anchor>
      )}
    </Stack>
  );
};

interface SetValueFromOptionsMenuVariableProps {
  value: any; // TODO: Ideally more specific type
  optionsMenuVariable: Variable;
}

export const setValueFromOptionsMenuVariable = ({ value, optionsMenuVariable }: SetValueFromOptionsMenuVariableProps): void => {
  console.log("setValueFromOptionsMenuVariable", value, optionsMenuVariable);
  const actionParams = optionsMenuVariable.getMetadata()?.actionParams;
  if (value !== undefined && actionParams && actionParams?.ids) {
    const { ids, propertyPath, name } = actionParams;
    switch (name) {
      case 'batchSetVariableProperty': {
        if (propertyPath === "metadata.visibility" && typeof value === "boolean") value = value ? 1 : 0;
        const variables = catalogStore.getVariableBatch(ids);
        const updatedVariables: Variable[] = [];
        variables.forEach((variable) => {
          const updatedVariable = variable.withAtPath(propertyPath, value);
          updatedVariables.push(updatedVariable);
        });
        catalogStore.addVariables(updatedVariables);
        break;
      }
      default:
        logger.error('Action not defined:', name);
    }
  }
};

interface SetValuesFromOptionsMenuVariablesProps {
  optionsMenuVariables: Variable[];
}

export const setValuesFromOptionsMenuVariables = ({ optionsMenuVariables }: SetValuesFromOptionsMenuVariablesProps): void => {
  optionsMenuVariables.forEach((optionsMenuVariable) => {
    const value = optionsMenuVariable.getValue();
    setValueFromOptionsMenuVariable({ value, optionsMenuVariable });
  });
};
