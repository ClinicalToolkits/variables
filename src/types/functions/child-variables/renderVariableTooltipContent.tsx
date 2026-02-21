import React from "react";
import { Grid, Text } from "@mantine/core";
import { convertAgeToAgeString, isTypeAge } from "@clinicaltoolkits/type-definitions";
import { getChildVariableIds, Variable } from "../..";
import { getContentBlocksFromVariableDescription, getContentBlocksFromVariableInterpretation } from "../utility/getVariableContent";
import { ContentBlockEditor } from "@clinicaltoolkits/content-blocks";
import { Editor } from "@tiptap/react";

export const renderVariableTooltipContent = (variable: Variable, data?: Map<string, Variable>, descriptionEditor?: Editor | null, interpretationEditor?: Editor | null, bInVerticalTooltipContent?: boolean): React.ReactElement | null => {
  //const metadata = resolveSubobjectConfigPath(item, fieldConfig.metadata);
  const numColumns = bInVerticalTooltipContent ? 1 : 4;
  const contentSpan = bInVerticalTooltipContent ? 1 : 3;
  const maxWidth = bInVerticalTooltipContent ? "280px" : "450px";

  const descriptionBlocks = getContentBlocksFromVariableDescription(variable);
  const interpretationBlocks = data ? getContentBlocksFromVariableInterpretation(variable, data, true) : [];

  const childIds = getChildVariableIds(variable);
  const childVariableContent = renderChildVariableValues(data, variable.getFullName(), childIds);

  const bRenderDescription = descriptionBlocks && descriptionBlocks.length > 0;
  const bRenderInterpretation = interpretationBlocks && interpretationBlocks.length > 0;



  return (
    <Grid columns={numColumns} fz={"xs"} maw={maxWidth}>
      {bRenderDescription && (
        <>
          <Grid.Col span={1}>
            <Text fw={"bold"} fz={"xs"}>
              {"Description: "}
            </Text>
          </Grid.Col>
          <Grid.Col span={contentSpan}>
            <ContentBlockEditor inEditor={descriptionEditor} inContentBlocks={descriptionBlocks} />
          </Grid.Col>
        </>
      )}
      {bRenderInterpretation && (
        <>
          <Grid.Col span={1}>
            <Text fw={"bold"} fz={"xs"}>
              {"Interpretation: "}
            </Text>
          </Grid.Col>
          <Grid.Col span={contentSpan}>
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

    const childName = childVariable.getFullName();
    const childValue = childVariable.getValue();
    const bChildHidden = childVariable.isHidden();

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
            {displayValue?.toString() /* //TODO: Monitor for errors after introducing .toString()... */}
          </Text>
        </Grid.Col>
      </React.Fragment>
    );

    return acc;
  }, []);

};