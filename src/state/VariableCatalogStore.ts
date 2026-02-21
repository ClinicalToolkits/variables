// stores/VariableCatalogStore.ts (factory version)
import { logger, createReactiveStore } from "@clinicaltoolkits/utility-functions";
import { Variable, VariableGroup, VariableGroupMap, VariableMap, VariableFunctions, VariableId, VariableValue } from "../types";
import { makeUseStore } from "@clinicaltoolkits/universal-react-components";
import { instrumentVariableMap } from "./variableMapDebug";
import { propagateVariableUpdates } from "../types/functions/automated-updates/deriveAutoVariableUpdates";

export interface CatalogState {
  variableMap: VariableMap;
  variableGroupMap: VariableGroupMap;
}

export function createVariableCatalogStore() {
  const store = createReactiveStore<CatalogState>({
    variableMap: instrumentVariableMap(new Map<string, Variable>(), "VariableCatalogStore.variableMap"),
    variableGroupMap: new Map<string, VariableGroup>(),
  });

  // ------------ reads ------------
  const hasVariable = (id: string): boolean => store.snapshot.variableMap.has(id);

  const hasVariableBatch = (ids: readonly string[]): boolean =>
    ids.every(id => hasVariable(id));

  const getVariable = (id: string): Variable | undefined =>
    store.snapshot.variableMap.get(id);

  const getVariableBatch = (ids: readonly string[]): Variable[] =>
    ids.map(id => getVariable(id)).filter((v): v is Variable => v !== undefined);

  const getChildrenOf = (id: string): Variable[] => {
    const variable = store.snapshot.variableMap.get(id);
    if (!variable) return [];
    const childIds = variable.getMetadata()?.childVariableIds ?? [];
    const out: Variable[] = [];
    for (const cid of childIds) {
      const child = store.snapshot.variableMap.get(cid);
      if (child) out.push(child);
    }
    return out;
  };

  const getParentIdOf = (id: string): string | undefined => {
    const variable = store.snapshot.variableMap.get(id);
    return variable?.getAssociatedCompositeVariableId();
  };

  const getSiblingsOf = (id: string): Variable[] => {
    const parentId = getParentIdOf(id);
    if (!parentId) return [];
    const siblings = getChildrenOf(parentId).filter(v => v.getId() !== id);
    return siblings;
  };

  const getGroup = (id: string): VariableGroup | undefined =>
    store.snapshot.variableGroupMap.get(id);

  const getVariablesByGroup = (opts: {
    groupId: string;
    includeChildren?: boolean;
    includeHidden?: boolean;
  }): Variable[] => {
    const { groupId, includeChildren, includeHidden } = opts;
    const s = store.snapshot.variableGroupMap.get(groupId);
    if (!s?.variableIds?.length) return [];
    const res: Variable[] = [];
    for (const id of s.variableIds) {
      const variable = getVariable(id);
      if (!variable) continue;
      if (variable.isVisible() || includeHidden) res.push(variable);
      if (includeChildren) {
        for (const kv of getChildrenOf(id)) {
          if (kv.isVisible() || includeHidden) res.push(kv);
        }
      }
    }
    return res;
  };

  const getVariableIdsByGroup = (opts: {
    groupId: string;
    includeChildren?: boolean;
    includeHidden?: boolean;
  }): string[] => {
    const variables = getVariablesByGroup(opts);
    return variables.map(v => v.getId());
  };

  const addVariable = (inVariable: Variable): void => {
    addVariables([inVariable]);
  };

  // ------------ writes (rare) ------------
  const addVariables = (inVariables: readonly Variable[]): void => {
    if (!inVariables.length) return;
  
    const variableGroupMap: VariableGroupMap = new Map();
  
    // 1) Start from current snapshot
    let next = instrumentVariableMap(
      new Map(store.snapshot.variableMap),
      "VariableCatalogStore.next"
    );
  
    // 2) Upsert all provided variables first (no derivations yet)
    const changedIds: VariableId[] = [];
  
    for (const addedVariable of inVariables) {
      const id = addedVariable.getId();
      next.set(id, addedVariable);
      changedIds.push(id);
  
      // group bookkeeping (unchanged)
      const groupId = addedVariable.getEntityVersionId()?.toString();
      if (groupId) {
        if (!variableGroupMap.has(groupId)) variableGroupMap.set(groupId, { id: groupId, variableIds: [] });
        variableGroupMap.get(groupId)!.variableIds.push(id);
      }
    }
  
    // 3) Run deterministic propagation ONCE
    next = propagateVariableUpdates({
      base: next,
      changedIds,
      maxIterations: 50,
    });
  
    logger.debug("VariableCatalogStore::addVariables() - Updated variableMap: ", next);
  
    // 4) Single state update
    store.setState({ variableMap: next });
  
    // 5) Group updates (same as before)
    addVariableGroupBatch(variableGroupMap);
  };  

  const addVariableGroup = (inGroup: VariableGroup): void => {
    const next = new Map(store.snapshot.variableGroupMap);
    next.set(inGroup.id, inGroup);
    store.setState({ variableGroupMap: next });
  };

  const addVariableGroupBatch = (inGroupMap: VariableGroupMap): void => {
    const next = new Map(store.snapshot.variableGroupMap);

    for (const [groupId, group] of inGroupMap) {
      if (!next.has(groupId)) {
        next.set(groupId, group);
      } else {
        const existing = next.get(groupId)!;
        const merged = new Set<string>([...existing.variableIds, ...group.variableIds]);
        next.set(groupId, { ...existing, variableIds: Array.from(merged) });
      }
    }

    store.setState({ variableGroupMap: next });
  };

  const setVariableValue = (id: VariableId, value: VariableValue): void => {
    const variable = store.snapshot.variableMap.get(id);
    if (variable) {
      const updatedVariable = variable.withValue(value);
      addVariable(updatedVariable);
    }
  };

  const removeVariable = (id: string): void => {
    if (!store.snapshot.variableMap.has(id)) return;
    const next = new Map(store.snapshot.variableMap);
    next.delete(id);
    store.setState({ variableMap: next });
  };

  const removeVariables = (ids: readonly string[]): void => {
    ids.forEach(id => removeVariable(id));
  };

  /**  
   * Removes a variable group by its ID. Does nothing if the group does not exist.
   * Returns variable ids that were part of the removed group for further handling.
   */
  const removeGroup = (id: string): VariableId[] => {
    if (!store.snapshot.variableGroupMap.has(id)) return [];
    const next = new Map(store.snapshot.variableGroupMap);
    const variableIds = next.get(id)?.variableIds ?? [];
    next.delete(id);
    store.setState({ variableGroupMap: next });
    return variableIds;
  };

  const clear = (): void => {
    store.setState({
      variableMap: new Map(),
      variableGroupMap: new Map(),
    });
  };

  // -------- public API (parity with class + base reactive-store) --------
  const api = {
    // base reactive-store surface
    subscribe: store.subscribe,
    setState: store.setState,
    replaceState: store.replaceState,
    batch: store.batch,
    get snapshot() { return store.snapshot; },

    // reads
    hasVariable,
    hasVariableBatch,
    getVariable,
    getVariableBatch,
    getChildrenOf,
    getParentIdOf,
    getSiblingsOf,
    getGroup,
    getVariablesByGroup,
    getVariableIdsByGroup,

    // writes
    addVariable,
    addVariables,
    setVariableValue,
    removeVariable,
    removeVariables,
    removeGroup,
    clear,
  } as const;

  return api;
}

/* singleton + hook (parity with previous export) */
export const variableCatalogStore = createVariableCatalogStore();
export const useVariableCatalogStoreState = makeUseStore(variableCatalogStore);
export { variableCatalogStore as catalogStore }
export { useVariableCatalogStoreState as useCatalogState }
