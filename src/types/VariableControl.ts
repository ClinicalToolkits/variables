import { Database } from "@clinicaltoolkits/ct-supabase";
import { defineModel, ModelInstance } from "@clinicaltoolkits/utility-functions";
import { Variable, VariableMap } from "./Variable";
import { EVisibility, getDisplayName } from "@clinicaltoolkits/type-definitions";

// ---------------- Helper Functions ----------------
function mapBooleanToPathValue(path: string, on: boolean): any {
    if (path.endsWith("metadata.visibility") || path === "visibility") return on ? "shown" : "hidden";
    //if (path.endsWith("value") || path === "value") return on; // Not implemented
    //if (path.endsWith("auto_calc") || path === "auto_calc") return on; // Not implemented
    //if (path.endsWith("required") || path === "required") return on; // Not implemented
    // default mirror
    return on;
}

// ---------------- VariableControl ----------------
export type VariableControlData = Database["report_generator"]["Tables"]["variable_controls"]["Row"];

export const VARIABLE_CONTROL_DATA_KEYS: Array<keyof VariableControlData> = [
    "id",
    "entity_version_id",
    "display_name",
    "description",
    "default_value",
    "created_at",
];

export interface VariableControlExtraMethods {
  /** Apply this control ON/OFF to a single Variable immutably. */
  applyToVariable(variable: Variable, on: boolean): Variable;

  /** Apply this control to many variables by id (immutably) */
  applyToVariables(
    variables: readonly Variable[],
    on: boolean
  ): Variable[];

    /** Get the long-form display name for this control. */
    getDisplayNameLong(): string;
}

const VARIABLE_CONTROL_NAME = "VariableControl" as const;
const VARIABLE_CONTROL_MODE = "strict" as const;

export type VariableControl = ModelInstance<VariableControlData, typeof VARIABLE_CONTROL_MODE, VariableControlExtraMethods, typeof VARIABLE_CONTROL_NAME>;

const VariableControlModel = defineModel<VariableControl>({
    name: VARIABLE_CONTROL_NAME,
    extras: {
        getDisplayNameLong() {
            return this.getDisplayName().singular.long;
        },
        applyToVariable(variable, on) {
        // TODO: Hardcoding only visibility for now, can extend later if needed.
            const path = this.getTargetPropertyPath();
            if (path !== "metadata.visibility") throw new Error(`VariableControlModel.applyToVariable only supports visibility path, got: ${path}`);

            const nextVal = on ? EVisibility.VISIBLE : EVisibility.HIDDEN;
            return variable.withVisibility(nextVal);
        },
        applyToVariables(variables, on) {
            return variables.map(v => this.applyToVariable(v, on));
        },
    },
    immutable: true,
    allKeys: VARIABLE_CONTROL_DATA_KEYS,
});

export const createVariableControl = VariableControlModel.create;
export const isVariableControl = VariableControlModel.is;

// ---------------- VariableControlTarget ----------------
export type VariableControlTargetData = Database["report_generator"]["Tables"]["variable_control_targets"]["Row"];
export const VARIABLE_CONTROL_TARGET_DATA_KEYS: Array<keyof VariableControlTargetData> = [
    "control_id",
    "variable_id",
    "entity_version_id",
    "config",
    "created_at",
];

const VARIABLE_CONTROL_TARGET_NAME = "VariableControlTarget" as const
export type VariableControlTarget = ModelInstance<VariableControlTargetData, typeof VARIABLE_CONTROL_MODE, {}, typeof VARIABLE_CONTROL_TARGET_NAME>;

const VariableControlTargetModel = defineModel<VariableControlTarget>({
    name: VARIABLE_CONTROL_TARGET_NAME,
    immutable: true,
    allKeys: VARIABLE_CONTROL_TARGET_DATA_KEYS,
});

export const createVariableControlTarget = VariableControlTargetModel.create;
export const isVariableControlTarget = VariableControlTargetModel.is;
