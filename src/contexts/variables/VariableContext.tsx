import React, { ReactNode, createContext, useReducer, useContext, useRef, useEffect } from "react";
import {
  AddVariableSetFunction,
  MarkVariablesHiddenFunction,
  RemoveVariableSetFunction,
  GetRelatedVariablesBySetFunction,
  GetVariableNameFunction,
  VariableSetMap,
  GetVariableSubgroupByTagFunction,
  GetChildVariablesFunction,
  GetVariableSubgroupByNameFunction,
} from "./VariableContextTypes";
import { getClientAgeHelper } from "./helpers";
import {  Tag, DataType, PathsToFields, setValueByPath, Visibility, isVisible } from "@clinicaltoolkits/type-definitions";
import { logger } from "@clinicaltoolkits/utility-functions";
import { getChildVariablesHelper } from "./helpers/getChildVariablesHelper";
import { fetchVariablesFromSet } from "../../api";
import {
  VariableMap,
  AddVariableFunction,
  RemoveVariableFunction,
  SetVariableFunction,
  Variable,
  VariableValue,
  VariableSet,
  SetVariablePropertyFunction,
  BatchSetVariablePropertyFunction,
  BatchAddVariableFunction,
  SetWholeVariableFunction
} from "../../types";
import { getDescriptorFromParentVariable } from "../../utility/getDescriptor";
import { getPercentileRankFromParentVariable } from "../../utility/getPercentileRank";
import { updateAssociatedSubvariableProperties } from "./utility";
import { fetchDescriptiveRatingsArray } from "../../descriptive-ratings/api";
import { ContentBlockWrapperOptionsProvider, defaultExtensions, RichTextProvider } from "@clinicaltoolkits/content-blocks";
import { getContentBlocksFromVariableInterpretation } from "../../utility";
import { Editor } from "@tiptap/react";

const ADD_VARIABLE = "ADD_VARIABLE";
const BATCH_ADD_VARIABLE = "BATCH_ADD_VARIABLE";
const REMOVE_VARIABLE = "REMOVE_VARIABLE";
const SET_WHOLE_VARIABLE = "SET_WHOLE_VARIABLE";
const SET_VARIABLE = "SET_VARIABLE";
const SET_VARIABLE_PROPERTY = "SET_VARIABLE_PROPERTY";
const BATCH_SET_VARIABLE_PROPERTY = "BATCH_SET_VARIABLE_PROPERTY";
const ADD_VARIABLE_SET = "ADD_VARIABLE_SUBSET";
const REMOVE_VARIABLE_SET = "REMOVE_VARIABLE_SUBSET";
const SET_VARIABLE_SET_MAP = "SET_VARIABLE_SUBSET_MAP";

interface VariableReducerState {
  variableMap: VariableMap;
  variableSetMap: VariableSetMap;
  selectedVariable?: string;
}

interface VariableContextProps {
  variableMap: VariableMap;
  variableSetMap: VariableSetMap;
  addVariable: AddVariableFunction;
  batchAddVariable: BatchAddVariableFunction;
  removeVariable: RemoveVariableFunction;
  setWholeVariable: SetWholeVariableFunction;
  setVariable: SetVariableFunction;
  setVariableProperty: SetVariablePropertyFunction;
  batchSetVariableProperty: BatchSetVariablePropertyFunction;
  addVariableSet: AddVariableSetFunction;
  removeVariableSet: RemoveVariableSetFunction;
  getVariableName: (key: string) => string;
  getVariableSubgroupByTag: GetVariableSubgroupByTagFunction;
  getVariableSubgroupByName: GetVariableSubgroupByNameFunction;
  getRelatedVariablesBySet: GetRelatedVariablesBySetFunction;
  getChildVariables: GetChildVariablesFunction;
  markVariablesHidden: MarkVariablesHiddenFunction;
  getClientAge: () => number | null;
}

type VariableAction =
  | { type: typeof ADD_VARIABLE; variable: Variable, variableSetId?: string }
  | { type: typeof BATCH_ADD_VARIABLE; variables: Variable[], variableSetId?: string }
  | { type: typeof SET_WHOLE_VARIABLE; variable: Variable }
  | { type: typeof SET_VARIABLE; id: string; value: VariableValue }
  | { type: typeof SET_VARIABLE_PROPERTY; id: string; propertyPath: PathsToFields<Variable>; value: any }
  | { type: typeof BATCH_SET_VARIABLE_PROPERTY; ids: string[]; propertyPath: PathsToFields<Variable>; value: any }
  | { type: typeof REMOVE_VARIABLE; id: string; documentId?: string }
  | { type: typeof ADD_VARIABLE_SET; variableSet: VariableSet }
  | { type: typeof REMOVE_VARIABLE_SET; variableSet: VariableSet }
  | { type: typeof SET_VARIABLE_SET_MAP; payload: VariableSetMap };

const initialState: VariableReducerState = {
  variableMap: new Map() as VariableMap,
  variableSetMap: new Map() as VariableSetMap,
};

function updateChildVariables(
  parentVariable: Variable,
  currentVariables: VariableMap,
  updatedVariables: VariableMap,
  variableSetMap: VariableSetMap
) {
  if (!parentVariable || !parentVariable.metadata?.childVariableIds) return;

  for (const childKey of parentVariable.metadata.childVariableIds) {
    const childVariable = currentVariables.get(childKey);
    let bAutoCalculate = true;
    if (childVariable) {
      // Update child variable value
      switch (childVariable.dataType) {
        case DataType.PERCENTILE_RANK: {
          bAutoCalculate = parentVariable.metadata?.bAutoCalculatePercentileRank ?? true;
          if (bAutoCalculate) {
            childVariable.value = getPercentileRankFromParentVariable(parentVariable);
          }
          break;
        }
        case DataType.DESCRIPTOR: {
          bAutoCalculate = parentVariable.metadata?.bAutoCalculateDescriptiveRating ?? true;
          if (bAutoCalculate) {
            /*let decriptiveRatingArray: DescriptiveRating[] | undefined = undefined;
            if (parentVariable.metadata?.descriptiveRatings) {
              decriptiveRatingArray = parentVariable.metadata.descriptiveRatings;  // If parentVariable has descriptiveRatings, use those.
            } else {
              decriptiveRatingArray = variableSetMap.get(parentVariable.variableSetKey)?.metadata?.descriptiveRatings; // Otherwise, check if the parentVariable's variableSet has descriptiveRatings, if not, use undefined which will prompt `getDescriptiveRatingsByTag` to utilize the universal descriptiveRatings.
            }*/

            childVariable.value = getDescriptorFromParentVariable(parentVariable, childVariable.metadata?.descriptiveRatings);
          }
          break;
        }
        default:
          return;
      }

      // Add updated childVariable (and value) to newVariables
      updatedVariables.set(childKey, { ...childVariable });

      // Recursively update potential children of the child - currently not used, but may be beneficial in future
      updateChildVariables(childVariable, currentVariables, updatedVariables, variableSetMap);
    }
  }
}

// TODO: Add type classification to 'action' parameter
// TODO: Add action creators for different actions (e.g., "const addVariable = (variable: Variable) => ({ type: actions.ADD_VARIABLE, payload: variable });")?
function reducer(state: VariableReducerState, action: VariableAction): VariableReducerState {
  switch (action.type) {
    case ADD_VARIABLE: {
      const variableToAdd = action.variable;
      const variableToAddId = variableToAdd.idToken.id;
      if (action.variableSetId) {
        variableToAdd.variableSetId = action.variableSetId;
      }

      // Clone variableMap
      const newVariableMap = new Map(state.variableMap);
      const bVariableAlreadyExists = newVariableMap.has(variableToAddId);

      if (!bVariableAlreadyExists) {
        newVariableMap.set(variableToAddId, variableToAdd);
        return {
          ...state,
          variableMap: newVariableMap,
        };
      }
      return state;
    }

    case BATCH_ADD_VARIABLE: {
      const variablesToAdd = action.variables;
      const newVariableMap = new Map(state.variableMap);
      variablesToAdd.forEach((variable) => {
        const variableToAddId = variable.idToken.id;
        if (action.variableSetId) {
          variable.variableSetId = action.variableSetId;
        }

        const bVariableAlreadyExists = newVariableMap.has(variableToAddId);
        if (!bVariableAlreadyExists) {
          newVariableMap.set(variableToAddId, variable);
        }
      });

      return {
        ...state,
        variableMap: newVariableMap,
      };
    }

    case REMOVE_VARIABLE: {
      const variablesAfterDeletion = new Map(state.variableMap);
      variablesAfterDeletion.delete(action.id);
      return { ...state, variableMap: variablesAfterDeletion };
    }

    case SET_WHOLE_VARIABLE: {
      const variable = action.variable;
      const variableId = variable.idToken.id;
      console.log("SET_WHOLE_VARIABLE: ", variable);
      const updatedVariableMap = new Map(state.variableMap);
      updatedVariableMap.set(variableId, variable);
      if (variable.metadata?.associatedCompositeVariableIdToken) {
        logger.debug("VariableContext::reducer()[SET_VARIABLE] - Updating associated composite variable");
        const associatedCompositeVariable = updatedVariableMap.get(variable.metadata.associatedCompositeVariableIdToken.id);
        if (associatedCompositeVariable) {
          updateAssociatedSubvariableProperties({ variable: associatedCompositeVariable, subvariableId: variable.idToken.id, subVariableValue: variable.value });
          updatedVariableMap.set(associatedCompositeVariable.idToken.id, associatedCompositeVariable);
        }
      }

      updateChildVariables(variable, state.variableMap, updatedVariableMap, state.variableSetMap);
      console.log("updatedVariableMap: ", updatedVariableMap);
      return { ...state, variableMap: updatedVariableMap };
    }

    case SET_VARIABLE: {
      const existingVariable = state.variableMap.get(action.id);
      if (existingVariable) {
        const updatedVariable = { ...existingVariable, value: action.value } as Variable;
        logger.debug("VariableContext::reducer()[SET_VARIABLE] - Updated variable:", updatedVariable);
        const updatedVariableMap = new Map(state.variableMap) as VariableMap;
        updatedVariableMap.set(action.id, updatedVariable);
        if (updatedVariable.metadata?.associatedCompositeVariableIdToken) {
          logger.debug("VariableContext::reducer()[SET_VARIABLE] - Updating associated composite variable");
          const associatedCompositeVariable = updatedVariableMap.get(updatedVariable.metadata.associatedCompositeVariableIdToken.id);
          if (associatedCompositeVariable) {
            updateAssociatedSubvariableProperties({ variable: associatedCompositeVariable, subvariableId: updatedVariable.idToken.id, subVariableValue: action.value });
            updatedVariableMap.set(associatedCompositeVariable.idToken.id, associatedCompositeVariable);
          }
        }

        updateChildVariables(updatedVariable, state.variableMap, updatedVariableMap, state.variableSetMap);

        return { ...state, variableMap: updatedVariableMap };
      } else {
        logger.error(`VariableContext::reducer()[SET_VARIABLE] - Variable with id ${action.id} not found`);
        return state;
      }
    }

    case SET_VARIABLE_PROPERTY: {
      const existingVariable = state.variableMap.get(action.id);
      const propertyPath = action.propertyPath;

      if (existingVariable) {
        if (propertyPath) {
          const updatedVariable = setValueByPath(existingVariable, propertyPath, action.value);
          const updatedVariableMap = new Map(state.variableMap) as VariableMap;
          updatedVariableMap.set(action.id, updatedVariable);
          return { ...state, variableMap: updatedVariableMap };
        } else {
          logger.error(`VariableContext::reducer()[SET_VARIABLE_PROPERTY] - Property path not provided for variable with id ${action.id}`);
        }
      } else {
        logger.error(`VariableContext::reducer()[SET_VARIABLE_PROPERTY] - Variable with id ${action.id} not found`);
      }

      return state;
    }

    case BATCH_SET_VARIABLE_PROPERTY: {
      const updatedVariableMap = new Map(state.variableMap) as VariableMap;
      action.ids.forEach((id) => {
        const existingVariable = updatedVariableMap.get(id);
        const propertyPath = action.propertyPath;
        const bUpdateValue = existingVariable?.value !== action.value;

        if (existingVariable && bUpdateValue) {
          if (propertyPath) {
            const updatedVariable = setValueByPath(existingVariable, propertyPath, action.value);
            updatedVariableMap.set(id, updatedVariable);
          } else {
            logger.error(`VariableContext::reducer()[BATCH_SET_VARIABLE_PROPERTY] - Property path not provided for variable with id ${id}`);
          }
        } else {
          logger.error(`VariableContext::reducer()[BATCH_SET_VARIABLE_PROPERTY] - Variable with id ${id} not found`);
        }
      });

      return { ...state, variableMap: updatedVariableMap };
    }

    case ADD_VARIABLE_SET: {
      // `If` statement required because typescript is being a dick.
      if (action.type === ADD_VARIABLE_SET) {
        const newVariableSetMap = new Map(state.variableSetMap);
        const bVariableSubsetAlreadyExists = newVariableSetMap.has(action.variableSet.idToken.id);
        if (!bVariableSubsetAlreadyExists) {
          newVariableSetMap.set(action.variableSet.idToken.id, action.variableSet);
          return { ...state, variableSetMap: newVariableSetMap };
        }
      }
      return state;
    }

    case REMOVE_VARIABLE_SET: {
      const newVariableSetMap = new Map(state.variableSetMap);
      newVariableSetMap.delete(action.variableSet.idToken.id);
      return { ...state, variableSetMap: newVariableSetMap };
    }

    case SET_VARIABLE_SET_MAP: {
      return {
        ...state,
        variableSetMap: action.payload,
      };
    }

    default: {
      return state;
    }
  }
}

export const VariableContext = createContext<VariableContextProps>({
  variableMap: new Map() as VariableMap,
  variableSetMap: new Map() as VariableSetMap,

  addVariable: (() => {}) as AddVariableFunction,
  batchAddVariable: (() => {}) as BatchAddVariableFunction,
  setWholeVariable: (() => {}) as SetWholeVariableFunction,
  setVariable: (() => {}) as SetVariableFunction,
  setVariableProperty: (() => {}) as SetVariablePropertyFunction,
  batchSetVariableProperty: (() => {}) as BatchSetVariablePropertyFunction,
  removeVariable: (() => {}) as RemoveVariableFunction,

  addVariableSet: (async () => {}) as AddVariableSetFunction,
  removeVariableSet: (() => {}) as RemoveVariableSetFunction,

  getVariableName: () => "",
  getRelatedVariablesBySet: () => [],
  getVariableSubgroupByTag: () => [],
  getVariableSubgroupByName: () => [],
  getChildVariables: () => null,
  markVariablesHidden: (() => {}),
  getClientAge: () => null,
});

export const useVariableContext = (): VariableContextProps => {
  const context = useContext(VariableContext);
  if (!context) {
    throw new Error("useVariableContext must be used within a VariableProvider");
  }
  return context;
};

interface VariableProviderProps {
  children: ReactNode;
  inContentBlockWrapperOptionsProvider?: React.FC;
  inRichTextProvider?: React.FC;
}

export const VariableProvider = ({ children, inContentBlockWrapperOptionsProvider, inRichTextProvider }: VariableProviderProps) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Used to access the current state inside of an async function
  const stateRef = useRef(state);
  // Maintains synchronicity between stateRef and state
  useEffect(() => {
    stateRef.current = state; // Update the ref whenever state changes
  }, [state]);

  const value = {
    variableMap: state.variableMap,
    variableSetMap: state.variableSetMap,

    addVariable: ((variable: Variable, variableSetId?: string) => {
      if (!variable) {
        throw new Error("VariableContext::addVariable - Missing 'variable'.");
      }
      dispatch({ type: ADD_VARIABLE, variable, variableSetId });
    }) as AddVariableFunction,

    batchAddVariable: ((variables: Variable[], variableSetId?: string) => {
      if (!variables) {
        throw new Error("VariableContext::batchAddVariable - Missing 'variables'.");
      }
      variables.forEach((variable) => value.addVariable(variable, variableSetId));
    }) as BatchAddVariableFunction,

    setWholeVariable: ((variable: Variable) => {
      dispatch({ type: SET_WHOLE_VARIABLE, variable });
    }) as SetWholeVariableFunction,

    setVariable: ((id: string, value: VariableValue) => {
      dispatch({ type: SET_VARIABLE, id, value });
    }) as SetVariableFunction,

    setVariableProperty: ((id: string, propertyPath: PathsToFields<Variable>, value: any) => {
      dispatch({ type: SET_VARIABLE_PROPERTY, id, propertyPath, value });
    }) as SetVariablePropertyFunction,

    batchSetVariableProperty: ((ids: string[], propertyPath: PathsToFields<Variable>, value: any) => {
      dispatch({ type: BATCH_SET_VARIABLE_PROPERTY, ids, propertyPath, value });
    }) as BatchSetVariablePropertyFunction,

    removeVariable: ((id: string, documentId?: string) => {
      dispatch({ type: REMOVE_VARIABLE, id, documentId });
    }) as RemoveVariableFunction,

    addVariableSet: (async (variableSet: VariableSet, bInIncludeAutoGeneratedVariables?: boolean): Promise<void> => {
      logger.debug("VariableContext::addVariableSet() - Adding variable set:", variableSet);
      const bExistingSet = state.variableSetMap.has(variableSet.idToken.id);
      return new Promise(async (resolve, reject) => {
        if (!bExistingSet) {
          try {
            const variablesToAdd = await fetchVariablesFromSet(variableSet, bInIncludeAutoGeneratedVariables);
            const pendingVariableIds = new Set(variablesToAdd.map(v => v.idToken.id));
            value.batchAddVariable(variablesToAdd, variableSet.idToken.id);
            //variablesToAdd.forEach((variable) => value.addVariable(variable, variableSet.idToken.id));

            if (variableSet.metadata?.descriptiveRatingId) {
              const descriptiveRatings = await fetchDescriptiveRatingsArray(variableSet.metadata?.descriptiveRatingId);
              variableSet.metadata!.descriptiveRatings = descriptiveRatings;
            }

            dispatch({ type: ADD_VARIABLE_SET, variableSet: variableSet });

            // Counter for the number of check attempts
            let checkAttempts = 0;
            const maxCheckAttempts = 10; // Set a maximum number of attempts to avoid infinite loops

            // Periodic check to see if all variables have been added
            const checkAllVariablesAdded = () => {
              if (checkAttempts >= maxCheckAttempts) {
                logger.error("VariableContext::checkAllVariablesAdded() - Max check attempts reached. Not all variables added.");
                reject(); // Reject the promise as not all variables are added within max attempts
                return;
              }

              if (Array.from(pendingVariableIds).every(variableId => stateRef.current.variableMap.has(variableId))) {
                logger.debug("VariableContext::addVariableSet::checkAllVariablesAdded() - All variables added. Printing added variables from state.")
                variableSet.variableIds.all.forEach((id) => {
                  const variable = stateRef.current.variableMap.get(id);
                  if (!variable) {
                    logger.error(`VariableContext::addVariableSet::checkAllVariablesAdded() - Variable with id ${id} not found in state.`);
                  }
                });
                resolve(); // Resolve the promise as all variables are added
              } else {
                logger.debug("VariableContext::addVariableSet::checkAllVariablesAdded() - Not all variables added. Checking again in 50ms.");
                setTimeout(checkAllVariablesAdded, 100); // Recheck after a delay // TODO: Use of setTimeout is not ideal may want to consider moving to an event-based approach (e.g., maintain a list of pending variables and remove them as they are added).
                checkAttempts++;
              }
            };

            checkAllVariablesAdded();
          } catch (error) {
            logger.error("VariableContext::addVariableSet() - Error fetching variable subset:", error);
            reject();
          }
        }
        else {
          resolve();
        }
      });
    }) as AddVariableSetFunction,

    removeVariableSet: ((variableSet: VariableSet) => {
      // Remove all variables associated with the variableSubset
      variableSet.variableIds?.all.forEach((variableId) => {
        value.removeVariable(variableId);
      });

      dispatch({ type: REMOVE_VARIABLE_SET, variableSet: variableSet });
      }) as RemoveVariableSetFunction,

    getVariableName: ((id: string) => {
      const variable = state.variableMap.get(id);
      if (variable) {
        return variable.fullName;
      } else {
        logger.error(`VariableContext::getVariableName() - Variable with id ${id} not found`);
      }
    }) as GetVariableNameFunction,

    getRelatedVariablesBySet: ((variableSet: VariableSet, bIncludeChlidVariables?: boolean, bIncludeHiddenVariables?: boolean): Variable[] => {
      let variables: Variable[] = [];
      if (variableSet.variableIds) {
        variableSet.variableIds.all.forEach((id) => {
          const variable = state.variableMap.get(id);
          if (variable) {
            variables.push(variable);
            if (bIncludeChlidVariables && variable.metadata?.childVariableIds) {
              variable.metadata.childVariableIds.forEach((childId) => {
                const childVariable = state.variableMap.get(childId);
                const bVisibleChildVariable = isVisible(childVariable?.metadata?.visibility);
                if (childVariable) {
                  if (bVisibleChildVariable) {
                    variables.push(childVariable);
                  } else if (bIncludeHiddenVariables) {
                    variables.push(childVariable);
                  }
                }
              });
            }
          }
        });
      }
      return variables;
    }) as GetRelatedVariablesBySetFunction,

    getVariableSubgroupByTag: ((variablestoSearch:Variable[], tag: Tag): Variable[] => {
      let variableSubgroup: Variable[] = [];
      if (variablestoSearch) {
        variablestoSearch.forEach((variable) => {
          if (variable.subgroupTag?.name === tag?.name) {
            variableSubgroup.push(variable);
          }
        });
      }
      return variableSubgroup;
    }) as GetVariableSubgroupByTagFunction,

    getVariableSubgroupByName: ((variablestoSearch: Variable[], name: string): Variable[] => {
      let variableSubgroup: Variable[] = [];
      if (variablestoSearch) {
        variablestoSearch.forEach((variable) => {
          if (variable.subgroupTag?.name === name) {
            variableSubgroup.push(variable);
          }
        });
      }
      return variableSubgroup;
    }) as GetVariableSubgroupByNameFunction,

    getChildVariables: ((parentVariable: Variable): Variable[] | null => {
      return getChildVariablesHelper(parentVariable, state.variableMap);
    }) as GetChildVariablesFunction,

    markVariablesHidden: ((ids: string[], bHidden: boolean) => {
      const updatedVisibility = bHidden ? Visibility.HIDDEN : Visibility.VISIBLE;
      value.batchSetVariableProperty(ids, "metadata.visibility", updatedVisibility);
    }) as MarkVariablesHiddenFunction,

    /* Moved to standalone utility function
    getVariablesArray(variableIds?: string[], bInIncludeAutoGeneratedVariables = true): Variable[] {
      let variables: Variable[] = [];

      if (variableIds) {
        variableIds.map((id) => {
          const variable = state.variableMap.get(id);
          if (!variable) {
            throw Error(`VariableContext::getVariablesArray() - Variable with id ${id} not found`);
          }
          bInIncludeAutoGeneratedVariables ? variables.push(variable) : !variable.metadata?.bAutoGenerated && variables.push(variable);
        });
      } else {
        if (bInIncludeAutoGeneratedVariables) {
          variables = Array.from(state.variableMap.values());
        } else {
          variables = Array.from(state.variableMap.values()).filter((variable) => !variable.metadata?.bAutoGenerated);
        }
      }

      return variables;
    },
    */

    getClientAge: () => {
      return getClientAgeHelper(state.variableMap);
    },
  };

  const ContentBlockProvider = inContentBlockWrapperOptionsProvider ?? ContentBlockWrapperOptionsProvider; // TODO: Unsure if this is the best way to handle this (need to weigh the pros and cons of including another package's provider within this provider)
  return (
    <RichTextProvider>
      <VariableContext.Provider value={value}>
        <ContentBlockProvider>
          {children}
        </ContentBlockProvider>
      </VariableContext.Provider>
    </RichTextProvider>
  );
};


      /*
            //const asyncTasks: Promise<void>[] = [];
      if (existingVariableSubset) {
        const updatedVariableSetKeys = addMultipleUnique(existingVariableSubset.variableKeys, variables.map((variable) => variable.key));
        newVariableSubsetMap.set(existingVariableSubset.key, { ...existingVariableSubset, variableKeys: updatedVariableSetKeys });
      } else {
        if (variableSubset.metadata?.descriptiveRatingId && !variableSubset.metadata?.descriptiveRatings) {
          const task = getDescriptiveRatingsById(supabaseClient, variableSubset.metadata?.descriptiveRatingId).then((descriptiveRatings) => {
            variableSubset.metadata!.descriptiveRatings = descriptiveRatings;
            newVariableSubsetMap.set(variableSubset.key, variableSubset);
          });
          asyncTasks.push(task);
        } else {
          newVariableSubsetMap.set(variableSubset.key, variableSubset);
        }
      }

      variables.forEach((variable) => value.addVariable(variable, variableSubset.key));

      // Wait for all async tasks to complete
      await Promise.all(asyncTasks);
      */
          //dispatch({ type: SET_VARIABLE_SUBSET_MAP, payload: newVariableSubsetMap });