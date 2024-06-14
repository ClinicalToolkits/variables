import { getSupabaseClient, logger } from "@clinicaltoolkits/utility-functions";
import { convertVariablePropertiesToDB } from "./utility";
import { Variable } from "../types";

export async function updateVariable(id: string, variableProperties: Partial<Variable>) {

  try {
    const supabaseClient = getSupabaseClient();
    if (variableProperties?.idToken) variableProperties.idToken.variableId = id; // Ensure the id is set to the variable being updated
    const updatedProperties = convertVariablePropertiesToDB(variableProperties);

    logger.info('Updating variable with properties:', updatedProperties);

    const { data, error } = await supabaseClient
      .from('variables')
      .update(updatedProperties)
      .eq("id", id);
  
    if (error) {
      logger.error('Error updating variable:', error);
    } else if (data) {
      logger.info('Variable update successful:', data[0]);
    }
  } catch (error) {
    logger.error('Error updating variables:', error);
  }
}
