"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computed = exports.stateify = exports.ObjectState = exports.ArrayState = exports.ReferenceState = exports.PrimitiveState = exports.AbstractState = void 0;
class AbstractState {
    observers;
    notify(type, ...args) {
        let observers = this.observers[type];
        if (observers == null) {
            return;
        }
        for (let index = 0; index < observers.length; index++) {
            observers[index](...args);
        }
    }
    constructor() {
        this.observers = {};
    }
    compute(computer) {
        let computed = stateify(computer(this.value()));
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
exports.PrimitiveState = PrimitiveState;
;
class ReferenceState extends AbstractState {
    lastValue;
    constructor(lastValue) {
        super();
        this.lastValue = lastValue;
    }
    update(valu) {
        let updated = false;
        if (valu !== this.lastValue) {
            this.lastValue = valu;
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
exports.ReferenceState = ReferenceState;
;
class ArrayState extends AbstractState {
    elements;
    updating;
    currentLength;
    onElementUpdate = () => {
        if (!this.updating) {
            this.notify("update", this);
        }
    };
    constructor(elements) {
        super();
        this.elements = [...elements];
        this.updating = false;
        this.currentLength = stateify(elements.length);
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
            let that = stateify(element.value());
            let subscription = element.observe("update", (state) => {
                that.update(state.value());
            });
            index.observe("update", (index) => {
                let element = this.element(index.value());
                subscription();
                that.update(element.value());
                subscription = element.observe("update", (state) => {
                    that.update(state.value());
                });
            });
            that.observe("update", (that) => {
                this.element(index.value()).update(that.value());
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
    insert(index, item) {
        if (index < 0 || index > this.elements.length) {
            throw new Error(`Expected index to be within bounds!`);
        }
        let element = item instanceof AbstractState ? item : stateify(item);
        this.elements.splice(index, 0, element);
        element.observe("update", this.onElementUpdate);
        this.currentLength.update(this.elements.length);
        this.notify("insert", element, index);
        this.notify("update", this);
    }
    length() {
        return this.currentLength;
    }
    mapStates(mapper) {
        let that = stateify([]);
        let indexStates = [];
        this.observe("insert", (state, index) => {
            let indexState = stateify(index);
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
            let indexState = stateify(index);
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
        if (true) {
            this.notify("update", this);
        }
    }
    update(value) {
        let updated = false;
        try {
            this.updating = true;
            let length = Math.min(this.elements.length, value?.length ?? 0);
            for (let index = 0; index < length; index++) {
                if (this.elements[index].update(value[index])) {
                    updated = true;
                }
            }
            for (let index = this.elements.length - 1; index >= length; index--) {
                this.remove(index);
                updated = true;
            }
            for (let index = length; index < (value?.length ?? 0); index++) {
                this.append(value[index]);
                updated = true;
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
    vacate() {
        return this.update([]);
    }
    value() {
        let lastValue = [];
        for (let index = 0; index < this.elements.length; index++) {
            lastValue.push(this.elements[index].value());
        }
        return lastValue;
    }
}
exports.ArrayState = ArrayState;
;
class ObjectState extends AbstractState {
    members;
    updating;
    onMemberUpdate = () => {
        if (!this.updating) {
            this.notify("update", this);
        }
    };
    constructor(members) {
        super();
        this.members = { ...members };
        this.updating = false;
        for (let key in this.members) {
            this.members[key].observe("update", this.onMemberUpdate);
        }
    }
    member(key, defaultValue) {
        let member = this.members[key];
        if (member == null) {
            this.members[key] = member = stateify(defaultValue);
            this.members[key].observe("update", this.onMemberUpdate);
            this.onMemberUpdate();
        }
        return member;
    }
    update(value) {
        let updated = false;
        try {
            this.updating = true;
            for (let key in this.members) {
                let member = this.member(key);
                if (member.update(value?.[key])) {
                    updated = true;
                }
            }
            for (let key in value) {
                if (!(key in this.members)) {
                    let member = this.member(key, value[key]);
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
exports.ObjectState = ObjectState;
;
function stateify(value) {
    if (value instanceof AbstractState) {
        return value;
    }
    if (typeof value === "bigint") {
        return new PrimitiveState(value);
    }
    if (typeof value === "boolean") {
        return new PrimitiveState(value);
    }
    if (typeof value === "number") {
        return new PrimitiveState(value);
    }
    if (typeof value === "string") {
        return new PrimitiveState(value);
    }
    if (value === null) {
        return new PrimitiveState(value);
    }
    if (typeof value === "undefined") {
        return new PrimitiveState(value);
    }
    if (value instanceof Array) {
        let elements = [];
        for (let index = 0; index < value.length; index++) {
            elements.push(stateify(value[index]));
        }
        return new ArrayState(elements);
    }
    if (value instanceof Object && value.constructor === Object) {
        let members = {};
        for (let key in value) {
            members[key] = stateify(value[key]);
        }
        return new ObjectState(members);
    }
    if (value instanceof Object) {
        return new ReferenceState(value);
    }
    throw new Error(`Expected code to be unreachable!`);
}
exports.stateify = stateify;
;
function computed(states, computer) {
    let values = states.map((state) => state.value());
    let computed = stateify(computer(...values));
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
