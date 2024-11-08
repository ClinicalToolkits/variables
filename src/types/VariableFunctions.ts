import { PathsToFields } from "@clinicaltoolkits/type-definitions";
import { Variable, VariableValue } from "./Variable";

/**
 * Function type definition for adding a variable.
 * @param {Variable} variable - The variable object to be added (an array for batch adding).
 * @param {string} label - The label associated with the variable (optional).
 * @throws Will throw an error if variable or label is invalid.
 */
export type AddVariableFunction = (variable: Variable, variableSubsetKey?: string) => void;
export type BatchAddVariableFunction = (variables: Variable[], variableSubsetKey?: string) => void;

/**
 * Function type definition for removing a variable.
 * @param {string} id - The unique string of the variable to be removed. Acts as a key for `variableMap`.
 */
export type RemoveVariableFunction = (id: string) => void;

/**
 * Function type definition for setting a variable.
 * @param {string} id - The unique sring of the variable to be set. Acts as a key for `variableMap`.
 * @param {VariableValue} value - The value of the variable to be set.
 * @throws Will throw an error if key or value is invalid.
 */
export type SetVariableFunction = (id: string, value: VariableValue) => void;

/**
 * Function type definition for setting any property of a variable.
 * @param {string} id - The unique string of the variable to be set. Acts as a key for `variableMap`.
 * @param {PathsToFields<Variable>} property - The property of the variable to be set.
 * @param {any} value - The value to update the property with.
 */
export type SetVariablePropertyFunction = (id: string, propertyPath: PathsToFields<Variable>, value: any) => void;

export type BatchSetVariablePropertyFunction = (ids: string[], propertyPath: PathsToFields<Variable>, value: any) => void;

/** Function type definition for setting the entire variable.
 * @param {Variable} variable - The variable object to be set.
 * @throws Will throw an error if variable is invalid.
 */
export type SetWholeVariableFunction = (variable: Variable) => void;
