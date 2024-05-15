import { getSupabaseClient } from "@clinicaltoolkits/utility-functions";
import { toCamelCaseKeys } from "@clinicaltoolkits/utility-functions";
import { DescriptiveRating, DescriptiveRatingSet } from "../types";

export const fetchDescriptiveRatingSets = async (descriptiveRatingIds?: string[]): Promise<DescriptiveRatingSet[]> => {
  const supabaseClient = getSupabaseClient();
  let query = supabaseClient
    .from("descriptive_rating_sets")
    .select(`*`)
  if (descriptiveRatingIds) {
    query = query.in("id", descriptiveRatingIds);
  }

  try {
    const { data, error } = await query;
    

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    data.forEach((datum) => {
      datum.id = datum.id.toString();
    });

    return data ? toCamelCaseKeys(data) : [];
  } catch (error) {
    console.error(`Failed to fetch descriptive ratings. Printing error: `, error);
    throw error;
  }
};

export const fetchDescriptiveRatingSet = async (descriptiveRatingId: string): Promise<DescriptiveRatingSet | null> => {
  return (await fetchDescriptiveRatingSets([descriptiveRatingId]))[0] || null;
};

export const fetchDescriptiveRatingsArray = async (descriptiveRatingId: string): Promise<DescriptiveRating[]> => {
  const descriptiveRatingSet = await fetchDescriptiveRatingSet(descriptiveRatingId);
  return descriptiveRatingSet?.ratings || [];
};
