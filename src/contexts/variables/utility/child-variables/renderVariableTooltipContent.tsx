import React from "react";
import { Grid, Text } from "@mantine/core";
import { convertAgeToAgeString, isHidden, isTypeAge } from "@clinicaltoolkits/type-definitions";
import { getChildVariableIds, getVariableFullName, getVariableMetadata, getVariableValue, Variable } from "../../../../types";
import { getVariableDescription, getVariableInterpretation } from "../../../../utility/getVariableContent";
import { ContentBlockEditor, convertBlocksToTipTapDoc, defaultExtensions } from "@clinicaltoolkits/content-blocks";
import { Editor } from "@tiptap/react";

export const renderVariableTooltipContent = (variable: Variable, data?: Map<string, Variable>, descriptionEditor?: Editor | null, interpretationEditor?: Editor | null): React.ReactElement | null => {
  //const metadata = resolveSubobjectConfigPath(item, fieldConfig.metadata);
  const descriptionBlocks = getVariableDescription(variable);
  const interpretationBlocks = data ? getVariableInterpretation(variable, data, true) : [];

  const childIds = getChildVariableIds(variable);
  const childVariableContent = renderChildVariableValues(data, variable.fullName, childIds);

  return (
    <Grid columns={4} fz={"xs"} maw={"350px"}>
      {descriptionBlocks && descriptionBlocks.length > 0 && (
        <>
          <Grid.Col span={1}>
            <Text fw={"bold"} fz={"xs"}>
              {"Description: "}
            </Text>
          </Grid.Col>
          <Grid.Col span={3}>
            <ContentBlockEditor inEditor={descriptionEditor} inContentBlocks={descriptionBlocks} />
          </Grid.Col>
        </>
      )}
      {interpretationBlocks && interpretationBlocks.length > 0 && (
        <>
          <Grid.Col span={1}>
            <Text fw={"bold"} fz={"xs"}>
              {"Interpretation: "}
            </Text>
          </Grid.Col>
          <Grid.Col span={3}>
            <ContentBlockEditor inEditor={interpretationEditor} inContentBlocks={interpretationBlocks} />
          </Grid.Col>
        </>
      )}
      {childVariableContent}
    </Grid>
  );
};

export const renderChildVariableValues = (data?: Map<string | number, Variable>, parentName?: string, childIds?: string[]): React.ReactElement[] | null => {
  if (!childIds || !data) {
    return null;
  }

  return childIds.reduce((acc: React.ReactElement[], childId) => {
    const childVariable = data.get(childId);
    if (!childVariable) {
      return acc;
    }

    const childName = getVariableFullName(childVariable);
    const childValue = getVariableValue(childVariable);
    const childMetadata = getVariableMetadata(childVariable);
    const bChildHidden = isHidden(childMetadata?.visibility);

    if (!bChildHidden) {
      return acc;
    }

    const modifiedDisplayName = childName.replace(new RegExp(`^${parentName}\\s*`), "");
    const displayValue = (childValue !== undefined) ? (isTypeAge(childValue) ? convertAgeToAgeString(childValue) : childValue) : "-";

    acc.push(
      <React.Fragment key={childId}>
        <Grid.Col span={1}>
          <Text fw={"bold"} fz={"xs"}>
            {`${modifiedDisplayName}:`}
          </Text>
        </Grid.Col>
        <Grid.Col span={3}>
          <Text fz={"xs"}>
            {displayValue}
          </Text>
        </Grid.Col>
      </React.Fragment>
    );

    return acc;
  }, []);

};