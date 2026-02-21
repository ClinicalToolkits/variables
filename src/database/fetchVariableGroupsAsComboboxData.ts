// TODO: Use database types.

import { getSupabaseClient } from "@clinicaltoolkits/ct-supabase";
import { ComboboxData } from "@clinicaltoolkits/type-definitions";

export type VariableGroupComboboxData = ComboboxData<string, VariableGroupComboboxMetadata>;
export type VariableGroupComboboxMetadata = {
    variableIds: string[];
}

export async function fetchVariableGroupsAsComboboxData(): Promise<VariableGroupComboboxData[]> {
    const supabaseClient = getSupabaseClient();
    let query = supabaseClient
        .from('entity_version_variables_view')
        .select('*')
        .order('abbreviated_label', { ascending: true });

    const { data, error } = await query;
    if (error) throw error;

    const comboboxData: VariableGroupComboboxData[] = data.map((dataRow) => {
        return {
            id: dataRow.entity_version_id,
            label: dataRow.abbreviated_label,
            metadata: {
                variableIds: dataRow.variable_ids || [],
                searchTerms: [dataRow.abbreviated_label, dataRow.full_label],
                tooltipContent: dataRow.full_label,
            }
        };
    })

    return comboboxData;
}
