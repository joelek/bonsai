"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const wtf = require("@joelek/wtf");
const state_1 = require("./state");
wtf.test(`Computed should compute a new state from two string states.`, (assert) => {
    let one = (0, state_1.stateify)("one");
    let two = (0, state_1.stateify)("two");
    let computed_state = (0, state_1.computed)([one, two], (one, two) => {
        return `${one} ${two}`;
    });
    assert.equals(computed_state.value(), "one two");
    one.update("ONE");
    assert.equals(computed_state.value(), "ONE two");
    two.update("TWO");
    assert.equals(computed_state.value(), "ONE TWO");
});
wtf.test(`Attributes<A> should support complex values.`, (assert) => {
    let attributes = {
        array: [
            {
                string: "a"
            }
        ],
        tuple: ["a", 0],
        object: {
            string: "a"
        },
        union: "a"
    };
    let array = (0, state_1.stateify)(attributes.array);
    array.update([{ string: "b" }]);
    array.observe("update", (state) => { });
    array.observe("insert", (state) => { });
    array.observe("remove", (state) => { });
    assert.equals(array[0].value(), { string: "b" });
    assert.equals(array.value(), [{ string: "b" }]);
    let tuple = (0, state_1.stateify)(attributes.tuple);
    tuple.update(["b", 1]);
    tuple.observe("update", (state) => { });
    tuple.observe("insert", (state) => { });
    tuple.observe("remove", (state) => { });
    assert.equals(tuple[0].value(), "b");
    assert.equals(tuple.value(), ["b", 1]);
    let object = (0, state_1.stateify)(attributes.object);
    object.update({ string: "b" });
    object.observe("update", (state) => { });
    assert.equals(object.string.value(), "b");
    assert.equals(object.value(), { string: "b" });
    let union = (0, state_1.stateify)(attributes.union);
    union.update("a");
    union.update("b");
    union.observe("update", (state) => { });
    assert.equals(union.value(), "b");
});
wtf.test(`It should support assignment from empty string literal to any string.`, (assert) => {
    let string = (0, state_1.make_state)("");
});
wtf.test(`It should not output undefined member values in object values.`, (assert) => {
    let state = (0, state_1.make_state)({ required: undefined });
    assert.equals(state.value(), {});
});
wtf.test(`It should support updating optional object members to undefined values.`, (assert) => {
    let state = (0, state_1.make_state)({ object: { primitive: "a" } });
    let object_state = state.member("object");
    state.update({ object: undefined });
    assert.equals(state.value(), {});
    state.update({ object: { primitive: "b" } });
    assert.equals(state.value(), { object: { primitive: "b" } });
    assert.equals(object_state.value(), { primitive: "b" });
});
wtf.test(`It should support updating optional array members to undefined values.`, (assert) => {
    let state = (0, state_1.make_state)({ array: ["a"] });
    let array_state = state.member("array");
    state.update({ array: undefined });
    assert.equals(state.value(), {});
    state.update({ array: ["b"] });
    assert.equals(state.value(), { array: ["b"] });
    assert.equals(array_state.value(), ["b"]);
});
wtf.test(`It should initialize optional members lazily when updated.`, (assert) => {
    let state = (0, state_1.make_state)({});
    state.update({ optional: undefined });
    let optional = state.member("optional");
    assert.equals(state.value(), {});
    assert.equals(optional.value(), undefined);
});
wtf.test(`Lazily initialized optional members should propagate changes back to the object.`, (assert) => {
    let state = (0, state_1.make_state)({});
    let optional = state.member("optional");
    optional.update(false);
    assert.equals(state.value(), { optional: false });
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
wtf.test(`Stateify should handle arrays with values.`, (assert) => {
    let state = (0, state_1.stateify)(["a"]);
    assert.equals(state.value(), ["a"]);
});
wtf.test(`Stateify should handle arrays with states.`, (assert) => {
    let state = (0, state_1.stateify)([(0, state_1.make_state)("a")]);
    assert.equals(state.value(), ["a"]);
});
wtf.test(`Stateify should handle arrays with values and states.`, (assert) => {
    let state = (0, state_1.stateify)([(0, state_1.make_state)("a"), "b"]);
    assert.equals(state.value(), ["a", "b"]);
});
wtf.test(`Stateify should handle arrays with objects with values.`, (assert) => {
    let state = (0, state_1.stateify)([{ one: "a" }]);
    assert.equals(state.value(), [{ one: "a" }]);
});
wtf.test(`Stateify should handle arrays with objects with states.`, (assert) => {
    let state = (0, state_1.stateify)([{ one: (0, state_1.make_state)("a") }]);
    assert.equals(state.value(), [{ one: "a" }]);
});
wtf.test(`Stateify should handle arrays with objects with values and states.`, (assert) => {
    let state = (0, state_1.stateify)([{ one: (0, state_1.make_state)("a"), two: "b" }]);
    assert.equals(state.value(), [{ one: "a", two: "b" }]);
});
wtf.test(`Stateify should handle array states with values.`, (assert) => {
    let state = (0, state_1.stateify)((0, state_1.make_state)(["a", "b"]));
    assert.equals(state.value(), ["a", "b"]);
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
wtf.test(`Valueify should handle arrays with values.`, (assert) => {
    let value = (0, state_1.valueify)(["a"]);
    assert.equals(value, ["a"]);
});
wtf.test(`Valueify should handle arrays with states.`, (assert) => {
    let value = (0, state_1.valueify)([(0, state_1.make_state)("a")]);
    assert.equals(value, ["a"]);
});
wtf.test(`Valueify should handle arrays with values and states.`, (assert) => {
    let value = (0, state_1.valueify)([(0, state_1.make_state)("a"), "b"]);
    assert.equals(value, ["a", "b"]);
});
wtf.test(`Valueify should handle arrays with objects with values.`, (assert) => {
    let value = (0, state_1.valueify)([{ one: "a" }]);
    assert.equals(value, [{ one: "a" }]);
});
wtf.test(`Valueify should handle arrays with objects with states.`, (assert) => {
    let value = (0, state_1.valueify)([{ one: (0, state_1.make_state)("a") }]);
    assert.equals(value, [{ one: "a" }]);
});
wtf.test(`Valueify should handle arrays with objects with values and states.`, (assert) => {
    let value = (0, state_1.valueify)([{ one: (0, state_1.make_state)("a"), two: "b" }]);
    assert.equals(value, [{ one: "a", two: "b" }]);
});
wtf.test(`Valueify should handle array states with values.`, (assert) => {
    let state = (0, state_1.valueify)((0, state_1.make_state)(["a", "b"]));
    assert.equals(state, ["a", "b"]);
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
    let optional = (0, state_1.fallback)((0, state_1.stateify)(attributes).member("optional"), { required: "optreq2" });
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
        }),
        three: [
            {
                one: (0, state_1.make_state)("e"),
                two: "f"
            }
        ],
        four: (0, state_1.make_state)([
            {
                one: "g",
                two: "h"
            }
        ])
    };
    let one_one = attributes.one.one;
    assert.equals((0, state_1.valueify)(one_one), "a");
    let one_two = attributes.one.two;
    assert.equals((0, state_1.valueify)(one_two), "b");
    let two_one = attributes.two.one;
    assert.equals((0, state_1.valueify)(two_one), "c");
    let two_two = attributes.two.two;
    assert.equals((0, state_1.valueify)(two_two), "d");
    assert.equals((0, state_1.valueify)(attributes.three), [{ one: "e", two: "f" }]);
    assert.equals((0, state_1.valueify)(attributes.four), [{ one: "g", two: "h" }]);
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
wtf.test(`Dynamic array elements should update properly when accessing deferred object members.`, (assert) => {
    let objects = (0, state_1.stateify)([
        {
            array: [
                {
                    array: []
                }
            ]
        }
    ]);
    objects.element((0, state_1.stateify)(0)).deferred;
    objects.element((0, state_1.stateify)(0)).array[0].deferred;
});
wtf.test(`Dynamic ArrayState elements should support being updated.`, (assert) => {
    let array = (0, state_1.make_state)(["one", "two"]);
    let index = (0, state_1.stateify)(0);
    let element = array.element(index);
    element.update("ONE");
    assert.equals(element.value(), "ONE");
    assert.equals(array.value(), ["ONE", "two"]);
});
wtf.test(`Dynamic ArrayState elements should throw an error when the index is invalid.`, async (assert) => {
    let array = (0, state_1.make_state)(["one", "two"]);
    let index = (0, state_1.stateify)(2);
    await assert.throws(async () => {
        let element = array.element(index);
    });
});
wtf.test(`Dynamic ArrayState elements should support being updated after the index is changed.`, (assert) => {
    let array = (0, state_1.make_state)(["one", "two"]);
    let index = (0, state_1.stateify)(0);
    let element = array.element(index);
    index.update(1);
    element.update("TWO");
    assert.equals(element.value(), "TWO");
    assert.equals(array.value(), ["one", "TWO"]);
});
wtf.test(`Dynamic ArrayState elements should throw an error when the index becomes invalid.`, async (assert) => {
    let array = (0, state_1.make_state)(["one", "two"]);
    let index = (0, state_1.stateify)(0);
    let element = array.element(index);
    await assert.throws(async () => {
        index.update(2);
    });
});
wtf.test(`Dynamic ArrayState elements should support being updated after array is vacated.`, (assert) => {
    let array = (0, state_1.make_state)(["one", "two"]);
    let index = (0, state_1.stateify)(0);
    let element = array.element(index);
    array.vacate();
    element.update("ONE");
    assert.equals(element.value(), "ONE");
    assert.equals(array.value(), []);
});
wtf.test(`Lazily initialized ObjectStates should supporting being cleared.`, (assert) => {
    let object = (0, state_1.make_state)({});
    let a = object.member("a");
    a.update({ key: "a" });
    let b = object.member("b");
    b.update({ key: "b" });
    object.update({});
    assert.equals(object.value(), {});
    assert.equals(a.value(), undefined);
    assert.equals(b.value(), undefined);
});
/*
wtf.test(`Lazily initialized ObjectStates should not trigger multiple updates.`, (assert) => {
    let states = make_state<Array<{ key?: string }>>([]);
    states.mapStates((state, index) => state.key); // Lazily initialized member triggers onMemberUpdate().
    let events = [] as Array<Array<{ key?: string }>>;
    states.observe("update", (state) => {
        events.push(state.value());
    });
    states.append({});
    assert.equals(events, [{}]);
});
 */
wtf.test(`State<[string, string] | undefined> should be assignable to StateOrValue<[string, string] | undefined>.`, (assert) => {
    let attribute = (0, state_1.stateify)(["one", "two"]);
});
wtf.test(`State<[string, string]> should be assignable to StateOrValue<[string, string] | undefined>.`, (assert) => {
    let attribute = (0, state_1.stateify)(["one", "two"]);
});
wtf.test(`State<undefined> should be assignable to StateOrValue<[string, string] | undefined>.`, (assert) => {
    let attribute = (0, state_1.stateify)(undefined);
});
wtf.test(`State<[string, string] | undefined> should be assignable to Attribute<[string, string] | undefined>.`, (assert) => {
    let attribute = (0, state_1.stateify)(["one", "two"]);
});
wtf.test(`State<[string, string]> should be assignable to Attribute<[string, string] | undefined>.`, (assert) => {
    let attribute = (0, state_1.stateify)(["one", "two"]);
});
wtf.test(`State<undefined> should be assignable to Attribute<[string, string] | undefined>.`, (assert) => {
    let attribute = (0, state_1.stateify)(undefined);
});
wtf.test(`Fallback states should use the underlying value when the underlying value is defined.`, (assert) => {
    let underlying = (0, state_1.make_state)("underlying");
    let fallbacked = (0, state_1.fallback)(underlying, "default");
    assert.equals(underlying.value(), "underlying");
    assert.equals(fallbacked.value(), "underlying");
});
wtf.test(`Fallback states should use the default value when the underlying value is undefined.`, (assert) => {
    let underlying = (0, state_1.make_state)(undefined);
    let fallbacked = (0, state_1.fallback)(underlying, "default");
    assert.equals(underlying.value(), undefined);
    assert.equals(fallbacked.value(), "default");
});
wtf.test(`Fallback states should propagate updated values back to the underlying state.`, (assert) => {
    let underlying = (0, state_1.make_state)(undefined);
    let fallbacked = (0, state_1.fallback)(underlying, "default");
    assert.equals(underlying.value(), undefined);
    assert.equals(fallbacked.value(), "default");
    fallbacked.update("updated");
    assert.equals(underlying.value(), "updated");
    assert.equals(fallbacked.value(), "updated");
});
wtf.test(`Fallback states should not propagate the default value back to the underlying state when the fallback state is updated.`, (assert) => {
    let underlying = (0, state_1.make_state)("underlying");
    let fallbacked = (0, state_1.fallback)(underlying, "default");
    assert.equals(underlying.value(), "underlying");
    assert.equals(fallbacked.value(), "underlying");
    fallbacked.update("default");
    assert.equals(underlying.value(), undefined);
    assert.equals(fallbacked.value(), "default");
});
wtf.test(`Fallback states should not propagate the default value back to the underlying state when the underlying state is updated.`, (assert) => {
    let underlying = (0, state_1.make_state)("underlying");
    let fallbacked = (0, state_1.fallback)(underlying, "default");
    assert.equals(underlying.value(), "underlying");
    assert.equals(fallbacked.value(), "underlying");
    underlying.update(undefined);
    assert.equals(underlying.value(), undefined);
    assert.equals(fallbacked.value(), "default");
});
wtf.test(`Merge should merge value { a: "one" } with value { a: "two" }.`, (assert) => {
    let one = (0, state_1.valueify)({ a: "one" });
    let two = (0, state_1.valueify)({ a: "two" });
    let merged = (0, state_1.merge)(one, two);
    assert.equals((0, state_1.valueify)(merged), { a: "two" });
});
wtf.test(`Merge should merge value { a: "one" } with state { a: "two" }.`, (assert) => {
    let one = (0, state_1.valueify)({ a: "one" });
    let two = (0, state_1.stateify)({ a: "two" });
    let merged = (0, state_1.merge)(one, two);
    assert.equals((0, state_1.valueify)(merged), { a: "two" });
});
wtf.test(`Merge should merge state { a: "one" } with value { a: "two" }.`, (assert) => {
    let one = (0, state_1.stateify)({ a: "one" });
    let two = (0, state_1.valueify)({ a: "two" });
    let merged = (0, state_1.merge)(one, two);
    assert.equals((0, state_1.valueify)(merged), { a: "two" });
});
wtf.test(`Merge should merge state { a: "one" } with state { a: "two" }.`, (assert) => {
    let one = (0, state_1.stateify)({ a: "one" });
    let two = (0, state_1.stateify)({ a: "two" });
    let merged = (0, state_1.merge)(one, two);
    assert.equals((0, state_1.valueify)(merged), { a: "two" });
});
wtf.test(`Merge should merge value {} with value { a: "two" }.`, (assert) => {
    let one = (0, state_1.valueify)({});
    let two = (0, state_1.valueify)({ a: "two" });
    let merged = (0, state_1.merge)(one, two);
    assert.equals((0, state_1.valueify)(merged), { a: "two" });
});
wtf.test(`Merge should merge value {} with state { a: "two" }.`, (assert) => {
    let one = (0, state_1.valueify)({});
    let two = (0, state_1.stateify)({ a: "two" });
    let merged = (0, state_1.merge)(one, two);
    assert.equals((0, state_1.valueify)(merged), { a: "two" });
});
wtf.test(`Merge should merge state {} with value { a: "two" }.`, (assert) => {
    let one = (0, state_1.stateify)({});
    let two = (0, state_1.valueify)({ a: "two" });
    let merged = (0, state_1.merge)(one, two);
    assert.equals((0, state_1.valueify)(merged), { a: "two" });
});
wtf.test(`Merge should merge state {} with state { a: "two" }.`, (assert) => {
    let one = (0, state_1.stateify)({});
    let two = (0, state_1.stateify)({ a: "two" });
    let merged = (0, state_1.merge)(one, two);
    assert.equals((0, state_1.valueify)(merged), { a: "two" });
});
wtf.test(`Merge should merge value { a: "one" } with value {}.`, (assert) => {
    let one = (0, state_1.valueify)({ a: "one" });
    let two = (0, state_1.valueify)({});
    let merged = (0, state_1.merge)(one, two);
    assert.equals((0, state_1.valueify)(merged), { a: "one" });
});
wtf.test(`Merge should merge value { a: "one" } with state {}.`, (assert) => {
    let one = (0, state_1.valueify)({ a: "one" });
    let two = (0, state_1.stateify)({});
    let merged = (0, state_1.merge)(one, two);
    assert.equals((0, state_1.valueify)(merged), { a: "one" });
});
wtf.test(`Merge should merge state { a: "one" } with value {}.`, (assert) => {
    let one = (0, state_1.stateify)({ a: "one" });
    let two = (0, state_1.valueify)({});
    let merged = (0, state_1.merge)(one, two);
    assert.equals((0, state_1.valueify)(merged), { a: "one" });
});
wtf.test(`Merge should merge state { a: "one" } with state {}.`, (assert) => {
    let one = (0, state_1.stateify)({ a: "one" });
    let two = (0, state_1.stateify)({});
    let merged = (0, state_1.merge)(one, two);
    assert.equals((0, state_1.valueify)(merged), { a: "one" });
});
wtf.test(`Merge should merge value { a: null } with value { a: "two" }.`, (assert) => {
    let one = (0, state_1.valueify)({ a: null });
    let two = (0, state_1.valueify)({ a: "two" });
    let merged = (0, state_1.merge)(one, two);
    assert.equals((0, state_1.valueify)(merged), { a: "two" });
});
wtf.test(`Merge should merge value { a: null } with state { a: "two" }.`, (assert) => {
    let one = (0, state_1.valueify)({ a: null });
    let two = (0, state_1.stateify)({ a: "two" });
    let merged = (0, state_1.merge)(one, two);
    assert.equals((0, state_1.valueify)(merged), { a: "two" });
});
wtf.test(`Merge should merge state { a: null } with value { a: "two" }.`, (assert) => {
    let one = (0, state_1.stateify)({ a: null });
    let two = (0, state_1.valueify)({ a: "two" });
    let merged = (0, state_1.merge)(one, two);
    assert.equals((0, state_1.valueify)(merged), { a: "two" });
});
wtf.test(`Merge should merge state { a: null } with state { a: "two" }.`, (assert) => {
    let one = (0, state_1.stateify)({ a: null });
    let two = (0, state_1.stateify)({ a: "two" });
    let merged = (0, state_1.merge)(one, two);
    assert.equals((0, state_1.valueify)(merged), { a: "two" });
});
wtf.test(`Merge should merge value { a: "one" } with value { "a": null }.`, (assert) => {
    let one = (0, state_1.valueify)({ a: "one" });
    let two = (0, state_1.valueify)({ a: null });
    let merged = (0, state_1.merge)(one, two);
    assert.equals((0, state_1.valueify)(merged), { a: null });
});
wtf.test(`Merge should merge value { a: "one" } with state { "a": null }.`, (assert) => {
    let one = (0, state_1.valueify)({ a: "one" });
    let two = (0, state_1.stateify)({ a: null });
    let merged = (0, state_1.merge)(one, two);
    assert.equals((0, state_1.valueify)(merged), { a: null });
});
wtf.test(`Merge should merge state { a: "one" } with value { "a": null }.`, (assert) => {
    let one = (0, state_1.stateify)({ a: "one" });
    let two = (0, state_1.valueify)({ a: null });
    let merged = (0, state_1.merge)(one, two);
    assert.equals((0, state_1.valueify)(merged), { a: null });
});
wtf.test(`Merge should merge state { a: "one" } with state { "a": null }.`, (assert) => {
    let one = (0, state_1.stateify)({ a: "one" });
    let two = (0, state_1.stateify)({ a: null });
    let merged = (0, state_1.merge)(one, two);
    assert.equals((0, state_1.valueify)(merged), { a: null });
});
wtf.test(`Merge should return the correct type for { a: string } and { a: string }.`, (assert) => {
    let one = (0, state_1.valueify)({ a: "one" });
    let two = (0, state_1.valueify)({ a: "two" });
    let merged = (0, state_1.merge)(one, two);
});
wtf.test(`Merge should return the correct type for { a?: string } and { a: string }.`, (assert) => {
    let one = (0, state_1.valueify)({});
    let two = (0, state_1.valueify)({ a: "two" });
    let merged = (0, state_1.merge)(one, two);
});
wtf.test(`Merge should return the correct type for { a: string } and { a?: string }.`, (assert) => {
    let one = (0, state_1.valueify)({ a: "two" });
    let two = (0, state_1.valueify)({});
    let merged = (0, state_1.merge)(one, two);
});
wtf.test(`Merge should return the correct type for { a?: string } and { a?: string }.`, (assert) => {
    let one = (0, state_1.valueify)({});
    let two = (0, state_1.valueify)({});
    let merged = (0, state_1.merge)(one, two);
});
wtf.test(`Merge should return the correct type for { a: string } and { a: number }.`, (assert) => {
    let one = (0, state_1.valueify)({ a: "one" });
    let two = (0, state_1.valueify)({ a: 1 });
    let merged = (0, state_1.merge)(one, two);
});
wtf.test(`Merge should return the correct type for { a?: string } and { a: number }.`, (assert) => {
    let one = (0, state_1.valueify)({});
    let two = (0, state_1.valueify)({ a: 1 });
    let merged = (0, state_1.merge)(one, two);
});
wtf.test(`Merge should return the correct type for { a: string } and { a?: number }.`, (assert) => {
    let one = (0, state_1.valueify)({ a: "two" });
    let two = (0, state_1.valueify)({});
    let merged = (0, state_1.merge)(one, two);
});
wtf.test(`Merge should return the correct type for { a?: string } and { a?: number }.`, (assert) => {
    let one = (0, state_1.valueify)({});
    let two = (0, state_1.valueify)({});
    let merged = (0, state_1.merge)(one, two);
});
wtf.test(`Merge should return the correct type for { a: number } and { a: string }.`, (assert) => {
    let one = (0, state_1.valueify)({ a: 1 });
    let two = (0, state_1.valueify)({ a: "two" });
    let merged = (0, state_1.merge)(one, two);
});
wtf.test(`Merge should return the correct type for { a?: number } and { a: string }.`, (assert) => {
    let one = (0, state_1.valueify)({});
    let two = (0, state_1.valueify)({ a: "two" });
    let merged = (0, state_1.merge)(one, two);
});
wtf.test(`Merge should return the correct type for { a: number } and { a?: string }.`, (assert) => {
    let one = (0, state_1.valueify)({ a: 1 });
    let two = (0, state_1.valueify)({});
    let merged = (0, state_1.merge)(one, two);
});
wtf.test(`Merge should return the correct type for { a?: number } and { a?: string }.`, (assert) => {
    let one = (0, state_1.valueify)({});
    let two = (0, state_1.valueify)({});
    let merged = (0, state_1.merge)(one, two);
});
wtf.test(`Merge should return the correct type for { a: number } and { a: null }.`, (assert) => {
    let one = (0, state_1.valueify)({ a: 1 });
    let two = (0, state_1.valueify)({ a: null });
    let merged = (0, state_1.merge)(one, two);
});
wtf.test(`Merge should return the correct type for { a: number } and { a: string | null }.`, (assert) => {
    let one = (0, state_1.valueify)({ a: 1 });
    let two = (0, state_1.valueify)({ a: null });
    let merged = (0, state_1.merge)(one, two);
});
wtf.test(`Merged objects created from {} and {} should update properly when the first object is updated.`, (assert) => {
    let one = (0, state_1.stateify)({});
    let two = (0, state_1.stateify)({});
    let merged = (0, state_1.merge)(one, two);
    one.update({ key: "one" });
    assert.equals((0, state_1.valueify)(merged), { key: "one" });
    one.update({ key: "ONE" });
    assert.equals((0, state_1.valueify)(merged), { key: "ONE" });
});
wtf.test(`Merged objects created from {} and {} should update properly when the second object is updated.`, (assert) => {
    let one = (0, state_1.stateify)({});
    let two = (0, state_1.stateify)({});
    let merged = (0, state_1.merge)(one, two);
    two.update({ key: "two" });
    assert.equals((0, state_1.valueify)(merged), { key: "two" });
    two.update({ key: "TWO" });
    assert.equals((0, state_1.valueify)(merged), { key: "TWO" });
});
wtf.test(`Merged objects created from { key: "one" } and {} should update properly when the first object is updated.`, (assert) => {
    let one = (0, state_1.stateify)({ key: "one" });
    let two = (0, state_1.stateify)({});
    let merged = (0, state_1.merge)(one, two);
    one.update({ key: "ONE" });
    assert.equals((0, state_1.valueify)(merged), { key: "ONE" });
    one.update({});
    assert.equals((0, state_1.valueify)(merged), {});
});
wtf.test(`Merged objects created from { key: "one" } and {} should update properly when the second object is updated.`, (assert) => {
    let one = (0, state_1.stateify)({ key: "one" });
    let two = (0, state_1.stateify)({});
    let merged = (0, state_1.merge)(one, two);
    two.update({ key: "two" });
    assert.equals((0, state_1.valueify)(merged), { key: "two" });
    two.update({ key: "TWO" });
    assert.equals((0, state_1.valueify)(merged), { key: "TWO" });
});
wtf.test(`Merged objects created from {} and { key: "two" } should update properly when the first object is updated.`, (assert) => {
    let one = (0, state_1.stateify)({});
    let two = (0, state_1.stateify)({ key: "two" });
    let merged = (0, state_1.merge)(one, two);
    one.update({ key: "one" });
    assert.equals((0, state_1.valueify)(merged), { key: "two" });
    one.update({ key: "ONE" });
    assert.equals((0, state_1.valueify)(merged), { key: "two" });
});
wtf.test(`Merged objects created from {} and { key: "two" } should update properly when the second object is updated.`, (assert) => {
    let one = (0, state_1.stateify)({});
    let two = (0, state_1.stateify)({ key: "two" });
    let merged = (0, state_1.merge)(one, two);
    two.update({ key: "TWO" });
    assert.equals((0, state_1.valueify)(merged), { key: "TWO" });
    two.update({});
    assert.equals((0, state_1.valueify)(merged), {});
});
wtf.test(`Merged objects created from { key: "one" } and { key: "two" } should update properly when the first object is updated.`, (assert) => {
    let one = (0, state_1.stateify)({ key: "one" });
    let two = (0, state_1.stateify)({ key: "two" });
    let merged = (0, state_1.merge)(one, two);
    one.update({ key: "ONE" });
    assert.equals((0, state_1.valueify)(merged), { key: "two" });
    one.update({});
    assert.equals((0, state_1.valueify)(merged), { key: "two" });
});
wtf.test(`Merged objects created from { key: "one" } and { key: "two" } should update properly when the second object is updated.`, (assert) => {
    let one = (0, state_1.stateify)({ key: "one" });
    let two = (0, state_1.stateify)({ key: "two" });
    let merged = (0, state_1.merge)(one, two);
    two.update({ key: "TWO" });
    assert.equals((0, state_1.valueify)(merged), { key: "TWO" });
    two.update({});
    assert.equals((0, state_1.valueify)(merged), { key: "one" });
});
wtf.test(`Object state members accessed using dot notation should have the correct type.`, (assert) => {
    let state = (0, state_1.stateify)({});
    let member = state.a;
});
wtf.test(`Object state members accessed using member() should have the correct type.`, (assert) => {
    let state = (0, state_1.stateify)({});
    let member = state.member("a");
});
wtf.test(`Array state elements accessed using brace notation should have the correct type.`, (assert) => {
    let state = (0, state_1.stateify)(["a"]);
    let element = state[0];
});
wtf.test(`Array state elements accessed using element() should have the correct type.`, (assert) => {
    let state = (0, state_1.stateify)(["a"]);
    let element = state.element(0);
});
wtf.test(`Generic types should be handled properly.`, (assert) => {
    function test(array) {
        let element = array[0];
    }
});
wtf.test(`Objects with readonly members should be handled properly.`, (assert) => {
    let value = { a: "" };
    let value_cast_to_mutable = value;
    let value_assigned_to_mutable = value;
    let state = (0, state_1.stateify)(value);
    let state_cast_to_mutable = state;
    let state_assigned_to_mutable = state;
    let member = state.member("a");
});
wtf.test(`Readonly arrays should be handled properly.`, (assert) => {
    let value = [""];
    let value_cast_to_mutable = value;
    // Assignment to mutable array from readonly array requires cast.
    // let value_assigned_to_mutable: ""[] = value;
    let state = (0, state_1.stateify)(value);
    let state_cast_to_mutable = state;
    let state_assigned_to_mutable = state;
    let element = state.element(0);
});
wtf.test(`Arrays containing objects with readonly members should be handled properly.`, (assert) => {
    let value = [{ a: "" }];
    let value_cast_to_mutable = value;
    let value_assigned_to_mutable = value;
    let state = (0, state_1.stateify)(value);
    let state_cast_to_mutable = state;
    let state_assigned_to_mutable = state;
    let element = state.element(0);
});
wtf.test(`Readonly arrays containing objects with readonly members should be handled properly.`, (assert) => {
    let value = [{ a: "" }];
    let value_cast_to_mutable = value;
    // Assignment to mutable array from readonly array requires cast.
    // let value_assigned_to_mutable: { a: "" }[] = value;
    let state = (0, state_1.stateify)(value);
    let state_cast_to_mutable = state;
    let state_assigned_to_mutable = state;
    let element = state.element(0);
});
