import { DataType, convertMonthsToAge } from "@clinicaltoolkits/type-definitions";
import { isEmptyValue } from "@clinicaltoolkits/utility-functions";

export function getVariableValueAsString(value: any, dataType: DataType): string {
  let formattedValue = "-";
  if (isEmptyValue(value)) return formattedValue;

  switch (dataType) {
    case DataType.AGE: {
      const clientAge = convertMonthsToAge(value);
      formattedValue = `${clientAge.years} Years, ${clientAge.months} Months`;
      break;
    }
    case DataType.PERCENTILE_RANGE: {
      const { min, max } = value;
      formattedValue = `${min} - ${max}`;
      break;
    }
    default: {
      if (typeof value === "number") {
        formattedValue = value.toString();
      } else {
        formattedValue = value as string;
      }
      break;
    }
  }

  console.log(`Value ${value} formatted as ${formattedValue}`);
  return formattedValue;
}
