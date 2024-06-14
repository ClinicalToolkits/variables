import React, { useEffect, useState } from 'react';
import { InfoFieldObjectProperties } from '@clinicaltoolkits/universal-react-components';
import { Button, Modal, Stack } from '@mantine/core';
import { ObjectInfoConfig, PathsToFields, setValueByPath } from '@clinicaltoolkits/type-definitions';
import { mergeUndefined, logger, capitalizeFirstLetter } from '@clinicaltoolkits/utility-functions';
import { updateVariable, createVariable } from '../api';
import { Variable, emptyVariable } from '../types';

export type VariableUpdateProperties = Partial<Variable>;
interface SectionModalProps {
  bOpened: boolean;
  onClose: () => void;
  variable: Variable | null;
  onVariableUpdated?: (updatedVariable: Variable) => void;
  mode?: 'create' | 'update';
  variableObjectConfig: ObjectInfoConfig<Variable>;
}

export const VariableModal: React.FC<SectionModalProps> = ({ bOpened, onClose, variable, onVariableUpdated, mode = 'update', variableObjectConfig }) => {
  const [selectedVariable, setSelectedVariable] = useState<Variable>(mergeUndefined(variable, emptyVariable));

  useEffect(() => {
    const newVariable = mergeUndefined(variable, emptyVariable);
    setSelectedVariable(newVariable);
  }, [variable, mode]);

  const handleSelectedVariableUpdate = (id: string | number, path: PathsToFields<Variable>, value: any) => {
    const updatedVariable = {...selectedVariable};
    setValueByPath(updatedVariable, path, value);
    setSelectedVariable(updatedVariable);
  };

  const handleSave = async () => {
    try {
      if (mode === 'update') {
        if (variable) {
          await updateVariable(variable.idToken.id, selectedVariable);
          onVariableUpdated?.(selectedVariable);

          logger.debug("Updated variable: ", selectedVariable);
        } else {
          logger.error("Variable is null. Cannot update variable.");
        }
      } else if (mode === 'create') {
        await createVariable(selectedVariable);
        onVariableUpdated?.(selectedVariable);

        logger.debug("Created new variable: ", selectedVariable);
      }

      onClose();
    } catch (error) {
      logger.error(`Failed to ${mode} variable: `, error);
    }

  };

  return (
    <Modal opened={bOpened} onClose={() => onClose()} title={`${mode.toUpperCase()} Variable`} closeOnClickOutside={false} fullScreen>
      <Stack w={"100%"} align='center'>
        { selectedVariable && <InfoFieldObjectProperties config={variableObjectConfig} data={selectedVariable} onUpdate={handleSelectedVariableUpdate} /> }
        <Button onClick={() => {handleSave()}}>{`${capitalizeFirstLetter(mode)} Variable`}</Button>
      </Stack>
    </Modal>
  );
};

// Utility to map Section properties to an InputFieldMap
/*
const variableToInputFieldMap = (variable: Variable, descriptiveRatingSetComboxData?: ComboboxData[], variablesComboboxData?: ComboboxData[]): InputFieldMap<InputField> => {
  const inputFieldMap: InputFieldMap<InputField> = new Map();
  const variableProperties = getAllPaths(emptyVariable);
  const excludedProperties: PropertySet<Variable> = new Set(['id', 'key', 'variableSetKey', 'value', 'metadata', 'tags', 'metadata.label', 'metadata.childVariableKeys', 'metadata.properties', 'metadata.dropdownOptions', 'metadata.associatedCompositeVariableKey', 'metadata.associatedSubvariableProperties', 'metadata.bIncludeInDynamicTable']);

  variableProperties.forEach(property => {
    if (!excludedProperties.has(property)) {
      let inputFieldKey = property;
      let displayName = property.toString();
      let value = getValueByPath(variable, property as PathsToFields<Variable>);
      let type = 'text'; // Default type
      let metadata: any = {};

      if (!value) logger.error(`Value is null for ${variable.associatedEntityAbbreviatedName} - ${variable.fullName}'s key: ${property}. Setting value to empty string.`);

      switch (property) {
        case 'dataType':
          type = 'select';
          metadata.dropdownOptions = Object.values(DataType).map(type => type);
          break;
        case 'associatedEntityAbbreviatedName':
          type = 'select',
          metadata.options = entitiesComboboxData;
          value = Object.values(entityRecords).find(entity => entity.abbreviatedName === variable.associatedEntityAbbreviatedName)?.id; // Search entityRecords' values for abbreviatedName that matches the associatedEntityAbbreviatedName and set it as value
          break;
        case 'subgroupTag':
          console.log("subgroupTag: ", variable.subgroupTag);
          type = 'select';
          metadata.options = tagsComboboxData;
          value = variable.subgroupTag?.id;
          break;
        case 'tagIds':
          displayName = 'tags';
          type = 'multiSelect'; // Specify the type as multiSelect
          metadata.options = tagsComboboxData;
          value = variable?.tagIds || [];
          break;
        case 'metadata.description':
          type = 'textArea';
          value = variable.metadata?.description ?? "";
          break;
        case 'metadata.descriptiveRatingId':
          type = 'select';
          value = variable.metadata?.descriptiveRatingId ?? "";
          metadata.options = descriptiveRatingSetComboxData ?? [];
          break;
        case 'metadata.associatedCompositeVariableId':
          type = 'select';
          value = variable.metadata?.associatedCompositeVariableId ?? "";
          metadata.options = variablesComboboxData ?? [];
          break;
        case 'metadata.associatedSubvariableIds':
          type = 'multiSelect';
          value = variable.metadata?.associatedSubvariableIds ?? [];
          metadata.options = variablesComboboxData ?? [];
          break;
      }

      if (property.startsWith('metadata.')) {
        displayName = property.split('.')[1];
        if (displayName.startsWith('b')) {
          type = 'checkbox';
          displayName = removeAffixFromBooleanName(displayName);
        }
      }

      inputFieldMap.set(inputFieldKey, {
        key: inputFieldKey,
        value,
        displayName: addSpaces(displayName, true), // Assuming you have a utility function for this
        type,
        metadata: metadata, // Example for handling enums
      });
    }
  });

  return inputFieldMap;
};
*/
