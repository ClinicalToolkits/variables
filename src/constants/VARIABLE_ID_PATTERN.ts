import { UUID4_STRING_PATTERN } from "@clinicaltoolkits/type-definitions";
import { createRegexPattern } from "@clinicaltoolkits/utility-functions";

export const VARIABLE_ID_PATTERN = `(${UUID4_STRING_PATTERN}(?::${UUID4_STRING_PATTERN})*)`;
export const VARIABLE_ID_REGEX_PATTERN = (enclosure?: [string, string]) => createRegexPattern({
  pattern: VARIABLE_ID_PATTERN,
  options: {
    enclosure: enclosure,
    flags: "gi"
  }
});
export enum ALLOWED_VARIABLE_PROPERTIES {
  ID = ".id",
  FULL_NAME = ".fullName",
  ABBREVIATED_NAME = ".abbreviatedName",
  VALUE = ".value",
  DESCRIPTION = ".metadata.description",
  ASSOCIATED_ENTITY_ABBREVIATED_NAME = ".associatedEntityAbbreviatedName",
}
