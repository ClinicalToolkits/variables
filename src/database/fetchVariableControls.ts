import { getSupabaseClient } from "@clinicaltoolkits/ct-supabase"
import { VariableControl, VariableControlTarget } from "../types";
import { createVariableControl, createVariableControlTarget } from "../types/VariableControl";

export interface FetchVariableControlsReturn {
    controls: VariableControl[],
    controlTargets: VariableControlTarget[]
}

export const fetchVariableControls = async (entityVersionId: string): Promise<FetchVariableControlsReturn> => {
    const supabaseClient = getSupabaseClient();
    const { data: controls, error: controlsError } = await supabaseClient
        .from('variable_controls')
        .select('*')
        .eq('entity_version_id', entityVersionId);

    if (controlsError) {
        throw controlsError;
    }

    const { data: controlTargets, error: controlTargetsError } = await supabaseClient
        .from('variable_control_targets')
        .select('*')
        .in('control_id', controls.map(control => control.id));

    if (controlTargetsError) {
        throw controlTargetsError;
    }

    const variableControls = createVariableControl(controls);
    const variableControlTargets = createVariableControlTarget(controlTargets);

    return {
        controls: variableControls,
        controlTargets: variableControlTargets
    };
};
