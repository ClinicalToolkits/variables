/*
import { generateUUID } from "@clinicaltoolkits/type-definitions";
import { logger } from "@clinicaltoolkits/utility-functions";
import { getSupabaseClient } from "@clinicaltoolkits/ct-supabase";
import { convertVariableToDBVariable } from "./utility";
import { Variable } from "../types";

export async function createVariable(variable: Variable) {

  try {
    const supabaseClient = getSupabaseClient();
    const dbVariable = convertVariableToDBVariable(variable);
    logger.info('Creating dbVariable:', dbVariable);

    const { data, error } = await supabaseClient
      .from('variables')
      .insert(dbVariable as any) // TODO: Fix type issue
      .eq("id", variable.getVariableId());
  
    if (error) {
      logger.error('Error creating variable:', error);
    } else if (data) {
      logger.info('Variable creation successful:', data[0]);
    }
  } catch (error) {
    logger.error('Error creating variable:', error);
  }
}
*/