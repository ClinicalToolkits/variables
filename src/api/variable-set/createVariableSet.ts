import { logger } from "@clinicaltoolkits/utility-functions";
import { abbreviateString, createLabel } from "@clinicaltoolkits/utility-functions";
import { VariableSet, VariableIdsBySubgroup } from "../../types";

type CreateVariableSetParams = Omit<VariableSet, "key" | "variableKeys" | "variableIds"> & {
  variableIds: VariableIdsBySubgroup;
};

export const createVariableSet = ({ id, entityId, abbreviatedName, version, subversion, variableIds, metadata }: CreateVariableSetParams): VariableSet => {
  const abbreviatedSubversion = subversion ? abbreviateString(subversion) : undefined;
  let setKey = createLabel({
    abbreviatedName: abbreviatedName,
    version: version,
    subversion: abbreviatedSubversion,
  });

  const variableIdsAll: string[] = [];
  const variableKeysAll: string[] = [];
  const variableSubgroups: VariableIdsBySubgroup = {};
  const variableKeysSubgroups: VariableIdsBySubgroup = {};

  // Assuming the input structure matches the expected new format
  Object.entries(variableIds).forEach(([subgroupTag, { required, optional }]) => {
    // Initialize subgroup entries
    variableSubgroups[subgroupTag] = {};
    variableKeysSubgroups[subgroupTag] = {};

    const processVariables = (variables: string[] | undefined, key: 'required' | 'optional') => {
      const keys: string[] = variables?.map(id => {
        let variableKey = id;
        if (abbreviatedSubversion) variableKey = variableKey.concat(`_${abbreviatedSubversion}`);
        logger.debug(`createVariableSet() - Pushing ${key} variableKey: ${variableKey}.`);

        // Adding to all lists
        variableIdsAll.push(id);
        variableKeysAll.push(variableKey);

        return variableKey;
      }) ?? [];

      if (keys.length > 0) {
        variableSubgroups[subgroupTag][key] = variables;
        variableKeysSubgroups[subgroupTag][key] = keys;
      }
    };

    processVariables(required, 'required');
    processVariables(optional, 'optional');
  });

  const variableSet: VariableSet = {
    id,
    entityId,
    key: setKey,
    abbreviatedName,
    version,
    subversion: abbreviatedSubversion,
    variableIds: {
      all: variableIdsAll,
      subgroups: variableSubgroups,
    },
    variableKeys: {
      all: variableKeysAll,
      subgroups: variableKeysSubgroups,
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
