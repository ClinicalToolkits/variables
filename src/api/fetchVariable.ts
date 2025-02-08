
import { getSupabaseClient } from "@clinicaltoolkits/utility-functions";
import { CURLY_BRACE_ENCLOSURE, DataType, EntityId } from "@clinicaltoolkits/type-definitions";
import { convertDBVariableToVariable, enrichSubvariableProperties, createAutoGeneratedVariables, applyDescriptiveRatings } from "./utility";
import { fetchDescriptiveRatingsArray, DescriptiveRating } from "../descriptive-ratings";
import { Variable, DBVariable, VariableIdToken, VariableContent, DEMOGRAPHICS } from "../types";
import { fetchVariableContent, getVariableAffixRules, getVariableDescriptionAsString, setVariableContent } from "../utility";
import { IAffixParams } from "@clinicaltoolkits/content-blocks";
import { autoSetClientLocationFromUser } from "../contexts";

export interface FetchVariableParams {
  variableId: string;
  entityId?: string;
  entityVersionId?: string;
  labelPrefix?: string;
}

export const fetchVariable = async ({ variableId, entityId, entityVersionId, labelPrefix }: FetchVariableParams): Promise<Variable | undefined> => {
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
  const convertedVariable = convertDBVariableToVariable({ 
    dbVariable,
    entityId,
    entityVersionId,
    labelPrefix
  });

  return convertedVariable;
};

export interface FetchVariablesParams extends Omit<FetchVariableParams, "variableId"> {
  variableIds?: string[];
  variableSetId?: string;
  descriptiveRatingId?: string;
  bIncludeAutoGeneratedVariables?: boolean;
}
export const fetchVariables = async ({
  variableIds,
  entityId,
  entityVersionId,
  labelPrefix,
  variableSetId,
  descriptiveRatingId,
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

      // TODO: This isn't the most elegant solution, but it works for now. Primarily used to auto set the city and province for the demographics section
      let callingUser = undefined;
      if (entityId === EntityId.DEMOGRAPHICS) {
        const userResponse = await supabaseClient.auth.getUser();
        callingUser = userResponse?.data?.user;
      }

      let variableSetDescriptiveRatings: DescriptiveRating[] | undefined = undefined;
      if (descriptiveRatingId) {
        variableSetDescriptiveRatings = await fetchDescriptiveRatingsArray(descriptiveRatingId);
      }

      const variableContentAffixParams: IAffixParams = {
        inPrefixToApply: (entityId && entityVersionId) ? `${entityId}:${entityVersionId}` : undefined,
        inEnclosure: CURLY_BRACE_ENCLOSURE,
      };
      const variableRegexRules = getVariableAffixRules(variableContentAffixParams);

      // Batch fetch variable contents
      const variableContentPromises = data.map(dbVariable =>
        fetchVariableContent(
          dbVariable.id,
          undefined,
          variableContentAffixParams,
          variableRegexRules,
          entityId,
          entityVersionId
        )
      );
      const variableContents = await Promise.all(variableContentPromises);
      const variableIdToContentMap = new Map<string, VariableContent>();
      data.forEach((dbVariable, index) => {
        const content = variableContents[index];
        if (content) variableIdToContentMap.set(dbVariable.id, content);
      });

      let additionalAccPromises: Promise<void>[] = [];

      const finalData: Variable[] =
        await data?.reduce<Promise<Variable[]>>(
          async (accPromise, dbVariable: DBVariable) => {
            const acc = await accPromise;

            const variableContent = variableIdToContentMap.get(dbVariable.id);

            // Convert database rows to application model
            let convertedVariable = await convertDBVariableToVariable({
              dbVariable,
              entityId,
              entityVersionId,
              labelPrefix,
              variableSetId,
              descriptiveRatingId,
              callingUser,
              variableSetDescriptiveRatings,
              variableContent,
              additionalAccPromises,
            });

            // Add the converted variable to the accumulator
            acc.push(convertedVariable);

            // Create auto-generated variables if necessary
            if (bIncludeAutoGeneratedVariables) {
              createAutoGeneratedVariables(convertedVariable, acc, additionalAccPromises, variableSetDescriptiveRatings);
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
      console.error(`Failed to fetch variables ${variableIds} with label prefix ${labelPrefix}: `, error);
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