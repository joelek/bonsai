"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const wtf = require("@joelek/wtf");
const state_1 = require("./state");
wtf.test(`It should support assignment from empty string literal to any string.`, (assert) => {
    let string = (0, state_1.make_state)("");
});
wtf.test(`It should not output undefined member values in object values.`, (assert) => {
    let state = (0, state_1.make_state)({ required: undefined });
    assert.equals(state.value(), {});
});
wtf.test(`It should support updating optional object members to undefined values.`, (assert) => {
    let state = (0, state_1.make_state)({ data: { page: "" } });
    state.update({ data: undefined });
    assert.equals(state.value(), { data: {} });
});
wtf.test(`It should support updating optional array members to undefined values.`, (assert) => {
    let state = (0, state_1.make_state)({ data: [] });
    state.update({ data: undefined });
    assert.equals(state.value(), { data: [] });
});
wtf.test(`It should initialize optional members lazily when updated.`, (assert) => {
    let state = (0, state_1.make_state)({});
    state.update({ optional: undefined });
    let optional = state.member("optional", false);
    assert.equals(optional.value(), undefined);
});
wtf.test(`It should initialize optional members lazily when accessed.`, (assert) => {
    let state = (0, state_1.make_state)({});
    let optional = state.member("optional", false);
    assert.equals(optional.value(), false);
});
wtf.test(`It should filter arrays.`, (assert) => {
    let original = (0, state_1.make_state)(["a", "B", "c", "D", "e"]);
    let filtered = original.filter((state) => state.compute((value) => value === value.toLowerCase()));
    assert.equals(original.value(), ["a", "B", "c", "D", "e"]);
    assert.equals(filtered.value(), ["a", "c", "e"]);
});
wtf.test(`A filtered array should be updated when the elements in the original array are updated from the start.`, (assert) => {
    let original = (0, state_1.make_state)(["a", "B", "c", "D", "e"]);
    let filtered = original.filter((state) => state.compute((value) => value === value.toLowerCase()));
    assert.equals(original.value(), ["a", "B", "c", "D", "e"]);
    assert.equals(filtered.value(), ["a", "c", "e"]);
    original.element(0).update("A");
    assert.equals(original.value(), ["A", "B", "c", "D", "e"]);
    assert.equals(filtered.value(), ["c", "e"]);
    original.element(1).update("b");
    assert.equals(original.value(), ["A", "b", "c", "D", "e"]);
    assert.equals(filtered.value(), ["b", "c", "e"]);
    original.element(2).update("C");
    assert.equals(original.value(), ["A", "b", "C", "D", "e"]);
    assert.equals(filtered.value(), ["b", "e"]);
    original.element(3).update("d");
    assert.equals(original.value(), ["A", "b", "C", "d", "e"]);
    assert.equals(filtered.value(), ["b", "d", "e"]);
    original.element(4).update("E");
    assert.equals(original.value(), ["A", "b", "C", "d", "E"]);
    assert.equals(filtered.value(), ["b", "d"]);
});
wtf.test(`A filtered array should be updated when the elements in the original array are updated from the end.`, (assert) => {
    let original = (0, state_1.make_state)(["a", "B", "c", "D", "e"]);
    let filtered = original.filter((state) => state.compute((value) => value === value.toLowerCase()));
    assert.equals(original.value(), ["a", "B", "c", "D", "e"]);
    assert.equals(filtered.value(), ["a", "c", "e"]);
    original.element(4).update("E");
    assert.equals(original.value(), ["a", "B", "c", "D", "E"]);
    assert.equals(filtered.value(), ["a", "c"]);
    original.element(3).update("d");
    assert.equals(original.value(), ["a", "B", "c", "d", "E"]);
    assert.equals(filtered.value(), ["a", "c", "d"]);
    original.element(2).update("C");
    assert.equals(original.value(), ["a", "B", "C", "d", "E"]);
    assert.equals(filtered.value(), ["a", "d"]);
    original.element(1).update("b");
    assert.equals(original.value(), ["a", "b", "C", "d", "E"]);
    assert.equals(filtered.value(), ["a", "b", "d"]);
    original.element(0).update("A");
    assert.equals(original.value(), ["A", "b", "C", "d", "E"]);
    assert.equals(filtered.value(), ["b", "d"]);
});
wtf.test(`The original array should be updated when the elements of the filtered array are updated from the start.`, (assert) => {
    let original = (0, state_1.make_state)(["a", "B", "c", "D", "e"]);
    let filtered = original.filter((state) => state.compute((value) => value === value.toLowerCase()));
    assert.equals(original.value(), ["a", "B", "c", "D", "e"]);
    assert.equals(filtered.value(), ["a", "c", "e"]);
    filtered.element(0).update("A");
    assert.equals(original.value(), ["A", "B", "c", "D", "e"]);
    assert.equals(filtered.value(), ["c", "e"]);
    filtered.element(0).update("C");
    assert.equals(original.value(), ["A", "B", "C", "D", "e"]);
    assert.equals(filtered.value(), ["e"]);
    filtered.element(0).update("E");
    assert.equals(original.value(), ["A", "B", "C", "D", "E"]);
    assert.equals(filtered.value(), []);
});
wtf.test(`The original array should be updated when the elements of the filtered array are updated from the end.`, (assert) => {
    let original = (0, state_1.make_state)(["a", "B", "c", "D", "e"]);
    let filtered = original.filter((state) => state.compute((value) => value === value.toLowerCase()));
    assert.equals(original.value(), ["a", "B", "c", "D", "e"]);
    assert.equals(filtered.value(), ["a", "c", "e"]);
    filtered.element(2).update("E");
    assert.equals(original.value(), ["a", "B", "c", "D", "E"]);
    assert.equals(filtered.value(), ["a", "c"]);
    filtered.element(1).update("C");
    assert.equals(original.value(), ["a", "B", "C", "D", "E"]);
    assert.equals(filtered.value(), ["a"]);
    filtered.element(0).update("A");
    assert.equals(original.value(), ["A", "B", "C", "D", "E"]);
    assert.equals(filtered.value(), []);
});
wtf.test(`A filtered array should be updated when elements are inserted at the start of the original array.`, (assert) => {
    let original = (0, state_1.make_state)([]);
    let filtered = original.filter((state) => state.compute((value) => value === value.toLowerCase()));
    assert.equals(original.value(), []);
    assert.equals(filtered.value(), []);
    original.insert(0, "e");
    assert.equals(original.value(), ["e"]);
    assert.equals(filtered.value(), ["e"]);
    original.insert(0, "D");
    assert.equals(original.value(), ["D", "e"]);
    assert.equals(filtered.value(), ["e"]);
    original.insert(0, "c");
    assert.equals(original.value(), ["c", "D", "e"]);
    assert.equals(filtered.value(), ["c", "e"]);
    original.insert(0, "B");
    assert.equals(original.value(), ["B", "c", "D", "e"]);
    assert.equals(filtered.value(), ["c", "e"]);
    original.insert(0, "a");
    assert.equals(original.value(), ["a", "B", "c", "D", "e"]);
    assert.equals(filtered.value(), ["a", "c", "e"]);
});
wtf.test(`A filtered array should be updated when elements are inserted at the end of the original array.`, (assert) => {
    let original = (0, state_1.make_state)([]);
    let filtered = original.filter((state) => state.compute((value) => value === value.toLowerCase()));
    assert.equals(original.value(), []);
    assert.equals(filtered.value(), []);
    original.insert(0, "a");
    assert.equals(original.value(), ["a"]);
    assert.equals(filtered.value(), ["a"]);
    original.insert(1, "B");
    assert.equals(original.value(), ["a", "B"]);
    assert.equals(filtered.value(), ["a"]);
    original.insert(2, "c");
    assert.equals(original.value(), ["a", "B", "c"]);
    assert.equals(filtered.value(), ["a", "c"]);
    original.insert(3, "D");
    assert.equals(original.value(), ["a", "B", "c", "D"]);
    assert.equals(filtered.value(), ["a", "c"]);
    original.insert(4, "e");
    assert.equals(original.value(), ["a", "B", "c", "D", "e"]);
    assert.equals(filtered.value(), ["a", "c", "e"]);
});
wtf.test(`A filtered array should be updated when elements are removed from the start of the original array.`, (assert) => {
    let original = (0, state_1.make_state)(["a", "B", "c", "D", "e"]);
    let filtered = original.filter((state) => state.compute((value) => value === value.toLowerCase()));
    assert.equals(original.value(), ["a", "B", "c", "D", "e"]);
    assert.equals(filtered.value(), ["a", "c", "e"]);
    original.remove(0);
    assert.equals(original.value(), ["B", "c", "D", "e"]);
    assert.equals(filtered.value(), ["c", "e"]);
    original.remove(0);
    assert.equals(original.value(), ["c", "D", "e"]);
    assert.equals(filtered.value(), ["c", "e"]);
    original.remove(0);
    assert.equals(original.value(), ["D", "e"]);
    assert.equals(filtered.value(), ["e"]);
    original.remove(0);
    assert.equals(original.value(), ["e"]);
    assert.equals(filtered.value(), ["e"]);
    original.remove(0);
    assert.equals(original.value(), []);
    assert.equals(filtered.value(), []);
});
wtf.test(`A filtered array should be updated when elements are removed from the end of the original array.`, (assert) => {
    let original = (0, state_1.make_state)(["a", "B", "c", "D", "e"]);
    let filtered = original.filter((state) => state.compute((value) => value === value.toLowerCase()));
    assert.equals(original.value(), ["a", "B", "c", "D", "e"]);
    assert.equals(filtered.value(), ["a", "c", "e"]);
    original.remove(4);
    assert.equals(original.value(), ["a", "B", "c", "D"]);
    assert.equals(filtered.value(), ["a", "c"]);
    original.remove(3);
    assert.equals(original.value(), ["a", "B", "c"]);
    assert.equals(filtered.value(), ["a", "c"]);
    original.remove(2);
    assert.equals(original.value(), ["a", "B"]);
    assert.equals(filtered.value(), ["a"]);
    original.remove(1);
    assert.equals(original.value(), ["a"]);
    assert.equals(filtered.value(), ["a"]);
    original.remove(0);
    assert.equals(original.value(), []);
    assert.equals(filtered.value(), []);
});
wtf.test(`Stateify should convert values to states.`, (assert) => {
    let state = (0, state_1.stateify)("test");
    assert.equals(state.value(), "test");
});
wtf.test(`Stateify should not process states.`, (assert) => {
    let state = (0, state_1.stateify)((0, state_1.make_state)("test"));
    assert.equals(state.value(), "test");
});
wtf.test(`Stateify should handle objects with states.`, (assert) => {
    let state = (0, state_1.stateify)({ one: (0, state_1.make_state)("a") });
    assert.equals(state.value(), { one: "a" });
});
wtf.test(`Stateify should handle objects with values and states.`, (assert) => {
    let state = (0, state_1.stateify)({ one: (0, state_1.make_state)("a"), two: "b" });
    assert.equals(state.value(), { one: "a", two: "b" });
});
wtf.test(`Stateify should handle nested objects with values and states.`, (assert) => {
    let state = (0, state_1.stateify)({ one: { one: (0, state_1.make_state)("a"), two: "b" } });
    assert.equals(state.value(), { one: { one: "a", two: "b" } });
});
wtf.test(`Stateify should handle nested objects with state objects.`, (assert) => {
    let state = (0, state_1.stateify)({ one: (0, state_1.make_state)({ one: "a", two: "b" }) });
    assert.equals(state.value(), { one: { one: "a", two: "b" } });
});
wtf.test(`Valueify should not process values.`, (assert) => {
    let value = (0, state_1.valueify)("test");
    assert.equals(value, "test");
});
wtf.test(`Valueify should convert states into values.`, (assert) => {
    let value = (0, state_1.valueify)((0, state_1.make_state)("test"));
    assert.equals(value, "test");
});
wtf.test(`Valueify should handle objects with states.`, (assert) => {
    let value = (0, state_1.valueify)({ one: (0, state_1.make_state)("a") });
    assert.equals(value, { one: "a" });
});
wtf.test(`Valueify should handle objects with values and states.`, (assert) => {
    let value = (0, state_1.valueify)({ one: (0, state_1.make_state)("a"), two: "b" });
    assert.equals(value, { one: "a", two: "b" });
});
wtf.test(`Valueify should handle nested objects with values and states.`, (assert) => {
    let value = (0, state_1.valueify)({ one: { one: (0, state_1.make_state)("a"), two: "b" } });
    assert.equals(value, { one: { one: "a", two: "b" } });
});
wtf.test(`Valueify should handle objects with state objects.`, (assert) => {
    let value = (0, state_1.valueify)({ one: (0, state_1.make_state)({ one: "a", two: "b" }) });
    assert.equals(value, { one: { one: "a", two: "b" } });
});
wtf.test(`State arrays should be created with index signatures.`, (assert) => {
    let state = (0, state_1.make_state)(["a", "b", "c"]);
    assert.equals(state[0] === state.element(0), true);
    assert.equals(state[1] === state.element(1), true);
    assert.equals(state[2] === state.element(2), true);
});
wtf.test(`State objects should be created with index signatures.`, (assert) => {
    let state = (0, state_1.make_state)({ string: "a", number: 0, boolean: false });
    assert.equals(state.string === state.member("string"), true);
    assert.equals(state.number === state.member("number"), true);
    assert.equals(state.boolean === state.member("boolean"), true);
});
wtf.test(`ArrayState should support observers being added in mapped arrays.`, async (assert) => {
    let states = (0, state_1.make_state)([]);
    let events = new Array();
    states.mapStates((state, index) => {
        events.push("b");
        states.observe("insert", (state, index) => {
            events.push("d");
        });
    });
    events.push("a");
    states.append("one");
    events.push("c");
    states.append("two");
    events.push("e");
    assert.equals(events, ["a", "b", "c", "b", "d", "e"]);
});
wtf.test(`Attributes should be user-friendly.`, (assert) => {
    let value = {
        required: {
            required: "reqreq",
            optional: "reqopt"
        },
        optional: {
            required: "optreq",
            optional: "optopt"
        }
    };
    let state = (0, state_1.make_state)(value);
    let value_attributes = value;
    let state_attributes = state;
    let attributes = value_attributes = state_attributes;
    let required = attributes.required;
    let required_required = required.required;
    assert.equals((0, state_1.valueify)(required_required), "reqreq");
    let required_optional = required.optional;
    assert.equals((0, state_1.valueify)(required_optional), "reqopt");
    let optional = (0, state_1.stateify)(attributes).member("optional", { required: "optreq2" });
    let optional_required = optional.required;
    assert.equals((0, state_1.valueify)(optional_required), "optreq");
    let optional_optional = optional.optional;
    assert.equals((0, state_1.valueify)(optional_optional), "optopt");
});
wtf.test(`Attributes should be composable from nested values and states.`, (assert) => {
    let attributes = {
        one: {
            one: (0, state_1.make_state)("a"),
            two: "b"
        },
        two: (0, state_1.make_state)({
            one: "c",
            two: "d"
        })
    };
    let one_one = attributes.one.one;
    assert.equals((0, state_1.valueify)(one_one), "a");
    let one_two = attributes.one.two;
    assert.equals((0, state_1.valueify)(one_two), "b");
    let two_one = attributes.two.one;
    assert.equals((0, state_1.valueify)(two_one), "c");
    let two_two = attributes.two.two;
    assert.equals((0, state_1.valueify)(two_two), "d");
});
wtf.test(`Array states should have rest functionality.`, (assert) => {
    let state = (0, state_1.make_state)(["a", "b"]);
    let spread = [...state];
    assert.equals(spread[0] === state[0], true);
    assert.equals(spread[1] === state[1], true);
});
wtf.test(`Array states should have spread functionality.`, (assert) => {
    let state = (0, state_1.make_state)(["a", "b"]);
    let spread = { ...state };
    assert.equals(Object.getOwnPropertyNames(spread), ["0", "1"]);
    assert.equals(spread[0] === state[0], true);
    assert.equals(spread[1] === state[1], true);
});
wtf.test(`Object states should have spread functionality.`, (assert) => {
    let state = (0, state_1.make_state)({ one: "a", two: "b" });
    let spread = { ...state };
    assert.equals(Object.getOwnPropertyNames(spread), ["one", "two"]);
    assert.equals(spread.one === state.one, true);
    assert.equals(spread.two === state.two, true);
});
wtf.test(`Primitive states should have spread functionality.`, (assert) => {
    let state = (0, state_1.make_state)(undefined);
    let spread = { ...state };
    assert.equals(Object.getOwnPropertyNames(spread), []);
    assert.equals(spread, {});
});
wtf.test(`Reference states should have spread functionality.`, (assert) => {
    let state = (0, state_1.make_state)(new class {
    });
    let spread = { ...state };
    assert.equals(Object.getOwnPropertyNames(spread), []);
    assert.equals(spread, {});
});
/*
wtf.test(`Dynamic ArrayState elements should support being updated after array is vacated.`, (assert) => {
    let state = make_state(["one"]);
    let element = state.element(stateify(0));
    state.vacate();
    element.update("two");
    assert.equals(element.value(), "two");
});
 */
/*
wtf.test(`Lazily initialized ObjectStates should supporting being cleared.`, (assert) => {
    let object = make_state({} as { a?: { key: string }, b?: { key: string } });
    let a = object.member("a", { key: "a" });
    let b = object.member("b", { key: "b" });
    object.update({});
    assert.equals(object.value(), {});
});
 */
