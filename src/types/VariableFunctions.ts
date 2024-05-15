import { Variable, VariableValue } from "./Variable";

/**
 * Function type definition for adding a variable.
 * @param {Variable} variable - The variable object to be added.
 * @param {string} label - The label associated with the variable (optional).
 * @throws Will throw an error if variable or label is invalid.
 */
export type AddVariableFunction = (variable: Variable, variableSubsetKey?: string) => void;

/**
 * Function type definition for removing a variable.
 * @param {string} key - The unique string of the variable to be removed. Acts as a key for `variableMap`.
 */
export type RemoveVariableFunction = (key: string) => void;

/**
 * Function type definition for setting a variable.
 * @param {string} key - The unique sring of the variable to be set. Acts as a key for `variableMap`.
 * @param {VariableValue} value - The value of the variable to be set.
 * @throws Will throw an error if key or value is invalid.
 */
export type SetVariableFunction = (key: string, value: VariableValue) => void;