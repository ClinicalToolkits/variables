/*
import { DataType, DescriptiveRating, Tag } from "@clinicaltoolkits/type-definitions";
import { getSupabaseClient } from "@clinicaltoolkits/utility-functions";

export const universalDescriptiveRatings: DescriptiveRating[] = [
  // Standard score cutoffs
  { cutoffScore: 130, descriptor: "Extremely High", dataType: DataType.STANDARD_SCORE },
  { cutoffScore: 120, descriptor: "Very High", dataType: DataType.STANDARD_SCORE },
  { cutoffScore: 110, descriptor: "High Average", dataType: DataType.STANDARD_SCORE },
  { cutoffScore: 90, descriptor: "Average", dataType: DataType.STANDARD_SCORE },
  { cutoffScore: 80, descriptor: "Low Average", dataType: DataType.STANDARD_SCORE },
  { cutoffScore: 70, descriptor: "Very Low", dataType: DataType.STANDARD_SCORE },
  { cutoffScore: 0, descriptor: "Extremely Low", dataType: DataType.STANDARD_SCORE },

  // Scaled score cutoffs
  { cutoffScore: 16, descriptor: "Extremely High", dataType: DataType.SCALED_SCORE },
  { cutoffScore: 14, descriptor: "Very High", dataType: DataType.SCALED_SCORE },
  { cutoffScore: 12, descriptor: "High Average", dataType: DataType.SCALED_SCORE },
  { cutoffScore: 8, descriptor: "Average", dataType: DataType.SCALED_SCORE },
  { cutoffScore: 6, descriptor: "Low Average", dataType: DataType.SCALED_SCORE },
  { cutoffScore: 4, descriptor: "Very Low", dataType: DataType.SCALED_SCORE },
  { cutoffScore: 0, descriptor: "Extremely Low", dataType: DataType.SCALED_SCORE },

  // T-score cutoffs
  { cutoffScore: 70, descriptor: "Clinically Significant", dataType: DataType.T_SCORE },
  { cutoffScore: 60, descriptor: "At-Risk", dataType: DataType.T_SCORE },
  { cutoffScore: 0, descriptor: "Average", dataType: DataType.T_SCORE },
];

export function getUniversalDescriptiveRatings(): DescriptiveRating[] {
  return universalDescriptiveRatings;
}

export async function getDescriptiveRatingsByTag(tag: Tag): Promise<DescriptiveRating[]> {
  const supabaseClient = getSupabaseClient();

    try {
      // Fetch data from supabase
      const { data, error } = await supabaseClient.schema("public").from("tags").select("*").eq("name", tag.name);
  
      // Throw if any error is encountered
      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }
  
      //const descriptiveRatings = await getDescriptiveRatingsByID(data[0].metadata?.test_descriptors_id);
  
      // Check if data exists and if the metadata has a test_descriptors_id
      if (data && data[0].metadata?.test_descriptors_id) {
        const descriptiveRatings = await getDescriptiveRatingsById(data[0].metadata.test_descriptors_id);
        return descriptiveRatings;
      }
  
      // Fallback to universal descriptive ratings if none found
      return universalDescriptiveRatings;
    } catch (error) {
      console.error("Failed to fetch descriptive ratings by tag:", error);
      throw error;
    }
  }
  
export async function getDescriptiveRatingsById(descriptiveRatingId: string): Promise<DescriptiveRating[]> {
  const supabaseClient = getSupabaseClient();

  try {
    // Fetch data from supabase
    const { data, error } = await supabaseClient.from("descriptive_rating_sets").select("*").eq("id", descriptiveRatingId);

    // Throw if any error is encountered
    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    // Safeguard for null or undefined data
    if (!data) {
      throw new Error("Data fetched from Supabase is null or undefined.");
    }

    // Array to hold transformed data
    const transformedData: DescriptiveRating[] = [];

    // Loop through each record fetched from supabase
    for (const item of data) {
      // Safeguard for null or undefined JSON data in the record
      if (!item.ratings) {
        console.error(`Descriptive ratings for item with id ${item.id} is null or undefined.`);
        continue;
      }

      // Transform the object to match the DescriptiveRating type
      for (const descriptive_rating of item.ratings) {
        const transformedRating: DescriptiveRating = {
          cutoffScore: descriptive_rating.cutoffScore,
          descriptor: descriptive_rating.descriptor,
          dataType: descriptive_rating.dataType as DataType,
        };
        transformedData.push(transformedRating);
      }
    }

    return transformedData;
  } catch (error) {
    console.error("Failed to fetch descriptive ratings by id:", error);
    throw error;
  }
}
*/
