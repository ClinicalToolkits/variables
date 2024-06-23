import { Variable, VariableMap, AssociatedSubvariableProperties } from "../../../types";
import { shouldDisplayVariable } from "../utility";

function hasProperty<T extends object>(obj: T, key: keyof any): key is keyof T {
  return key in obj;
}

export function getVariableProperty(key: string, propertyPath: keyof Variable, variableMap: VariableMap): string {
  const item = variableMap.get(key);
  if (item && hasProperty(item, propertyPath)) {
    return item[propertyPath] as string; // Cast to string if you're sure it's always a string.
  }
  return 'Unknown';
}

function getValueByPath(obj: any, pathString: string): any {
  // Convert paths like "property.subproperty[0]" into ["property", "subproperty", "0"]
  const path = pathString.replace(/\[/g, '.').replace(/\]/g, '').split('.');
  return path.reduce((acc, part) => {
    if (acc === undefined) return undefined; // Early exit if the path does not exist

    // Handling for numeric indexes (arrays)
    if (!isNaN(parseInt(part, 10))) {
      return acc[parseInt(part, 10)];
    }

    // Assuming the possibility of encountering Map objects
    if (acc instanceof Map) {
      // Check if part indicates a .get operation
      if (part.startsWith('get(') && part.endsWith(')')) {
        const key = part.slice(4, -1); // Extract key between 'get(' and ')'
        return acc.get(key);
      } else if (part === 'size') {
        // Directly return the size of the Map
        return acc.size;
      }
    }

    // Default object property access
    return acc[part];
  }, obj);
}

// TODO: This whole thing is a clusterfuck of error prone nonsense. Needs to be cleaned up and refined (e.g., individual checks for specific properties to return a specific structure is absurd).
export function getVariablePropertyFromKeyPath(variableMap: VariableMap, keyPath: string, bRemoveUnusedVariables = false): any {
  // The first part is the key, the rest is the property path
  const [variableKey, ...propertyParts] = keyPath.split('.');
  const propertyPath = propertyParts.join('.');
  const variable = variableMap.get(variableKey);

  if (!variable) {
    console.error(`Variable with key ${variableKey} not found.`);
    return undefined;
  }

  // If no property path is provided, return the whole variable
  if (propertyPath === '') {
    return variable;
  }

  // If the property path ends with 'associatedSubvariableProperties.length' and the user wants to remove unsued variables from their return, apply special handling
  if (propertyPath.includes('associatedSubvariableProperties')) {
    if (propertyPath.endsWith('.length')) {
      const basePropertyPath = propertyPath.replace('.length', '');
      const associatedSubvariableProperties: AssociatedSubvariableProperties[] = getValueByPath(variable, basePropertyPath);

      // Filter the associatedSubvariableProperties by bValueEntered
      if (Array.isArray(associatedSubvariableProperties)) {
        let filteredSubvariableProperties: AssociatedSubvariableProperties[] = [];
        associatedSubvariableProperties.forEach(subvarProperty => {
          const subvariable = variableMap.get(subvarProperty.id);
          if (!subvariable) return; // Skip if the full subvariable is not found
          if (bRemoveUnusedVariables) {
            if (subvarProperty.bValueEntered && shouldDisplayVariable(subvariable)) {
              filteredSubvariableProperties.push(subvarProperty);
            }
          } else {
            if (shouldDisplayVariable(subvariable)) {
              filteredSubvariableProperties.push(subvarProperty);
            }
          }
        });
        return filteredSubvariableProperties.length; // Return the count of subvariables where bValueEntered is true
      } else {
        return undefined; // Return undefined if associatedSubvariables is not an array
      }
    } else {
      const basePropertyPath = 'metadata.associatedSubvariableProperties'
      // find the number contained inside the `[]` in the property path and return it as a number
      const indexMatch = propertyPath.match(/\[(\d+)\]/);
      const indexString = indexMatch ? indexMatch[1] : ''; // Provide a default value or handle differently
      const indexToReference = parseInt(indexString, 10);

      const associatedSubvariableProperties: AssociatedSubvariableProperties[] = getValueByPath(variable, basePropertyPath);
      
      if (Array.isArray(associatedSubvariableProperties)) {
        let filteredSubvariableProperties: AssociatedSubvariableProperties[] = [];
        associatedSubvariableProperties.forEach(subvarProperty => {
          const subvariable = variableMap.get(subvarProperty.id);
          if (!subvariable) return; // Skip if the full subvariable is not found
          if (bRemoveUnusedVariables) {
            if (subvarProperty.bValueEntered && shouldDisplayVariable(subvariable)) {
              filteredSubvariableProperties.push(subvarProperty);
            }
          } else if (shouldDisplayVariable(subvariable)) {
              filteredSubvariableProperties.push(subvarProperty);
          }
        });
        return filteredSubvariableProperties[indexToReference].fullName; // Return the count of subvariables where bValueEntered is true
      } else {
        return undefined; // Return undefined if associatedSubvariables is not an array
      }
    }
  }

  // Use the revised getValueByPath that supports "property.subproperty[0]" syntax
  return getValueByPath(variable, propertyPath);
}
