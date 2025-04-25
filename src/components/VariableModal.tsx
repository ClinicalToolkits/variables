import React, { ReactNode, useEffect, useState } from 'react';
import { InfoFieldObjectProperties, SingleSelectDropdown } from '@clinicaltoolkits/universal-react-components';
import { Button, Modal, Stack } from '@mantine/core';
import { ComboboxData, convertObjectArrayToComboboxDataArray, entityRecords, generateUUID, ObjectInfoConfig, PathsToFields, setValueByPath, tags } from '@clinicaltoolkits/type-definitions';
import { mergeUndefined, logger, capitalizeFirstLetter, isEmptyValue, getSupabaseClient } from '@clinicaltoolkits/utility-functions';
import { updateVariable, createVariable, fetchVariablesComboboxData, fetchVariable, upsertVariable } from '../api';
import { Variable, emptyVariable, getVariableObjectConfig } from '../types';
import { convertVariableContentToBlock, upsertVariableContent } from '../utility/getVariableContent'; // TODO: Circular dependency
import { useRichTextEditor } from '@clinicaltoolkits/content-blocks';
import { fetchDescriptiveRatingsComboboxData } from '../descriptive-ratings';

const fetchEntityComboboxData = async (): Promise<ComboboxData[]> => {
  const client = getSupabaseClient();
  const { data, error } = await client.from('entities').select('id, abbreviated_name').order('abbreviated_name', { ascending: true });
  if (error) {
    logger.error("Error fetching entities: ", error);
    return [];
  }
  console.log("Entities: ", data);
  const comboboxData = convertObjectArrayToComboboxDataArray({ array: data, idPath: 'id', labelPath: 'abbreviated_name' });
  console.log("Entities combobox data: ", comboboxData);
  return comboboxData;
};

const fetchEntityVersionsComboboxData = async (): Promise<ComboboxData[]> => {
  const client = getSupabaseClient();
  const { data, error } = await client.from('entity_versions').select('id, abbreviated_label').order('abbreviated_label', { ascending: true });
  if (error) {
    logger.error("Error fetching entity versions: ", error);
    return [];
  }
  console.log("Entity versions: ", data);
  const comboboxData = convertObjectArrayToComboboxDataArray({ array: data, idPath: 'id', labelPath: 'abbreviated_label' });
  console.log("Entity versions combobox data: ", comboboxData);
  return comboboxData;
};

const tagsComboboxData: ComboboxData[] = convertObjectArrayToComboboxDataArray({ array: Object.values(tags), idPath: 'id', labelPath: 'name' });
//const entitiesComboboxData: ComboboxData[] = convertObjectArrayToComboboxDataArray({array: Object.values(entityRecords), idPath: 'id', labelPath: 'abbreviatedName', searchTermsPath: 'name'});

export const variableSuggestDescriptionEditorId = "variableSuggestDescriptionEditor";
export const variableSuggestInterpretationEditorId = "variableSuggestInterpretationEditor";

export type VariableUpdateProperties = Partial<Variable>;
interface SectionModalProps {
  bOpened: boolean;
  onClose: () => void;
  variable: Variable | null;
  onSave: (variable: Variable) => void;
}

export const VariableModal: React.FC<SectionModalProps> = ({ bOpened, onClose, variable, onSave }) => {
  const [variableDraft, setVariableDraft] = useState<Variable>(mergeUndefined(variable, emptyVariable));
  const [variablesComboboxData, setVariablesComboboxData] = useState<ComboboxData[]>([]);
  const [bShowDescriptionBlock, setShowDescriptionBlock] = useState(variableDraft.content?.bCreateDescription);
  const [bShowInterpretationBlock, setShowInterpretationBlock] = useState(variableDraft.content?.bCreateInterpretation);
  console.log("bShowDescriptionBlock: ", bShowDescriptionBlock);
  console.log("variableDraft: ", variableDraft);
  const [variableObjectConfig, setVariableObjectConfig] = useState<ObjectInfoConfig<Variable, ReactNode> | null>(null);


  const descriptionEditor = useRichTextEditor(variableSuggestDescriptionEditorId, true);
  const interpretationEditor = useRichTextEditor(variableSuggestInterpretationEditorId, true);

  const prepData = async () => {
    let localDescriptiveRatingComboxData = await fetchDescriptiveRatingsComboboxData();
    const entityComboboxData = await fetchEntityComboboxData();
    const entityVersionsComboboxData = await fetchEntityVersionsComboboxData();

    const localVariablesComboboxData = await fetchVariablesComboboxData();
    setVariablesComboboxData(localVariablesComboboxData.sort((a, b) => a.label.localeCompare(b.label)));

    setVariableObjectConfig(getVariableObjectConfig(tagsComboboxData, entityComboboxData, entityVersionsComboboxData, localDescriptiveRatingComboxData, localVariablesComboboxData, descriptionEditor, interpretationEditor, bShowDescriptionBlock, bShowInterpretationBlock));
    
    console.log("descriptionEditor: ", descriptionEditor);
    console.log("interpretationEditor: ", interpretationEditor);
  };

  useEffect(() => {
    prepData();
  }, []);

  useEffect(() => {
    if (descriptionEditor && interpretationEditor && descriptionEditor?.isEditable && interpretationEditor?.isEditable) {
      prepData();
    }
  }, [descriptionEditor, interpretationEditor, descriptionEditor?.isEditable, interpretationEditor?.isEditable, bShowDescriptionBlock, bShowInterpretationBlock]);
  
  useEffect(() => {
    if (variableDraft.content?.bCreateDescription !== bShowDescriptionBlock) setShowDescriptionBlock(variableDraft.content?.bCreateDescription);
    if (variableDraft.content?.bCreateInterpretation !== bShowInterpretationBlock) setShowInterpretationBlock(variableDraft.content?.bCreateInterpretation);
  }, [variableDraft.content?.bCreateDescription, variableDraft.content?.bCreateInterpretation]);

  useEffect(() => {
    const newVariable = mergeUndefined(variable, emptyVariable);
    if (!newVariable.idToken.variableId) newVariable.idToken.variableId = generateUUID();
    setVariableDraft(newVariable);
    console.log("newVariable: ", newVariable);
  }, [variable]);

  const handleVariableDraftPropertyUpdate = (id: string | number, path: PathsToFields<Variable>, value: any) => {
    const updatedVariable = {...variableDraft};
    if (path === 'metadata.visibility' || path === "metadata.percentileRankVisibility" || path === "metadata.descriptiveRatingVisibility") value = parseInt(value);
    else if (path === 'idToken.entityId') setValueByPath(updatedVariable, "associatedEntityAbbreviatedName", entityRecords[value].abbreviatedName);
    //else if(path === 'content.bCreateDescription') setShowDescriptionBlock(value); // Handled in useEffect
    //else if(path === 'content.bCreateInterpretation') setShowInterpretationBlock(value); // Handled in useEffect
    setValueByPath(updatedVariable, path, value);
    setVariableDraft(updatedVariable);
    console.log("updatedVariable: ", updatedVariable);
  };

  // TODO: Currently, description and interpretation blocks can only be "not updated" (by setting corresponding checkbox to false), but deletion needs to occur manually in the database. Eventually move to a more robust solution.
  const handleSave = () => {
    onSave({
      ...variableDraft,
      content: {
        ...variableDraft.content,
        description: variableDraft?.content?.bCreateDescription ? convertVariableContentToBlock(variableDraft, descriptionEditor, 'description') : undefined,
        interpretation: variableDraft?.content?.bCreateInterpretation ? convertVariableContentToBlock(variableDraft, interpretationEditor, 'interpretation') : undefined,
      },
    });
    onClose();
  };

  const handleCopyVariableSelection = async (value: string) => {
    const variableToCopy = await fetchVariable({ variableId: value });
    if (variableToCopy) {
      variableToCopy.idToken.cloneWithChanges({
        variableId: variableDraft.idToken.variableId,
      })
      setVariableDraft(variableToCopy);
    }
  }

  return (
    <Modal opened={bOpened} onClose={() => onClose()} title={`Edit Variable`} closeOnClickOutside={false} fullScreen>
      <Stack w={"100%"} align='center'>
        <SingleSelectDropdown options={variablesComboboxData} label='Select Variable To Copy' value={variableDraft?.idToken.variableId} onChange={handleCopyVariableSelection} />
        { variableDraft && variableObjectConfig && <InfoFieldObjectProperties config={variableObjectConfig} data={variableDraft} onUpdate={handleVariableDraftPropertyUpdate} /> }
        <Button onClick={handleSave}>{"Save"}</Button>
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
