import { generateUUID } from "@clinicaltoolkits/type-definitions";
import { getSupabaseClient, logger } from "@clinicaltoolkits/utility-functions";
import { convertVariableToDBVariable } from "./utility";
import { Variable } from "../types";
import { upsertVariableContent } from "../utility";

export async function upsertVariable(variable: Variable) {
  try {
    const supabaseClient = getSupabaseClient();
    const dbVariable = convertVariableToDBVariable(variable);

    const { data, error } = await supabaseClient
      .from('variables')
      .upsert(dbVariable)
      .select();
    
  
    if (error) {
      logger.error('upsertVariable - Error creating variable:', error);
      throw error
    } else if (data) {
        logger.info('upsertVariable - Variable creation successful:', data[0]);
    }
  } catch (error) {
    logger.error('upsertVariable - Error creating variable:', error);
  }
}

async function batchUpsertVariable(variables: Variable[]) {
  try {
    const supabaseClient = getSupabaseClient();
    const dbVariables = variables.map(variable => convertVariableToDBVariable(variable));
    
    const { data, error } = await supabaseClient
      .from('variables')
      .upsert(dbVariables)
      .select();
    
    if (error) {
      logger.error('batchUpsertVariable - Error creating variables:', error);
      throw error
    } else if (data) {
        logger.info('batchUpsertVariable - Variables creation successful:', data);
    }
  } catch (error) {
    logger.error('batchUpsertVariable - Error creating variables:', error);
  }
}

export async function upsertVariableWithContent(variable: Variable) {
  try {
    await upsertVariable(variable);
    await upsertVariableContent({ inVariable: variable });
  } catch (error) {
    logger.error('upsertVariableWithContent - Error creating variable with content:', error);
  }
}

export async function batchUpsertVariableWithContent(variables: Variable[]) {
    try {
        await batchUpsertVariable(variables);
        for (const variable of variables) {
            console.log('variable: ', variable);
            await upsertVariableContent({ inVariable: variable });
        }
    } catch (error) {
        logger.error('batchUpsertVariableWithContent - Error creating variables with content:', error);
    }
}
