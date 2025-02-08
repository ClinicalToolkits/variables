import { DataType } from "@clinicaltoolkits/type-definitions";
import { Variable, VariableValue } from "../types";
import { clampMax, clampMin, logger } from "@clinicaltoolkits/utility-functions";

export const getRandomeVariableValue = (variable: Variable): VariableValue => {
  let value: VariableValue;

  switch (variable.dataType) {
    case DataType.TEXT:
    case DataType.QUALITATIVE:
      value = variable.abbreviatedName;
      break;
    case DataType.SCALED_SCORE:
      value = Math.floor(Math.random() * 20);
      break;
    case DataType.STANDARD_SCORE:
      value = Math.floor(clampMin(Math.random() + 0.5, 0.5) * 100); // Clamp to 0.5 to 1.5 and multiply by 100 to get a value between 50 and 150
      break;
    case DataType.PERCENTILE_RANGE:
      value = Math.floor(Math.random() * 100);
      break;
    case DataType.DATE:
      // Generate a random date between 1/1/1900 and 1/1/2022 in ISO format
      value = new Date(Math.floor(Math.random() * (new Date(2022, 0, 1).getTime() - new Date(1900, 0, 1).getTime()) + new Date(1900, 0, 1).getTime())).toISOString();
    case DataType.RAW_SCORE:
      value = Math.floor(Math.random() * 100);
      break;
    case DataType.T_SCORE:
      value = Math.floor(clampMax(clampMin(Math.random(), 0.2), 0.8) * 100); // Clamp to 0.2 to 0.8 and multiply by 100 to get a value between 20 and 80
      break;
    case DataType.AGE:
      value = {
        years: Math.floor(Math.random() * 100),
        months: Math.floor(Math.random() * 12),
      }
    default:
      logger.error(`getRandomVariableValue() - Variable: ${variable.abbreviatedName} has an unsupported data type: ${variable.dataType}. Skipping value generation.`);
  }

  return value;
};
