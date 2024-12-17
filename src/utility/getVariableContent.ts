import {
  AffixParams,
  batchFetchTemplateBlock,
  ContentBlock,
  convertInfoFieldNodesToPlaceholders,
  convertTipTapJSONToBlocks,
  createTemplateBlock,
  getContentBlocksFromTemplateBlock,
  getSubBlocksFromConditionalBlock,
  getTextFromContentBlock,
  isConditionalBlock,
  isTemplateBlock,
  removePrefixesFromVariablesRule,
  TemplateBlock,
  upsertTemplateBlock
} from "@clinicaltoolkits/content-blocks";
import { Variable, VariableContent, VariableMap } from "../types";
import { getSupabaseClient, logger, RegexRuleArray } from "@clinicaltoolkits/utility-functions";
import { shouldDisplayVariable } from "../contexts";
import { CURLY_BRACE_ENCLOSURE } from "@clinicaltoolkits/type-definitions";
import { Editor } from '@tiptap/react';

export const useUpsertVariableContent = () => {
  const upsertVariableContent = async (
    inVariable: Variable, 
    propertyKey: 'descriptionBlock' | 'interpretationBlock', 
    editor: Editor | null,
    mode?: 'create' | 'update'
  ) => {
    if (!editor) {
      logger.error("Editor is null or undefined");
      return;
    }
    console.log("inVariable: ", inVariable);
    let templateBlock: TemplateBlock;

    // Convert info field nodes to placeholders in the specified editor
    convertInfoFieldNodesToPlaceholders(editor);
    const updatedBlocks = convertTipTapJSONToBlocks(editor?.getJSON());

    // Set up regex rules and parameters
    const affixParams: AffixParams = {
      inEnclosure: CURLY_BRACE_ENCLOSURE,
      inPrefixToRemove: inVariable.idToken.prefix,
    };
    const regexRules: RegexRuleArray = [removePrefixesFromVariablesRule(affixParams)];

    // Update the specified property using the propertyKey
    if (inVariable.content) {
      if (!inVariable.content[propertyKey]) {
        templateBlock = createTemplateBlock({
          property: propertyKey === 'descriptionBlock' ? 'description' : 'interpretation',
          blocks: updatedBlocks,
          entityId: inVariable.idToken.entityId,
          entityVersionId: inVariable.idToken.entityVersionId,
          variableId: inVariable.idToken.variableId,
        });
        inVariable.content[propertyKey] = templateBlock;
      } else {
        templateBlock = { ...inVariable.content[propertyKey] };
        templateBlock.blocks = updatedBlocks;
      }

      if (!isTemplateBlock(templateBlock)) throw Error("upsertVariableContent() - The updated template block is not a valid template block.");
      await upsertTemplateBlock({ inTemplateBlock: templateBlock, inAffixParams: affixParams, inRegexRules: regexRules });
    } else {
      throw Error(`upsertVariableContent() - Can't update content blocks, variable does not have a defined content property.`);
    }
  };

  return { upsertVariableContent };
};


export const fetchVariableContent = async (inDbVariableId: string, property?: string, inAffixParams?: AffixParams, inRegexRules?: RegexRuleArray, inEntityId?: string, inEntityVersionId?: string): Promise<VariableContent | undefined> => {
  const variableContent: VariableContent = {};
  const templateBlockIds: string[] = [];
  let query = getSupabaseClient()
    .from("variable_content")
    .select("id")
    .eq("variable_id", inDbVariableId);
  
  if (property) {
    query = query.eq("property", property);
  }

  if (inEntityId) {
    query = query.or(`entity_id.eq.${inEntityId}, entity_id.is.null`);
  }

  if (inEntityVersionId) {
    query = query.or(`entity_version_id.eq.${inEntityVersionId}, entity_version_id.is.null`);
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
    console.log("templateBlock: ", templateBlock);
    if (templateBlock.property === "description") variableContent.descriptionBlock = templateBlock;
    if (templateBlock.property === "interpretation") variableContent.interpretationBlock = templateBlock;
    //if (templateBlock.blocks) variableContent[templateBlock.property] = templateBlock.blocks; // TODO: Double check if removing this line is safe
  });

  const bEmptyObject = Object.keys(variableContent).length === 0;
  if (!bEmptyObject) {
    variableContent.affixParams = inAffixParams;
    variableContent.regexRules = inRegexRules;
  }

  return bEmptyObject ? undefined : variableContent;
};

export const fetchVariableDescription = async (inDbVariableId: string): Promise<TemplateBlock | undefined> => {
  const variableContent = await fetchVariableContent(inDbVariableId, "description");
  return variableContent?.descriptionBlock;
};

export const getVariableContent = (inVariable: Variable): VariableContent | undefined => {
  return inVariable.content || undefined;
};
export const setVariableContent = (inVariable: Variable, inContent: VariableContent | undefined) => {
  inVariable.content = inContent;
  if (inVariable.content?.descriptionBlock) inVariable.content.bCreateDescription = true;
  if (inVariable.content?.interpretationBlock) inVariable.content.bCreateInterpretation = true;
};

export const getContentBlocksFromVariableDescription = (inVariable: Variable): ContentBlock[] | undefined => {
  const descriptionBlock = getVariableContent(inVariable)?.descriptionBlock;
  if (!descriptionBlock) return undefined;
  return getContentBlocksFromTemplateBlock(descriptionBlock);
};
export const getVariableDescriptionAsString = (inVariable: Variable): string => {
  const singleVariableMapInstance = new Map<string, Variable>();
  singleVariableMapInstance.set(inVariable.idToken.id, inVariable);
  const getValueFromObject = (objectMap: Map<string, Variable>, path: string, bRemoveEmptyContent?: boolean) => {
    const variable = objectMap.get(path);
    return variable;
  };
  return getContentBlocksFromVariableDescription(inVariable)?.map((block) => getTextFromContentBlock(block, false, singleVariableMapInstance, getValueFromObject, undefined)).join(" ") || "";
};
export const setVariableDescriptionContentBlocks = (inVariable: Variable, inContentBlocks: ContentBlock[]): Variable => {
  // Clone the variable to avoid mutating the original object
  const updatedVariable = { ...inVariable };

  updatedVariable.content = updatedVariable.content || {};
  if (!updatedVariable.content.descriptionBlock) throw Error("setVariableDescriptionContentBlocks() - Can't set content blocks, variable does not have a parent description block.");
  updatedVariable.content.descriptionBlock.blocks = inContentBlocks;
  return updatedVariable;
};

export const getContentBlocksFromVariableInterpretation = (inVariable: Variable, variableMap: VariableMap, bRemoveUnusedContentControls: boolean): ContentBlock[] | undefined => {
  //const variableId = inVariable.idToken.databaseId as string;
  let interpretationBlocks: ContentBlock[] | undefined = getVariableContent(inVariable)?.interpretationBlock?.blocks;
  if (!interpretationBlocks) return undefined;

  const conditionalBlock = interpretationBlocks[0];
  if (!isConditionalBlock(conditionalBlock)) throw Error("getVariableInterpretation() - Content block at index 0 is not a conditional block. All interpretation blocks must be contained inside a conditional block.");
  const conditionalSubBlocks = getSubBlocksFromConditionalBlock(conditionalBlock, variableMap, bRemoveUnusedContentControls, shouldDisplayVariable);
  return conditionalSubBlocks;
}

export const setVariableInterpretationContentBlocks = (inVariable: Variable, inContentBlocks: ContentBlock[]): Variable => {
  // Clone the variable to avoid mutating the original object
  const updatedVariable = { ...inVariable };

  updatedVariable.content = updatedVariable.content || {};
  if (!updatedVariable.content.interpretationBlock) throw Error("setVariableInterpretationContentBlocks() - Can't set content blocks, variable does not have a parent interpretation block.");
  updatedVariable.content.interpretationBlock.blocks = inContentBlocks;
  return updatedVariable;
};
