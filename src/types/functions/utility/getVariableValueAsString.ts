import { DataType, convertMonthsToAge, formatAgeToNaturalLagnuage } from "@clinicaltoolkits/type-definitions";
import { isEmptyValue, logger } from "@clinicaltoolkits/utility-functions";

export function getVariableValueAsString(value: any, dataType: DataType): string {
  let formattedValue = "-";
  if (isEmptyValue(value)) return formattedValue;

  switch (dataType) {
    case DataType.AGE: {
      const clientAge = convertMonthsToAge(value);
      formattedValue = formatAgeToNaturalLagnuage(clientAge);
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

  logger.debug(`getVariableValueAsString - Value ${value} formatted as ${formattedValue}`);
  return formattedValue;
}
