import { Variable } from "../Variable";

export const getClonedVariables = <T extends Variable>(variables: T[] | Map<string, T>): T[] => {
    if (!Array.isArray(variables)) {
        variables = Array.from(variables.values());
    }

    return variables.filter(v => v?.metadata?._internal?._origin === "cloned");;
};
