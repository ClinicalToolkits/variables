/*
import { Button, CloseButton, Group, Modal, Stack, TextInput } from "@mantine/core";
import { DescriptiveRatingInput } from "./DescriptiveRatingInput";
import React, { useEffect, useState } from "react";
import { IconName, IconWrapper } from "@clinicaltoolkits/universal-react-components";
import { DataType } from "@clinicaltoolkits/type-definitions";
import { deepClone } from "@clinicaltoolkits/utility-functions";
import { DescriptiveRating, DescriptiveRatingSet } from "../../types";
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

export const DescriptiveRatingModalDEP: React.FC<DescriptiveRatingModalProps> = ({ bOpened, onClose, descriptiveRatingSet, onUpdated, mode = 'update' }) => {
  const [descriptiveRatings, setDescriptiveRatings] = useState<DescriptiveRating[]>([]);
  const [fullName, setFullName] = useState<string>("");

  useEffect(() => {
    if (mode === 'update' && descriptiveRatingSet) {
      setDescriptiveRatings(descriptiveRatingSet.ratings);
      setFullName(descriptiveRatingSet?.fullName);
    } else if (mode === 'create') {
      setDescriptiveRatings([emptyDescriptiveRating]);
    }
  }, [descriptiveRatingSet, mode]);

  const handleRatingUpdate = (updatedRating: DescriptiveRating, index: number) => {
    const updatedRatings = deepClone(descriptiveRatings);
    updatedRatings[index] = updatedRating;
    console.log("Updated ratings: ", updatedRatings);
    setDescriptiveRatings(updatedRatings);
  };

  const handleRatingDelete = (index: number) => {
    setDescriptiveRatings(currentRatings => currentRatings.filter((_, i) => i !== index));
  };

  const handleAddRating = () => {
    setDescriptiveRatings(currentRatings => [
      ...currentRatings, 
      { ...emptyDescriptiveRating } // Ensure a new object is created
    ]);
  };

  const handleSubmit = async () => {
    if (mode === 'create') {
      const descriptiveRatingSet: DescriptiveRatingSet = {
        id: "", // Placeholder ID
        fullName: fullName,
        ratings: descriptiveRatings,
      }
      const newDescriptiveRating = await createDescriptiveRatingSet(descriptiveRatingSet);
      console.log("Created new descriptive rating: ", newDescriptiveRating);
      if (onUpdated) onUpdated(newDescriptiveRating);
    } else if (mode === 'update') {
      if (descriptiveRatingSet) {
        const updatedDescriptiveRatingSet: DescriptiveRatingSet = {
          id: descriptiveRatingSet.id,
          fullName: fullName,
          ratings: descriptiveRatings,
        }
        const updatedDescriptiveRating = await updateDescriptiveRatingSet(descriptiveRatingSet.id, updatedDescriptiveRatingSet);
        console.log("Updated descriptive rating: ", updatedDescriptiveRating);
        if (onUpdated) onUpdated(updatedDescriptiveRating);
      }
    }
    onClose();
  };

  const submitButtonName = mode === 'create' ? "Create" : "Update";

  return (
    <Modal opened={bOpened} onClose={() => onClose()} title="Edit Descriptive Ratings" closeOnClickOutside={false} fullScreen>
      <Stack w={"100%"} align='center'>
        <TextInput value={fullName} onChange={(event) => setFullName(event.currentTarget.value)} placeholder="Full Name" />
        {descriptiveRatings.map((descriptiveRating, index) => (
          <Group w={"100%"} wrap="nowrap" key={index}>
            <IconWrapper name={IconName.VERTICAL_DRAG_ICON} size={24} style={{ cursor: "grab" }}/>
            <DescriptiveRatingInput 
              descriptiveRating={descriptiveRating} 
              onDescriptiveRatingUpdated={(updatedRating) => handleRatingUpdate(updatedRating, index)}
            />
            <CloseButton onClick={() => handleRatingDelete(index)} />
          </Group>))
        }
        <Button onClick={handleAddRating}>Add Rating</Button>
        <Button onClick={() => {handleSubmit()}}>{submitButtonName}</Button>
      </Stack>
    </Modal>
  );
};
*/
