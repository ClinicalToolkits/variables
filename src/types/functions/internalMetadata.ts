import { Variable, VariableData } from "../Variable";
import { InternalVariableMetadata } from "../VariableMetadata";

export function getInternalMetadata<T extends Variable>(variable: T): InternalVariableMetadata | undefined {
    const metadata = variable.getMetadata();
    if (metadata && metadata._internal) {
        return metadata._internal;
    }
    return undefined;
};

export function setInternalMetadata<T extends VariableData>(
    variableData: T,
    partialInternal: Partial<InternalVariableMetadata>
): T {
    if (!variableData.metadata) variableData.metadata = {};
    if (!variableData.metadata._internal) variableData.metadata._internal = {};
    Object.assign(variableData.metadata._internal, partialInternal);
    return variableData;
};

