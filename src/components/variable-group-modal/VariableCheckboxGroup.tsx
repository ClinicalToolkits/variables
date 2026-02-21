import React, { useState } from "react";
import { Checkbox, Stack, Anchor, rem } from "@mantine/core";
import { textStyles } from "@clinicaltoolkits/universal-react-components";
import { convertStringToTag, getPluralNameFromTag } from "@clinicaltoolkits/type-definitions";
import { addSpaces } from "@clinicaltoolkits/utility-functions";
import { VariableMap } from "../../types";
import styles from "./styles.module.css";

const shouldDisplaySubgroupVariables = (variableIds: string[], variableMap: VariableMap) => {
  return variableIds.every((variableId) => {
    const variable = variableMap.get(variableId);
    return variable ? variable.isVisible() : false;
  });
};

type VariableCheckboxGroupProps = {
  inVariableMap: VariableMap;
  inSubgroups: Record<string, string[]>; // Adjusted to reflect the actual data structure
  onChange: (variableIds: string[], checked: boolean) => void;
};

export const VariableCheckboxGroup: React.FC<VariableCheckboxGroupProps> = ({ inVariableMap, inSubgroups, onChange }) => {
  const [showAll, setShowAll] = useState(false);
  const subgroupKeys = Object.keys(inSubgroups); // Convert subgroups to an array of keys

  return (
    <Stack gap={rem("5px")}>
      {/* Render the first checkbox and any additional checkboxes based on showAll state */}
      <>
        {subgroupKeys.slice(0, 1).map((subgroupKey, index) => (
          <Checkbox
            key={index}
            label={getDisplayTextFromSubgroupKey(subgroupKey)}
            checked={shouldDisplaySubgroupVariables(inSubgroups[subgroupKey], inVariableMap)}
            onChange={(event) => {
              console.log("event.currentTarget.checked", event.currentTarget.checked);
              const optionalVariableKeys = inSubgroups[subgroupKey];
              onChange(optionalVariableKeys, event.currentTarget.checked);
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
              checked={shouldDisplaySubgroupVariables(inSubgroups[subgroupKey], inVariableMap)}
              onChange={(event) => {
                console.log("event.currentTarget.checked", event.currentTarget.checked);
                const optionalVariableKeys = inSubgroups[subgroupKey];
                onChange(optionalVariableKeys, event.currentTarget.checked);
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

// TODO: This is likely to throw an error, we now use category display names for subgroups
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