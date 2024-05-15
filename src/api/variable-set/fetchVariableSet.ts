
import { getSupabaseClient, logger } from "@clinicaltoolkits/utility-functions";
import { convertVariableSetDBToVariableSet } from "./convertVariableSetDBToVariableSet";
import { VariableSet } from "../../types";

export const fetchVariableSet = async (entityVersionId: string): Promise<VariableSet | null> => {
  const supabaseClient = getSupabaseClient();
  let variableSet: VariableSet | null = null;

  const { data, error } = await supabaseClient
    .from("variable_sets_view")
    .select("*")
    .eq("entity_version_id", entityVersionId)

  if (error) {
    logger.error(`Supabase error: ${error.message}`);
  }

  if (data && data.length > 0) {
    variableSet = convertVariableSetDBToVariableSet(data[0]);
  }
  console.log("fetchVariableSet variableSet:", variableSet);
  return variableSet;
};

export const fetchVariableSets = async (entityVersionIds?: string[]): Promise<VariableSet[]> => {
  const supabaseClient = getSupabaseClient();
  let query = supabaseClient
    .from("variable_sets_view")
    .select("*")
  if (entityVersionIds) {
    query = query.in("entity_version_id", entityVersionIds);
  }

  try {
    const { data, error } = await query;

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    return data ? data.map(convertVariableSetDBToVariableSet) : [];
  } catch (error) {
    console.error(`Failed to fetch variable sets. Printing error: `, error);
    throw error;
  }
};