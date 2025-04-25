import { Variable } from "../Variable";
import { InternalVariableMetadata } from "../VariableMetadata";

export function getInternalMetadata<T extends Variable>(variable: T): InternalVariableMetadata | undefined {
    if (variable.metadata && variable.metadata._internal) {
        return variable.metadata._internal;
    }
    return undefined;
};

export function setInternalMetadata<T extends Variable>(
    variable: T,
    partialInternal: Partial<InternalVariableMetadata>
): T {
    if (!variable.metadata) variable.metadata = {};
    if (!variable.metadata._internal) variable.metadata._internal = {};
    Object.assign(variable.metadata._internal, partialInternal);
    return variable;
};

