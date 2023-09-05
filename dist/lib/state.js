"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.merge = exports.fallback = exports.valueify = exports.stateify = exports.computed = exports.make_state = exports.make_reference_state = exports.make_object_state = exports.make_array_state = exports.make_primitive_state = exports.ObjectStateImplementation = exports.ObjectState = exports.ArrayStateImplementation = exports.ArrayState = exports.ReferenceStateImplementation = exports.ReferenceState = exports.PrimitiveStateImplementation = exports.PrimitiveState = exports.AbstractState = void 0;
const utils_1 = require("./utils");
class AbstractState {
    observers;
    notify(type, ...args) {
        let observers = this.observers[type];
        if (observers == null) {
            return;
        }
        // Prevent issues arising from mutating the array of observers while notifying.
        observers = [...observers];
        for (let index = 0; index < observers.length; index++) {
            observers[index](...args);
        }
    }
    constructor() {
        this.observers = {};
    }
    compute(computer) {
        let computed = make_state(computer(this.value()));
        this.observe("update", (state) => {
            computed.update(computer(state.value()));
        });
        return computed;
    }
    observe(type, observer) {
        let observers = this.observers[type];
        if (observers == null) {
            this.observers[type] = observers = [];
        }
        observers.push(observer);
        return () => {
            this.unobserve(type, observer);
        };
    }
    unobserve(type, observer) {
        let observers = this.observers[type];
        if (observers == null) {
            return;
        }
        let index = observers.lastIndexOf(observer);
        if (index < 0) {
            return;
        }
        observers.splice(index, 1);
        if (observers.length === 0) {
            delete this.observers[type];
        }
    }
}
exports.AbstractState = AbstractState;
;
class PrimitiveState extends AbstractState {
    lastValue;
    constructor(lastValue) {
        super();
        this.lastValue = lastValue;
    }
}
exports.PrimitiveState = PrimitiveState;
;
// Implement the abstract methods in secret in order for TypeScript not to handle them as if they were own properties.
class PrimitiveStateImplementation extends PrimitiveState {
    update(value) {
        let updated = false;
        if (value !== this.lastValue) {
            this.lastValue = value;
            updated = true;
        }
        if (updated) {
            this.notify("update", this);
        }
        return updated;
    }
    value() {
        return this.lastValue;
    }
}
exports.PrimitiveStateImplementation = PrimitiveStateImplementation;
;
class ReferenceState extends AbstractState {
    lastValue;
    constructor(lastValue) {
        super();
        this.lastValue = lastValue;
    }
}
exports.ReferenceState = ReferenceState;
;
// Implement the abstract methods in secret in order for TypeScript not to handle them as if they were own properties.
class ReferenceStateImplementation extends ReferenceState {
    update(value) {
        let updated = false;
        if (value !== this.lastValue) {
            this.lastValue = value;
            updated = true;
        }
        if (updated) {
            this.notify("update", this);
        }
        return updated;
    }
    value() {
        return this.lastValue;
    }
}
exports.ReferenceStateImplementation = ReferenceStateImplementation;
;
class ArrayState extends AbstractState {
    elements;
    updating;
    currentLength;
    isUndefined;
    onElementUpdate = () => {
        if (!this.updating) {
            this.notify("update", this);
        }
    };
    constructor(elements) {
        super();
        this.elements = [...elements];
        this.updating = false;
        this.currentLength = make_state(elements.length);
        this.isUndefined = false;
        for (let index = 0; index < this.elements.length; index++) {
            this.elements[index].observe("update", this.onElementUpdate);
        }
    }
    [Symbol.iterator]() {
        return this.elements[Symbol.iterator]();
    }
    append(...items) {
        for (let item of items) {
            this.insert(this.elements.length, item);
        }
    }
    element(index) {
        if (index instanceof AbstractState) {
            let element = this.element(index.value());
            let that = make_state(element.value());
            let subscription = element.observe("update", (state) => {
                that.update(state.value());
            });
            index.observe("update", (index) => {
                element = this.element(index.value());
                subscription();
                that.update(element.value());
                subscription = element.observe("update", (state) => {
                    that.update(state.value());
                });
            });
            that.observe("update", (that) => {
                element.update(that.value());
            });
            return that;
        }
        else {
            if (index < 0 || index >= this.elements.length) {
                throw new Error(`Expected index to be within bounds!`);
            }
            return this.elements[index];
        }
    }
    filter(predicate) {
        let filteredIndices = make_state([]);
        let indexStates = [];
        let subscriptions = [];
        this.observe("insert", (state, index) => {
            let indexState = make_state(index);
            indexStates.splice(index, 0, indexState);
            for (let i = index + 1; i < indexStates.length; i++) {
                indexStates[i].update(i);
            }
            let outcomeState = predicate(state, indexState);
            if (outcomeState.value()) {
                let orderedIndex = (0, utils_1.getOrderedIndex)(filteredIndices.elements, (filteredIndex) => indexState.value() - filteredIndex.value());
                filteredIndices.insert(orderedIndex, indexState);
            }
            let subscription = outcomeState.observe("update", (outcome) => {
                let orderedIndex = (0, utils_1.getOrderedIndex)(filteredIndices.elements, (filteredIndex) => indexState.value() - filteredIndex.value());
                let found = filteredIndices.elements[orderedIndex]?.value() === indexState.value();
                if (outcome.value()) {
                    if (!found) {
                        filteredIndices.insert(orderedIndex, indexState);
                    }
                }
                else {
                    if (found) {
                        filteredIndices.remove(orderedIndex);
                    }
                }
            });
            subscriptions.splice(index, 0, subscription);
        });
        this.observe("remove", (state, index) => {
            let indexState = indexStates[index];
            let orderedIndex = (0, utils_1.getOrderedIndex)(filteredIndices.elements, (index) => indexState.value() - index.value());
            let found = filteredIndices.elements[orderedIndex]?.value() === indexState.value();
            if (found) {
                filteredIndices.remove(orderedIndex);
            }
            indexStates.splice(index, 1);
            for (let i = index; i < indexStates.length; i++) {
                indexStates[i].update(i);
            }
            let subscription = subscriptions[index];
            subscriptions.splice(index, 1);
            subscription();
        });
        for (let index = 0; index < this.elements.length; index++) {
            let indexState = make_state(index);
            indexStates.splice(index, 0, indexState);
            let element = this.elements[index];
            let outcomeState = predicate(element, indexState);
            if (outcomeState.value()) {
                filteredIndices.append(indexState);
            }
            let subscription = outcomeState.observe("update", (outcome) => {
                let orderedIndex = (0, utils_1.getOrderedIndex)(filteredIndices.elements, (filteredIndex) => indexState.value() - filteredIndex.value());
                let found = filteredIndices.elements[orderedIndex]?.value() === indexState.value();
                if (outcome.value()) {
                    if (!found) {
                        filteredIndices.insert(orderedIndex, indexState);
                    }
                }
                else {
                    if (found) {
                        filteredIndices.remove(orderedIndex);
                    }
                }
            });
            subscriptions.splice(index, 0, subscription);
        }
        return filteredIndices.mapStates((state) => this.element(state));
    }
    first() {
        let state = make_state(undefined);
        state.update(this.elements[0]?.value());
        this.currentLength.observe("update", () => {
            state.update(this.elements[0]?.value());
        });
        state.observe("update", (state) => {
            let value = state.value();
            if (value == null) {
                return;
            }
            this.elements[0]?.update(value);
        });
        return state;
    }
    insert(index, item) {
        if (index < 0 || index > this.elements.length) {
            throw new Error(`Expected index to be within bounds!`);
        }
        let element = item instanceof AbstractState ? item : make_state(item);
        this.elements.splice(index, 0, element);
        element.observe("update", this.onElementUpdate);
        this.currentLength.update(this.elements.length);
        if (true) {
            this.notify("insert", element, index);
        }
        if (!this.updating) {
            this.notify("update", this);
        }
    }
    last() {
        let state = make_state(undefined);
        state.update(this.elements[this.elements.length - 1]?.value());
        this.currentLength.observe("update", () => {
            state.update(this.elements[this.elements.length - 1]?.value());
        });
        state.observe("update", (state) => {
            let value = state.value();
            if (value == null) {
                return;
            }
            this.elements[this.elements.length - 1]?.update(value);
        });
        return state;
    }
    length() {
        return this.currentLength;
    }
    mapStates(mapper) {
        let that = make_state([]);
        let indexStates = [];
        this.observe("insert", (state, index) => {
            let indexState = make_state(index);
            indexStates.splice(index, 0, indexState);
            for (let i = index + 1; i < indexStates.length; i++) {
                indexStates[i].update(i);
            }
            let mapped = mapper(state, indexState);
            that.insert(index, mapped);
        });
        this.observe("remove", (state, index) => {
            indexStates.splice(index, 1);
            for (let i = index; i < indexStates.length; i++) {
                indexStates[i].update(i);
            }
            that.remove(index);
        });
        for (let index = 0; index < this.elements.length; index++) {
            let indexState = make_state(index);
            indexStates.splice(index, 0, indexState);
            let element = this.elements[index];
            let mapped = mapper(element, indexState);
            that.append(mapped);
        }
        return that;
    }
    mapValues(mapper) {
        return this.mapStates((state, index) => state.compute((value) => mapper(value, index.value())));
    }
    remove(index) {
        if (index < 0 || index >= this.elements.length) {
            throw new Error(`Expected index to be within bounds!`);
        }
        let element = this.elements[index];
        this.elements.splice(index, 1);
        element.unobserve("update", this.onElementUpdate);
        this.currentLength.update(this.elements.length);
        if (true) {
            this.notify("remove", element, index);
        }
        if (!this.updating) {
            this.notify("update", this);
        }
    }
    spread() {
        return [...this.elements];
    }
    vacate() {
        return this.update([]);
    }
}
exports.ArrayState = ArrayState;
;
// Implement the abstract methods in secret in order for TypeScript not to handle them as if they were own properties.
class ArrayStateImplementation extends ArrayState {
    update(value) {
        let updated = false;
        try {
            this.updating = true;
            let isUndefined = typeof value === "undefined";
            updated = (this.isUndefined && !isUndefined) || (!this.isUndefined && isUndefined);
            this.isUndefined = isUndefined;
            if (this.elements.length !== value?.length) {
                updated = true;
            }
            else {
                for (let index = 0; index < this.elements.length; index++) {
                    let copy = make_state(this.elements[index].value());
                    if (copy.update(value[index])) {
                        updated = true;
                        break;
                    }
                }
            }
            if (updated) {
                for (let index = this.elements.length - 1; index >= 0; index--) {
                    this.remove(index);
                }
                for (let index = 0; index < (value?.length ?? 0); index++) {
                    this.append(value[index]);
                }
            }
        }
        finally {
            this.updating = false;
        }
        if (updated) {
            this.notify("update", this);
        }
        return updated;
    }
    value() {
        if (this.isUndefined) {
            return undefined;
        }
        let lastValue = [];
        for (let index = 0; index < this.elements.length; index++) {
            lastValue.push(this.elements[index].value());
        }
        return lastValue;
    }
}
exports.ArrayStateImplementation = ArrayStateImplementation;
;
class ObjectState extends AbstractState {
    members;
    updating;
    isUndefined;
    onMemberUpdate = () => {
        if (!this.updating) {
            this.notify("update", this);
        }
    };
    constructor(members) {
        super();
        this.members = { ...members };
        this.updating = false;
        this.isUndefined = false;
        for (let key in this.members) {
            this.members[key].observe("update", this.onMemberUpdate);
        }
    }
    member(key) {
        let member = this.members[key];
        if (member == null) {
            this.members[key] = member = make_state(undefined);
            this.members[key].observe("update", this.onMemberUpdate);
            this.onMemberUpdate();
        }
        return member;
    }
    spread() {
        return { ...this.members };
    }
}
exports.ObjectState = ObjectState;
;
// Implement the abstract methods in secret in order for TypeScript not to handle them as if they were own properties.
class ObjectStateImplementation extends ObjectState {
    update(value) {
        let updated = false;
        try {
            this.updating = true;
            let isUndefined = typeof value === "undefined";
            updated = (this.isUndefined && !isUndefined) || (!this.isUndefined && isUndefined);
            this.isUndefined = isUndefined;
            for (let key in this.members) {
                let member = this.member(key);
                if (member.update(value?.[key])) {
                    updated = true;
                }
            }
            for (let key in value) {
                if (!(key in this.members)) {
                    let member = this.member(key);
                    member.update(value[key]);
                    updated = true;
                }
            }
        }
        finally {
            this.updating = false;
        }
        if (updated) {
            this.notify("update", this);
        }
        return updated;
    }
    value() {
        if (this.isUndefined) {
            return undefined;
        }
        let lastValue = {};
        for (let key in this.members) {
            let member = this.member(key);
            let value = member.value();
            if (typeof value !== "undefined") {
                lastValue[key] = value;
            }
        }
        return lastValue;
    }
}
exports.ObjectStateImplementation = ObjectStateImplementation;
;
function make_primitive_state(value) {
    return new Proxy(new PrimitiveStateImplementation(value), {
        ownKeys(target) {
            return [];
        }
    });
}
exports.make_primitive_state = make_primitive_state;
;
function make_array_state(elements) {
    return new Proxy(new ArrayStateImplementation(elements), {
        get(target, key) {
            if (key in target) {
                return target[key];
            }
            else {
                return target.element(key);
            }
        },
        getOwnPropertyDescriptor(target, key) {
            if (key in target) {
                return Object.getOwnPropertyDescriptor(target, key);
            }
            else {
                return Object.getOwnPropertyDescriptor(target.spread(), key);
            }
        },
        ownKeys(target) {
            return Object.getOwnPropertyNames(target.spread());
        }
    });
}
exports.make_array_state = make_array_state;
;
function make_object_state(members) {
    return new Proxy(new ObjectStateImplementation(members), {
        get(target, key) {
            if (key in target) {
                return target[key];
            }
            else {
                return target.member(key);
            }
        },
        getOwnPropertyDescriptor(target, key) {
            if (key in target) {
                return Object.getOwnPropertyDescriptor(target, key);
            }
            else {
                return Object.getOwnPropertyDescriptor(target.spread(), key);
            }
        },
        ownKeys(target) {
            return Object.getOwnPropertyNames(target.spread());
        }
    });
}
exports.make_object_state = make_object_state;
;
function make_reference_state(value) {
    return new Proxy(new ReferenceStateImplementation(value), {
        ownKeys(target) {
            return [];
        }
    });
}
exports.make_reference_state = make_reference_state;
;
function make_state(value) {
    if (typeof value === "bigint") {
        return make_primitive_state(value);
    }
    if (typeof value === "boolean") {
        return make_primitive_state(value);
    }
    if (typeof value === "number") {
        return make_primitive_state(value);
    }
    if (typeof value === "string") {
        return make_primitive_state(value);
    }
    if (value === null) {
        return make_primitive_state(value);
    }
    if (typeof value === "undefined") {
        return make_primitive_state(value);
    }
    if (value instanceof Array) {
        let elements = [];
        for (let index = 0; index < value.length; index++) {
            elements.push(make_state(value[index]));
        }
        return make_array_state(elements);
    }
    if (value instanceof Object && value.constructor === Object) {
        let members = {};
        for (let key in value) {
            members[key] = make_state(value[key]);
        }
        return make_object_state(members);
    }
    if (value instanceof Object) {
        return make_reference_state(value);
    }
    throw new Error(`Expected code to be unreachable!`);
}
exports.make_state = make_state;
;
function computed(states, computer) {
    let values = states.map((state) => state.value());
    let computed = make_state(computer(...values));
    for (let index = 0; index < states.length; index++) {
        let state = states[index];
        state.observe("update", (state) => {
            values[index] = state.value();
            computed.update(computer(...values));
        });
    }
    return computed;
}
exports.computed = computed;
;
function stateify(attribute) {
    if (attribute instanceof AbstractState) {
        return attribute;
    }
    if (attribute instanceof Array) {
        let states = [];
        for (let element of attribute) {
            states.push(stateify(element));
        }
        return make_array_state(states);
    }
    if (attribute instanceof Object && attribute.constructor === Object) {
        let states = {};
        for (let key in attribute) {
            states[key] = stateify(attribute[key]);
        }
        return make_object_state(states);
    }
    return make_state(attribute);
}
exports.stateify = stateify;
;
function valueify(attribute) {
    if (attribute instanceof AbstractState) {
        return attribute.value();
    }
    if (attribute instanceof Array) {
        let values = [];
        for (let element of attribute) {
            values.push(valueify(element));
        }
        return values;
    }
    if (attribute instanceof Object && attribute.constructor === Object) {
        let values = {};
        for (let key in attribute) {
            values[key] = valueify(attribute[key]);
        }
        return values;
    }
    return attribute;
}
exports.valueify = valueify;
;
function fallback(state, defaultValue) {
    let computer = ((value) => typeof value !== "undefined" ? value : defaultValue);
    let computed_state = state.compute(computer);
    computed_state.observe("update", (computed_state) => {
        let value = computed_state.value();
        if (make_state(defaultValue).update(value)) {
            state.update(value);
        }
        else {
            state.update(undefined);
        }
    });
    return computed_state;
}
exports.fallback = fallback;
;
function merge(one, two) {
    let one_state = stateify(one);
    let two_state = stateify(two);
    let merged = stateify({});
    merged.members = new Proxy({}, {
        get(target, key) {
            if (!(key in target)) {
                let one_member = one_state.member(key);
                let two_member = two_state.member(key);
                target[key] = computed([one_member, two_member], (one_member, two_member) => typeof two_member !== "undefined" ? two_member : one_member);
            }
            return target[key];
        }
    });
    one_state.compute((one) => {
        for (let key in one_state) {
            merged.member(key);
        }
    });
    two_state.compute((two) => {
        for (let key in two_state) {
            merged.member(key);
        }
    });
    return merged;
}
exports.merge = merge;
;
