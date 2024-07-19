import { isValidUUID, ID_SEPERATOR, REPEATING_UUID_REGEX_PATTERN } from "@clinicaltoolkits/type-definitions";
import { createReplacementFunction, RegexRule, RegexRuleArray } from "@clinicaltoolkits/utility-functions";
import { getVariablePropertyFromKeyPath } from "../contexts";
import { DEMOGRAPHICS, USER_INFORMATION, DEMOGRAPHICS_PREFIX, USER_INFORMATION_PREFIX, getVariableIdFromString, VariableMap } from "../types";
import { AffixParams } from "@clinicaltoolkits/content-blocks";

// TODO: Consider if this isn't better conceptualized as utility functions for content blocks (i.e., focus on id replacement, rather than variable id replacement)
const demographicsUuids: string[] = Object.values(DEMOGRAPHICS);
const userUuids: string[] = Object.values(USER_INFORMATION);

const appendPrefixToVariablesReplacement = (args: AffixParams) => {
  const { inPrefixToApply, inEnclosure } = args;

  return createReplacementFunction({
    processData: (matches, enclosure) => {
      let returnString = `${matches.basePattern}${matches.everythingAfterBasePattern}`;
      if (demographicsUuids.includes(matches.basePattern)) {
        returnString = `${DEMOGRAPHICS_PREFIX}${ID_SEPERATOR}${matches.basePattern}${matches.everythingAfterBasePattern}`;
      } else if (userUuids.includes(matches.basePattern)) {
        returnString = `${USER_INFORMATION_PREFIX}${ID_SEPERATOR}${matches.basePattern}${matches.everythingAfterBasePattern}`;
      } else if (inPrefixToApply) {
        returnString = inPrefixToApply + ID_SEPERATOR + matches.basePattern + matches.everythingAfterBasePattern;
      }

      if (enclosure) {
        returnString = enclosure[0] + returnString + enclosure[1];
      }
      return returnString;
    },
    enclosure: inEnclosure,
  });
};
export const appendPrefixToVariablesRule = (args: AffixParams): RegexRule => {
  const { inEnclosure } = args;

  return {
    pattern: REPEATING_UUID_REGEX_PATTERN(inEnclosure),
    replacement: appendPrefixToVariablesReplacement({ ...args }),
    shouldApply: (args) => args?.inPrefixToApply !== undefined,
    metadata: {
      bApplyToIfStatement: true,
    }
  }
};

const removePrefixesFromVariablesReplacement = (args: AffixParams) => {
  const { inEnclosure } = args;

  return createReplacementFunction({
    processData: (matches, enclosure) => {
      const bIsUUID = isValidUUID(matches.basePattern);
      const variableId = bIsUUID ? matches.basePattern : getVariableIdFromString(matches.basePattern);
      let returnString = variableId + matches.everythingAfterBasePattern;

      if (enclosure) {
        returnString = enclosure[0] + returnString + enclosure[1];
      }
      return returnString;
    },
    enclosure: inEnclosure,
  });
};
export const removePrefixesFromVariablesRule = (args: AffixParams): RegexRule => {
  const { inPrefixToRemove, inEnclosure } = args;

  if (inPrefixToRemove === "07d18958-a88b-4077-9782-975a7d7f74cc:46079a2a-86a7-4eb2-ac14-af57dc11dcf8") {
    console.log("removePrefixesFromVariablesRule() - inPrefixToRemove: ", inPrefixToRemove, "inEnclosure: ", inEnclosure);
  }

  return {
    pattern: REPEATING_UUID_REGEX_PATTERN(inEnclosure),
    replacement: removePrefixesFromVariablesReplacement({ ...args }),
    shouldApply: (args) => args?.inPrefixToRemove !== undefined,
    metadata: {
      bApplyToIfStatement: true,
    }
  }
};

const appendSuffixToVariablesReplacement = (args: AffixParams) => {
  const { inSuffixToApply, inEnclosure } = args;

  return createReplacementFunction({
    processData: (matches, enclosure) => {
      let returnString = `${matches.basePattern}${ID_SEPERATOR}${inSuffixToApply}${matches.everythingAfterBasePattern}`;
      if (enclosure) {
        returnString = enclosure[0] + returnString + enclosure[1];
      }
      return returnString;
    },
    enclosure: inEnclosure,
  });
};
export const appendSuffixToVariablesRule = (args: AffixParams): RegexRule => {
  const { inEnclosure } = args;

  return {
    pattern: REPEATING_UUID_REGEX_PATTERN(inEnclosure),
    replacement: appendSuffixToVariablesReplacement({ ...args }),
    shouldApply: (args) => args?.inSuffixToApply !== undefined,
    metadata: {
      bApplyToIfStatement: true,
    }
  }
};

const removeSuffixFromVariablesReplacement = (args: AffixParams) => {
  const { inEnclosure } = args;

  return createReplacementFunction({
    processData: (matches, enclosure) => {
      const returnString = `${matches.basePattern}${matches.everythingAfterBasePattern}`;
      if (enclosure) {
        return enclosure[0] + returnString + enclosure[1];
      }
      return returnString;
    },
    enclosure: inEnclosure,
  });
};
export const removeSuffixFromVariablesRule = (args: AffixParams): RegexRule => {
  const { inEnclosure } = args;

  return {
    pattern: REPEATING_UUID_REGEX_PATTERN(inEnclosure),
    replacement: removeSuffixFromVariablesReplacement({ ...args}),
    shouldApply: (args) => args?.inSuffixToRemove !== undefined,
    metadata: {
      bApplyToIfStatement: true,
    }
  }
};

export const getVariableAffixRules = ({ inPrefixToApply, inPrefixToRemove, inSuffixToApply, inSuffixToRemove, inEnclosure }: AffixParams): RegexRuleArray => {
  const rules: RegexRuleArray = [];
  if (inPrefixToApply) {
    rules.push(appendPrefixToVariablesRule);
  }
  if (inSuffixToApply) {
    rules.push(appendSuffixToVariablesRule);
  }
  if (inPrefixToRemove) {
    rules.push(removePrefixesFromVariablesRule);
  }
  if (inSuffixToRemove) {
    rules.push(removeSuffixFromVariablesRule);
  }
  return rules;
};

const replaceUUIDEnclosureFunction = (currentEnclosure: [string, string], replacementEnclosure: [string, string]) => createReplacementFunction({
  processData: (matches) => {
    return replacementEnclosure[0] + matches.basePattern + matches.everythingAfterBasePattern + replacementEnclosure[1];
  },
  enclosure: currentEnclosure,
});
export const replaceUUIDEnclosureRule = (currentEnclosure: [string, string], replacementEnclosure: [string, string]): RegexRule => ({
  pattern: REPEATING_UUID_REGEX_PATTERN(currentEnclosure),
  replacement: replaceUUIDEnclosureFunction(currentEnclosure, replacementEnclosure),
});

const removeUUIDEnclosureFunction = (enclosure: [string, string]) => createReplacementFunction({
  processData: (matches) => {
    return matches.basePattern + matches.everythingAfterBasePattern;
  },
  enclosure,
});
export const removeUUIDEnclosureRule = (enclosure: [string, string]): RegexRule => ({
  pattern: REPEATING_UUID_REGEX_PATTERN(enclosure),
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
  pattern: REPEATING_UUID_REGEX_PATTERN(enclosure),
  replacement: replaceUUIDPatternFunction(variableMap, bRemoveEmptyVariableContent, suffixesToSearch),
});