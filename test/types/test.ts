export type RecordType = Record<string, string>;

export interface NestedType {
    string: string;
    number: number;
    boolean: boolean;
    record: RecordType;
}

export type NestedArray = NestedType[];

export type UnionType = string | number | NestedType;

export interface TestType {
    string: string;
    number: number;
    boolean: boolean;
    nested: NestedType;
    nestedArray: NestedArray;
    union: UnionType;
    record: RecordType;
}