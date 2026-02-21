import { addSpaces } from "@clinicaltoolkits/utility-functions";
import { VariableMap, Variable } from "..";

export const getRequiredVariables = (inVariables: Variable[]): Variable[] => {
  return inVariables.filter(variable => !variable.getMetadata()?.bOptional);
};

export const getOptionalVariables = (inVariables: Variable[]): Variable[] => {
  return inVariables.filter(variable => variable.getMetadata()?.bOptional);
};

export type GetVariableSubgroupsToDisplayReturnType = {
  subgroupsToDisplay: Record<string, string[]>;
  optionalSubgroups?: Record<string, string[]>;
  requiredSubgroups?: Record<string, string[]>;
}

export const getVariableSubgroupsToDisplay = (inVariables: Variable[]): GetVariableSubgroupsToDisplayReturnType => {
  const requiredVariables = getRequiredVariables(inVariables);
  const optionalVariables = getOptionalVariables(inVariables);

  // Buckets
  const requiredByGroup = new Map<string, Variable[]>();
  const optionalByGroup = new Map<string, Variable[]>();
  const minRequiredOrder = new Map<string, number>();

  const keyOf = (v: Variable) => v.getCategory()?.trim();

  // Partition required
  for (const variable of requiredVariables) {
    const category = variable.getCategory();
    const variableArray = requiredByGroup.get(category);
    if (variableArray) variableArray.push(variable);
    else requiredByGroup.set(category, [variable]);

    const orderWithinSet = variable.getOrderWithinSet();
    const prev = minRequiredOrder.get(category);
    if (prev === undefined || orderWithinSet < prev) minRequiredOrder.set(category, orderWithinSet);
  }

  // Partition optional
  for (const variable of optionalVariables) {
    const category = keyOf(variable);
    const variableArray = optionalByGroup.get(category);
    if (variableArray) variableArray.push(variable);
    else optionalByGroup.set(category, [variable]);
  }


  // Sort within each bucket by orderWithinSet (ascending)
  const byOrder = (a: Variable, b: Variable) => a.getOrderWithinSet() - b.getOrderWithinSet();

  for (const requiredVariableArray of requiredByGroup.values()) requiredVariableArray.sort(byOrder);
  for (const optionalVariableArray of optionalByGroup.values()) optionalVariableArray.sort(byOrder);

  // Group order: determined only by REQUIRED groups' min order
  // (no tie-breaker to preserve legacy semantics / engine-stable sort)
  const subgroupOrder = Array.from(requiredByGroup.keys())
    .map(k => ({ k, min: minRequiredOrder.get(k)! }))
    .sort((a, b) => a.min - b.min)
    .map(e => e.k);

  // Initialize output with REQUIRED groups (in computed order)
  const subgroupsToDisplay: Record<string, string[]> = {};
  for (const k of subgroupOrder) {
    const req = requiredByGroup.get(k)!;
    subgroupsToDisplay[k] = req.map(v => v.getId());
  }

  // Merge OPTIONAL vars:
  // - If group already exists, append IDs (keeps required-first ordering).
  // - If group is optional-only: include it only if shouldDisplayVariables says true,
  //   then append after required groups (object insertion order).
  for (const [k, optVars] of optionalByGroup) {
    const optIds = optVars.map(v => v.getId());

    if (subgroupsToDisplay[k]) {
      subgroupsToDisplay[k] = subgroupsToDisplay[k].concat(optIds);
    } else {
      // mirror original: gate optional-only subgroups
      if (inVariables.every(v => v.isVisible())) {
        subgroupsToDisplay[k] = optIds; // appended after required groups
      }
    }
  }

  let optionalSubgroups: Record<string, string[]> | undefined = undefined;

  if (optionalByGroup.size > 0) {
    optionalSubgroups = {};

    for (const [k, optVars] of optionalByGroup) {
      const optIds = optVars.map(v => v.getId());
      optionalSubgroups[k] = optIds;
    }
  }

  let requiredSubgroups: Record<string, string[]> | undefined = undefined;
  if (requiredByGroup.size > 0) {
    requiredSubgroups = {};

    for (const [k, reqVars] of requiredByGroup) {
      const reqIds = reqVars.map(v => v.getId());
      requiredSubgroups[k] = reqIds;
    }
  }

  const out = {
    subgroupsToDisplay,
    optionalSubgroups,
    requiredSubgroups,
  }

  return out;
};

export function getSubgroupNameForVariable(variable: Variable): string {
  const bOptionalVariable = variable.getMetadata()?.bOptional;
  // Default to "Optional Items" or "Required Items" if the variable does not have a subgroup tag
  let pluralizedName = bOptionalVariable ? "Optional Items" : "Required Items";
  const subgroupTag = variable.getSubgroupTag();
  if (subgroupTag) {
    const pluralName = subgroupTag.metadata?.pluralName;
    if (pluralName) {
      // If the subgroup tag has a plural name, use that as the name of the subgroup
      pluralizedName = addSpaces({ text: pluralName, bTitleCase: true });
      if (bOptionalVariable) {
        pluralizedName = `Optional ${pluralizedName}`;
      }
    } else {
      // If the subgroup tag does not have a plural name, use the name of the subgroup tag and pluralize it by adding an 's'
      pluralizedName = `${addSpaces({ text: subgroupTag.name, bTitleCase: true })}s`;
      if (bOptionalVariable) {
        pluralizedName = `Optional ${pluralizedName}`;
      }
    }
  }
  return pluralizedName;
}

export type BuildVariableGroupsReturnType = {
  builtGroups: Record<string, VariableMap>;
} & GetVariableSubgroupsToDisplayReturnType;

// Builds subgroup -> VariableMap in the exact order from getVariableSubgroupsToDisplay
// - Skips child roots (parentVariableId defined)
// - Inserts each parent's children immediately after the parent (sorted by orderWithinSet)
// - Drops empty / all-hidden groups
export function buildVariableGroups(
  variables: Variable[],
  variableMap: VariableMap,
  getChildVariables: (v: Variable, variableMap: VariableMap) => Variable[] | null
): BuildVariableGroupsReturnType {
  if (!variables?.length) return {
    builtGroups: {},
    subgroupsToDisplay: {},
    optionalSubgroups: undefined,
    requiredSubgroups: undefined,
  };

  const { subgroupsToDisplay, optionalSubgroups, requiredSubgroups } = getVariableSubgroupsToDisplay(variables);

  const grouped: Record<string, VariableMap> = {};
  for (const [groupName, ids] of Object.entries(subgroupsToDisplay)) {
    const map = new Map<string, Variable>();
    const seen = new Set<string>();

    for (const id of ids) {
      const v = variableMap.get(id);
      if (!v) continue;

      // skip child roots (children get injected under their parent)
      const isChildRoot = v.getMetadata()?.properties?.childVariable?.parentVariableId !== undefined;
      if (isChildRoot) continue;

      if (!v.isHidden()) {
        map.set(v.getId(), v);
        seen.add(v.getId());
      }

      // insert children directly after the parent
      let children = getChildVariables(v, variableMap) ?? [];
      if (children.length > 1) {
        children = [...children].sort(
          (a, b) => a.getOrderWithinSet() - b.getOrderWithinSet()
        );
      }
      for (const c of children) {
        const cid = c.getId();
        if (seen.has(cid)) continue;
        if (c.isHidden()) continue;
        map.set(cid, c);
        seen.add(cid);
      }
    }

    if (map.size > 0) {
      const allHidden = Array.from(map.values()).every(v => v.isHidden());
      if (!allHidden) grouped[groupName] = map;
    }
  }

  return {
    builtGroups: grouped,
    subgroupsToDisplay,
    optionalSubgroups,
    requiredSubgroups,
  };
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
