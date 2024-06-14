import React, { useState } from "react";
import { Checkbox, Stack, Anchor, rem } from "@mantine/core";
import { textStyles } from "@clinicaltoolkits/universal-react-components";
import { convertStringToTag, getPluralNameFromTag } from "@clinicaltoolkits/type-definitions";
import { shouldDisplayVariables, useVariableContext } from "../../contexts";
import { addSpaces } from "@clinicaltoolkits/utility-functions";
import styles from "./styles.module.css";

type VariableCheckboxGroupProps = {
  subgroups: Record<string, string[]>; // Adjusted to reflect the actual data structure
};

export const VariableCheckboxGroup: React.FC<VariableCheckboxGroupProps> = ({ subgroups }) => {
  const { markVariablesHidden, variableMap } = useVariableContext();
  const [showAll, setShowAll] = useState(false);
  const subgroupKeys = Object.keys(subgroups); // Convert subgroups to an array of keys

  return (
    <Stack gap={rem("5px")}>
      {/* Render the first checkbox and any additional checkboxes based on showAll state */}
      <>
        {subgroupKeys.slice(0, 1).map((subgroupKey, index) => (
          <Checkbox
            key={index}
            label={getDisplayTextFromSubgroupKey(subgroupKey)}
            checked={shouldDisplayVariables(subgroups[subgroupKey], variableMap)}
            onChange={(event) => {
              console.log("event.currentTarget.checked", event.currentTarget.checked);
              const optionalVariableKeys = subgroups[subgroupKey];
              console.log("optionalVariableKeys", optionalVariableKeys);
              markVariablesHidden(optionalVariableKeys, !event.currentTarget.checked);
            }}
            size="xs"
            classNames={{ root: styles.optionalVariablesCheckbox, label: textStyles.generalText }}
          />
        ))}
        {showAll &&
          subgroupKeys.slice(1).map((subgroupKey, index) => (
            <Checkbox
              key={index}
              label={getDisplayTextFromSubgroupKey(subgroupKey)}
              checked={shouldDisplayVariables(subgroups[subgroupKey], variableMap)}
              onChange={(event) => {
                console.log("event.currentTarget.checked", event.currentTarget.checked);
                const optionalVariableKeys = subgroups[subgroupKey];
                console.log("optionalVariableKeys", optionalVariableKeys);
                markVariablesHidden(optionalVariableKeys, !event.currentTarget.checked);
              }}
              size="xs"
              classNames={{ root: styles.optionalVariablesCheckbox, label: textStyles.generalText }}
            />
          ))}
      </>

      {/* Always render the Anchor at the end */}
      {subgroupKeys.length > 1 && (
        <Anchor onClick={() => setShowAll(!showAll)} size="xs">
          {showAll ? "Hide options" : "Show more options"}
        </Anchor>
      )}
    </Stack>
  );
};

const getDisplayTextFromSubgroupKey = (subgroupKey: string): string => {
  let displayText = "Include" + " ";
  const tag = convertStringToTag(subgroupKey);

  if (tag) {
    displayText += addSpaces({ text: getPluralNameFromTag(tag) });
  } else {
    displayText += `${addSpaces({ text: subgroupKey })}s`;
  }

  displayText += " " + "(optional)";

  return displayText;
};