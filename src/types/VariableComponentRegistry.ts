import { DataType } from "@clinicaltoolkits/type-definitions";
import { AgeRangeInputElement, AgeInputElement, NumberInputElement, TextInputElement, SelectInputElement } from "@clinicaltoolkits/universal-react-components";

export const variableComponentRegistry = {
  ageRange: AgeRangeInputElement,
  [DataType.AGE]: AgeInputElement,
  [DataType.STANDARD_SCORE]: NumberInputElement,
  [DataType.SCALED_SCORE]: NumberInputElement,
  [DataType.T_SCORE]: NumberInputElement,
  [DataType.RAW_SCORE]: NumberInputElement,
  [DataType.PERCENTILE_RANK]: NumberInputElement,
  [DataType.QUALITATIVE]: TextInputElement,
  [DataType.DESCRIPTOR]: SelectInputElement,
  [DataType.DROPDOWN]: SelectInputElement,
  // Add your components here
};

export const variableTypesWithTwoFields: Set<DataType> = new Set([
  DataType.STANDARD_SCORE,
  DataType.SCALED_SCORE,
  DataType.T_SCORE,
  DataType.PERCENTILE_RANK,
  DataType.RAW_SCORE,
]);