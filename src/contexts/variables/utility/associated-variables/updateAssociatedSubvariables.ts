import { isEmptyValue, logger } from "@clinicaltoolkits/utility-functions";
import { Variable, VariableValue } from "../../../../types";

type UpdateAssociatedSubvariablePropertiesParams = {
  variable: Variable;
  subvariableId: string;
  subVariableValue: VariableValue;
};

export const updateAssociatedSubvariableProperties = ({ variable, subvariableId, subVariableValue }: UpdateAssociatedSubvariablePropertiesParams) => {
  // Ensure metadata exists
  if (variable.metadata) {
    // Initialize associatedSubvariable array if it doesn't exist
    if (!variable.metadata.associatedSubvariableProperties) {
      variable.metadata.associatedSubvariableProperties = [];
    }

    // Determine if the subvariable value is null (or equivalent) and update accordingly
    const isValueNull = isEmptyValue(subVariableValue);

    // Update the associatedSubvariablePropertyMap
    // If subVariableValue is null, set the associated property to false, otherwise true
    variable.metadata.associatedSubvariableProperties = variable.metadata.associatedSubvariableProperties.map((subvariableProperty) => {
      if (subvariableProperty.id === subvariableId) {
        return {
          ...subvariableProperty,
          bValueEntered: !isValueNull,
        };
      }
      return subvariableProperty;
    });

    logger.log(`Updated associatedSubvariableProperties for ${subvariableId}: ${!isValueNull}`);
  } else {
    logger.error("Variable metadata is missing");
  }
};
