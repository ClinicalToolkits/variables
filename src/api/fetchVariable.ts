
import { getSupabaseClient } from "@clinicaltoolkits/utility-functions";
import { DataType } from "@clinicaltoolkits/type-definitions";
import { convertDBVariableToVariable, enrichSubvariableProperties, createAutoGeneratedVariables, applyDescriptiveRatings } from "./utility";
import { fetchDescriptiveRatingsArray, DescriptiveRating } from "../descriptive-ratings";
import { Variable, DBVariable } from "../types";

export interface FetchVariableParams {
  variableId: string;
  uniqueSuffix?: string;
}

export const fetchVariable = async ({ variableId, uniqueSuffix }: FetchVariableParams): Promise<Variable | undefined> => {
  const supabaseClient = getSupabaseClient();
  const { data, error } = await supabaseClient
    .from("variables")
    .select(`*`)
    .eq("id", variableId);
  
  if (error) {
    throw new Error(`Supabase error: ${error.message}`);
  }

  const dbVariable: DBVariable | undefined = data?.[0];
  if (!dbVariable) {
    return undefined;
  }

  // Convert database rows to application model
  const convertedVariable = convertDBVariableToVariable(dbVariable, uniqueSuffix);

  return convertedVariable;
};

export interface FetchVariablesParams  extends Omit<FetchVariableParams, "variableId"> {
  variableIds?: string[];
  variableSetParams?: {
    id: string;
    key: string;
    subversion?: string;
    descriptiveRatingId?: string;
  },
  bIncludeAutoGeneratedVariables?: boolean;
}
export const fetchVariables = async ({
  variableIds,
  uniqueSuffix,
  variableSetParams,
  bIncludeAutoGeneratedVariables = true,
}: FetchVariablesParams): Promise<Variable[]> => {
    const supabaseClient = getSupabaseClient();
    let query = supabaseClient
      .from("variables")
      .select(`*`)
    if (variableIds) {
      query = query.in("id", variableIds);
    }

    try {
      const { data, error } = await query;

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      let variableSetDescriptiveRatings: DescriptiveRating[] | undefined = undefined;
      if (variableSetParams?.descriptiveRatingId) {
        variableSetDescriptiveRatings = await fetchDescriptiveRatingsArray(variableSetParams.descriptiveRatingId);
      }

      let additionalAccPromises: Promise<void>[] = [];
  
      const finalData: Variable[] =
        await data?.reduce<Promise<Variable[]>>(
          async (accPromise, dbVariable: DBVariable) => {
            const acc = await accPromise;

            // Convert database rows to application model
            const convertedVariable = convertDBVariableToVariable(dbVariable, uniqueSuffix, variableSetParams);

            // Add the converted variable to the accumulator
            acc.push(convertedVariable);

            // Create auto-generated variables if necessary
            if (bIncludeAutoGeneratedVariables) {
              createAutoGeneratedVariables(convertedVariable, acc, additionalAccPromises, variableSetDescriptiveRatings);
            }

            if (convertedVariable.dataType === DataType.DESCRIPTOR) {
              applyDescriptiveRatings(convertedVariable, convertedVariable.dataType, convertedVariable?.metadata?.descriptiveRatingId, variableSetDescriptiveRatings, additionalAccPromises);
            }

            // Return the accumulator with the new variable and any auto-generated variables
            return acc;
          },
          Promise.resolve([]) // Start with a resolved promise of an empty array in order to allow async operations in conjunction with reduce
        ) ?? [];

        // Wait for all additional promises to complete (i.e., any internal async operations in the loop above)
        await Promise.all(additionalAccPromises);

        // Enrich the associatedSubvariableProperties with actual subvariable names
        for (const variable of finalData) {
          enrichSubvariableProperties(variable, finalData);
        }

      return finalData;
    } catch (error) {
      console.error(`Failed to fetch variables ${variableIds} with unique suffix ${uniqueSuffix}: `, error);
      throw error;
    }
}

/*
export const fetchVariables = async (variableIds?: string[]): Promise<Variable[]> => {
  const supabaseClient = getSupabaseClient();
  let query = supabaseClient
    .from("variables")
    .select(`*`)

  if (variableIds) {
    query = query.overlaps("id", variableIds);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Supabase error: ${error.message}`);
  }

  const variables = data?.map((variable: DBVariable) => {
    const {
      id,
      full_name,
      abbreviated_name,
      data_type,
      subgroup_tag,
      order_within_set,
      tags,
      ...rest
    } = variable;

    return {
      ...rest,
      id: id,
      key: id,
      variableSetKey: id,
      fullName: full_name,
      abbreviatedName: abbreviated_name,
      dataType: data_type,
      value: undefined,
      orderWithinSet: order_within_set,
      tags: [],
      subgroupTag: null,
    };
  });

  return variables;
}*/