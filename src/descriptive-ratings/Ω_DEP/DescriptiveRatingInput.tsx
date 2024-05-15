/*
import React, { useEffect, useState } from 'react';
import { InputField, InputFields } from '@clinicaltoolkits/universal-react-components';
import { DataType } from '@clinicaltoolkits/type-definitions';
import { DescriptiveRating } from '../../types';
import styles from "./styles.module.css";

const emptyDescriptiveRating: DescriptiveRating = {
  dataType: DataType.UNKNOWN,
  cutoffScore: 0,
  descriptor: '',
};

interface DescriptiveRatingInputProps {
  descriptiveRating: DescriptiveRating;
  onDescriptiveRatingUpdated: (updatedRating: DescriptiveRating) => void;
}

export const DescriptiveRatingInput = ({ descriptiveRating, onDescriptiveRatingUpdated }: DescriptiveRatingInputProps) => {
  const [inputFieldMap, setInputFieldMap] = useState<Map<string, InputField>>(new Map());
  const [nonChildInputFields, setNonChildInputFields] = useState<InputField[]>([]);

  useEffect(() => {
    const { inputFields, nonChildInputFields } = descriptiveRatingToInputFields(descriptiveRating, 0);
    setInputFieldMap(new Map(inputFields.map(field => [field.key, field])));
    setNonChildInputFields(nonChildInputFields);
  }, [descriptiveRating]);

  const handleFieldUpdate = (updatedField: InputField) => {
    setInputFieldMap(prevMap => {
      const newMap = new Map(prevMap);
      newMap.set(updatedField.key, updatedField);
      const updatedRating: DescriptiveRating = { ...descriptiveRating }; // Clone the current rating
      newMap.forEach((value, key) => {
        if (key in updatedRating) (updatedRating as any)[key] = value.value; // Update the cloned rating with new values
        (updatedRating as any)[key] = value.value; // Update the cloned rating with new values
      });
      onDescriptiveRatingUpdated(updatedRating); // Call the update callback only here
      return newMap;
    });
  };

  return (
    <InputFields
      inputFields={nonChildInputFields} 
      inputFieldMap={inputFieldMap} 
      onInputFieldUpdated={handleFieldUpdate} 
      props={{
        inputFields: {
          classNames: {
            root: styles.inputFieldRoot,
            labelFlex: styles.inputFieldLabelFlex,
            labelText: styles.inputFieldLabelText,
            componentGroup: styles.inputFieldComponentGroup,
          }
        },
        paper: {
          className: styles.inputFieldPaper,
        }
      }}
      dataTypesWithTwoFieldsOverride={new Set(['select', 'text'])}
    />
  );
}

const descriptiveRatingToInputFields = (rating: DescriptiveRating, index: number): { inputFields: InputField[], nonChildInputFields: InputField[] } => {
  const ratingKeys = Object.keys(rating) as Array<keyof DescriptiveRating>;
  const inputFields: InputField[] = [];
  const nonChildInputFields: InputField[] = [];

  ratingKeys.forEach(property => {
    let value = (rating as any)[property] ?? '';
    let type = 'text'; // Default type
    let metadata: any = {
      index,
    };

    switch (property) {
      case 'dataType':
        type = 'select';
        value = value || DataType.UNKNOWN;
        metadata = {
          ...metadata,
          options: Object.values(DataType).map(type => type),
          bChildField: true,
        };
        break;
      case 'cutoffScore':
        type = 'number';
        metadata = {
          ...metadata,
          childInputFieldKeys: [`dataType`, `descriptor`],
          bChildField: false,
        };
        break;
      case 'descriptor':
        type = 'text';
        metadata = {
          ...metadata,
          bChildField: true,
        };
        break;
      default:
        break;
    }

    inputFields.push({
      key: property,
      value,
      displayName: `${property}`,
      type,
      metadata,
    });

    if (!metadata.bChildField) {
      nonChildInputFields.push({
        key: property,
        value,
        displayName: "Descriptive Rating",
        type,
        metadata,
      });
    }
  });

  return { inputFields, nonChildInputFields };
};
*/