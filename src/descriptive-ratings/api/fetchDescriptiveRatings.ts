import { getSupabaseClient } from "@clinicaltoolkits/ct-supabase";
import { TextOps } from "@clinicaltoolkits/utility-functions";
import { DescriptiveRating, DescriptiveRatingSet } from "../types";

export const fetchDescriptiveRatingSets = async (descriptiveRatingIds?: string[]): Promise<DescriptiveRatingSet[]> => {
  const supabaseClient = getSupabaseClient();
  let query = supabaseClient
    .from("descriptive_rating_sets")
    .select(`*`)
  if (descriptiveRatingIds) {
    query = query.in("id", descriptiveRatingIds as any); // TODO: fix types - should not need 'as any'
  }

  try {
    const { data, error } = await query;
    

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    (data as any).forEach((datum: any) => { // TODO: fix types - should not need 'as any' or 'datum: any'
      datum.id = datum.id.toString();
    });

    return data ? TextOps.toCamelKeys(data) as any : []; // TODO: fix types - should not need 'as any'
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
