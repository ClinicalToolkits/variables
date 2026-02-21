import { getSupabaseClient } from "@clinicaltoolkits/ct-supabase";
import { VariableControl, VariableControlTarget } from "../types";
import { logger } from "@clinicaltoolkits/utility-functions";

export const upsertVariableControl = async (inVariableControl: VariableControl, inVariableControlTarget?: VariableControlTarget) => {
    try {
        const supabaseClient = getSupabaseClient();
        const dbVariableControlData = inVariableControl.toJSON();

        const { error } = await supabaseClient
            .from('variable_controls')
            .upsert(dbVariableControlData);

        if (error) {
            logger.error('upsertVariableControl - Error creating variable control:', error);
            throw error;
        }

        if (inVariableControlTarget) {
            const dbVariableControlTargetData = inVariableControlTarget.toJSON();

            const { error: targetError } = await supabaseClient
                .from('variable_control_targets')
                .upsert(dbVariableControlTargetData);

            if (targetError) {
                logger.error('upsertVariableControl - Error creating variable control target:', targetError);
                throw targetError;
            }
        }
    } catch (error) {
        logger.error('upsertVariableControl - Error creating variable control with target:', error);
    }
};

export const upsertVariableControlBatch = async (variableControls: VariableControl[], variableControlTargets?: VariableControlTarget[]) => {
    try {
        const supabaseClient = getSupabaseClient();
        const dbVariableControlsData = variableControls.map(vc => vc.toJSON());

        const { error } = await supabaseClient
            .from('variable_controls')
            .upsert(dbVariableControlsData);

        if (error) {
            logger.error('upsertVariableControlBatch - Error creating variable controls:', error);
            throw error;
        }

        if (variableControlTargets && variableControlTargets.length > 0) {
            const dbVariableControlTargetsData = variableControlTargets.map(vct => vct.toJSON());

            const { error: targetError } = await supabaseClient
                .from('variable_control_targets')
                .upsert(dbVariableControlTargetsData);

            if (targetError) {
                logger.error('upsertVariableControlBatch - Error creating variable control targets:', targetError);
                throw targetError;
            }
        }
    } catch (error) {
        logger.error('upsertVariableControlBatch - Error creating variable controls with targets:', error);
    }
};
