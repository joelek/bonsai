"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IterableWeakSet = exports.IterableWeakMap = exports.getOrderedIndex = void 0;
function getOrderedIndex(array, collator) {
    function recursive(offset, length) {
        if (length <= 0) {
            return offset;
        }
        let pivot = offset + (length >> 1);
        let outcome = collator(array[pivot]);
        if (outcome === 0) {
            return pivot;
        }
        if (outcome < 0) {
            return recursive(offset, pivot - offset);
        }
        else {
            return recursive(pivot + 1, length - (pivot + 1) - offset);
        }
    }
    ;
    return recursive(0, array.length);
}
exports.getOrderedIndex = getOrderedIndex;
;
class IterableWeakMap {
    keyrefs;
    registry;
    map;
    current_size;
    constructor(iterable) {
        this.keyrefs = new Set();
        this.registry = new FinalizationRegistry((keyref) => {
            this.keyrefs.delete(keyref);
            this.current_size -= 1;
        });
        this.map = new WeakMap();
        this.current_size = 0;
        for (let [key, value] of iterable ?? []) {
            this.set(key, value);
        }
    }
    get size() {
        return this.current_size;
    }
    get [Symbol.toStringTag]() {
        return "IterableWeakMap";
    }
    [Symbol.iterator]() {
        return this.entries();
    }
    *entries() {
        for (let keyref of this.keyrefs) {
            let key = keyref.deref();
            if (key != null) {
                let entry = this.map.get(key);
                if (entry != null) {
                    yield [key, entry.value];
                }
            }
        }
    }
    *keys() {
        for (let keyref of this.keyrefs) {
            let key = keyref.deref();
            if (key != null) {
                yield key;
            }
        }
    }
    *values() {
        for (let keyref of this.keyrefs) {
            let key = keyref.deref();
            if (key != null) {
                let entry = this.map.get(key);
                if (entry != null) {
                    yield entry.value;
                }
            }
        }
    }
    clear() {
        for (let keyref of this.keyrefs) {
            let key = keyref.deref();
            if (key != null) {
                this.registry.unregister(key);
            }
        }
        this.keyrefs.clear();
        this.map = new WeakMap();
    }
    delete(key) {
        let entry = this.map.get(key);
        if (entry == null) {
            return false;
        }
        else {
            this.map.delete(key);
            this.keyrefs.delete(entry.keyref);
            this.registry.unregister(key);
            return true;
        }
    }
    forEach(callback, self) {
        for (let [key, value] of this) {
            callback.call(self, value, key, this);
        }
    }
    get(key) {
        return this.map.get(key)?.value;
    }
    has(key) {
        return this.map.has(key);
    }
    set(key, value) {
        let entry = this.map.get(key);
        if (entry == null) {
            let keyref = new WeakRef(key);
            this.registry.register(key, keyref, key);
            this.current_size += 1;
            entry = {
                keyref,
                value
            };
            this.keyrefs.add(keyref);
            this.map.set(key, entry);
        }
        else {
            entry.value = value;
        }
        return this;
    }
    static IS_SUPPORTED = typeof WeakRef === "function" && typeof FinalizationRegistry === "function" && typeof WeakMap === "function";
    static create(iterable) {
        if (this.IS_SUPPORTED) {
            return new IterableWeakMap(iterable);
        }
        else {
            // Default to using a regular map with potential memory leaks since polyfilling is technically impossible.
            return new Map(iterable);
        }
    }
    ;
}
exports.IterableWeakMap = IterableWeakMap;
;
class IterableWeakSet {
    keyrefs;
    registry;
    map;
    current_size;
    constructor(iterable) {
        this.keyrefs = new Set();
        this.registry = new FinalizationRegistry((keyref) => {
            this.keyrefs.delete(keyref);
            this.current_size -= 1;
        });
        this.map = new WeakMap();
        this.current_size = 0;
        for (let key of iterable ?? []) {
            this.add(key);
        }
    }
    get size() {
        return this.current_size;
    }
    get [Symbol.toStringTag]() {
        return "IterableWeakSet";
    }
    [Symbol.iterator]() {
        return this.values();
    }
    *entries() {
        for (let keyref of this.keyrefs) {
            let key = keyref.deref();
            if (key != null) {
                yield [key, key];
            }
        }
    }
    *keys() {
        for (let keyref of this.keyrefs) {
            let key = keyref.deref();
            if (key != null) {
                yield key;
            }
        }
    }
    *values() {
        for (let keyref of this.keyrefs) {
            let key = keyref.deref();
            if (key != null) {
                yield key;
            }
        }
    }
    add(key) {
        let entry = this.map.get(key);
        if (entry == null) {
            let keyref = new WeakRef(key);
            this.registry.register(key, keyref, key);
            this.current_size += 1;
            entry = {
                keyref
            };
            this.keyrefs.add(keyref);
            this.map.set(key, entry);
        }
        return this;
    }
    clear() {
        for (let keyref of this.keyrefs) {
            let key = keyref.deref();
            if (key != null) {
                this.registry.unregister(key);
            }
        }
        this.keyrefs.clear();
        this.map = new WeakMap();
    }
    delete(key) {
        let entry = this.map.get(key);
        if (entry == null) {
            return false;
        }
        else {
            this.map.delete(key);
            this.keyrefs.delete(entry.keyref);
            this.registry.unregister(key);
            return true;
        }
    }
    forEach(callback, self) {
        for (let key of this) {
            callback.call(self, key, key, this);
        }
    }
    has(key) {
        return this.map.has(key);
    }
    static IS_SUPPORTED = typeof WeakRef === "function" && typeof FinalizationRegistry === "function" && typeof WeakMap === "function";
    static create(iterable) {
        if (this.IS_SUPPORTED) {
            return new IterableWeakSet(iterable);
        }
        else {
            // Default to using a regular set with potential memory leaks since polyfilling is technically impossible.
            return new Set(iterable);
        }
    }
    ;
}
exports.IterableWeakSet = IterableWeakSet;
;
