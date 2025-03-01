import { DebugMenuItem } from "@clinicaltoolkits/universal-react-components";
import { useVariableContext } from "../contexts";
import { DataType, generateUUID } from "@clinicaltoolkits/type-definitions";
import { Variable, VariableIdToken } from "../types";

export const debugItems: DebugMenuItem[] = [
  {
    label: "Print All Variables",
    action: () => {
      const { variableMap } = useVariableContext();
      console.log(variableMap);
    },
  },
  {
    label: "Add Debug Variable",
    action: () => {
      const { addVariable } = useVariableContext();
      const id = generateUUID();
      const testVariable: Variable = {
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
      };
      addVariable(testVariable);
    },
  },
  {
    label: "Print Variable Set Map",
    action: () => {
      const { variableSetMap } = useVariableContext();
      console.log(variableSetMap);
    },
  }
];
