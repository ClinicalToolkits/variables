import { MessageBatch, MessageCategory } from "@clinicaltoolkits/universal-react-components";

export enum VariablesMessageCode {
    NONE = "none",
  
    // General
  
    // Success
  
    // Errors
    ERROR_DATE_OF_BIRTH_MUST_BE_BEFORE_ASSESSMENT_END_DATE = "error_date_of_birth_must_be_before_assessment_end_date",
    ERROR_DATE_OF_BIRTH_MUST_BE_IN_PAST = "error_date_of_birth_must_be_in_past",
  }
  
  export const repGenMessages: MessageBatch[] = [
    {
      category: MessageCategory.INFO,
      messages: [],
    },
    {
      category: MessageCategory.SUCCESS,
      messages: [],
    },
    {
      category: MessageCategory.ERROR,
      messages: [
        {
          key: VariablesMessageCode.ERROR_DATE_OF_BIRTH_MUST_BE_BEFORE_ASSESSMENT_END_DATE,
          title: "Error",
          message: "The client's date of birth must be before the assessment end date. Please correct the date of birth or assessment end date.",
        },
        {
          key: VariablesMessageCode.ERROR_DATE_OF_BIRTH_MUST_BE_IN_PAST,
          title: "Error",
          message: "The client's date of birth must be in the past. Please correct the date of birth.",
        }
      ],
    },
  ];