import { getSupabaseClient } from "@clinicaltoolkits/ct-supabase";
import { TextOps } from "@clinicaltoolkits/utility-functions";
import { DescriptiveRatingSet } from "../types";

type DescriptiveRatingSetProperties = Partial<DescriptiveRatingSet>;

export const updateDescriptiveRatingSet = async (id: string, descriptiveRatingSetProperties: DescriptiveRatingSetProperties): Promise<DescriptiveRatingSet> => {
  const supabaseClient = getSupabaseClient();
  const { data, error } = await supabaseClient
    .from("descriptive_rating_sets")
    .update({
      full_name: descriptiveRatingSetProperties.fullName,
      ratings: descriptiveRatingSetProperties.ratings as any // TODO: fix types - should not need 'as any'
    })
    .eq("id", id as any) // TODO: fix types - should not need 'as any'
    .select();

  if (error) {
    throw new Error(`Supabase error: ${error.message}`);
  }

  return TextOps.toCamelKeys(data)[0] as any; // TODO: fix types - should not need 'as any'
};