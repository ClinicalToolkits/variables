import React, { useEffect, useState } from "react";
import { logger, mergeUndefined } from "@clinicaltoolkits/utility-functions";
import { InfoFieldObjectProperties } from "@clinicaltoolkits/universal-react-components";
import { DataType } from "@clinicaltoolkits/type-definitions";
import { Button, Group, Modal, Paper, Stack, Text, TextInput } from "@mantine/core";
import { DescriptiveRating, DescriptiveRatingSet, emptyDescriptiveRatingSet, getDescriptiveRatingObjectConfig } from "../types";
import { createDescriptiveRatingSet, updateDescriptiveRatingSet } from "../api";

const emptyDescriptiveRating: DescriptiveRating = {
  dataType: DataType.UNKNOWN,
  cutoffScore: 0,
  descriptor: '',
};

interface DescriptiveRatingModalProps {
  bOpened: boolean;
  onClose: () => void;
  descriptiveRatingSet: DescriptiveRatingSet | null;
  onUpdated?: (updatedDescriptiveRatingSet: DescriptiveRatingSet) => void;
  mode?: 'create' | 'update';
}

export const DescriptiveRatingModal: React.FC<DescriptiveRatingModalProps> = ({ bOpened, onClose, descriptiveRatingSet, onUpdated, mode = 'update' }) => {
  const [selectedDescriptiveRatingSet, setSelectedDescriptiveRatingSet] = useState<DescriptiveRatingSet>(mergeUndefined(descriptiveRatingSet, emptyDescriptiveRatingSet));

  useEffect(() => {
    const newdescriptiveRatingSet = mergeUndefined(descriptiveRatingSet, emptyDescriptiveRatingSet);
    setSelectedDescriptiveRatingSet(newdescriptiveRatingSet);
  }, [descriptiveRatingSet, mode]);

  const handleUpdateRating = (index: number, propertyPath: keyof DescriptiveRating, value: any) => {
    let updatedRatings = [...selectedDescriptiveRatingSet.ratings];
    updatedRatings[index] = {...updatedRatings[index], [propertyPath]: value};
    setSelectedDescriptiveRatingSet({
      ...selectedDescriptiveRatingSet,
      ratings: updatedRatings
    });
  };

  const handleAddRating = () => {
    setSelectedDescriptiveRatingSet({
      ...selectedDescriptiveRatingSet,
      ratings: [...selectedDescriptiveRatingSet.ratings, emptyDescriptiveRating]
    });
  };

  const handleDeleteRating = (index: number) => {
    let filteredRatings = selectedDescriptiveRatingSet.ratings.filter((_, idx) => idx !== index);
    setSelectedDescriptiveRatingSet({
      ...selectedDescriptiveRatingSet,
      ratings: filteredRatings
    });
  };

  const handleSave = async () => {
    if (mode === 'update') {
      if (descriptiveRatingSet) {
        const updatedSet = await updateDescriptiveRatingSet(selectedDescriptiveRatingSet.id, selectedDescriptiveRatingSet);
        onUpdated?.(updatedSet);
      } else {
        logger.error("Descriptive Rating Set is null. Cannot update.");
      }
    } else if (mode === 'create') {
      const newSet = await createDescriptiveRatingSet(selectedDescriptiveRatingSet);
      onUpdated?.(newSet);
    }
    onClose();
  };

  return (
    <Modal opened={bOpened} onClose={() => onClose()} title={`${mode.toUpperCase()} DESCRIPTIVE RATINGS`} closeOnClickOutside={false} fullScreen>
      <Stack w={"100%"} align='center'>
        <TextInput label="Full Name" value={selectedDescriptiveRatingSet.fullName} onChange={(e) => setSelectedDescriptiveRatingSet({ ...selectedDescriptiveRatingSet, fullName: e.currentTarget.value })} placeholder="Full Name" />
        {selectedDescriptiveRatingSet.ratings.map((rating, index) => (
          <Paper key={index}>
            <Text>{`Descriptor ${index + 1}`}</Text>
            <Group w={"100%"} wrap="nowrap">
              <InfoFieldObjectProperties
                config={getDescriptiveRatingObjectConfig()}
                data={rating}
                onUpdate={(id, path, value) => handleUpdateRating(index, path, value)}
              />
              <Button onClick={() => handleDeleteRating(index)}>Delete</Button>
            </Group>
          </Paper>
        ))}
        <Button onClick={handleAddRating}>Add Rating</Button>
        <Button onClick={handleSave}>{mode === 'create' ? "Create" : "Update"}</Button>
      </Stack>
    </Modal>
  );
};
