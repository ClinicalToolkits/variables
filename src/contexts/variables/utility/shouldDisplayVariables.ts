import { VariableMap, Variable } from "../../../types";

export const shouldDisplayVariables = (variableKeys: string[], variableMap: VariableMap) => {
  return variableKeys.every((variableKey) => {
    const variable = variableMap.get(variableKey);
    return variable ? shouldDisplayVariable(variable) : false;
  });
};
/*export const shouldDisplayVariableSubgroup = (subgroupName?: string, section?: Section) => {
  if (!subgroupName) {
    return false;
  }

  if (section && section.metadata?.variableSubgroupVisibility?.hasOwnProperty(subgroupName)) {
    return section.metadata.variableSubgroupVisibility[subgroupName];
  }
  // Default to false if the section or group is not found
  return false;
};*/

export const shouldDisplayVariable = (variable: Variable) => {
  const bShouldDisplay = !variable.metadata?.bHidden ?? true;
  return bShouldDisplay;

};

/*export const shouldDisplayVariable = (variable: Variable, section?: Section) => {
  console.log("shouldDisplayVariable", variable?.key, section?.fullName);
  if (!section) {
    return false;
  }
  
  const optionalVariableKeys = variable?.subgroupTag?.name ? getOptionalVariableSubgroups(section)[variable?.subgroupTag?.name] : undefined;
  const bOptionalVariable = optionalVariableKeys?.includes(variable.key);
  console.log("shouldDisplayVariable bOptionalVariable", bOptionalVariable, variable?.key, variable?.subgroupTag?.name, optionalVariableKeys, section?.fullName);
  if (!bOptionalVariable) {
    return true;
  }

  return shouldDisplayVariableSubgroup(variable?.subgroupTag?.name, section);
};*/