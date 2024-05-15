import { Tag } from "@clinicaltoolkits/type-definitions";
import { VariableSet, Variable, AddVariableFunction, RemoveVariableFunction, SetVariableFunction } from "../../types";

/**
 * Map associating each `variableSetTag` to an array of `variable.key` values belonging to the set ID.
 * @param {string} key - The uuid that corresponds to the variable set (i.e., `variableSetTag`).
 * @param {VariableSet} value - The array of variable keys associated with that set.
 */
export type VariableSetMap = Map<string, VariableSet>;

/**
 * Function type definition for adding a variable set.
 * @param {Variable[]} variables - The variables to be added.
 * @param {string} label - The label associated with the variable set.
 * @throws Will throw an error if variables or label is invalid.
 */
export type AddVariableSetFunction = (variableSubset: VariableSet) => Promise<void>;

/**
 * Function type definition for removing a variable set.
 * @param {Tag} Variable set tag corresponding to the group of variables to be removed.
 */
export type RemoveVariableSetFunction = (variableSubset: VariableSet) => void;

/**
 * Function type definition for getting the name of a variable.
 * @param {string} key - The unique string of the variable. Acts as a key for `variableMap`.
 */
export type GetVariableNameFunction = (key: string) => string;

/**
 * Function type definition for getting a variable array by label.
 * @param {Tag} variableSetTag - The tag of the variable set.
 * @returns {Variable[]} An array of variables that have the same 'label'.
 */
export type GetRelatedVariablesBySetFunction = (variableSubset: VariableSet, bIncludeChildVariables?: boolean, bIncludeHiddenVariables?: boolean) => Variable[];

export type GetVariableSubgroupByTagFunction = (variablestoSearch: Variable[], tag: Tag) => Variable[] | null;

export type GetVariableSubgroupByNameFunction = (variablestoSearch: Variable[], name: string) => Variable[] | null;

export type GetChildVariablesFunction = (variable: Variable) => Variable[] | null;

export type MarkVariablesHiddenFunction = (keys: string[], bHidden: boolean) => void;

/**
 * Function type definition for returning an array of all variables.
 * @returns {Variable[]} An array of all variables.
 */
export type GetVariablesArrayFunction = () => Variable[];

// Group interface for convenience, currently not in use
export interface VariableContextTypes {
  variable: Variable;
  addVariable: AddVariableFunction;
  removeVariable: RemoveVariableFunction;
  setVariable: SetVariableFunction;
}
