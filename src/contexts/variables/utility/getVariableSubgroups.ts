import { addSpaces, capitalizeFirstLetter } from "@clinicaltoolkits/utility-functions";
import { VariableSet, VariableMap, Variable } from "../../../types";
import { shouldDisplayVariables } from "./shouldDisplayVariables";

export const getRequiredVariableSubgroups = (variableSet: VariableSet): Record<string, string[]> => {
  const variableIdsBySubgroup = variableSet.variableIds.subgroups;
  const requiredVariableSubgroups: Record<string, string[]> = {};

  if (variableIdsBySubgroup) {
    Object.entries(variableIdsBySubgroup).forEach(([subgroupTag, { required }]) => {
      if (required && required.length > 0) {
        requiredVariableSubgroups[subgroupTag] = required;
      }
    });
  }

  return requiredVariableSubgroups;
};

export const getOptionalVariableSubgroups = (variableSet: VariableSet): Record<string, string[]> => {
  const variableIdsBySubgroup = variableSet.variableIds.subgroups;
  const optionalVariableSubgroupKeys: Record<string, string[]> = {};

  if (variableIdsBySubgroup) {
    Object.entries(variableIdsBySubgroup).forEach(([subgroupTag, { optional }]) => {
      if (optional && optional.length > 0) {
        optionalVariableSubgroupKeys[subgroupTag] = optional;
      }
    });
  }

  return optionalVariableSubgroupKeys;
};

export const getVariableSubgroupsToDisplay = (variableSet: VariableSet, variableMap: VariableMap): Record<string, string[]> => {
  const requiredVariableSubgroups = getRequiredVariableSubgroups(variableSet);
  const optionalVariableSubgroups = getOptionalVariableSubgroups(variableSet);

  // Determine sort order using required variables
  const subgroupOrder = Object.entries(requiredVariableSubgroups).map(([subgroup, vars]) => ({
    subgroup,
    minOrder: Math.min(...vars.map(varKey => variableMap.get(varKey)?.orderWithinSet ?? Infinity))
  }))
  .sort((a, b) => a.minOrder - b.minOrder)
  .map(entry => entry.subgroup);

  // Initialize variableSubgroupsToDisplay with sorted requiredVariableSubgroups
  const variableSubgroupsToDisplay: Record<string, string[]> = {};
  subgroupOrder.forEach(subgroup => {
    variableSubgroupsToDisplay[subgroup] = requiredVariableSubgroups[subgroup];
  });

  Object.entries(requiredVariableSubgroups).forEach(([subgroupTag, required]) => {
    variableSubgroupsToDisplay[subgroupTag] = required;
  });

  // Merge optional variables without affecting the sort order
  Object.entries(optionalVariableSubgroups).forEach(([subgroupTag, optional]) => {
    if (shouldDisplayVariables(optional, variableMap)) {
      if (variableSubgroupsToDisplay[subgroupTag]) {
        variableSubgroupsToDisplay[subgroupTag] = variableSubgroupsToDisplay[subgroupTag].concat(optional);
      } else {
        variableSubgroupsToDisplay[subgroupTag] = optional;
      }
    }
  });

  return variableSubgroupsToDisplay;
};

export function getSubgroupNameForVariable(variable: Variable): string {
  const bOptionalVariable = variable.metadata?.bOptional;
  // Default to "Optional Items" or "Required Items" if the variable does not have a subgroup tag
  let pluralizedName = bOptionalVariable ? "Optional Items" : "Required Items";
  if (variable.subgroupTag) {
    if (variable.subgroupTag?.metadata?.pluralName) {
      // If the subgroup tag has a plural name, use that as the name of the subgroup
      pluralizedName = addSpaces({ text: variable.subgroupTag?.metadata?.pluralName, bTitleCase: true });
      if (bOptionalVariable) {
        pluralizedName = `Optional ${pluralizedName}`;
      }
    } else {
      // If the subgroup tag does not have a plural name, use the name of the subgroup tag and pluralize it by adding an 's'
      pluralizedName = `${addSpaces({ text: variable.subgroupTag.name, bTitleCase: true })}s`;
      if (bOptionalVariable) {
        pluralizedName = `Optional ${pluralizedName}`;
      }
    }
  }
  return pluralizedName;
}

/*
import { Section } from "../../../type-definitions";
import { shouldDisplayVariableSubgroup } from "./shouldDisplayVariableSubgroup";

export const getRequiredVariableSubgroups = (section: Section): Record<string, string[]> => {
  const variableSubgroupKeys = section.metadata?.variableSet?.variableKeys.subgroups;
  const requiredVariableSubgroups: Record<string, string[]> = {};

  if (variableSubgroupKeys) {
    Object.entries(variableSubgroupKeys).forEach(([subgroupTag, { required }]) => {
      if (required && required.length > 0) {
        requiredVariableSubgroups[subgroupTag] = required;
      }
    });
  }

  return requiredVariableSubgroups;
};

export const getOptionalVariableSubgroups = (section: Section): Record<string, string[]> => {
  const variableSubgroupKeys = section.metadata?.variableSet?.variableKeys.subgroups;
  const optionalVariableSubgroupKeys: Record<string, string[]> = {};

  if (variableSubgroupKeys) {
    Object.entries(variableSubgroupKeys).forEach(([subgroupTag, { optional }]) => {
      if (optional && optional.length > 0) {
        optionalVariableSubgroupKeys[subgroupTag] = optional;
      }
    });
  }

  return optionalVariableSubgroupKeys;
};

export const getVariableSubgroupsToDisplay = (section: Section): Record<string, string[]> => {
  const requiredVariableSubgroups = getRequiredVariableSubgroups(section);
  const optionalVariableSubgroups = getOptionalVariableSubgroups(section);

  const variableSubgroupsToDisplay: Record<string, string[]> = {};

  Object.entries(requiredVariableSubgroups).forEach(([subgroupTag, required]) => {
    variableSubgroupsToDisplay[subgroupTag] = required;
  });

  Object.entries(optionalVariableSubgroups).forEach(([subgroupTag, optional]) => {
    if (shouldDisplayVariableSubgroup(subgroupTag, section)) {
      if (variableSubgroupsToDisplay[subgroupTag]) {
        variableSubgroupsToDisplay[subgroupTag] = variableSubgroupsToDisplay[subgroupTag].concat(optional);
      } else {
        variableSubgroupsToDisplay[subgroupTag] = optional;
      }
    }
  });

  return variableSubgroupsToDisplay;
};
*/
