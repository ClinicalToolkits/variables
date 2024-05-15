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
import { markVariablesHiddenHelper, getClientAgeHelper } from "./helpers";
import {  Tag, DataType } from "@clinicaltoolkits/type-definitions";
import { logger } from "@clinicaltoolkits/utility-functions";
import { getChildVariablesHelper } from "./helpers/getChildVariablesHelper";
import { fetchVariablesFromSet } from "../../api";
import { VariableMap, AddVariableFunction, RemoveVariableFunction, SetVariableFunction, Variable, VariableValue, VariableSet } from "../../types";
import { getDescriptorFromParentVariable } from "../../utility/getDescriptor";
import { getPercentileRankFromParentVariable } from "../../utility/getPercentileRank";
import { updateAssociatedSubvariableProperties } from "./utility";
import { fetchDescriptiveRatingsArray } from "../../descriptive-ratings/api";

const ADD_VARIABLE = "ADD_VARIABLE";
const REMOVE_VARIABLE = "REMOVE_VARIABLE";
const SET_VARIABLE = "SET_VARIABLE";
const ADD_VARIABLE_SET = "ADD_VARIABLE_SUBSET";
const REMOVE_VARIABLE_SET = "REMOVE_VARIABLE_SUBSET";
const SET_VARIABLE_SET_MAP = "SET_VARIABLE_SUBSET_MAP";
const MARK_VARIABLES_HIDDEN = "MARK_VARIABLES_HIDDEN";

interface VariableReducerState {
  variableMap: VariableMap;
  variableSetMap: VariableSetMap;
  selectedVariable?: string;
}

interface VariableContextProps {
  variableMap: VariableMap;
  variableSetMap: VariableSetMap;
  addVariable: AddVariableFunction;
  removeVariable: RemoveVariableFunction;
  setVariable: SetVariableFunction;
  addVariableSet: AddVariableSetFunction;
  removeVariableSet: RemoveVariableSetFunction;
  getVariableName: (key: string) => string;
  getVariableSubgroupByTag: GetVariableSubgroupByTagFunction;
  getVariableSubgroupByName: GetVariableSubgroupByNameFunction;
  getRelatedVariablesBySet: GetRelatedVariablesBySetFunction;
  getChildVariables: GetChildVariablesFunction;
  markVariablesHidden: MarkVariablesHiddenFunction;
  getVariablesArray: (variableKeys?: string[]) => Variable[];
  getClientAge: () => number | null;
}

type VariableAction =
  | { type: typeof ADD_VARIABLE; variable: Variable, variableSetKey?: string }
  | { type: typeof SET_VARIABLE; key: string; value: VariableValue }
  | { type: typeof REMOVE_VARIABLE; key: string; documentId?: string }
  | { type: typeof ADD_VARIABLE_SET; variableSet: VariableSet }
  | { type: typeof REMOVE_VARIABLE_SET; variableSet: VariableSet }
  | { type: typeof SET_VARIABLE_SET_MAP; payload: VariableSetMap }
  | { type: typeof MARK_VARIABLES_HIDDEN; keys: string[]; bHidden: boolean };

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
  if (!parentVariable || !parentVariable.metadata?.childVariableKeys) return;

  for (const childKey of parentVariable.metadata.childVariableKeys) {
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
      if (action.variableSetKey) {
        variableToAdd.variableSetKey = action.variableSetKey;
      }

      // Clone variableMap
      const newVariableMap = new Map(state.variableMap);
      const bVariableAlreadyExists = newVariableMap.has(variableToAdd.key);

      if (!bVariableAlreadyExists) {
        newVariableMap.set(variableToAdd.key, variableToAdd);
        return {
          ...state,
          variableMap: newVariableMap,
        };
      }
      return state;
    }

    case REMOVE_VARIABLE: {
      const variablesAfterDeletion = new Map(state.variableMap);
      variablesAfterDeletion.delete(action.key);
      return { ...state, variableMap: variablesAfterDeletion };
    }

    case SET_VARIABLE: {
      const existingVariable = state.variableMap.get(action.key);
      if (existingVariable) {
        const updatedVariable = { ...existingVariable, value: action.value } as Variable;
        logger.debug("VariableContext::reducer()[SET_VARIABLE] - Updated variable:", updatedVariable);
        const updatedVariableMap = new Map(state.variableMap) as VariableMap;
        updatedVariableMap.set(action.key, updatedVariable);
        if (updatedVariable.metadata?.associatedCompositeVariableKey) {
          logger.debug("VariableContext::reducer()[SET_VARIABLE] - Updating associated composite variable");
          const associatedCompositeVariable = updatedVariableMap.get(updatedVariable.metadata.associatedCompositeVariableKey);
          if (associatedCompositeVariable) {
            updateAssociatedSubvariableProperties({ variable: associatedCompositeVariable, subvariableKey: updatedVariable.key, subVariableValue: action.value });
            updatedVariableMap.set(associatedCompositeVariable.key, associatedCompositeVariable);
          }
        }

        updateChildVariables(updatedVariable, state.variableMap, updatedVariableMap, state.variableSetMap);

        return { ...state, variableMap: updatedVariableMap };
      } else {
        logger.error(`VariableContext::reducer()[SET_VARIABLE] - Variable with key ${action.key} not found`);
      }
    }

    case ADD_VARIABLE_SET: {
      // `If` statement required because typescript is being a dick.
      if (action.type === ADD_VARIABLE_SET) {
        const newVariableSetMap = new Map(state.variableSetMap);
        const bVariableSubsetAlreadyExists = newVariableSetMap.has(action.variableSet.key);
        if (!bVariableSubsetAlreadyExists) {
          newVariableSetMap.set(action.variableSet.key, action.variableSet);
          return { ...state, variableSetMap: newVariableSetMap };
        }
      }
      return state;
    }

    case REMOVE_VARIABLE_SET: {
      const newVariableSetMap = new Map(state.variableSetMap);
      newVariableSetMap.delete(action.variableSet.key);
      return { ...state, variableSetMap: newVariableSetMap };
    }

    case SET_VARIABLE_SET_MAP: {
      return {
        ...state,
        variableSetMap: action.payload,
      };
    }

    case MARK_VARIABLES_HIDDEN: {
      const updatedVariableMap = markVariablesHiddenHelper(state.variableMap, action.keys, action.bHidden);
      return { ...state, variableMap: updatedVariableMap };
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
  setVariable: (() => {}) as SetVariableFunction,
  removeVariable: (() => {}) as RemoveVariableFunction,

  addVariableSet: (async () => {}) as AddVariableSetFunction,
  removeVariableSet: (() => {}) as RemoveVariableSetFunction,

  getVariableName: () => "",
  getRelatedVariablesBySet: () => [],
  getVariableSubgroupByTag: () => [],
  getVariableSubgroupByName: () => [],
  getChildVariables: () => null,
  markVariablesHidden: (() => {}),
  getVariablesArray: () => [],
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
}

export const VariableProvider = ({ children }: VariableProviderProps) => {
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

    addVariable: ((variable: Variable, variableSetKey?: string) => {
      if (!variable) {
        throw new Error("VariableContext::addVariable - Missing 'variable'.");
      }
      dispatch({ type: ADD_VARIABLE, variable, variableSetKey });
    }) as AddVariableFunction,

    setVariable: ((key: string, value: VariableValue) => {
      dispatch({ type: SET_VARIABLE, key, value });
    }) as SetVariableFunction,

    removeVariable: ((key: string, documentId?: string) => {
      dispatch({ type: REMOVE_VARIABLE, key, documentId });
    }) as RemoveVariableFunction,

    addVariableSet: (async (variableSet: VariableSet): Promise<void> => {
      logger.debug("VariableContext::addVariableSet() - Adding variable set:", variableSet);
      const bExistingSet = state.variableSetMap.has(variableSet.key);
      return new Promise(async (resolve, reject) => {
        if (!bExistingSet) {
          try {
            const variablesToAdd = await fetchVariablesFromSet(variableSet);
            const pendingVariables = new Set(variablesToAdd.map(v => v.key));
            variablesToAdd.forEach((variable) => value.addVariable(variable, variableSet.key));

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

              if (Array.from(pendingVariables).every(key => stateRef.current.variableMap.has(key))) {
                logger.debug("VariableContext::checkAllVariablesAdded() - All variables added. Printing added variables from state.")
                variableSet.variableKeys.all.forEach((key) => {
                  const variable = stateRef.current.variableMap.get(key);
                  if (!variable) {
                    logger.error(`VariableContext::checkAllVariablesAdded() - Variable with key ${key} not found in state.`);
                  }
                });
                resolve(); // Resolve the promise as all variables are added
              } else {
                logger.debug("VariableContext::checkAllVariablesAdded() - Not all variables added. Checking again in 50ms.");
                setTimeout(checkAllVariablesAdded, 50); // Recheck after a delay // TODO: Use of setTimeout is not ideal may want to consider moving to an event-based approach (e.g., maintain a list of pending variables and remove them as they are added).
                checkAttempts++;
              }
            };

            checkAllVariablesAdded();
          } catch (error) {
            logger.error("VariableContext::addVariableSubset() - Error fetching variable subset:", error);
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
      variableSet.variableKeys?.all.forEach((variableKey) => {
        value.removeVariable(variableKey);
      });

      dispatch({ type: REMOVE_VARIABLE_SET, variableSet: variableSet });
      }) as RemoveVariableSetFunction,

    getVariableName: ((key: string) => {
      const variable = state.variableMap.get(key);
      if (variable) {
        return variable.fullName;
      } else {
        logger.error(`VariableContext::getVariableName() - Variable with key ${key} not found`);
      }
    }) as GetVariableNameFunction,

    getRelatedVariablesBySet: ((variableSet: VariableSet, bIncludeChlidVariables?: boolean, bIncludeHiddenVariables?: boolean): Variable[] => {
      let variables: Variable[] = [];
      if (variableSet.variableKeys) {
        variableSet.variableKeys.all.forEach((key) => {
          const variable = state.variableMap.get(key);
          if (variable) {
            variables.push(variable);
            if (bIncludeChlidVariables && variable.metadata?.childVariableKeys) {
              variable.metadata.childVariableKeys.forEach((childKey) => {
                const childVariable = state.variableMap.get(childKey);
                const bHiddenChildVariable = childVariable?.metadata?.bHidden;
                if (childVariable) {
                  if (!bHiddenChildVariable) {
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

    markVariablesHidden: ((keys: string[], bHidden: boolean) => {
      dispatch({ type: MARK_VARIABLES_HIDDEN, keys, bHidden });
    }) as MarkVariablesHiddenFunction,

    getVariablesArray(variableKeys?: string[]): Variable[] {
      if (variableKeys) {
        return variableKeys.map((key) => {
          const variable = state.variableMap.get(key);
          if (!variable) {
            logger.error(`VariableContext::getVariablesArray() - Variable with key ${key} not found`);
          }
          return variable!;
        });
      } else {
        return Array.from(state.variableMap.values());
      }
    },

    getClientAge: () => {
      return getClientAgeHelper(state.variableMap);
    },

  };

  return <VariableContext.Provider value={value}>{children}</VariableContext.Provider>;
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