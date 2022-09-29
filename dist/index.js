var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "underscore"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ChangeType = exports.deepCopy = void 0;
    const _ = __importStar(require("underscore"));
    const deepCopy = (target) => {
        if (target === null) {
            return target;
        }
        if (target instanceof Date) {
            return new Date(target.getTime());
        }
        if (target instanceof Array) {
            const cp = [];
            target.forEach((v) => {
                cp.push(v);
            });
            return cp.map((n) => (0, exports.deepCopy)(n));
        }
        if (typeof target === 'object' && !_.isEmpty(target)) {
            const cp = { ...target };
            Object.keys(cp).forEach(k => {
                cp[k] = (0, exports.deepCopy)(cp[k]);
            });
            return cp;
        }
        return target;
    };
    exports.deepCopy = deepCopy;
    var ChangeType;
    (function (ChangeType) {
        ChangeType["PUT"] = "put";
        ChangeType["DEL"] = "del";
    })(ChangeType = exports.ChangeType || (exports.ChangeType = {}));
    const diff = (old, new_) => {
        const changes = compare(old, new_, [], []);
        return changes;
    };
    function delCheck(op) {
        if (op.type === ChangeType.PUT && op.value === undefined) {
            op.type = ChangeType.DEL;
            delete op.value;
        }
        return op;
    }
    const compare = (old, new_, path, cache) => {
        const changes = [];
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
                };
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
        }
        else if (old !== new_) {
            changes.push(delCheck({ type: ChangeType.PUT, key: path, value: new_ }));
        }
        return changes;
    };
    const apply = (changes, target, modify = false) => {
        let appliedObj, keys;
        if (modify) {
            appliedObj = target;
        }
        else {
            appliedObj = (0, exports.deepCopy)(target);
        }
        changes.forEach((change) => {
            let ptr;
            switch (change.type) {
                case ChangeType.PUT:
                    ptr = appliedObj;
                    keys = change.key;
                    if (keys.length) {
                        keys.forEach((key, index, records) => {
                            if (!(key in ptr)) {
                                ptr[key] = {};
                            }
                            if (index < records.length - 1) {
                                ptr = ptr[key];
                            }
                            else {
                                ptr[key] = change.value;
                            }
                        });
                    }
                    else {
                        appliedObj = change.value;
                    }
                    break;
                case ChangeType.DEL:
                    ptr = appliedObj;
                    keys = change.key;
                    if (keys.length) {
                        keys.forEach((key, index, records) => {
                            if (!(key in ptr)) {
                                ptr[key] = {};
                            }
                            if (index < records.length - 1) {
                                ptr = ptr[key];
                            }
                            else {
                                if (Array.isArray(ptr)) {
                                    ptr.splice(parseInt(key, 10), 1);
                                }
                                else {
                                    delete ptr[key];
                                }
                            }
                        });
                    }
                    else {
                        appliedObj = null;
                    }
                    break;
            }
        });
        return appliedObj;
    };
    diff.apply = apply;
    exports.default = diff;
});
//# sourceMappingURL=index.js.map