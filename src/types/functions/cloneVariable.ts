import { cloneTemplateBlock } from "@clinicaltoolkits/content-blocks";
import { Variable } from "..";
import { setInternalMetadata } from "./internalMetadata";

interface CloneVariableOptions {
    variableToClone: Variable;
    newVariableId: string;
    entityId: string;
    entityInstanceId: string;
    variableIdMap?: Record<string, string>;
  }
  
  export const cloneVariable = ({
    variableToClone,
    newVariableId,
    entityId,
    entityInstanceId,
    variableIdMap = {},
  }: CloneVariableOptions): Variable => {
    const newIdToken = variableToClone.idToken.cloneWithChanges({
      variableId: newVariableId,
      entityId,
      entityVersionId: entityInstanceId,
    });
  
    const clonedVariable: Variable = {
      ...variableToClone,
      idToken: newIdToken,
      entityId,
      entityVersionId: entityInstanceId,
      // Important: set the id to the new one
      ...newIdToken, // In case you want to flatten it
    };
  
    // Clone content blocks if present
    if (variableToClone.content) {
      clonedVariable.content = {
        ...variableToClone.content,
        description: variableToClone.content.description
          ? cloneTemplateBlock({
              block: variableToClone.content.description,
              variableIdMap,
              entityId,
              entityInstanceId,
            })
          : undefined,
        interpretation: variableToClone.content.interpretation
          ? cloneTemplateBlock({
              block: variableToClone.content.interpretation,
              variableIdMap,
              entityId,
              entityInstanceId,
            })
          : undefined,
      };
    }
  
    // Optional: Clone and remap childVariableIds
    if (variableToClone.metadata?.childVariableIds?.length) {
      clonedVariable.metadata = {
        ...variableToClone.metadata,
        childVariableIds: variableToClone.metadata.childVariableIds.map(
          (oldId) => variableIdMap[oldId] || oldId
        ),
      };
    }

    setInternalMetadata(clonedVariable, {
        _origin: "cloned",
      });
  
    return clonedVariable;
  };
  