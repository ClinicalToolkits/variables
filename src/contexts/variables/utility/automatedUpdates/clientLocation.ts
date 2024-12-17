import { DEMOGRAPHICS, Variable } from "../../../../types";
import { User } from "@supabase/supabase-js"

export const autoSetClientLocationFromUser = (inVariable: Variable, inSupabaseUser: User | undefined | null): void => {
  //const updatedVariable = structuredClone(inVariable); // TODO: My other codebase (e.g., utility functions) has a (likely) less efficient and robust implementation for deep cloning, I should likely consider moving all cases to use this instead
  // Although currently the above is throwing an error, so... yeah.
  const city = inSupabaseUser?.user_metadata?.city;
  const province = inSupabaseUser?.user_metadata?.province;
  if (inVariable.idToken.variableId === DEMOGRAPHICS.CITY && city) {
    inVariable.value = city;
  } else if (inVariable.idToken.variableId === DEMOGRAPHICS.PROVINCE && province) {
    inVariable.value = province;
  }
}
