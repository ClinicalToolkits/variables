import React, { useEffect, useState } from 'react';
import { InfoFieldObjectProperties } from '@clinicaltoolkits/universal-react-components';
import { Button, Modal, Stack } from '@mantine/core';
import { ComboboxData, convertObjectArrayToComboboxDataArray, entityRecords, generateUUID, ObjectInfoConfig, PathsToFields, setValueByPath, tags } from '@clinicaltoolkits/type-definitions';
import { mergeUndefined, logger, capitalizeFirstLetter, isEmptyValue } from '@clinicaltoolkits/utility-functions';
import { updateVariable, createVariable, fetchVariablesComboboxData } from '../api';
import { Variable, emptyVariable, getVariableObjectConfig } from '../types';
import { useUpsertVariableContent } from '../utility/getVariableContent'; // TODO: Circular dependency
import { useRichTextEditor } from '@clinicaltoolkits/content-blocks';
import { fetchDescriptiveRatingsComboboxData } from '../descriptive-ratings';

const tagsComboboxData: ComboboxData[] = convertObjectArrayToComboboxDataArray({ array: Object.values(tags), idPath: 'id', labelPath: 'name' });
const entitiesComboboxData: ComboboxData[] = convertObjectArrayToComboboxDataArray({array: Object.values(entityRecords), idPath: 'id', labelPath: 'abbreviatedName', searchTermsPath: 'name'});

export const variableSuggestDescriptionEditorId = "variableSuggestDescriptionEditor";
export const variableSuggestInterpretationEditorId = "variableSuggestInterpretationEditor";

export type VariableUpdateProperties = Partial<Variable>;
interface SectionModalProps {
  bOpened: boolean;
  onClose: () => void;
  variable: Variable | null;
  onVariableUpdated?: (updatedVariable: Variable) => void;
  mode?: 'create' | 'update';
}

export const VariableModal: React.FC<SectionModalProps> = ({ bOpened, onClose, variable, onVariableUpdated, mode = 'update' }) => {
  const [selectedVariable, setSelectedVariable] = useState<Variable>(mergeUndefined(variable, emptyVariable));
  const { upsertVariableContent } = useUpsertVariableContent();
  const [descriptiveRatingSetComboxData, setDescriptiveRatingSetComboxData] = useState<ComboboxData[]>([]);
  const [variablesComboboxData, setVariablesComboboxData] = useState<ComboboxData[]>([]);
  const [bShowDescriptionBlock, setShowDescriptionBlock] = useState(selectedVariable.content?.bCreateDescription);
  const [bShowInterpretationBlock, setShowInterpretationBlock] = useState(selectedVariable.content?.bCreateInterpretation);
  console.log("bShowDescriptionBlock: ", bShowDescriptionBlock);
  console.log("selectedVariable: ", selectedVariable);
  const [variableObjectConfig, setVariableObjectConfig] = useState<ObjectInfoConfig<Variable>>(getVariableObjectConfig(tagsComboboxData, entitiesComboboxData, descriptiveRatingSetComboxData, variablesComboboxData));


  const descriptionEditor = useRichTextEditor(variableSuggestDescriptionEditorId, true);
  const interpretationEditor = useRichTextEditor(variableSuggestInterpretationEditorId, true);

  const prepData = async () => {
    let localDescriptiveRatingComboxData = await fetchDescriptiveRatingsComboboxData();
    setDescriptiveRatingSetComboxData(localDescriptiveRatingComboxData);

    const localVariablesComboboxData = await fetchVariablesComboboxData();
    setVariablesComboboxData(localVariablesComboboxData);

    setVariableObjectConfig(getVariableObjectConfig(tagsComboboxData, entitiesComboboxData, localDescriptiveRatingComboxData, localVariablesComboboxData, descriptionEditor, interpretationEditor, bShowDescriptionBlock, bShowInterpretationBlock));
    console.log("descriptionEditor: ", descriptionEditor);
    console.log("interpretationEditor: ", interpretationEditor);
  };

  useEffect(() => {
    if (descriptionEditor && interpretationEditor && descriptionEditor?.isEditable && interpretationEditor?.isEditable) {
      prepData();
    }
  }, [descriptionEditor, interpretationEditor, descriptionEditor?.isEditable, interpretationEditor?.isEditable, bShowDescriptionBlock, bShowInterpretationBlock]);
  
  useEffect(() => {
    if (selectedVariable.content?.bCreateDescription !== bShowDescriptionBlock) setShowDescriptionBlock(selectedVariable.content?.bCreateDescription);
    if (selectedVariable.content?.bCreateInterpretation !== bShowInterpretationBlock) setShowInterpretationBlock(selectedVariable.content?.bCreateInterpretation);
  }, [selectedVariable.content?.bCreateDescription, selectedVariable.content?.bCreateInterpretation]);

  useEffect(() => {
    const newVariable = mergeUndefined(variable, emptyVariable);
    if (!newVariable.idToken.variableId) newVariable.idToken.variableId = generateUUID();
    setSelectedVariable(newVariable);
  }, [variable, mode]);

  const handleSelectedVariableUpdate = (id: string | number, path: PathsToFields<Variable>, value: any) => {
    const updatedVariable = {...selectedVariable};
    if (path === 'metadata.visibility' || path === "metadata.percentileRankVisibility" || path === "metadata.descriptiveRatingVisibility") value = parseInt(value);
    else if (path === 'idToken.entityId') setValueByPath(updatedVariable, "associatedEntityAbbreviatedName", entityRecords[value].abbreviatedName);
    //else if(path === 'content.bCreateDescription') setShowDescriptionBlock(value); // Handled in useEffect
    //else if(path === 'content.bCreateInterpretation') setShowInterpretationBlock(value); // Handled in useEffect
    setValueByPath(updatedVariable, path, value);
    setSelectedVariable(updatedVariable);
    console.log("updatedVariable: ", updatedVariable);
  };

  // TODO: Currently, description and interpretation blocks can only be "not updated" (by setting corresponding checkbox to false), but deletion needs to occur manually in the database. Eventually move to a more robust solution.
  const handleSave = async () => {
    try {
      if (mode === 'update') {
        if (variable) {
          if (selectedVariable?.content?.bCreateDescription) await upsertVariableContent(selectedVariable, 'descriptionBlock', descriptionEditor, mode);
          if (selectedVariable?.content?.bCreateInterpretation) await upsertVariableContent(selectedVariable, 'interpretationBlock', interpretationEditor, mode);
          await updateVariable(variable.idToken.databaseId, selectedVariable);
          onVariableUpdated?.(selectedVariable);

          logger.log("Updated variable: ", selectedVariable);
        } else {
          logger.error("Variable is null. Cannot update variable.");
        }
      } else if (mode === 'create') {
        if (!selectedVariable.idToken.variableId || isEmptyValue(selectedVariable.idToken.variableId)) throw new Error("Variable ID is empty. Cannot create variable.");
        await createVariable(selectedVariable);

        if (selectedVariable?.content?.bCreateDescription) await upsertVariableContent(selectedVariable, 'descriptionBlock', descriptionEditor, mode);
        if (selectedVariable?.content?.bCreateInterpretation) await upsertVariableContent(selectedVariable, 'interpretationBlock', interpretationEditor, mode);

        onVariableUpdated?.(selectedVariable);

        logger.log("Created new variable: ", selectedVariable);
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
        <Button onClick={async () => {await handleSave()}}>{`${capitalizeFirstLetter(mode)} Variable`}</Button>
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
