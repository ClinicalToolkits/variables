import { TextOps } from "@clinicaltoolkits/utility-functions";
import { DescriptiveRatingSet } from "../types";
import { getSupabaseClient } from "@clinicaltoolkits/ct-supabase";

export const createDescriptiveRatingSet = async (descriptiveRatingSet: DescriptiveRatingSet): Promise<DescriptiveRatingSet> => {
  const supabaseClient = getSupabaseClient();
  const { data, error } = await supabaseClient
    .from("descriptive_rating_sets")
    .insert({
      full_name: descriptiveRatingSet.fullName,
      ratings: descriptiveRatingSet.ratings,
    } as any) // TODO: fix types - should not need 'as any'
    .select();

  if (error) {
    throw new Error(`Supabase error: ${error.message}`);
  }

  return TextOps.toCamelKeys(data)[0] as any; // TODO: fix types - should not need 'as any'
};