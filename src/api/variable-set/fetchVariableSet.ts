
import { getSupabaseClient } from "@clinicaltoolkits/utility-functions";
import { convertVariableSetDBToVariableSet } from "./convertVariableSetDBToVariableSet";
import { VariableSet } from "../../types";

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

export const fetchVariableSet = async (entityVersionId: string): Promise<VariableSet | null> => {
  const variableSets = await fetchVariableSets([entityVersionId]);

  return variableSets.length > 0 ? variableSets[0] : null;
};
