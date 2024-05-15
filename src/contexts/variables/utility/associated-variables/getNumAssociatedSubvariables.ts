import { Variable } from "../../../../types";

export const getNumAssociatedSubvariables = (variable: Variable) => {
  // Check if `associatedSubvariablePropertyMap` exists and return the size of the Map
  if (variable.metadata?.associatedSubvariableProperties) {
    return variable.metadata.associatedSubvariableProperties.length;
  }
  return 0; // Return 0 if `associatedSubvariablePropertyMap` does not exist
};
