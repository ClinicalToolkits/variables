import { batchFetchTemplateBlock, ContentBlock, fetchTemplateBlock, getTextFromContentBlock } from "@clinicaltoolkits/content-blocks";
import { Variable, VariableContent } from "../types";
import { getSupabaseClient } from "@clinicaltoolkits/utility-functions";

export const fetchVariableContent = async (inDbVariableId: string, property?: string): Promise<VariableContent> => {
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
  const templateBlocks = await batchFetchTemplateBlock({ inIds: templateBlockIds });
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
