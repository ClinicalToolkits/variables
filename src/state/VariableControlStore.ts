// stores/ControlCatalogStore.ts (factory version)
import { EVisibility } from "@clinicaltoolkits/type-definitions";
import { createReactiveStore } from "@clinicaltoolkits/utility-functions";
import { makeUseStore } from "@clinicaltoolkits/universal-react-components";
import type { VariableControl, VariableControlTarget, VariableId } from "../types";
import type { Variable, VariableMap } from "../types";
import { variableCatalogStore } from "./VariableCatalogStore";

export type VariableControlId = string;

type ControlsById = Map<VariableControlId, VariableControl>;
type TargetsByVariableId = Map<VariableId, VariableControlTarget[]>;
type TargetIdsByControlId = Map<VariableControlId, VariableId[]>;   // controlId -> [variableId]
type ControlIdsByVariableId = Map<VariableId, VariableControlId[]>;  // variableId -> [controlId]
type ControlState = Map<VariableControlId, boolean>;            // controlId -> ON/OFF

export interface ControlStoreState {
  controlsById: ControlsById;
  targetsByVariableId: TargetsByVariableId;
  targetIdsByControlId: TargetIdsByControlId;
  controlIdsByVariableId: ControlIdsByVariableId;
  controlState: ControlState;
}


/** How this store reads/writes the variable layer (registered by the app). */
export interface VariableOps {
    /** Return a snapshot (Map) of all variables. */
    getVariableMap(): VariableMap;
    /** Upsert a batch of variables (immutably replacing in your catalog). */
    upsertVariables(vars: readonly Variable[]): void;
}
  
/* ---------------- variable ops registration (no circular deps) -------------- */

let variableOps: VariableOps | null = null;

/** Call once at app init. */
export function registerVariableOps(ops: VariableOps) {
    variableOps = ops;
}

export function createVariableControlStore() {
    const controlStore = createReactiveStore<ControlStoreState>({
        controlsById: new Map(),
        targetsByVariableId: new Map(),
        targetIdsByControlId: new Map(),
        controlIdsByVariableId: new Map(),
        controlState: new Map(),
    });

    /* ---------------- upserts (models only) ---------------- */
  
    /** Upsert controls (seeds state from default_value if unseen). */
    const upsertControls = (controls: readonly VariableControl[]) => {
        if (!controls.length) return;
        const controlsById = new Map(controlStore.snapshot.controlsById);
        const controlState = new Map(controlStore.snapshot.controlState);
        
        for (const ctrl of controls) {
            controlsById.set(ctrl.getId(), ctrl);
            if (!controlState.has(ctrl.getId())) {
            controlState.set(ctrl.getId(), !!ctrl.getDefaultValue());
            }
        }
        controlStore.setState({ controlsById, controlState });
    }

    /** Upsert targets (build both indexes for O(1) fan-out and fan-in). */
    const upsertControlTargets = (targets: readonly VariableControlTarget[]) => {
        if (!targets.length) return;
        const targetsByVariableId = new Map(controlStore.snapshot.targetsByVariableId);
        const targetIdsByControlId = new Map(controlStore.snapshot.targetIdsByControlId);
        const controlIdsByVariableId = new Map(controlStore.snapshot.controlIdsByVariableId);
      
        for (const t of targets) {
            const cid = t.getControlId();
            const vid = t.getVariableId();
        
            const a = targetIdsByControlId.get(cid) ?? [];
            if (!a.includes(vid)) a.push(vid);
            targetIdsByControlId.set(cid, a);
        
            const b = controlIdsByVariableId.get(vid) ?? [];
            if (!b.includes(cid)) b.push(cid);
            controlIdsByVariableId.set(vid, b);

            const c = targetsByVariableId.get(vid) ?? [];
            if (!c.find(target => target.getControlId() === cid)) c.push(t);
            targetsByVariableId.set(vid, c);
        }
        controlStore.setState({ targetsByVariableId, targetIdsByControlId, controlIdsByVariableId });
    };

    /* ---------------- state ---------------- */
    const getControlState = (controlId: VariableControlId): boolean => {
        return !!controlStore.snapshot.controlState.get(controlId);
    }

    const setControlState = (controlId: VariableControlId, on: boolean) => {
        const controlState = new Map(controlStore.snapshot.controlState);
        controlState.set(controlId, on);
        controlStore.setState({ controlState });
    }

    /* ---------------- selectors for rendering ---------------- */

    const getControlsForEntityVersion = (entityVersionId: string): VariableControl[] => {
        const out: VariableControl[] = [];
        for (const [, c] of controlStore.snapshot.controlsById) {
          if (c.getEntityVersionId() === entityVersionId) out.push(c);
        }
        out.sort((a, b) => a.getDisplayNameLong().localeCompare(b.getDisplayNameLong()));
        return out;
    }
    
    /** Controls that affect a single variable id (fast, via reverse index). */
    const getControlsForVariableId = (variableId: VariableId): VariableControl[] => {
        const ids = controlStore.snapshot.controlIdsByVariableId.get(variableId) ?? [];
        const out: VariableControl[] = [];
        for (const cid of ids) {
            const c = controlStore.snapshot.controlsById.get(cid);
            if (c) out.push(c);
        }
        return out;
    }
    
    /** Controls that affect any of the given variable ids (de-duped, still O(n)). */
    const getControlsForVariableIds = (variableIds: readonly VariableId[]): VariableControl[] => {
        if (!variableIds.length) return [];
        const seenCtrlIds = new Set<VariableControlId>();
        for (const vid of variableIds) {
            const ctrlIds = controlStore.snapshot.controlIdsByVariableId.get(vid) ?? [];
            for (const cid of ctrlIds) seenCtrlIds.add(cid);
        }
        const res: VariableControl[] = [];
        for (const cid of seenCtrlIds) {
            const c = controlStore.snapshot.controlsById.get(cid);
            if (c) res.push(c);
        }
        return res;
    }

    const getControlsForVariables = (variables: readonly Variable[]): VariableControl[] => {
        const variableIds = variables.map(v => v.getId());
        const controlsForVariableIds = getControlsForVariableIds(variableIds);
        return controlsForVariableIds;
    };

    const getControlTargetsForVariableId = (variableId: VariableId): VariableControlTarget[] => {
        return controlStore.snapshot.targetsByVariableId.get(variableId) ?? [];
    };

    const getControlTargetsForVariableIds = (variableIds: readonly VariableId[]): VariableControlTarget[] => {
        const out: VariableControlTarget[] = [];
        for (const vid of variableIds) {
        const targets = controlStore.snapshot.targetsByVariableId.get(vid);
        if (targets?.length) out.push(...targets);
        }
        return out;
    };
      
    /* ---------------- core: apply to variables (array in → array out) ---------------- */
    /** FIX: cascade correctly (use the progressively updated variable, not the original). */
    const applyControlsToVariable = (inVariable: Variable): Variable => {
        const controlIds = controlStore.snapshot.controlIdsByVariableId.get(inVariable.getId());
        if (!controlIds?.length) return inVariable;

        let updated = inVariable;
        for (const cid of controlIds) {
        const ctrl = controlStore.snapshot.controlsById.get(cid);
        if (!ctrl) continue;
        const on = !!controlStore.snapshot.controlState.get(cid);
        updated = ctrl.applyToVariable(updated, on); // <-- cascade uses `updated`, not `inVariable`
        }
        return updated;
    };

    /** Apply to an entire variable map (immutable; returns same ref if unchanged). */
    const applyControlsToVariableMap = (variableMap: VariableMap): VariableMap => {
        let changed = false;
        const next = new Map(variableMap);
        for (const [id, v] of variableMap) {
        const v2 = applyControlsToVariable(v);
        if (v2 !== v) { next.set(id, v2); changed = true; }
        }
        return changed ? next : variableMap;
    };

      /**
     * Recompute a specific set of variable ids by re-applying *all* of their controls,
     * then push changes to the variable layer via VariableOps.
     */
    const recomputeAndUpsertVariablesByIds = (variableIds: readonly VariableId[]) => {
        if (!variableOps || !variableIds.length) return;
        const map = variableOps.getVariableMap();

        const updated: Variable[] = [];
        for (const vid of variableIds) {
        const base = map.get(vid);
        if (!base) continue;

        const ctrlIds = controlStore.snapshot.controlIdsByVariableId.get(vid) ?? [];
        if (!ctrlIds.length) continue;

        // Apply all controls affecting this variable in cascade order (stable by ctrlIds order)
        let vOut = base;
        for (const cid of ctrlIds) {
            const ctrl = controlStore.snapshot.controlsById.get(cid);
            if (!ctrl) continue;
            const on = !!controlStore.snapshot.controlState.get(cid);
            vOut = ctrl.applyToVariable(vOut, on);
        }
        if (vOut !== base) updated.push(vOut);
        }

        if (updated.length) {
        variableOps.upsertVariables(updated);
        }
    };

      /**
     * Public entrypoint for the UI:
     * - set ON/OFF for a control
     * - recompute and upsert all variables targeted by that control
     */
    const toggleControl = (controlId: VariableControlId, nextOn: boolean) => {
        setControlState(controlId, nextOn);

        // Recompute only affected variables (fast fan-out via targetsByControl)
        const vids = controlStore.snapshot.targetIdsByControlId.get(controlId) ?? [];
        recomputeAndUpsertVariablesByIds(vids);
    };

    const api = {
        subscribe: controlStore.subscribe,
        get snapshot() { return controlStore.snapshot; },
    
        // selectors
        getControlsForEntityVersion,
        getControlsForVariableId,
        getControlsForVariableIds,
        getControlsForVariables,
        getControlTargetsForVariableId,
        getControlTargetsForVariableIds,
    
        // state
        getControlState,
        setControlState,
    
        // mutations / IO
        upsertControls,
        upsertControlTargets,
    
        // apply
        applyControlsToVariable,
        applyControlsToVariableMap,
    
        // main UI hook
        toggleControl,
    
        // variable IO registration
        registerVariableOps,
    };

    return api;
};

// TODO: Possibly revisit this pattern or at least create a separate file where we initialize any globals needed for the library to function.
registerVariableOps({
    getVariableMap: () => variableCatalogStore.snapshot.variableMap,
    upsertVariables: (vars) => variableCatalogStore.addVariables(vars),
});

export const variableControlStore = createVariableControlStore();
export const useVariableControlStoreState = makeUseStore(variableControlStore);
export { variableControlStore as controlStore };
export { useVariableControlStoreState as useControlState };
