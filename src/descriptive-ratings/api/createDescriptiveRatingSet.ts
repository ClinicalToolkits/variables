import { getSupabaseClient, toCamelCaseKeys } from "@clinicaltoolkits/utility-functions";
import { DescriptiveRatingSet } from "../types";

export const createDescriptiveRatingSet = async (descriptiveRatingSet: DescriptiveRatingSet): Promise<DescriptiveRatingSet> => {
  const supabaseClient = getSupabaseClient();
  const { data, error } = await supabaseClient
    .from("descriptive_rating_sets")
    .insert({
      full_name: descriptiveRatingSet.fullName,
      ratings: descriptiveRatingSet.ratings,
    })
    .select();

  if (error) {
    throw new Error(`Supabase error: ${error.message}`);
  }

  return data ? toCamelCaseKeys(data)[0] : undefined;
};