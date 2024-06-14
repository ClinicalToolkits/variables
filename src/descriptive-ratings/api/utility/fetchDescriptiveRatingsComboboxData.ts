import { ComboboxData, convertObjectArrayToComboboxDataArray } from "@clinicaltoolkits/type-definitions";
import { fetchDescriptiveRatingSets } from "../fetchDescriptiveRatings";

export const fetchDescriptiveRatingsComboboxData = async (): Promise<ComboboxData[]> => {
  const descriptiveRatingSets = await fetchDescriptiveRatingSets();
  const descriptiveRatingsComboxData = convertObjectArrayToComboboxDataArray({ array: descriptiveRatingSets, idPath: 'id', labelPath: 'fullName' });
  return descriptiveRatingsComboxData;
};
