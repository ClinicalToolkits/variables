import { Variable } from "../Variable";

export const sortVariables = (variables: Variable[]): Variable[] => {
    return variables.sort((a, b) => a.getOrderWithinSet() - b.getOrderWithinSet());
};
