import { DataType } from "@clinicaltoolkits/type-definitions";

export const getVariablePlaceholder = (type: string): string | undefined => {
  switch (type) {
    case DataType.DATE:
      return "Date";
    case DataType.STANDARD_SCORE:
      return "Standard Score";
    case DataType.SCALED_SCORE:
      return "Scaled Score";
    case DataType.T_SCORE:
      return "T-Score";
    case DataType.PERCENTILE_RANK:
    case DataType.PERCENTILE_RANGE:
      return "Percentile";
    case DataType.AGE:
      return "Years:Months";
    default:
      return "Value";
  }
};

export const getAbbreviatedVariablePlaceholder = (type: string): string | undefined => {
  switch (type) {
    case DataType.PERCENTILE_RANK:
    case DataType.PERCENTILE_RANGE:
      return "%-ile";
    /*case DataType.AGE:
      return "Y:M";*/
    default:
      return undefined;
  }
};