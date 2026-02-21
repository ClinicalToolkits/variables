// variable-value-store.ts
import { createValueStore, ComputePlugin, ValueConfig } from "@clinicaltoolkits/utility-functions"; // <-- your generic store
import type { VariableValue } from "../types";

// If you already have these elsewhere, keep them in one place:
export type ScopeId = string;   // e.g., documentId, entityVersionId, etc.
export type VariableId = string;

/**
 * Choose a single scoping strategy and stick to it:
 * - "doc::<uuid>"        // per document
 * - "entity::<uuid>::v::<uuid>" // per entity version
 * Make sure your persistence uses the same key.
 */

// ----------------- Compute plugins (OPTIONAL) -----------------
// Keep these as no-ops until you migrate logic from your reducer.
// They run synchronously *after* you call set/batchSet, before persistence,
// and receive both the composed patch and a `get(id)` for current values.

const sideEffectsPlugin: ComputePlugin<VariableValue> = ({ scope, get, patch }) => {
  // PLACEHOLDER: run your *in-memory* side-effects here.
  // Examples (use your own functions — do NOT import mine):
  //
  // for (const [id, next] of Object.entries(patch)) {
  //   const prev = get(id);
  //   if (Object.is(prev, next)) continue;
  //
  //   // 1) Update associated composite variable metadata
  //   // updateAssociatedSubvariableProperties({
  //   //   scope, subvariableId: id, subVariableValue: next
  //   // });
  //
  //   // 2) Push changes to children/siblings if you currently do that
  //   // updateChildVariables({ scope, changedId: id, get });
  //
  //   // 3) Validate or normalize (client-only)
  //   // validateVariableValue({ id, value: next });
  // }
  //
  // If you want to also *modify* values being committed (e.g., normalization),
  // return an object of additional/overriding assignments:
  // return { [someId]: normalizedValue, ... };
  //
  // Otherwise return nothing.
};

// Add more plugins later (order matters, left → right).
const compute: ComputePlugin<VariableValue>[] = [
  sideEffectsPlugin,
];

// ----------------- Persistence (REQUIRED) -----------------
const persistence = {
  async save(scope: ScopeId, patch: Readonly<Record<VariableId, VariableValue>>) {
    // PLACEHOLDER: write your real supabase/io layer here.
    // Example shape (Postgres):
    //   table: report_generator.variable_values(scope text, var_id uuid, value jsonb, primary key (scope, var_id))
    // Convert patch → rows and upsert:
    //
    // const rows = Object.entries(patch).map(([var_id, value]) => ({
    //   scope,
    //   var_id,
    //   value: value ?? null,
    // }));
    // await supabase.from("variable_values").upsert(rows, { onConflict: "scope,var_id" });
    //
    // PLACEHOLDER: If you need server-side fanout (e.g., update parent metadata),
    // do it in a DB trigger or RPC—keep client lightweight.
  },
};

// ----------------- Store instance -----------------
const cfg: ValueConfig<VariableValue> = {
  debounceMs: 300,      // adjust to taste
  compute,
  persistence,
};

export const variableValueStore = createValueStore(cfg);

// ----------------- Thin convenience API -----------------
export function setVariableValue(scope: ScopeId, id: VariableId, value: VariableValue) {
  // PLACEHOLDER (pre-set): call lightweight guards if desired
  // e.g., ensureDataTypeMatches(id, value);
  variableValueStore.set(scope, id, value);
}

export function setVariableValues(
  scope: ScopeId,
  patch: Readonly<Record<VariableId, VariableValue>>
) {
  // PLACEHOLDER (pre-batch): batch-level validation if needed
  variableValueStore.batchSet(scope, patch);
}

export function getVariableValue(scope: ScopeId, id: VariableId) {
  return variableValueStore.get(scope, id);
}

export function getScopeValues(scope: ScopeId) {
  return variableValueStore.getScope(scope);
}

export function flushVariableValues(scope: ScopeId) {
  return variableValueStore.flush(scope);
}
