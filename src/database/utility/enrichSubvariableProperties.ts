import { VariableData } from "../../types";
import { logger } from "@clinicaltoolkits/logger";
import { SCOPES } from "../../scopes";

const log = logger.scope(SCOPES.database.utility.enrichSubvariableProperties);

export const enrichSubvariableProperties = (variable: VariableData, variables: VariableData[]) => {
  if (variable.metadata?.associatedSubvariableProperties) {
    log.debug("enriching subvariable properties for: ", variable);
    // Map through each associatedSubvariable to update its properties
    const enrichedSubvariables = variable.metadata.associatedSubvariableProperties.map(subvariableProperty => {
      // Find the subvariable in finalData using the enriched subvar's id
      const correspondingSubvar = variables.find(v => v.idToken.id === subvariableProperty.id);
      
      if (correspondingSubvar) {
        // If a matching subvariable is found, enrich the current subvar object
        return {
          ...subvariableProperty,
          fullName: correspondingSubvar.fullName, // Or any other property you need to update
        };
      }
      // If no matching subvariable is found, return the subvar as is
      return subvariableProperty;
    });

    // Update the variable's associatedSubvariableProperties with the enriched data
    variable.metadata.associatedSubvariableProperties = enrichedSubvariables;
  }
};
