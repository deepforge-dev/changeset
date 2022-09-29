export declare const deepCopy: <T>(target: T) => T;
export declare enum ChangeType {
    PUT = "put",
    DEL = "del"
}
export interface ChangeSet {
    type: ChangeType;
    key: string[];
    value?: any;
}
declare const diff: {
    (old: any, new_: any): ChangeSet[];
    apply: (changes: ChangeSet[], target: any, modify?: boolean) => any;
};
export default diff;
