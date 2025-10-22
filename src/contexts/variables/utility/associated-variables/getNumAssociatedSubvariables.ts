import { Variable } from "../../../../types";

export const getNumAssociatedSubvariables = (variable: Variable) => {
  // Check if `associatedSubvariablePropertyMap` exists and return the size of the Map
  const associatedSubvariableProperties = variable.getMetadata()?.associatedSubvariableProperties;
  return associatedSubvariableProperties ? associatedSubvariableProperties.length : 0; // Return 0 if `associatedSubvariablePropertyMap` does not exist
};
