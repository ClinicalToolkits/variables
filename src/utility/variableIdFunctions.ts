import { isValidUUID, ID_SEPERATOR, REPEATING_UUID_REGEX_PATTERN, getObjectPropertyFromKeyPath } from "@clinicaltoolkits/type-definitions";
import { createReplacementFunction, logger, RegexRule, RegexRuleArray } from "@clinicaltoolkits/utility-functions";
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
  return {
    pattern: REPEATING_UUID_REGEX_PATTERN(args?.inEnclosure),
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
    logger.debug("replaceUUIDPatternParams - idPath: ", idPath);
    return getObjectPropertyFromKeyPath(variableMap, idPath, bRemoveEmptyVariableContent);
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