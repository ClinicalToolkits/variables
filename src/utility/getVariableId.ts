import { UUID, asUUID, ID_SEPERATOR } from "@clinicaltoolkits/type-definitions";
import { Variable, VariableIdToken } from "../types";

// Returns the last part of the variable ID, which is the database ID (i.e., `${idToken.entityId}:${idToken.entityVersionId}:${idToken.variableId}` would return `${idToken.variableId}`)
export function getDBVariableId(variableId: string): UUID;
export function getDBVariableId(variable: Variable): UUID;
export function getDBVariableId(idToken: VariableIdToken): UUID;
export function getDBVariableId(variableOrIdTokenOrVariableIdString: Variable | VariableIdToken | string): UUID {
  if (typeof variableOrIdTokenOrVariableIdString === "string") {
    return asUUID(variableOrIdTokenOrVariableIdString.split(ID_SEPERATOR).pop()!);
  }
  if ("idToken" in variableOrIdTokenOrVariableIdString) {
    return asUUID(variableOrIdTokenOrVariableIdString.idToken.databaseId);
  }
  return asUUID(variableOrIdTokenOrVariableIdString.databaseId);
}

export function getDBVariableIds(variableIds: string[]): UUID[] {
  return variableIds.map((variableId) => getDBVariableId(variableId));
};

export function getVariableId(variableOridToken: VariableIdToken): string;
export function getVariableId(variableOridToken: Variable): string;
export function getVariableId(variableOridToken: Variable | VariableIdToken): string {
  if ("idToken" in variableOridToken) {
    return variableOridToken.idToken.id;
  }
  return variableOridToken.id;
};
