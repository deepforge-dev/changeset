import * as _ from 'underscore';

export const deepCopy = <T>(target: T): T => {
    if (target === null) {
        return target;
    }
    if (target instanceof Date) {
        return new Date(target.getTime()) as any;
    }
    if (target instanceof Array) {
        const cp = [] as any[];
        (target as any[]).forEach((v) => {
            cp.push(v);
        });
        return cp.map((n: any) => deepCopy<any>(n)) as any;
    }
    if (typeof target === 'object' && !_.isEmpty(target)) {
        const cp = {...(target as { [key: string]: any })} as { [key: string]: any };
        Object.keys(cp).forEach(k => {
            cp[k] = deepCopy<any>(cp[k]);
        });
        return cp as T;
    }
    return target;
};

export enum ChangeType {
    PUT = 'put',
    DEL = 'del'
}

export interface ChangeSet {
    type: ChangeType
    key: string[];
    value?: any;
}

const diff = (old: any, new_: any): ChangeSet[] => {
    const changes = compare(old, new_, [], []);
    return changes;
}


function delCheck(op: ChangeSet) {
    if (op.type === ChangeType.PUT && op.value === undefined) {
        op.type = ChangeType.DEL;
        delete op.value;
    }
    return op;
}

const compare = (old: any, new_: any, path: string[], cache: string[]): ChangeSet[] => {
    const changes: ChangeSet[] = [];
    if (old !== null && new_ !== null && typeof old === 'object' && typeof new_ === 'object' && !_.contains(cache, old)) {
        cache.push(old);
        const oldKeys = Object.keys(old);
        const newKeys = Object.keys(new_);

        const sameKeys = _.intersection(oldKeys, newKeys);
        sameKeys.forEach(k => {
            const childChanges = compare(old[k], new_[k], path.concat(k), cache);
            changes.push(...childChanges);
        });

        const deletions = _.difference(oldKeys, newKeys).reverse().map(k => {
            return {
                type: ChangeType.DEL,
                key: path.concat(k),
            }
        });
        changes.push(...deletions);

        const additions = _.difference(newKeys, oldKeys).map(k => {
            return delCheck({
                type: ChangeType.PUT,
                key: path.concat(k),
                value: new_[k]
            });
        });

        changes.push(...additions);
    } else if (old !== new_) {
        changes.push(delCheck({type: ChangeType.PUT, key: path, value: new_}));
    }

    return changes;
}


const apply = (changes: ChangeSet[], target: any, modify: boolean = false) => {
    let appliedObj: any, keys: string[];
    if(modify) {
        appliedObj = target;
    } else {
        appliedObj = deepCopy(target);
    }

    changes.forEach((change) => {
        let ptr: any;

        switch (change.type) {
            case ChangeType.PUT:
                ptr = appliedObj;
                keys = change.key;
                if(keys.length) {
                    keys.forEach((key, index, records) => {
                        if(!(key in ptr)) {
                            ptr[key] = {};
                        }

                        if( index < records.length - 1) {
                            ptr = ptr[key];
                        } else {
                            ptr[key] = change.value;
                        }
                    });
                } else {
                    appliedObj = change.value;
                }
                break;
            case ChangeType.DEL:
                ptr = appliedObj;
                keys = change.key;
                if(keys.length) {
                    keys.forEach((key, index, records) => {
                        if(!(key in ptr)) {
                            ptr[key] = {};
                        }

                        if(index < records.length - 1) {
                            ptr = ptr[key];
                        } else {
                            if(Array.isArray(ptr)) {
                                ptr.splice(parseInt(key, 10), 1);
                            } else {
                                delete ptr[key];
                            }
                        }
                    });
                } else {
                    appliedObj = null;
                }
                break;
        }
    });

    return appliedObj;
}

diff.apply = apply;

export default diff;
