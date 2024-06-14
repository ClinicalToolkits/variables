import { logger } from "@clinicaltoolkits/utility-functions";
import { abbreviateString, createLabel } from "@clinicaltoolkits/utility-functions";
import { VariableSet, VariableIdsBySubgroup, VariableIdToken } from "../../types";

type CreateVariableSetParams = Omit<VariableSet, "key" | "variableKeys" | "variableIds"> & {
  variableIds: VariableIdsBySubgroup;
  entityVersionId?: string;
};

export const createVariableSet = ({ idToken, label, variableIds, metadata }: CreateVariableSetParams): VariableSet => {
  const variableIdsAll: string[] = [];
  const variableSubgroups: VariableIdsBySubgroup = {};

  // Assuming the input structure matches the expected new format
  Object.entries(variableIds).forEach(([subgroupTag, { required, optional }]) => {
    // Initialize subgroup entries
    variableSubgroups[subgroupTag] = {};

    const processVariables = (variableIds: string[] | undefined, optionalGroupingKey: 'required' | 'optional') => {
      const subgroupVariableIds: string[] = [];
      const ids: string[] = variableIds?.map(id => {
        let variableIdToken = idToken.cloneWithChanges({ variableId: id });
        logger.debug(`createVariableSet() - Pushing ${id} variableIdToken: ${variableIdToken}.`);

        // Adding to all lists
        subgroupVariableIds.push(variableIdToken.id);
        variableIdsAll.push(variableIdToken.id);

        return variableIdToken.id;
      }) ?? [];

      if (ids.length > 0) {
        variableSubgroups[subgroupTag][optionalGroupingKey] = subgroupVariableIds;
      }
    };

    processVariables(required, 'required');
    processVariables(optional, 'optional');
  });

  const variableSet: VariableSet = {
    idToken,
    label: label.toUpperCase(),
    variableIds: {
      all: variableIdsAll,
      subgroups: variableSubgroups,
    },
    metadata,
  };

  return variableSet;
};

  /*const abbreviatedSubversion = subversion ? abbreviateString(subversion) : undefined;
  let setKey = createLabel({
    abbreviatedName: abbreviatedName,
    version: version,
    subversion: abbreviatedSubversion
  });

  const variableIdsAll: string[] = [];
  const variableKeysAll: string[] = [];
  const variableKeysMain: string[] = [];
  const variableKeysOptional: string[] = [];

  variableIds.main?.forEach((id) => {
    let variableKey = id;
    if (abbreviatedSubversion) variableKey = variableKey.concat(`_${abbreviatedSubversion}`);
    console.log("pushing variableKey:", variableKey);
    variableIdsAll.push(id);
    variableKeysAll.push(variableKey);
    variableKeysMain.push(variableKey);
  });

  variableIds.optional?.forEach((id) => {
    let variableKey = id;
    if (abbreviatedSubversion) variableKey = variableKey.concat(`_${abbreviatedSubversion}`);
    console.log("pushing optional variableKey:", variableKey);
    variableIdsAll.push(id);
    variableKeysAll.push(variableKey);
    variableKeysOptional.push(variableKey);
  });

  const returnIds = {
    all: variableIdsAll,
    main: variableIds.main ? variableIds.main : undefined,
    optional: variableIds.optional ? variableIds.optional : undefined,
  };

  const returnKeys = {
    all: variableKeysAll,
    main: variableKeysMain.length > 0 ? variableKeysMain : undefined,
    optional: variableKeysOptional.length > 0 ? variableKeysOptional : undefined,
  };

  const variableSet: VariableSet = {
    id: id,
    entityId: entityId,
    key: setKey,
    abbreviatedName: abbreviatedName,
    version: version,
    subversion: subversion,
    variableIds: returnIds,
    variableKeys: returnKeys,
    metadata: metadata,
  };

  return variableSet;
}*/
