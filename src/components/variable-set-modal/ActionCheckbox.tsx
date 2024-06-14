import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { textStyles } from '@clinicaltoolkits/universal-react-components';
import { Anchor, Checkbox, Stack, rem } from '@mantine/core';
import { sortVariables, useVariableContext } from '../../contexts';
import { logger } from '@clinicaltoolkits/utility-functions';
import { DataType, PathsToFields, State, createGenericContext } from '@clinicaltoolkits/type-definitions';
import styles from "./styles.module.css";
import { getOptionsMenuVariables } from '../../utility';
import { Variable } from '../../types';

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
  id: string;
}

export const ActionCheckbox: React.FC<ActionCheckboxProps> = ({ id }) => {
  const { batchSetVariableProperty, variableMap, setVariable } = useVariableContext();
  const variable = variableMap.get(id);
  if (!variable) return null;

  const label = variable.metadata?.actionParams?.label || variable.fullName;
  const bChecked = typeof variable.value === 'boolean' ? variable.value : false;

  const handleChange = () => {
    setValueFromOptionsMenuVariable(!bChecked, variable, batchSetVariableProperty);
    setVariable(id, !bChecked);
  };

  return (
    <Checkbox
      id={id}
      label={label}
      checked={bChecked}
      onChange={handleChange}
      size="xs"
      classNames={{ root: styles.optionalVariablesCheckbox, label: textStyles.generalText }}
    />
  );
};

interface ActionCheckboxesProps {
  inIds: string[];
  inOwningId: string;
}

export const ActionCheckboxes: React.FC<ActionCheckboxesProps> = ({ inIds, inOwningId }) => {
  const { getVariablesArray, batchSetVariableProperty } = useVariableContext();
  const { owningId, setOwningId, bShowAll, setShowAll } = useActionCheckboxContext();
  const variables = getVariablesArray(inIds);
  const actionCheckboxVariables = getOptionsMenuVariables({ variables, dataType: DataType.CHECKBOX });
  const sortedActionCheckboxVariables = sortVariables(actionCheckboxVariables);
  const actionCheckboxes: React.ReactNode[] = sortedActionCheckboxVariables.map((variable) => {
    const id = variable.idToken.id;
    return (
      <ActionCheckbox
        key={id}
        id={id}
      />
    );
  });

  useMemo(() => {
    if (inOwningId !== owningId) {
      setOwningId(inOwningId);
      setShowAll(false);
      setValuesFromOptionsMenuVariables(actionCheckboxVariables, batchSetVariableProperty);
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

export const setValueFromOptionsMenuVariable = (value: any, optionsMenuVariable: Variable, batchSetVariableProperty: (ids: string[], propertyPath: PathsToFields<Variable>, value: any) => void): void => {
  if (value !== undefined && optionsMenuVariable.metadata?.actionParams?.ids) {
    const { ids, propertyPath, name } = optionsMenuVariable.metadata.actionParams;
    switch (name) {
      case 'batchSetVariableProperty': {
        if (propertyPath === "metadata.bHidden") value = !value; // TODO: This is a hack to make the hidden property work as expected, should likely change bHidden to bVisible
        
        if (ids) batchSetVariableProperty(ids, propertyPath, value);
        break;
      }
      default:
        logger.error('Action not defined:', name);
    }
  }
};

export const setValuesFromOptionsMenuVariables = (optionsMenuVariables: Variable[], batchSetVariableProperty: (ids: string[], propertyPath: PathsToFields<Variable>, value: any) => void): void => {
  optionsMenuVariables.forEach((optionsMenuVariable) => {
    const value = optionsMenuVariable.value || optionsMenuVariable.metadata?.initialValue;
    setValueFromOptionsMenuVariable(value, optionsMenuVariable, batchSetVariableProperty);
  });
};
