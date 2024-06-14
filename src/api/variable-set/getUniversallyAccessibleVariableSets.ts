import { getSupabaseClient } from "@clinicaltoolkits/utility-functions";
import { convertDBVariableSetArrayToVariableSetArray } from "./convertVariableSetDBToVariableSet";
import { VariableSet } from "../../types";

export const getUniversallyAccessibleVariableSets = async (): Promise<VariableSet[]> => {
  const supabaseClient = getSupabaseClient();

  const { data, error } = await supabaseClient
    .from("variable_sets_view")
    .select("*")
    // Use the '->>' operator to get the text representation of the 'bUniversallyAccessible' field
    // and check if it's 'true'
    .filter('metadata->b_universally_accessible', 'eq', 'true');

  if (error) {
    throw error;
  }

  const finalData = convertDBVariableSetArrayToVariableSetArray(data);
  return finalData || [];
};