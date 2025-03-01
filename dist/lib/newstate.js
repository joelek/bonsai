"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.flatten = exports.squash = void 0;
class StateImplementation {
    active_value;
    constructor(active_value) {
        this.active_value = active_value;
    }
    append(...items) {
        throw new Error("Method not implemented.");
    }
    element(index) {
        throw new Error("Method not implemented.");
    }
    filter(predicate) {
        throw new Error("Method not implemented.");
    }
    first() {
        throw new Error("Method not implemented.");
    }
    last() {
        throw new Error("Method not implemented.");
    }
    get length() {
        throw new Error("Method not implemented.");
    }
    mapStates(mapper) {
        throw new Error("Method not implemented.");
    }
    mapValues(mapper) {
        throw new Error("Method not implemented.");
    }
    member(key) {
        throw new Error("Method not implemented.");
    }
    spread() {
        throw new Error("Method not implemented.");
    }
    vacate() {
        throw new Error("Method not implemented.");
    }
    [Symbol.iterator]() {
        throw new Error("Method not implemented.");
    }
    compute(computer) {
        throw new Error("Method not implemented.");
    }
    observe(type, observer) {
        throw new Error("Method not implemented.");
    }
    shadow() {
        throw new Error("Method not implemented.");
    }
    subscribe(target, type, callback) {
        throw new Error("Method not implemented.");
    }
    unobserve(type, observer) {
        throw new Error("Method not implemented.");
    }
    attach(key, item) {
        throw new Error("Method not implemented.");
    }
    detach(key) {
        throw new Error("Method not implemented.");
    }
    insert(index, item) {
        throw new Error("Method not implemented.");
    }
    remove() {
        throw new Error("Method not implemented.");
    }
    update(value) {
        throw new Error("Method not implemented.");
    }
    value() {
        throw new Error("Method not implemented.");
    }
}
function make_state(value) {
    return new StateImplementation(value);
}
;
function stateify(attribute) {
    throw "";
}
function valueify(attribute) {
    throw "";
}
let state = stateify([make_state("a"), "b"]);
let state2 = stateify(["a", "b"]);
let state3 = stateify({ one: "a", two: "b" });
let value = valueify([make_state("a"), "b"]);
function one(state) {
    state.observe("update", (state) => {
        state.update(state.value());
    });
    state.update(state.value());
}
function two(state) {
    state.observe("update", (state) => {
        state.update(state.value());
    });
    state.observe("insert", (state, index) => {
        state.update(state.value());
    });
    state.observe("remove", (state, index) => {
        state.update(state.value());
    });
    state.update(state.value());
}
function three(state) {
    state.observe("update", (state) => {
        state.update(state.value());
    });
    state.observe("attach", (state, key) => {
        state.update(state.value());
    });
    state.observe("detach", (state, key) => {
        state.update(state.value());
    });
    state.update(state.value());
}
function callable(state) {
}
// @ts-expect-error
callable(stateify("string"));
// @ts-expect-error
callable(stateify(undefined));
callable(stateify(undefined));
function squash(records) {
    throw "";
}
exports.squash = squash;
;
{
    let records = stateify([
        { one: "a" }
    ]);
    let squashed = squash(records);
}
function flatten(states) {
    throw "";
}
exports.flatten = flatten;
;
{
    let array_00 = stateify(["b"]);
    let array_01 = stateify(["e"]);
    let array_10 = stateify(["h"]);
    let array_11 = stateify(["k"]);
    let array_0 = stateify([array_00, array_01]);
    let array_1 = stateify([array_10, array_11]);
    let array = stateify([array_0, array_1]);
    let flattened = flatten(array);
}
