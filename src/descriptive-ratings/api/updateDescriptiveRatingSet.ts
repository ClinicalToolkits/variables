import { getSupabaseClient } from "@clinicaltoolkits/utility-functions";
import { toCamelCaseKeys } from "@clinicaltoolkits/utility-functions";
import { DescriptiveRatingSet } from "../types";

type DescriptiveRatingSetProperties = Partial<DescriptiveRatingSet>;

export const updateDescriptiveRatingSet = async (id: string, descriptiveRatingSetProperties: DescriptiveRatingSetProperties): Promise<DescriptiveRatingSet> => {
  const supabaseClient = getSupabaseClient();
  const { data, error } = await supabaseClient
    .from("descriptive_rating_sets")
    .update({
      full_name: descriptiveRatingSetProperties.fullName,
      ratings: descriptiveRatingSetProperties.ratings,
    })
    .eq("id", id)
    .select();

  if (error) {
    throw new Error(`Supabase error: ${error.message}`);
  }

  return data ? toCamelCaseKeys(data)[0] : undefined;
};