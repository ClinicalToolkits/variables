import { generateUUID } from "@clinicaltoolkits/type-definitions";
import { getSupabaseClient, logger } from "@clinicaltoolkits/utility-functions";
import { convertVariableToDBVariable } from "./utility";
import { Variable } from "../types";

export async function createVariable(variable: Variable) {

  try {
    const supabaseClient = getSupabaseClient();
    const dbVariable = convertVariableToDBVariable(variable);
    dbVariable.id = generateUUID();
    logger.info('Creating dbVariable:', dbVariable);

    const { data, error } = await supabaseClient
      .from('variables')
      .insert(dbVariable)
      .eq("id", variable.id);
  
    if (error) {
      logger.error('Error creating variable:', error);
    } else if (data) {
      logger.info('Variable creation successful:', data[0]);
    }
  } catch (error) {
    logger.error('Error creating variable:', error);
  }
}
