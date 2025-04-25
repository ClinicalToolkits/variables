import {
  IAffixParams,
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
  ITemplateBlock,
  upsertTemplateBlock,
} from "@clinicaltoolkits/content-blocks";
import { getSupabaseClient, logger, RegexRuleArray } from "@clinicaltoolkits/utility-functions";
import { CURLY_BRACE_ENCLOSURE } from "@clinicaltoolkits/type-definitions";
import { Variable, VariableContent, VariableMap } from "../types";
import { shouldDisplayVariable } from "../contexts";
import { Editor } from '@tiptap/react';
import { removePrefixesFromVariablesRule } from "./variableIdFunctions";

export const convertVariableContentToBlock = (inVariable: Variable, inEditor: Editor | null, inPropertyKey: 'description' | 'interpretation'): ITemplateBlock => {
  if (!inEditor) throw new Error("Editor is null or undefined");
  let templateBlock: ITemplateBlock;

  // Convert info field nodes to placeholders in the specified editor
  convertInfoFieldNodesToPlaceholders(inEditor);
  const updatedBlocks = convertTipTapJSONToBlocks(inEditor.getJSON());

  // Update the specified property using the propertyKey
  if (inVariable.content) {
    if (!inVariable.content[inPropertyKey]) {
      templateBlock = createTemplateBlock({
        property: inPropertyKey === 'description' ? 'description' : 'interpretation',
        blocks: updatedBlocks,
        entityId: inVariable.idToken.entityId,
        entityVersionId: inVariable.idToken.entityVersionId,
        variableId: inVariable.idToken.variableId,
      });
      inVariable.content[inPropertyKey] = templateBlock;
    } else {
      templateBlock = { ...inVariable.content[inPropertyKey] };
      templateBlock.blocks = updatedBlocks;
    }
  } else {
    throw new Error(`upsertVariableContent() - Can't update content blocks, variable does not have a defined content property.`);
  }

  return templateBlock;
};

export interface IUpsertVariableContentParams {
  inVariable: Variable;
}

export const upsertVariableContent = async ({ inVariable }: IUpsertVariableContentParams) => {
  // Set up regex rules and parameters
  const affixParams: IAffixParams = {
    inEnclosure: CURLY_BRACE_ENCLOSURE,
    inPrefixToRemove: inVariable.idToken.prefix,
  };
  const regexRules: RegexRuleArray = [removePrefixesFromVariablesRule(affixParams)];

  try {
    const contentUpserts: Promise<unknown>[] = [];
    if (inVariable.content?.bCreateDescription && inVariable.content.description) {
      contentUpserts.push(
        upsertTemplateBlock({
          inTemplateBlock: inVariable.content.description,
          inAffixParams: affixParams,
          inRegexRules: regexRules,
        })
      );
    }
    if (inVariable.content?.bCreateInterpretation && inVariable.content.interpretation) {
      contentUpserts.push(
        upsertTemplateBlock({
          inTemplateBlock: inVariable.content.interpretation,
          inAffixParams: affixParams,
          inRegexRules: regexRules,
        })
      );
    }

    // Wait for all operations to complete
    await Promise.all(contentUpserts);
  } catch (error) {
    logger.error("upsertVariableContent - Error upserting template block: ", error);
  }
};

export const fetchVariableContent = async (inDbVariableId: string, property?: string, inAffixParams?: IAffixParams, inRegexRules?: RegexRuleArray, inEntityId?: string, inEntityVersionId?: string): Promise<VariableContent | undefined> => {
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
    if (templateBlock.property === "description") variableContent.description = templateBlock;
    if (templateBlock.property === "interpretation") variableContent.interpretation = templateBlock;
    //if (templateBlock.blocks) variableContent[templateBlock.property] = templateBlock.blocks; // TODO: Double check if removing this line is safe
  });

  const bEmptyObject = Object.keys(variableContent).length === 0;
  if (!bEmptyObject) {
    variableContent.affixParams = inAffixParams;
    variableContent.regexRules = inRegexRules;
  }

  return bEmptyObject ? undefined : variableContent;
};

export const fetchVariableDescription = async (inDbVariableId: string): Promise<ITemplateBlock | undefined> => {
  const variableContent = await fetchVariableContent(inDbVariableId, "description");
  return variableContent?.description;
};

export const getVariableContent = (inVariable: Variable): VariableContent | undefined => {
  return inVariable.content || undefined;
};
export const setVariableContent = (inVariable: Variable, inContent: VariableContent | undefined) => {
  inVariable.content = inContent;
  if (inVariable.content?.description) inVariable.content.bCreateDescription = true;
  if (inVariable.content?.interpretation) inVariable.content.bCreateInterpretation = true;
};

export const getContentBlocksFromVariableDescription = (inVariable: Variable): ContentBlock[] | undefined => {
  const descriptionBlock = getVariableContent(inVariable)?.description;
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
  if (!updatedVariable.content.description) throw Error("setVariableDescriptionContentBlocks() - Can't set content blocks, variable does not have a parent description block.");
  updatedVariable.content.description.blocks = inContentBlocks;
  return updatedVariable;
};

export const getContentBlocksFromVariableInterpretation = (inVariable: Variable, variableMap: VariableMap, bRemoveUnusedContentControls: boolean): ContentBlock[] | undefined => {
  //const variableId = inVariable.idToken.databaseId as string;
  let interpretationBlocks: ContentBlock[] | undefined = getVariableContent(inVariable)?.interpretation?.blocks;
  if (!interpretationBlocks) return undefined;

  const conditionalBlock = interpretationBlocks[0];
  if (!isConditionalBlock(conditionalBlock)) throw Error("getVariableInterpretation() - Content block at index 0 is not a conditional block. All interpretation blocks must be contained inside a conditional block.");
  const conditionalSubBlocks = getSubBlocksFromConditionalBlock({ conditionalBlock, objectMap: variableMap, bRemoveUnusedContentControls, shouldDisplayObjectContent: shouldDisplayVariable });
  return conditionalSubBlocks;
}

export const setVariableInterpretationContentBlocks = (inVariable: Variable, inContentBlocks: ContentBlock[]): Variable => {
  // Clone the variable to avoid mutating the original object
  const updatedVariable = { ...inVariable };

  updatedVariable.content = updatedVariable.content || {};
  if (!updatedVariable.content.interpretation) throw Error("setVariableInterpretationContentBlocks() - Can't set content blocks, variable does not have a parent interpretation block.");
  updatedVariable.content.interpretation.blocks = inContentBlocks;
  return updatedVariable;
};
