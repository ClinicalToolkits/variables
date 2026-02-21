import { DebugMenuItem } from "@clinicaltoolkits/universal-react-components";
import { DataType, generateUUID } from "@clinicaltoolkits/type-definitions";
import { createVariable, Variable, VariableIdToken } from "../types";
import { variableCatalogStore } from "../state/VariableCatalogStore";

export const debugItems: DebugMenuItem[] = [
  {
    label: "Print All Variables",
    action: () => console.log(variableCatalogStore.snapshot.variableMap),
  },
  {
    label: "Add Debug Variable",
    action: () => {
      const id = generateUUID();
      const testVariable: Variable = createVariable({
        id,
        idToken: new VariableIdToken({ variableId: id }),
        fullName: "Test Variable",
        abbreviatedName: "Test Variable",
        label: "Test Variable",
        tags: [],
        dataType: DataType.QUALITATIVE,
        value: "{testValue}",
        subgroupTag: null,
        orderWithinSet: 0,
        metadata: {
          label: "testLabels",
          childVariableIds: [],
        },
      });
      variableCatalogStore.addVariables([testVariable]);
    },
  },
  {
    label: "Print Variable Group Map",
    action: () => console.log(variableCatalogStore.snapshot.variableGroupMap),
  }
];
