import { Tag, DataType } from "@clinicaltoolkits/type-definitions";
import { makeModel } from "@clinicaltoolkits/utility-functions";
import { VariableIdToken, VariableValue, VariableContent } from "./Variable";
import { VariableMetadata } from "./VariableMetadata";

export interface VariableData {
  id: string;
  idToken: VariableIdToken;
  fullName: string;
  abbreviatedName: string;
  label: string;
  variableSetId?: string;
  tagIds?: number[];
  tags?: Tag[];
  dataType: DataType;
  value: VariableValue;
  subgroupTag: Tag | null;
  orderWithinSet: number;
  content?: VariableContent | null;
  metadata?: VariableMetadata | null;
  associatedEntityAbbreviatedName?: string;
  entityId?: string;
  entityVersionId?: string;
  templateVariableId?: string | null;
}

interface ExtraVariableMethods {
    getDisplayId(): string;
    renameTo(name: string): Variable;
}
const VariableModel = makeModel<VariableData, ExtraVariableMethods>('Variable', {
  getters: {
    // central switch: change ID derivation here, not at call sites
    id: (self) => self.idToken?.id ?? self.id,
  },
  extras: {
    getDisplayId() {
      return this.getIdToken().id ?? this.getIdToken().variableId ?? this.getId();
    },
    renameTo(name: string) {
      return this.withAbbreviatedName(name).withFullName(name).withLabel(name);
    },
  },
  immutable: true,
});

// Public API with de-conflicted names:
export type Variable = ReturnType<typeof VariableModel['create']>;

export const createVariable = VariableModel.create;
export const wrapVariables = VariableModel.wrap;
export const isVariable = VariableModel.is;



const testVariable = createVariable({
    id: 'var1',
    idToken: new VariableIdToken({ variableId: 'var1' }),
    fullName: 'Test Variable',
    abbreviatedName: 'TestVar',
    label: 'Test Variable Label',
    dataType: DataType.TEXT,
    value: "Some value",
    subgroupTag: null,
    orderWithinSet: 1,
    associatedEntityAbbreviatedName: 'Entity1',
});

testVariable.getDisplayId();
const id = testVariable.withId('var2');
const metadata = testVariable.getMetadata();
console.log('Test Variable id:', testVariable.getId());