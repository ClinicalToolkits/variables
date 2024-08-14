
import { createLabel, getSupabaseClient } from "@clinicaltoolkits/utility-functions";
import { ComboboxData, ID_SEPERATOR } from "@clinicaltoolkits/type-definitions";

// Function for only retrieving the combobox data for variable sets (i.e., only retrieving the entity_version_id, entity_id, abbreviated_name, version, and subversion);
export const fetchVariableSetComboboxData = async (): Promise<ComboboxData[]> => {
  const supabaseClient = getSupabaseClient();
  let query = supabaseClient
    .from("variable_sets_view")
    .select("entity_version_id, entity_id, abbreviated_name, version, subversion");

  try {
    const { data, error } = await query;

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    // Convert the data to combobox data
    const transformedData = data ? data.map((variableSetColumns) => ({
        id: variableSetColumns.entity_id + ID_SEPERATOR + variableSetColumns.entity_version_id,
        label: createLabel({abbreviatedName: variableSetColumns.abbreviated_name, version: variableSetColumns.version, subversion: variableSetColumns.subversion}),
    })) : [];
    
    return transformedData;
  } catch (error) {
    console.error(`Failed to fetch variable sets. Printing error: `, error);
    throw error;
  }
};
