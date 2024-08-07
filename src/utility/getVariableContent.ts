import { AffixParams, batchFetchTemplateBlock, ConditionalBlock, ContentBlock, getSubBlocksFromConditionalBlock, getTextFromContentBlock, isConditionalBlock } from "@clinicaltoolkits/content-blocks";
import { Variable, VariableContent, VariableMap } from "../types";
import { evaluateLogicalExpression, getSupabaseClient, parseLogicalExpression, RegexRuleArray } from "@clinicaltoolkits/utility-functions";
import { shouldDisplayVariable } from "../contexts";
import { getVariableId } from "./getVariableId";
import { getObjectPropertyFromKeyPath } from "@clinicaltoolkits/type-definitions";

export const fetchVariableContent = async (inDbVariableId: string, property?: string, inAffixParams?: AffixParams, inRegexRules?: RegexRuleArray): Promise<VariableContent> => {
  const variableContent: VariableContent = {};
  const templateBlockIds: string[] = [];
  let query = getSupabaseClient()
    .from("variable_content")
    .select("id")
    .eq("variable_id", inDbVariableId);
  
  if (property) {
    query = query.eq("property", property);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Supabase error: ${error.message}`);
  }

  data?.forEach((row) => {
    templateBlockIds.push(row.id);
  });
  // Fetch `templateBlocks` and use them to populate the `variableContent` object, using the `property` column as the key
  const templateBlocks = await batchFetchTemplateBlock({ inIds: templateBlockIds, inAffixParams, inRegexRules });
  templateBlocks?.forEach((templateBlock) => {
    if (templateBlock.blocks) variableContent[templateBlock.property] = templateBlock.blocks;
  });

  return variableContent;
};

export const fetchVariableDescription = async (inDbVariableId: string): Promise<ContentBlock[]> => {
  const variableContent = await fetchVariableContent(inDbVariableId, "description");
  return variableContent.description || [];
};

export const getVariableContent = (inVariable: Variable): VariableContent => {
  return inVariable.content || {};
};
export const setVariableContent = (inVariable: Variable, inContent: VariableContent | undefined) => {
  inVariable.content = inContent;
};

export const getVariableDescription = (inVariable: Variable): ContentBlock[] => {
  return getVariableContent(inVariable)?.description || [];
};
export const getVariableDescriptionAsString = (inVariable: Variable): string => {
  const singleVariableMapInstance = new Map<string, Variable>();
  singleVariableMapInstance.set(inVariable.idToken.id, inVariable);
  const getValueFromObject = (objectMap: Map<string, Variable>, path: string, bRemoveEmptyContent?: boolean) => {
    const variable = objectMap.get(path);
    return variable;
  };
  return inVariable.content?.description?.map((block) => getTextFromContentBlock(block, false, singleVariableMapInstance, getValueFromObject, undefined)).join(" ") || "";
};
export const setVariableDescription = (inVariable: Variable, descriptionBlocks: ContentBlock[]) => {
  inVariable.content = inVariable.content || {};
  inVariable.content.description = descriptionBlocks;
};

export const getVariableInterpretation = (inVariable: Variable, variableMap: VariableMap, bRemoveUnusedContentControls: boolean): ContentBlock[] => {
  //const variableId = inVariable.idToken.databaseId as string;
  let interpretationBlocks: ContentBlock[] = getVariableContent(inVariable)?.interpretation || undefined;
  if (!interpretationBlocks) return [];
  const conditionalBlock = interpretationBlocks[0];
  if (!isConditionalBlock(conditionalBlock)) throw Error("getVariableInterpretation() - Content block at index 0 is not a conditional block. All interpretation blocks must be contained inside a conditional block.");
  const conditionalSubBlocks = getSubBlocksFromConditionalBlock(conditionalBlock, variableMap, bRemoveUnusedContentControls, shouldDisplayVariable);
  return conditionalSubBlocks;
}
