import { GenericTable, GenericTableProps } from "@clinicaltoolkits/universal-react-components";
import { Button, Container, useMantineTheme } from "@mantine/core";
import React, { useEffect, useState } from "react";
import { DescriptiveRatingModal } from "./DescriptiveRatingModal";
import { DescriptiveRatingSet } from "../types";
import { fetchDescriptiveRatingSets } from "../api";

export const DescriptiveRatingTable = () => {
  const [descriptiveRatingSets, setDescriptiveRatingSets] = useState<DescriptiveRatingSet[]>([]);
  const [selectedDescriptiveRatingSet, setSelectedDescriptiveRatingSet] = useState<DescriptiveRatingSet | null>(null);
  const [bOpenedDescriptiveRatingModal, setOpenedDescriptiveRatingModal] = React.useState(false);
  const theme = useMantineTheme();

  useEffect(() => {
    fetchDescriptiveRatingSets().then(setDescriptiveRatingSets).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedDescriptiveRatingSet) {
      setOpenedDescriptiveRatingModal(true);
    } else {
      setOpenedDescriptiveRatingModal(false);
    }
  }, [selectedDescriptiveRatingSet]);

  const handleSelectedDescriptiveRatingSetUpdate = (updatedDescriptiveRatingSet: DescriptiveRatingSet) => {
    let bFoundDescriptiveRatingSet = false;
    const updatedDescriptiveRatingSets = descriptiveRatingSets.map(descriptiveRatingSet => {
      if (descriptiveRatingSet.id === updatedDescriptiveRatingSet.id) {
        bFoundDescriptiveRatingSet = true;
        return { ...descriptiveRatingSet, ...updatedDescriptiveRatingSet };
      }
      return descriptiveRatingSet;
    });
    setDescriptiveRatingSets(bFoundDescriptiveRatingSet ? updatedDescriptiveRatingSets : [...descriptiveRatingSets, updatedDescriptiveRatingSet]);
  };

  const descriptiveRatingTableProps: GenericTableProps<DescriptiveRatingSet> = {
    data: descriptiveRatingSets,
    columns: [{ path: "id" }, { path: "fullName" }],
    headingText: "Descriptive Ratings",
    onRowClick: (descriptiveRatingSet) => setSelectedDescriptiveRatingSet(descriptiveRatingSet),
  };

  const handleDescriptiveRatingModalClose = () => {
    setOpenedDescriptiveRatingModal(false);
    setSelectedDescriptiveRatingSet(null);
  };

  return (
    <Container fluid w={"100vw"} p={"xs"} bg={theme.colors.dark[7]}>
      <GenericTable {...descriptiveRatingTableProps} />
      <Button onClick={() => setOpenedDescriptiveRatingModal(true)}>Create Descriptive Rating</Button>
      <DescriptiveRatingModal descriptiveRatingSet={selectedDescriptiveRatingSet} bOpened={bOpenedDescriptiveRatingModal} onClose={handleDescriptiveRatingModalClose} mode={selectedDescriptiveRatingSet ? 'update' : 'create'} onUpdated={ (updatedDescriptiveRatingSet) => { handleSelectedDescriptiveRatingSetUpdate(updatedDescriptiveRatingSet) }} />
    </Container>
  );
};