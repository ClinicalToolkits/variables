import { Variable } from "../Variable"

export const getOptionsMenuVariables = (inVariables: Variable[]): Variable[] => {
    return inVariables.filter((variable) => variable.getMetadata()?.bOptionsMenu);
};
