import { getSupabaseClient } from "@clinicaltoolkits/utility-functions";
import { convertDBVariableSubsetArrayToVariableSubsetArray } from "./convertVariableSetDBToVariableSet";
import { VariableSet } from "../../types";

export async function getVariableSubsetArrayFromDatabase(
  variableSubsetIds: string[],
): Promise<VariableSet[]> {
  const supabaseClient = getSupabaseClient();

  try {
    const { data, error } = await supabaseClient
      .from("variable_subsets")
      .select("*")
      .in("id", variableSubsetIds);

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    const finalData = convertDBVariableSubsetArrayToVariableSubsetArray(data);

    return finalData;
  } catch (error) {
    console.error(`Failed to fetch variable subsets using variable subset ids: ${variableSubsetIds}:`, error);
    throw error;
  }
}