"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computed = exports.fallback = exports.merge = exports.flatten = exports.squash = exports.valueify = exports.stateify = exports.make_state = exports.StateImplementation = exports.Subscription = void 0;
exports.Subscription = {
    create(is_cancelled, callback) {
        let cancel = (() => {
            if (is_cancelled.value()) {
                return;
            }
            callback();
            is_cancelled.update(true);
        });
        cancel.is_cancelled = is_cancelled;
        return cancel;
    }
};
;
;
;
;
;
;
;
;
;
class StateImplementation {
    constructor() {
        throw new Error("Method not implemented.");
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
    subscribe(subscription) {
        throw new Error("Method not implemented.");
    }
    unobserve(type, observer) {
        throw new Error("Method not implemented.");
    }
    attach(key, item) {
        //attach<B extends string, C>(key: B, item: WritableStateOrValue<C>): WritableState<ExpansionOf<RecordType<A> & { [key in B]: C; }>> {
        throw new Error("Method not implemented.");
    }
    detach(key) {
        throw new Error("Method not implemented.");
    }
    insert(index, item) {
        throw new Error("Method not implemented.");
    }
    remove(index) {
        throw new Error("Method not implemented.");
    }
    update(value) {
        throw new Error("Method not implemented.");
    }
    value() {
        throw new Error("Method not implemented.");
    }
}
exports.StateImplementation = StateImplementation;
{
    let state6 = undefined;
    let state8 = undefined;
}
function make_state(value) {
    return new StateImplementation();
}
exports.make_state = make_state;
;
function stateify(attribute) {
    throw "";
}
exports.stateify = stateify;
;
{
    let a = stateify(undefined);
    // @ts-expect-error
    let b = stateify(undefined);
    let c = stateify(undefined);
    let d = stateify(undefined);
    // @ts-expect-error
    let e = stateify(undefined);
    let f = stateify(undefined);
    // @ts-expect-error
    let g = stateify(undefined);
    let h = stateify(undefined);
    let i = stateify(undefined);
}
function valueify(attribute) {
    throw "";
}
exports.valueify = valueify;
;
let state0a = stateify(["a", 5])[0];
let state0b = stateify(["a", 5])[1];
let state1 = stateify([make_state("a"), "b"]);
let state2 = stateify(["a", "b"]);
let state3 = stateify({ one: "a", two: "b" });
let value1 = valueify([make_state("a"), "b"]);
let value2 = valueify(["a", "b"]);
let value3 = valueify({ one: "a", two: "b" });
let state4 = undefined;
let state5 = undefined;
let state6 = undefined;
let state7 = undefined;
let state8 = undefined;
let state9 = undefined;
function function_expecting_generic_readable_attribute(attribute) {
    let value = valueify(attribute, true);
    let state = stateify(attribute, true);
    assertType(value);
    assertType(state);
}
function_expecting_generic_readable_attribute(undefined);
function_expecting_generic_readable_attribute(undefined);
function_expecting_generic_readable_attribute(undefined);
function_expecting_generic_readable_attribute(undefined);
function_expecting_generic_readable_attribute(undefined);
function_expecting_generic_readable_attribute(undefined);
function_expecting_generic_readable_attribute(undefined);
function_expecting_generic_readable_attribute(undefined);
function_expecting_generic_readable_attribute(undefined);
function_expecting_generic_readable_attribute(undefined);
function_expecting_generic_readable_attribute(undefined);
function_expecting_generic_readable_attribute(undefined);
function function_expecting_generic_readable_attribute_array_a(attribute) {
    let value = valueify(attribute, true);
    let state = stateify(attribute, true);
    assertType(value);
    assertType(state);
}
function_expecting_generic_readable_attribute_array_a(undefined);
function_expecting_generic_readable_attribute_array_a(undefined);
function_expecting_generic_readable_attribute_array_a(undefined);
function function_expecting_readable_attribute_record_a(attribute) {
    let value = valueify(attribute, true);
    let state = stateify(attribute, true);
    assertType(value);
    assertType(state);
}
function_expecting_readable_attribute_record_a(undefined);
function_expecting_readable_attribute_record_a(undefined);
function_expecting_readable_attribute_record_a(undefined);
function function_expecting_generic_writable_attribute(attribute) {
    let value = valueify(attribute, true);
    let state = stateify(attribute, true);
    assertType(value);
    assertType(state);
}
// @ts-expect-error
function_expecting_generic_writable_attribute(undefined);
// @ts-expect-error
function_expecting_generic_writable_attribute(undefined);
// @ts-expect-error
function_expecting_generic_writable_attribute(undefined);
// @ts-expect-error
function_expecting_generic_writable_attribute(undefined);
function_expecting_generic_writable_attribute(undefined);
function_expecting_generic_writable_attribute(undefined);
function_expecting_generic_writable_attribute(undefined);
function_expecting_generic_writable_attribute(undefined);
function_expecting_generic_writable_attribute(undefined);
function_expecting_generic_writable_attribute(undefined);
function_expecting_generic_writable_attribute(undefined);
function_expecting_generic_writable_attribute(undefined);
function function_expecting_generic_writable_attribute_array_a(attribute) {
    let value = valueify(attribute, true);
    let state = stateify(attribute, true);
    assertType(value);
    assertType(state);
}
// @ts-expect-error
function_expecting_generic_writable_attribute_array_a(undefined);
function_expecting_generic_writable_attribute_array_a(undefined);
function_expecting_generic_writable_attribute_array_a(undefined);
function function_expecting_writable_attribute_record_a(attribute) {
    let value = valueify(attribute, true);
    let state = stateify(attribute, true);
    assertType(value);
    assertType(state);
}
// @ts-expect-error
function_expecting_writable_attribute_record_a(undefined);
function_expecting_writable_attribute_record_a(undefined);
function_expecting_writable_attribute_record_a(undefined);
function function_expecting_readable_state_a(state) {
    state.observe("update", (state) => {
        let value = state.value();
    });
    state.compute((f) => 0);
    let value = state.value();
    assertType(value);
    let shadow = state.shadow();
    assertType(shadow);
}
function_expecting_readable_state_a(undefined);
function_expecting_readable_state_a(undefined);
function_expecting_readable_state_a(undefined);
function_expecting_readable_state_a(undefined);
function_expecting_readable_state_a(undefined);
function_expecting_readable_state_a(undefined);
function_expecting_readable_state_a(undefined);
function_expecting_readable_state_a(undefined);
function function_expecting_readable_state_array_a(state) {
    state.observe("update", (state) => {
        let value = state.value();
    });
    state.observe("insert", (state, index) => {
        let value = state.value();
    });
    state.observe("remove", (state, index) => {
        let value = state.value();
    });
    let element1 = state.element(0);
    let element2 = state[0];
    let mapped1 = state.mapStates((f) => 0);
    let mapped2 = state.mapStates((f) => stateify(0));
}
function_expecting_readable_state_array_a(undefined);
function_expecting_readable_state_array_a(undefined);
function function_expecting_readable_state_record_a(state) {
    state.observe("update", (state) => {
        let value = state.value();
    });
    state.observe("attach", (state, key) => {
        let value = state.value();
    });
    state.observe("detach", (state, key) => {
        let value = state.value();
    });
    let member1 = state.member("key");
    let member2 = state["key"];
}
function_expecting_readable_state_record_a(undefined);
function_expecting_readable_state_record_a(undefined);
function function_expecting_writable_state_a(state) {
    state.observe("update", (state) => {
        state.update(state.value());
    });
    state.update(state.value());
    let value = state.value();
    assertType(value);
    let shadow = state.shadow();
    assertType(shadow);
}
// @ts-expect-error
function_expecting_writable_state_a(undefined);
// @ts-expect-error
function_expecting_writable_state_a(undefined);
// @ts-expect-error
function_expecting_writable_state_a(undefined);
// @ts-expect-error
function_expecting_writable_state_a(undefined);
function_expecting_writable_state_a(undefined);
function_expecting_writable_state_a(undefined);
function_expecting_writable_state_a(undefined);
function_expecting_writable_state_a(undefined);
function function_expecting_writable_state_array_a(state) {
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
    let element1 = state.element(0);
    let element2 = state[0];
    let mapped1 = state.mapStates((f) => 0);
    let mapped2 = state.mapStates((f) => stateify(0));
}
// @ts-expect-error
function_expecting_writable_state_array_a(undefined);
function_expecting_writable_state_array_a(undefined);
function function_expecting_writable_state_record_a(state) {
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
    let member1 = state.member("key");
    let member2 = state["key"];
    assertType(member1);
    assertType(member2);
}
function assertType(type) { }
// @ts-expect-error
function_expecting_writable_state_record_a(undefined);
function_expecting_writable_state_record_a(undefined);
// ReadableAttribute should accept any value or state.
function function_expecting_readable_attribute(attribute) {
    let value = valueify(attribute);
    let state = stateify(attribute);
    assertType(value);
    assertType(state);
}
function_expecting_readable_attribute(undefined);
function_expecting_readable_attribute(undefined);
function_expecting_readable_attribute(undefined);
function_expecting_readable_attribute(undefined);
function_expecting_readable_attribute(undefined);
function_expecting_readable_attribute(undefined);
function_expecting_readable_attribute(undefined);
function_expecting_readable_attribute(undefined);
function_expecting_readable_attribute(undefined);
function_expecting_readable_attribute(undefined);
function_expecting_readable_attribute(undefined);
function_expecting_readable_attribute(undefined);
// WritableAttribute should only accept state containing exactly string | undefined or values assignable to string | undefined.
function function_expecting_writable_attribute(attribute) {
    let value = valueify(attribute);
    let state = stateify(attribute);
    assertType(value);
    assertType(state);
}
// @ts-expect-error
function_expecting_writable_attribute(undefined);
// @ts-expect-error
function_expecting_writable_attribute(undefined);
// @ts-expect-error
function_expecting_writable_attribute(undefined);
// @ts-expect-error
function_expecting_writable_attribute(undefined);
// @ts-expect-error
function_expecting_writable_attribute(undefined);
// @ts-expect-error
function_expecting_writable_attribute(undefined);
function_expecting_writable_attribute(undefined);
// @ts-expect-error
function_expecting_writable_attribute(undefined);
function_expecting_writable_attribute(undefined);
function_expecting_writable_attribute(undefined);
function_expecting_writable_attribute(undefined);
function_expecting_writable_attribute(undefined);
// Attribute should accept any value or state.
function function_expecting_attribute(attribute) {
    let value = valueify(attribute);
    let state = stateify(attribute);
    assertType(value);
    assertType(state);
}
function_expecting_attribute(undefined);
function_expecting_attribute(undefined);
function_expecting_attribute(undefined);
function_expecting_attribute(undefined);
function_expecting_attribute(undefined);
function_expecting_attribute(undefined);
function_expecting_attribute(undefined);
function_expecting_attribute(undefined);
function_expecting_attribute(undefined);
function_expecting_attribute(undefined);
function_expecting_attribute(undefined);
function_expecting_attribute(undefined);
// ReadableState should be covariant. Any state that can be guaranteed to only contain string, undefined or string | undefined should be accepted.
function function_expecting_readable_state(attribute) {
    let value = valueify(attribute);
    let shadow = attribute.shadow();
    let computed = attribute.compute((value) => value);
    attribute.observe("update", (state) => {
        let value = state.value();
    });
}
function_expecting_readable_state(undefined);
function_expecting_readable_state(undefined);
function_expecting_readable_state(undefined);
function_expecting_readable_state(undefined);
function_expecting_readable_state(undefined);
function_expecting_readable_state(undefined);
function_expecting_readable_state(undefined);
function_expecting_readable_state(undefined);
// @ts-expect-error
function_expecting_readable_state(undefined);
// @ts-expect-error
function_expecting_readable_state(undefined);
// @ts-expect-error
function_expecting_readable_state(undefined);
// @ts-expect-error
function_expecting_readable_state(undefined);
// WritableState should be invariant. Only state containing exactly string | undefined should be accepted.
function function_expecting_writable_state(attribute) {
    let value = valueify(attribute);
    let shadow = attribute.shadow();
    let computed = attribute.compute((value) => value);
    attribute.observe("update", (state) => {
        let value = state.value();
    });
}
// @ts-expect-error
function_expecting_writable_state(undefined);
// @ts-expect-error
function_expecting_writable_state(undefined);
// @ts-expect-error
function_expecting_writable_state(undefined);
// @ts-expect-error
function_expecting_writable_state(undefined);
// @ts-expect-error
function_expecting_writable_state(undefined);
// @ts-expect-error
function_expecting_writable_state(undefined);
function_expecting_writable_state(undefined);
// @ts-expect-error
function_expecting_writable_state(undefined);
// @ts-expect-error
function_expecting_writable_state(undefined);
// @ts-expect-error
function_expecting_writable_state(undefined);
// @ts-expect-error
function_expecting_writable_state(undefined);
// @ts-expect-error
function_expecting_writable_state(undefined);
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
    // TODO: test with complex arrays containing objects
}
function merge(...states) {
    throw "";
}
exports.merge = merge;
;
{
    let one = stateify({ a: 1 });
    let two = stateify({ a: null });
    let merged = merge(one, two);
}
function fallback(underlying, default_value) {
    throw "";
}
exports.fallback = fallback;
;
{
    fallback(make_state("string"), "hello");
}
function computed(states, computer) {
    throw "";
}
exports.computed = computed;
;
{
    computed([make_state(5), make_state("string")], (a, b) => {
    });
}
{
    function inner(outer) {
    }
    // require/optional?
    function outer(outer) {
        return inner(outer.inner);
    }
    let string = "string";
    let readable_string = make_state("string");
    let writable_string = make_state("string");
    outer({
        inner: {
            inner_writable_string: writable_string,
            inner_readable_string: readable_string
        },
        outer_writable_string: writable_string,
        outer_readable_string: readable_string
    });
}
