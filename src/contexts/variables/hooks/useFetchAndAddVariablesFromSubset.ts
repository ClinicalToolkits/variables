import { useEffect } from "react";
import { useVariableContext } from "../VariableContext";
import { fetchVariableSet, fetchVariablesFromSet } from "../../../api";

/**
 * Custom hook to initialize any variable set associated with the passed in tag. Allows for use of variable sets that may not be associated with a specific section.
 * @param {string} variableSubsetId - The unique id of the variable subset to be added. Corresponds to the uuid of the variable subset's row in the database.
 * @param {string} variableSubsetKey - Optional key of the variable subset to be added. Corresponds to the key used in the variableSubsetMap.
 */
export const useFetchAndAddVariablesFromSubset = (variableSubsetId: string, variableSubsetKey?:string,) => {
  const { addVariableSet: addVariableSubset, variableSetMap: variableSubsetMap } = useVariableContext();
  let variableSubset = variableSubsetKey ? variableSubsetMap.get(variableSubsetKey) : undefined;

  useEffect(() => {
    async function fetchAndAddVariableSubset() {
      try {
        variableSubset = await fetchVariableSet(variableSubsetId) ?? undefined;
        if (variableSubset) {
          const variables = await fetchVariablesFromSet(variableSubset);
          addVariableSubset(variableSubset);
        }
      } catch (error) {
        console.error(`Failed to add variable subset ${variableSubset} variable set: `, error);
      }
    }
    if (!variableSubset) {
      fetchAndAddVariableSubset();
    } else {
      console.warn(`Variable subset ${variableSubset} already exists in variableSetMap. If this warning is being displayed multiple times, check that a component is not re-rendering too frequently.`);
    }
  }, []); // Run only once (e.g., similar to `componentDidMount`)
};