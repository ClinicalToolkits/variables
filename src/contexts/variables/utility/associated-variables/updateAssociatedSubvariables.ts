import { isEmptyValue, logger } from "@clinicaltoolkits/utility-functions";
import { Variable, VariableValue } from "../../../../types";
import { AssociatedSubobjectProperties } from "@clinicaltoolkits/type-definitions";

type UpdateAssociatedSubvariablePropertiesParams = {
  variable: Variable;
  subvariableId: string;
  subVariableValue: VariableValue;
};

export const updateAssociatedSubvariableProperties = ({ variable, subvariableId, subVariableValue }: UpdateAssociatedSubvariablePropertiesParams): AssociatedSubobjectProperties[] => {
  let out: AssociatedSubobjectProperties[] = [];
  // Ensure metadata exists
  const variableMetadata = variable.getMetadata();
  if (variableMetadata) {
    // Initialize associatedSubvariable array if it doesn't exist
    let currentAssociatedSubvariableProperties = variableMetadata.associatedSubvariableProperties || [];

    // Determine if the subvariable value is null (or equivalent) and update accordingly
    const isValueNull = isEmptyValue(subVariableValue);

    // Update the associatedSubvariablePropertyMap
    // If subVariableValue is null, set the associated property to false, otherwise true
    currentAssociatedSubvariableProperties = currentAssociatedSubvariableProperties.map((subvariableProperty) => {
      if (subvariableProperty.id === subvariableId) {
        return {
          ...subvariableProperty,
          bValueEntered: !isValueNull,
        };
      }
      return subvariableProperty;
    });

    out = currentAssociatedSubvariableProperties;
    logger.log(`Updated associatedSubvariableProperties for ${subvariableId}: ${!isValueNull}`);
  } else {
    logger.error("Variable metadata is missing");
  }

  return out;
};
