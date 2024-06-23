import { isValidUUID, ID_SEPERATOR } from "@clinicaltoolkits/type-definitions";
import { createReplacementFunction, RegexRule } from "@clinicaltoolkits/utility-functions";
import { VARIABLE_ID_REGEX_PATTERN } from "../constants";
import { getVariablePropertyFromKeyPath } from "../contexts";
import { DEMOGRAPHICS, USER_INFORMATION, DEMOGRAPHICS_PREFIX, USER_INFORMATION_PREFIX, getVariableIdFromString, VariableMap } from "../types";

// TODO: Find a way to remove the need for Variable related imports in this file
const demographicsUuids: string[] = Object.values(DEMOGRAPHICS);
const userUuids: string[] = Object.values(USER_INFORMATION);

const appendPrefixToVariablesReplacement = (prefix: string, enclosure?: [string, string]) => createReplacementFunction({
  processData: (matches, enclosure) => {
    let returnString = "";
    if (demographicsUuids.includes(matches.basePattern)) {
      returnString = `${DEMOGRAPHICS_PREFIX}${ID_SEPERATOR}${matches.basePattern}${matches.everythingAfterBasePattern}`;
    } else if (userUuids.includes(matches.basePattern)) {
      returnString = `${USER_INFORMATION_PREFIX}${ID_SEPERATOR}${matches.basePattern}${matches.everythingAfterBasePattern}`;
    } else {
      returnString = prefix + ID_SEPERATOR + matches.basePattern + matches.everythingAfterBasePattern;
    }

    if (enclosure) {
      returnString = enclosure[0] + returnString + enclosure[1];
    }
    return returnString;
  },
  enclosure,
});
export const appendPrefixToVariablesRule = (prefix: string, enclosure?: [string, string]): RegexRule => ({
  pattern: VARIABLE_ID_REGEX_PATTERN(enclosure),
  replacement: appendPrefixToVariablesReplacement(prefix, enclosure),
  shouldApply: (args) => args?.[0]?.inPrefixToApply !== undefined,
  metadata: {
    bApplyToIfStatement: true,
  }
});

const removePrefixesFromVariablesReplacement = (enclosure?: [string, string]) => createReplacementFunction({
  processData: (matches, enclosure) => {
    const bIsUUID = isValidUUID(matches.basePattern);
    const variableId = bIsUUID ? matches.basePattern : getVariableIdFromString(matches.basePattern);

    let returnString = variableId + matches.everythingAfterBasePattern;
    if (enclosure) {
      returnString = enclosure[0] + returnString + enclosure[1];
    }
    return returnString;
  },
  enclosure,
});
export const removePrefixesFromVariablesRule = (enclosure?: [string, string]): RegexRule => ({
  pattern: VARIABLE_ID_REGEX_PATTERN(enclosure),
  replacement: removePrefixesFromVariablesReplacement(enclosure),
  shouldApply: (args) => args?.[0]?.inPrefixToRemove !== undefined,
  metadata: {
    bApplyToIfStatement: true,
  }
});

const appendSuffixToVariablesReplacement = (suffix: string, enclosure?: [string, string]) => createReplacementFunction({
  processData: (matches, enclosure) => {
    let returnString = `${matches.basePattern}${ID_SEPERATOR}${suffix}${matches.everythingAfterBasePattern}`;
    if (enclosure) {
      returnString = enclosure[0] + returnString + enclosure[1];
    }
    return returnString;
  },
  enclosure,
});
export const appendSuffixToVariablesRule = (suffix: string, enclosure?: [string, string]): RegexRule => ({
  pattern: VARIABLE_ID_REGEX_PATTERN(enclosure),
  replacement: appendSuffixToVariablesReplacement(suffix, enclosure),
  shouldApply: (args) => args?.[0]?.inSuffixToApply !== undefined,
  metadata: {
    bApplyToIfStatement: true,
  }
});

const removeSuffixFromVariablesReplacement = (enclosure?: [string, string]) => createReplacementFunction({
  processData: (matches, enclosure) => {
    const returnString = `${matches.basePattern}${matches.everythingAfterBasePattern}`;
    if (enclosure) {
      return enclosure[0] + returnString + enclosure[1];
    }
    return returnString;
  },
  enclosure,
});
export const removeSuffixFromVariablesRule = (enclosure?: [string, string]): RegexRule => ({
  pattern: VARIABLE_ID_REGEX_PATTERN(enclosure),
  replacement: removeSuffixFromVariablesReplacement(enclosure),
  shouldApply: (args) => args?.[0]?.inSuffixToRemove !== undefined,
  metadata: {
    bApplyToIfStatement: true,
  }
});

const replaceUUIDEnclosureFunction = (currentEnclosure: [string, string], replacementEnclosure: [string, string]) => createReplacementFunction({
  processData: (matches) => {
    return replacementEnclosure[0] + matches.basePattern + matches.everythingAfterBasePattern + replacementEnclosure[1];
  },
  enclosure: currentEnclosure,
});
export const replaceUUIDEnclosureRule = (currentEnclosure: [string, string], replacementEnclosure: [string, string]): RegexRule => ({
  pattern: VARIABLE_ID_REGEX_PATTERN(currentEnclosure),
  replacement: replaceUUIDEnclosureFunction(currentEnclosure, replacementEnclosure),
});

const removeUUIDEnclosureFunction = (enclosure: [string, string]) => createReplacementFunction({
  processData: (matches) => {
    return matches.basePattern + matches.everythingAfterBasePattern;
  },
  enclosure,
});
export const removeUUIDEnclosureRule = (enclosure: [string, string]): RegexRule => ({
  pattern: VARIABLE_ID_REGEX_PATTERN(enclosure),
  replacement: removeUUIDEnclosureFunction(enclosure),
});

const replaceUUIDPatternFunction = (
  variableMap: VariableMap,
  bRemoveEmptyVariableContent: boolean,
  suffixesToSearch?: string[]
) => createReplacementFunction({
  processData: (matches) => {
    const uuid = matches.basePattern;
    const propertyPath = matches.everythingAfterBasePattern;
    const idPath = uuid + (propertyPath || "");
    console.log("replaceUUIDPatternParams - idPath: ", idPath);
    return getVariablePropertyFromKeyPath(variableMap, idPath, bRemoveEmptyVariableContent);
  },
  suffixes: suffixesToSearch,
});
export const replaceUUIDPatternRule = (
  variableMap: VariableMap,
  bRemoveEmptyVariableContent: boolean,
  suffixesToSearch?: string[],
  enclosure?: [string, string]
): RegexRule => ({
  pattern: VARIABLE_ID_REGEX_PATTERN(enclosure),
  replacement: replaceUUIDPatternFunction(variableMap, bRemoveEmptyVariableContent, suffixesToSearch),
});