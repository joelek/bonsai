import * as wtf from "@joelek/wtf";
import { Attribute, Attributes, merge, make_state, State, stateify, StateOrValue, valueify, Value, computed, fallback, flatten } from "./state";

wtf.test(`Computed should compute a new state from two string states.`, (assert) => {
	let one = stateify("one" as string);
	let two = stateify("two" as string);
	let computed_state = computed([one, two], (one, two) => {
		return `${one} ${two}`;
	});
	assert.equals(computed_state.value(), "one two");
	one.update("ONE");
	assert.equals(computed_state.value(), "ONE two");
	two.update("TWO");
	assert.equals(computed_state.value(), "ONE TWO");
});

wtf.test(`Attributes<A> should support complex values.`, (assert) => {
	type MyValueType = {
		array: {
			string: string;
		}[];
		tuple: [string, number];
		object: {
			string: string;
		};
		union: "a" | "b";
	};
	let attributes: Attributes<MyValueType> = {
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
	let array = stateify(attributes.array);
	array.update([{ string: "b" }]);
	array.observe("update", (state) => {});
	array.observe("insert", (state) => {});
	array.observe("remove", (state) => {});
	assert.equals(array[0].value(), { string: "b" });
	assert.equals(array.value(), [{ string: "b" }]);
	let tuple = stateify(attributes.tuple);
	tuple.update(["b", 1]);
	tuple.observe("update", (state) => {});
	tuple.observe("insert", (state) => {});
	tuple.observe("remove", (state) => {});
	assert.equals(tuple[0].value(), "b");
	assert.equals(tuple.value(), ["b", 1]);
	let object = stateify(attributes.object);
	object.update({ string: "b" });
	object.observe("update", (state) => {});
	assert.equals(object.string.value(), "b");
	assert.equals(object.value(), { string: "b" });
	let union = stateify(attributes.union);
	union.update("a");
	union.update("b");
	union.observe("update", (state) => {});
	assert.equals(union.value(), "b");
});

wtf.test(`It should support assignment from empty string literal to any string.`, (assert) => {
	let string: State<string> = make_state("");
});

wtf.test(`It should output undefined member values in object values.`, (assert) => {
	let state = make_state({ required: undefined });
	assert.equals(state.value(), { required: undefined });
});

wtf.test(`It should support updating optional object members to undefined values.`, (assert) => {
	let state = make_state({ object: { primitive: "a" } } as { object?: { primitive: string } });
	let object_state = state.member("object");
	state.update({ object: undefined });
	assert.equals(state.value(), { object: undefined });
	state.update({ object: { primitive: "b" } });
	assert.equals(state.value(), { object: { primitive: "b" }});
	assert.equals(object_state.value(), { primitive: "b" });
});

wtf.test(`It should support updating optional array members to undefined values.`, (assert) => {
	let state = make_state({ array: ["a"] } as { array?: string[] });
	let array_state = state.member("array");
	state.update({ array: undefined });
	assert.equals(state.value(), { array: undefined });
	state.update({ array: ["b"] });
	assert.equals(state.value(), { array: ["b"] });
	assert.equals(array_state.value(), ["b"]);
});

wtf.test(`It should initialize optional members lazily when updated.`, (assert) => {
	let state = make_state({} as { optional?: boolean });
	state.update({ optional: undefined });
	let optional = state.member("optional");
	assert.equals(state.value(), { optional: undefined });
	assert.equals(optional.value(), undefined);
});

wtf.test(`Lazily initialized optional members should propagate changes back to the object.`, (assert) => {
	let state = make_state({} as { optional?: boolean });
	let optional = state.member("optional");
	optional.update(false);
	assert.equals(state.value(), { optional: false });
	assert.equals(optional.value(), false);
});

wtf.test(`It should filter arrays.`, (assert) => {
	let original = make_state(["a", "B", "c", "D", "e"] as Array<string>);
	let filtered = original.filter((state) => state.compute((value) => value === value.toLowerCase()));
	assert.equals(original.value(), ["a", "B", "c", "D", "e"]);
	assert.equals(filtered.value(), ["a", "c", "e"]);
});

wtf.test(`A filtered array should be updated when the elements in the original array are updated from the start.`, (assert) => {
	let original = make_state(["a", "B", "c", "D", "e"] as Array<string>);
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
	let original = make_state(["a", "B", "c", "D", "e"] as Array<string>);
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
	let original = make_state(["a", "B", "c", "D", "e"] as Array<string>);
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
	let original = make_state(["a", "B", "c", "D", "e"] as Array<string>);
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
	let original = make_state([] as Array<string>);
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
	let original = make_state([] as Array<string>);
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
	let original = make_state(["a", "B", "c", "D", "e"] as Array<string>);
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
	let original = make_state(["a", "B", "c", "D", "e"] as Array<string>);
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
	let state = stateify("test");
	assert.equals(state.value(), "test");
});

wtf.test(`Stateify should not process states.`, (assert) => {
	let state = stateify(make_state("test"));
	assert.equals(state.value(), "test");
});

wtf.test(`Stateify should handle objects with states.`, (assert) => {
	let state = stateify({ one: make_state("a") });
	assert.equals(state.value(), { one: "a" });
});

wtf.test(`Stateify should handle objects with values and states.`, (assert) => {
	let state = stateify({ one: make_state("a"), two: "b" });
	assert.equals(state.value(), { one: "a", two: "b" });
});

wtf.test(`Stateify should handle nested objects with values and states.`, (assert) => {
	let state = stateify({ one: { one: make_state("a"), two: "b" } });
	assert.equals(state.value(), { one: { one: "a", two: "b" } });
});

wtf.test(`Stateify should handle nested objects with state objects.`, (assert) => {
	let state = stateify({ one: make_state({ one: "a", two: "b" }) });
	assert.equals(state.value(), { one: { one: "a", two: "b" } });
});

wtf.test(`Stateify should handle arrays with values.`, (assert) => {
	let state = stateify(["a"]);
	assert.equals(state.value(), ["a"]);
});

wtf.test(`Stateify should handle arrays with states.`, (assert) => {
	let state = stateify([make_state("a")]);
	assert.equals(state.value(), ["a"]);
});

wtf.test(`Stateify should handle arrays with values and states.`, (assert) => {
	let state = stateify([make_state("a"), "b"]);
	assert.equals(state.value(), ["a", "b"]);
});

wtf.test(`Stateify should handle arrays with objects with values.`, (assert) => {
	let state = stateify([{ one: "a" }]);
	assert.equals(state.value(), [{ one: "a" }]);
});

wtf.test(`Stateify should handle arrays with objects with states.`, (assert) => {
	let state = stateify([{ one: make_state("a") }]);
	assert.equals(state.value(), [{ one: "a" }]);
});

wtf.test(`Stateify should handle arrays with objects with values and states.`, (assert) => {
	let state = stateify([{ one: make_state("a"), two: "b" }]);
	assert.equals(state.value(), [{ one: "a", two: "b" }]);
});

wtf.test(`Stateify should handle array states with values.`, (assert) => {
	let state = stateify(make_state(["a", "b"]));
	assert.equals(state.value(), ["a", "b"]);
});

wtf.test(`Valueify should not process values.`, (assert) => {
	let value = valueify("test");
	assert.equals(value, "test");
});

wtf.test(`Valueify should convert states into values.`, (assert) => {
	let value = valueify(make_state("test"));
	assert.equals(value, "test");
});

wtf.test(`Valueify should handle objects with states.`, (assert) => {
	let value = valueify({ one: make_state("a") });
	assert.equals(value, { one: "a" });
});

wtf.test(`Valueify should handle objects with values and states.`, (assert) => {
	let value = valueify({ one: make_state("a"), two: "b" });
	assert.equals(value, { one: "a", two: "b" });
});

wtf.test(`Valueify should handle nested objects with values and states.`, (assert) => {
	let value = valueify({ one: { one: make_state("a"), two: "b" } });
	assert.equals(value, { one: { one: "a", two: "b" } });
});

wtf.test(`Valueify should handle objects with state objects.`, (assert) => {
	let value = valueify({ one: make_state({ one: "a", two: "b" }) });
	assert.equals(value, { one: { one: "a", two: "b" } });
});

wtf.test(`Valueify should handle arrays with values.`, (assert) => {
	let value = valueify(["a"]);
	assert.equals(value, ["a"]);
});

wtf.test(`Valueify should handle arrays with states.`, (assert) => {
	let value = valueify([make_state("a")]);
	assert.equals(value, ["a"]);
});

wtf.test(`Valueify should handle arrays with values and states.`, (assert) => {
	let value = valueify([make_state("a"), "b"]);
	assert.equals(value, ["a", "b"]);
});

wtf.test(`Valueify should handle arrays with objects with values.`, (assert) => {
	let value = valueify([{ one: "a" }]);
	assert.equals(value, [{ one: "a" }]);
});

wtf.test(`Valueify should handle arrays with objects with states.`, (assert) => {
	let value = valueify([{ one: make_state("a") }]);
	assert.equals(value, [{ one: "a" }]);
});

wtf.test(`Valueify should handle arrays with objects with values and states.`, (assert) => {
	let value = valueify([{ one: make_state("a"), two: "b" }]);
	assert.equals(value, [{ one: "a", two: "b" }]);
});

wtf.test(`Valueify should handle array states with values.`, (assert) => {
	let state = valueify(make_state(["a", "b"]));
	assert.equals(state, ["a", "b"]);
});

wtf.test(`State arrays should be created with index signatures.`, (assert) => {
	let state = make_state(["a", "b", "c"]);
	assert.equals(state[0] === state.element(0), true);
	assert.equals(state[1] === state.element(1), true);
	assert.equals(state[2] === state.element(2), true);
});

wtf.test(`State objects should be created with index signatures.`, (assert) => {
	let state = make_state({ string: "a" as string, number: 0 as number, boolean: false as boolean });
	assert.equals(state.string === state.member("string"), true);
	assert.equals(state.number === state.member("number"), true);
	assert.equals(state.boolean === state.member("boolean"), true);
});

wtf.test(`ArrayState should support observers being added in mapped arrays.`, async (assert) => {
	let states = make_state<Array<string>>([]);
	let events = new Array<string>();
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
		} as { required: string, optional?: string },
		optional: {
			required: "optreq",
			optional: "optopt"
		} as { required: string, optional?: string } | undefined
	};
	let state = make_state(value);
	let value_attributes: Attributes<typeof value> = value;
	let state_attributes: Attributes<typeof value> = state;
	let attributes = value_attributes = state_attributes;
	let required = attributes.required;
	let required_required = required.required;
	assert.equals(valueify(required_required), "reqreq");
	let required_optional = required.optional;
	assert.equals(valueify(required_optional), "reqopt");
	let optional = fallback(stateify(attributes).member("optional"), { required: "optreq2" });
	let optional_required = optional.required;
	assert.equals(valueify(optional_required), "optreq");
	let optional_optional = optional.optional;
	assert.equals(valueify(optional_optional), "optopt");
});

wtf.test(`Attributes should be composable from nested values and states.`, (assert) => {
	type Type = {
		one: {
			one: string;
			two: string;
		};
		two: {
			one: string;
			two: string;
		};
		three: Array<{
			one: string;
			two: string;
		}>;
		four: Array<{
			one: string;
			two: string;
		}>;
	};
	let attributes: Attributes<Type> = {
		one: {
			one: make_state("a"),
			two: "b"
		},
		two: make_state({
			one: "c",
			two: "d"
		}),
		three: [
			{
				one:  make_state("e"),
				two: "f"
			}
		],
		four: make_state([
			{
				one: "g",
				two: "h"
			}
		])
	};
	let one_one = attributes.one.one;
	assert.equals(valueify(one_one), "a");
	let one_two = attributes.one.two;
	assert.equals(valueify(one_two), "b");
	let two_one = attributes.two.one;
	assert.equals(valueify(two_one), "c");
	let two_two = attributes.two.two;
	assert.equals(valueify(two_two), "d");
	assert.equals(valueify(attributes.three), [{ one: "e", two: "f" }]);
	assert.equals(valueify(attributes.four), [{ one: "g", two: "h" }]);
});

wtf.test(`Array states should have rest functionality.`, (assert) => {
	let state = make_state(["a", "b"]);
	let spread = [ ...state ];
	assert.equals(spread[0] === state[0], true);
	assert.equals(spread[1] === state[1], true);
});

wtf.test(`Array states should have spread functionality.`, (assert) => {
	let state = make_state(["a", "b"]);
	let spread = { ...state };
	assert.equals(Object.getOwnPropertyNames(spread), ["0", "1"]);
	assert.equals(spread[0] === state[0], true);
	assert.equals(spread[1] === state[1], true);
});

wtf.test(`Object states should have spread functionality.`, (assert) => {
	let state = make_state({ one: "a", two: "b" });
	let spread = { ...state };
	assert.equals(Object.getOwnPropertyNames(spread), ["one", "two"]);
	assert.equals(spread.one === state.one, true);
	assert.equals(spread.two === state.two, true);
});

wtf.test(`Primitive states should have spread functionality.`, (assert) => {
	let state = make_state(undefined);
	let spread = { ...state };
	assert.equals(Object.getOwnPropertyNames(spread), []);
	assert.equals(spread, {});
});

wtf.test(`Reference states should have spread functionality.`, (assert) => {
	let state = make_state(new class {});
	let spread = { ...state };
	assert.equals(Object.getOwnPropertyNames(spread), []);
	assert.equals(spread, {});
});

wtf.test(`Dynamic array elements should update properly when accessing deferred object members.`, (assert) => {
	type Object = { deferred?: string, array: Array<Object> };
	let objects = stateify<Array<Object>>([
		{
			array: [
				{
					array: []
				}
			]
		}
	]);
	objects.element(stateify(0)).deferred;
	objects.element(stateify(0)).array[0].deferred;
});

wtf.test(`Dynamic ArrayState elements should support being updated.`, (assert) => {
	let array = make_state(["one", "two"]);
	let index = stateify<number>(0);
	let element = array.element(index);
	element.update("ONE");
	assert.equals(element.value(), "ONE");
	assert.equals(array.value(), ["ONE", "two"]);
});

wtf.test(`Dynamic ArrayState elements should throw an error when the index is invalid.`, async (assert) => {
	let array = make_state(["one", "two"]);
	let index = stateify<number>(2);
	await assert.throws(async () => {
		let element = array.element(index);
	});
});

wtf.test(`Dynamic ArrayState elements should support being updated after the index is changed.`, (assert) => {
	let array = make_state(["one", "two"]);
	let index = stateify<number>(0);
	let element = array.element(index);
	index.update(1);
	element.update("TWO");
	assert.equals(element.value(), "TWO");
	assert.equals(array.value(), ["one", "TWO"]);
});

wtf.test(`Dynamic ArrayState elements should throw an error when the index becomes invalid.`, async (assert) => {
	let array = make_state(["one", "two"]);
	let index = stateify<number>(0);
	let element = array.element(index);
	await assert.throws(async () => {
		index.update(2);
	});
});

wtf.test(`Dynamic ArrayState elements should support being updated after array is vacated.`, (assert) => {
	let array = make_state(["one", "two"]);
	let index = stateify<number>(0);
	let element = array.element(index);
	array.vacate();
	element.update("ONE");
	assert.equals(element.value(), "ONE");
	assert.equals(array.value(), []);
});

wtf.test(`Lazily initialized ObjectStates should supporting being cleared.`, (assert) => {
	let object = make_state({} as { a?: { key: string }, b?: { key: string } });
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
	let attribute: StateOrValue<[string, string] | undefined> = stateify<[string, string] | undefined>(["one", "two"]);
});

wtf.test(`State<[string, string]> should be assignable to StateOrValue<[string, string] | undefined>.`, (assert) => {
	let attribute: StateOrValue<[string, string] | undefined> = stateify<[string, string]>(["one", "two"]);
});

wtf.test(`State<undefined> should be assignable to StateOrValue<[string, string] | undefined>.`, (assert) => {
	let attribute: StateOrValue<[string, string] | undefined> = stateify<undefined>(undefined);
});

wtf.test(`State<[string, string] | undefined> should be assignable to Attribute<[string, string] | undefined>.`, (assert) => {
	let attribute: Attribute<[string, string] | undefined> = stateify<[string, string] | undefined>(["one", "two"]);
});

wtf.test(`State<[string, string]> should be assignable to Attribute<[string, string] | undefined>.`, (assert) => {
	let attribute: Attribute<[string, string] | undefined> = stateify<[string, string]>(["one", "two"]);
});

wtf.test(`State<undefined> should be assignable to Attribute<[string, string] | undefined>.`, (assert) => {
	let attribute: Attribute<[string, string] | undefined> = stateify<undefined>(undefined);
});

wtf.test(`Fallback states should be constructible from other fallback states.`, (asserts) => {
	let state = make_state({} as { object?: { string?: string } });
	let object = fallback(state.member("object"), {});
	let string = fallback(object.member("string"), "string");
	asserts.equals(state.value(), { object: { string: undefined } });
	asserts.equals(object.value(), { string: undefined });
	asserts.equals(string.value(), "string");
});

wtf.test(`Fallback states should use the underlying value when the underlying value is defined.`, (assert) => {
	let underlying = make_state("underlying" as string | undefined);
	let fallbacked = fallback(underlying, "default");
	assert.equals(underlying.value(), "underlying");
	assert.equals(fallbacked.value(), "underlying");
});

wtf.test(`Fallback states should use the default value when the underlying value is undefined.`, (assert) => {
	let underlying = make_state(undefined as string | undefined);
	let fallbacked = fallback(underlying, "default");
	assert.equals(underlying.value(), undefined);
	assert.equals(fallbacked.value(), "default");
});

wtf.test(`Fallback states should propagate updated values back to the underlying state.`, (assert) => {
	let underlying = make_state(undefined as string | undefined);
	let fallbacked = fallback(underlying, "default");
	assert.equals(underlying.value(), undefined);
	assert.equals(fallbacked.value(), "default");
	fallbacked.update("updated");
	assert.equals(underlying.value(), "updated");
	assert.equals(fallbacked.value(), "updated");
});

wtf.test(`Fallback states should not propagate the default value back to the underlying state when the fallback state is updated.`, (assert) => {
	let underlying = make_state("underlying" as string | undefined);
	let fallbacked = fallback(underlying, "default");
	assert.equals(underlying.value(), "underlying");
	assert.equals(fallbacked.value(), "underlying");
	fallbacked.update("default");
	assert.equals(underlying.value(), undefined);
	assert.equals(fallbacked.value(), "default");
});

wtf.test(`Fallback states should not propagate the default value back to the underlying state when the underlying state is updated.`, (assert) => {
	let underlying = make_state("underlying" as string | undefined);
	let fallbacked = fallback(underlying, "default");
	assert.equals(underlying.value(), "underlying");
	assert.equals(fallbacked.value(), "underlying");
	underlying.update(undefined);
	assert.equals(underlying.value(), undefined);
	assert.equals(fallbacked.value(), "default");
});

wtf.test(`Merge should merge value { a: "one" } with value { a: "two" }.`, (assert) => {
	let one = valueify({ a: "one" });
	let two = valueify({ a: "two" });
	let merged = merge(one, two);
	assert.equals(valueify(merged), { a: "two" });
});

wtf.test(`Merge should merge value { a: "one" } with state { a: "two" }.`, (assert) => {
	let one = valueify({ a: "one" });
	let two = stateify({ a: "two" });
	let merged = merge(one, two);
	assert.equals(valueify(merged), { a: "two" });
});

wtf.test(`Merge should merge state { a: "one" } with value { a: "two" }.`, (assert) => {
	let one = stateify({ a: "one" });
	let two = valueify({ a: "two" });
	let merged = merge(one, two);
	assert.equals(valueify(merged), { a: "two" });
});

wtf.test(`Merge should merge state { a: "one" } with state { a: "two" }.`, (assert) => {
	let one = stateify({ a: "one" });
	let two = stateify({ a: "two" });
	let merged = merge(one, two);
	assert.equals(valueify(merged), { a: "two" });
});

wtf.test(`Merge should merge value {} with value { a: "two" }.`, (assert) => {
	let one = valueify({});
	let two = valueify({ a: "two" });
	let merged = merge(one, two);
	assert.equals(valueify(merged), { a: "two" });
});

wtf.test(`Merge should merge value {} with state { a: "two" }.`, (assert) => {
	let one = valueify({});
	let two = stateify({ a: "two" });
	let merged = merge(one, two);
	assert.equals(valueify(merged), { a: "two" });
});

wtf.test(`Merge should merge state {} with value { a: "two" }.`, (assert) => {
	let one = stateify({});
	let two = valueify({ a: "two" });
	let merged = merge(one, two);
	assert.equals(valueify(merged), { a: "two" });
});

wtf.test(`Merge should merge state {} with state { a: "two" }.`, (assert) => {
	let one = stateify({});
	let two = stateify({ a: "two" });
	let merged = merge(one, two);
	assert.equals(valueify(merged), { a: "two" });
});

wtf.test(`Merge should merge value { a: "one" } with value {}.`, (assert) => {
	let one = valueify({ a: "one" });
	let two = valueify({});
	let merged = merge(one, two);
	assert.equals(valueify(merged), { a: "one" });
});

wtf.test(`Merge should merge value { a: "one" } with state {}.`, (assert) => {
	let one = valueify({ a: "one" });
	let two = stateify({});
	let merged = merge(one, two);
	assert.equals(valueify(merged), { a: "one" });
});

wtf.test(`Merge should merge state { a: "one" } with value {}.`, (assert) => {
	let one = stateify({ a: "one" });
	let two = valueify({});
	let merged = merge(one, two);
	assert.equals(valueify(merged), { a: "one" });
});

wtf.test(`Merge should merge state { a: "one" } with state {}.`, (assert) => {
	let one = stateify({ a: "one" });
	let two = stateify({});
	let merged = merge(one, two);
	assert.equals(valueify(merged), { a: "one" });
});

wtf.test(`Merge should merge value { a: null } with value { a: "two" }.`, (assert) => {
	let one = valueify({ a: null });
	let two = valueify({ a: "two" });
	let merged = merge(one, two);
	assert.equals(valueify(merged), { a: "two" });
});

wtf.test(`Merge should merge value { a: null } with state { a: "two" }.`, (assert) => {
	let one = valueify({ a: null });
	let two = stateify({ a: "two" });
	let merged = merge(one, two);
	assert.equals(valueify(merged), { a: "two" });
});

wtf.test(`Merge should merge state { a: null } with value { a: "two" }.`, (assert) => {
	let one = stateify({ a: null });
	let two = valueify({ a: "two" });
	let merged = merge(one, two);
	assert.equals(valueify(merged), { a: "two" });
});

wtf.test(`Merge should merge state { a: null } with state { a: "two" }.`, (assert) => {
	let one = stateify({ a: null });
	let two = stateify({ a: "two" });
	let merged = merge(one, two);
	assert.equals(valueify(merged), { a: "two" });
});

wtf.test(`Merge should merge value { a: "one" } with value { "a": null }.`, (assert) => {
	let one = valueify({ a: "one" });
	let two = valueify({ a: null });
	let merged = merge(one, two);
	assert.equals(valueify(merged), { a: null });
});

wtf.test(`Merge should merge value { a: "one" } with state { "a": null }.`, (assert) => {
	let one = valueify({ a: "one" });
	let two = stateify({ a: null });
	let merged = merge(one, two);
	assert.equals(valueify(merged), { a: null });
});

wtf.test(`Merge should merge state { a: "one" } with value { "a": null }.`, (assert) => {
	let one = stateify({ a: "one" });
	let two = valueify({ a: null });
	let merged = merge(one, two);
	assert.equals(valueify(merged), { a: null });
});

wtf.test(`Merge should merge state { a: "one" } with state { "a": null }.`, (assert) => {
	let one = stateify({ a: "one" });
	let two = stateify({ a: null });
	let merged = merge(one, two);
	assert.equals(valueify(merged), { a: null });
});

wtf.test(`Merge should return the correct type for { a: string } and { a: string }.`, (assert) => {
	let one = valueify({ a: "one" });
	let two = valueify({ a: "two" });
	let merged: Attributes<{ a: string }> = merge(one, two);
});

wtf.test(`Merge should return the correct type for { a?: string } and { a: string }.`, (assert) => {
	let one = valueify({} as { a?: string });
	let two = valueify({ a: "two" });
	let merged: Attributes<{ a: string }> = merge(one, two);
});

wtf.test(`Merge should return the correct type for { a: string } and { a?: string }.`, (assert) => {
	let one = valueify({ a: "two" });
	let two = valueify({} as { a?: string });
	let merged: Attributes<{ a: string }> = merge(one, two);
});

wtf.test(`Merge should return the correct type for { a?: string } and { a?: string }.`, (assert) => {
	let one = valueify({} as { a?: string });
	let two = valueify({} as { a?: string });
	let merged: Attributes<{ a: string | undefined }> = merge(one, two);
});

wtf.test(`Merge should return the correct type for { a: string } and { a: number }.`, (assert) => {
	let one = valueify({ a: "one" });
	let two = valueify({ a: 1 });
	let merged: Attributes<{ a: number }> = merge(one, two);
});

wtf.test(`Merge should return the correct type for { a?: string } and { a: number }.`, (assert) => {
	let one = valueify({} as { a?: string });
	let two = valueify({ a: 1 });
	let merged: Attributes<{ a: number }> = merge(one, two);
});

wtf.test(`Merge should return the correct type for { a: string } and { a?: number }.`, (assert) => {
	let one = valueify({ a: "two" });
	let two = valueify({} as { a?: number });
	let merged: Attributes<{ a: string | number }> = merge(one, two);
});

wtf.test(`Merge should return the correct type for { a?: string } and { a?: number }.`, (assert) => {
	let one = valueify({} as { a?: string });
	let two = valueify({} as { a?: number });
	let merged: Attributes<{ a: string | number | undefined }> = merge(one, two);
});

wtf.test(`Merge should return the correct type for { a: number } and { a: string }.`, (assert) => {
	let one = valueify({ a: 1 });
	let two = valueify({ a: "two" });
	let merged: Attributes<{ a: string }> = merge(one, two);
});

wtf.test(`Merge should return the correct type for { a?: number } and { a: string }.`, (assert) => {
	let one = valueify({} as { a?: number });
	let two = valueify({ a: "two" });
	let merged: Attributes<{ a: string }> = merge(one, two);
});

wtf.test(`Merge should return the correct type for { a: number } and { a?: string }.`, (assert) => {
	let one = valueify({ a: 1 });
	let two = valueify({} as { a?: string });
	let merged: Attributes<{ a: string | number }> = merge(one, two);
});

wtf.test(`Merge should return the correct type for { a?: number } and { a?: string }.`, (assert) => {
	let one = valueify({} as { a?: number });
	let two = valueify({} as { a?: string });
	let merged: Attributes<{ a: string | number | undefined }> = merge(one, two);
});

wtf.test(`Merge should return the correct type for { a: number } and { a: null }.`, (assert) => {
	let one = valueify({ a: 1 });
	let two = valueify({ a: null });
	let merged: Attributes<{ a: null }> = merge(one, two);
});

wtf.test(`Merge should return the correct type for { a: number } and { a: string | null }.`, (assert) => {
	let one = valueify({ a: 1 });
	let two = valueify({ a: null as string | null });
	let merged: Attributes<{ a: string | null }> = merge(one, two);
});

wtf.test(`Merged objects created from {} and {} should update properly when the first object is updated.`, (assert) => {
	let one = stateify({} as { key?: string });
	let two = stateify({} as { key?: string });
	let merged = merge(one, two);
	one.update({ key: "one" });
	assert.equals(valueify(merged), { key: "one" });
	one.update({ key: "ONE" });
	assert.equals(valueify(merged), { key: "ONE" });
});

wtf.test(`Merged objects created from {} and {} should update properly when the second object is updated.`, (assert) => {
	let one = stateify({} as { key?: string });
	let two = stateify({} as { key?: string });
	let merged = merge(one, two);
	two.update({ key: "two" });
	assert.equals(valueify(merged), { key: "two" });
	two.update({ key: "TWO" });
	assert.equals(valueify(merged), { key: "TWO" });
});

wtf.test(`Merged objects created from { key: "one" } and {} should update properly when the first object is updated.`, (assert) => {
	let one = stateify({ key: "one" } as { key?: string });
	let two = stateify({} as { key?: string });
	let merged = merge(one, two);
	one.update({ key: "ONE" });
	assert.equals(valueify(merged), { key: "ONE" });
	one.update({});
	assert.equals(valueify(merged), { key: undefined });
});

wtf.test(`Merged objects created from { key: "one" } and {} should update properly when the second object is updated.`, (assert) => {
	let one = stateify({ key: "one" } as { key?: string });
	let two = stateify({} as { key?: string });
	let merged = merge(one, two);
	two.update({ key: "two" });
	assert.equals(valueify(merged), { key: "two" });
	two.update({ key: "TWO" });
	assert.equals(valueify(merged), { key: "TWO" });
});

wtf.test(`Merged objects created from {} and { key: "two" } should update properly when the first object is updated.`, (assert) => {
	let one = stateify({} as { key?: string });
	let two = stateify({ key: "two" } as { key?: string });
	let merged = merge(one, two);
	one.update({ key: "one" });
	assert.equals(valueify(merged), { key: "two" });
	one.update({ key: "ONE" });
	assert.equals(valueify(merged), { key: "two" });
});

wtf.test(`Merged objects created from {} and { key: "two" } should update properly when the second object is updated.`, (assert) => {
	let one = stateify({} as { key?: string });
	let two = stateify({ key: "two" } as { key?: string });
	let merged = merge(one, two);
	two.update({ key: "TWO" });
	assert.equals(valueify(merged), { key: "TWO" });
	two.update({});
	assert.equals(valueify(merged), { key: undefined });
});

wtf.test(`Merged objects created from { key: "one" } and { key: "two" } should update properly when the first object is updated.`, (assert) => {
	let one = stateify({ key: "one" } as { key?: string });
	let two = stateify({ key: "two" } as { key?: string });
	let merged = merge(one, two);
	one.update({ key: "ONE" });
	assert.equals(valueify(merged), { key: "two" });
	one.update({});
	assert.equals(valueify(merged), { key: "two" });
});

wtf.test(`Merged objects created from { key: "one" } and { key: "two" } should update properly when the second object is updated.`, (assert) => {
	let one = stateify({ key: "one" } as { key?: string });
	let two = stateify({ key: "two" } as { key?: string });
	let merged = merge(one, two);
	two.update({ key: "TWO" });
	assert.equals(valueify(merged), { key: "TWO" });
	two.update({});
	assert.equals(valueify(merged), { key: "one" });
});

wtf.test(`Object state members accessed using dot notation should have the correct type.`, (assert) => {
	let state = stateify({} as { a?: string });
	let member: State<string | undefined> = state.a;
});

wtf.test(`Object state members accessed using member() should have the correct type.`, (assert) => {
	let state = stateify({} as { a?: string });
	let member: State<string | undefined> = state.member("a");
});

wtf.test(`Array state elements accessed using brace notation should have the correct type.`, (assert) => {
	let state = stateify(["a" as string | undefined]);
	let element: State<string | undefined> = state[0];
});

wtf.test(`Array state elements accessed using element() should have the correct type.`, (assert) => {
	let state = stateify(["a" as string | undefined]);
	let element: State<string | undefined> = state.element(0);
});

wtf.test(`Generic types should be handled properly.`, (assert) => {
	function test<A extends Value>(array: State<Array<A>>): void {
		let element: State<A> = array[0];
	}
});

wtf.test(`Objects with readonly members should be assigned and cast properly.`, (assert) => {
	let value = { a: "" } as { readonly a: "" };
	let value_cast_to_mutable = value as { a: "" };
	let value_assigned_to_mutable: { a: "" } = value;
	let state = stateify(value);
	let state_cast_to_mutable = state as State<{ a: "" }>;
	let state_assigned_to_mutable: State<{ a: "" }> = state;
	let member = state.member("a");
});

wtf.test(`Readonly arrays should be assigned and cast properly.`, (assert) => {
	let value = [""] as readonly ""[];
	let value_cast_to_mutable = value as ""[];
	// Assignment to mutable array type from readonly array type requires cast.
	// @ts-expect-error
	let value_assigned_to_mutable: ""[] = value;
	let state = stateify(value);
	let state_cast_to_mutable = state as State<""[]>;
	// This should ideally throw an error while still being castable.
	let state_assigned_to_mutable: State<""[]> = state;
	let element = state.element(0);
});

wtf.test(`Arrays containing objects with readonly members should be assigned and cast properly.`, (assert) => {
	let value = [{ a: "" }] as { readonly a: "" }[];
	let value_cast_to_mutable = value as { a: "" }[];
	let value_assigned_to_mutable: { a: "" }[] = value;
	let state = stateify(value);
	let state_cast_to_mutable = state as State<{ a: "" }[]>;
	let state_assigned_to_mutable: State<{ a: "" }[]> = state;
	let element = state.element(0);
});

wtf.test(`Readonly arrays containing objects with readonly members should be assigned and cast properly.`, (assert) => {
	let value = [{ a: "" }] as readonly { readonly a: "" }[];
	let value_cast_to_mutable = value as { a: "" }[];
	// Assignment to mutable array type from readonly array type requires cast.
	// @ts-expect-error
	let value_assigned_to_mutable: { a: "" }[] = value;
	let state = stateify(value);
	let state_cast_to_mutable = state as State<{ a: "" }[]>;
	// This should ideally throw an error while still being castable.
	let state_assigned_to_mutable: State<{ a: "" }[]> = state;
	let element = state.element(0);
});

wtf.test(`Object states with optional members should be assigned and cast properly.`, (assert) => {
	let value = { a: "" } as { a: "" };
	let value_cast_to_similar = value as { a: "", b: "" | undefined };
	// Assignment to object type with required member from object type with optional member requires cast.
	// @ts-expect-error
	let value_assigned_to_similar: { a: "", b: "" | undefined } = value;
	let state = make_state(value);
	let state_cast_to_similar = state as State<{ a: "", b?: "" }>;
	// @ts-expect-error
	let state_assigned_to_similar: State<{ a: "", b?: "" }> = state;
});

wtf.test(`Flatten should flatten three levels of arrays.`, (asserts) => {
	let array_00 = stateify(["a", "b"]);
	let array_01 = stateify(["c", "d"]);
	let array_10 = stateify(["e", "f"]);
	let array_11 = stateify(["g", "h"]);
	let array_0 = stateify([array_00, array_01]);
	let array_1 = stateify([array_10, array_11]);
	let array = stateify([array_0, array_1 ]);
	let flattened = flatten(array);
	asserts.equals(flattened.value(), ["a", "b", "c", "d", "e", "f", "g", "h"]);
});

wtf.test(`Flattened arrays should contain states from the original arrays.`, (asserts) => {
	let array_00 = stateify(["a", "b"]);
	let array_01 = stateify(["c", "d"]);
	let array_10 = stateify(["e", "f"]);
	let array_11 = stateify(["g", "h"]);
	let array_0 = stateify([array_00, array_01]);
	let array_1 = stateify([array_10, array_11]);
	let array = stateify([array_0, array_1]);
	let flattened = flatten(array);
	array_00[0].update("A");
	array_00[1].update("B");
	array_01[0].update("C");
	array_01[1].update("D");
	array_10[0].update("E");
	array_10[1].update("F");
	array_11[0].update("G");
	array_11[1].update("H");
	asserts.equals(flattened.value(), ["A", "B", "C", "D", "E", "F", "G", "H"]);
});

wtf.test(`Flattened arrays should contain items inserted into the original arrays.`, (asserts) => {
	let array_00 = stateify(["b"]);
	let array_01 = stateify(["e"]);
	let array_10 = stateify(["h"]);
	let array_11 = stateify(["k"]);
	let array_0 = stateify([array_00,array_01]);
	let array_1 = stateify([array_10, array_11]);
	let array = stateify([array_0, array_1]);
	let flattened = flatten(array);
	array_00.insert(0, "a");
	array_00.insert(2, "c");
	array_01.insert(0, "d");
	array_01.insert(2, "f");
	array_10.insert(0, "g");
	array_10.insert(2, "i");
	array_11.insert(0, "j");
	array_11.insert(2, "l");
	asserts.equals(flattened.value(), ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l"]);
});

wtf.test(`Flattened arrays should not contain items removed from the original arrays.`, (asserts) => {
	let array_00 = stateify(["a", "b", "c"]);
	let array_01 = stateify(["d", "e", "f"]);
	let array_10 = stateify(["g", "h", "i"]);
	let array_11 = stateify(["j", "k", "l"]);
	let array_0 = stateify([array_00, array_01]);
	let array_1 = stateify([array_10, array_11]);
	let array = stateify([array_0, array_1]);
	let flattened = flatten(array);
	array_00.remove(1);
	array_01.remove(1);
	array_10.remove(1);
	array_11.remove(1);
	asserts.equals(flattened.value(), ["a", "c", "d", "f", "g", "i", "j", "l"]);
});

wtf.test(`Flattened arrays should contain arrays inserted into the original arrays.`, (asserts) => {
	let array_00 = stateify(["a"]);
	let array_01 = stateify(["b"]);
	let array_02 = stateify(["c"]);
	let array_10 = stateify(["d"]);
	let array_11 = stateify(["e"]);
	let array_12 = stateify(["f"]);
	let array_20 = stateify(["g"]);
	let array_21 = stateify(["h"]);
	let array_22 = stateify(["i"]);
	let array_0 = stateify([array_00, array_02]);
	let array_1 = stateify([array_10, array_12]);
	let array_2 = stateify([array_20, array_22]);
	let array = stateify([array_0, array_2]);
	let flattened = flatten(array);
	array_0.insert(1, array_01);
	array_1.insert(1, array_11);
	array_2.insert(1, array_21)
	array.insert(1, array_1);
	asserts.equals(flattened.value(), ["a", "b", "c", "d", "e", "f", "g", "h", "i"]);
});

wtf.test(`Flattened arrays should not contain arrays removed from the original arrays.`, (asserts) => {
	let array_00 = stateify(["a"]);
	let array_01 = stateify(["b"]);
	let array_02 = stateify(["c"]);
	let array_10 = stateify(["d"]);
	let array_11 = stateify(["e"]);
	let array_12 = stateify(["f"]);
	let array_20 = stateify(["g"]);
	let array_21 = stateify(["h"]);
	let array_22 = stateify(["i"]);
	let array_0 = stateify([array_00, array_01, array_02]);
	let array_1 = stateify([array_10, array_11, array_12]);
	let array_2 = stateify([array_20, array_21, array_22]);
	let array = stateify([array_0, array_1, array_2]);
	let flattened = flatten(array);
	array_0.remove(1);
	array_1.remove(1);
	array_2.remove(1)
	array.remove(1);
	asserts.equals(flattened.value(), ["a", "c", "g", "i"]);
});

wtf.test(`Dynamic members should be updated when the dynamic key is updated.`, (asserts) => {
	let state = make_state({ one: "one", two: "two" });
	let key = make_state("one" as "one" | "two");
	let member = state.member(key);
	asserts.equals(member.value(), "one");
	key.update("two");
	asserts.equals(member.value(), "two");
	key.update("one");
	asserts.equals(member.value(), "one");
});

wtf.test(`Dynamic members should be updated when the active member is updated.`, (asserts) => {
	let state = make_state({ one: "one", two: "two" });
	let key = make_state("one" as "one" | "two");
	let one = state.one;
	let two = state.two;
	let member = state.member(key);
	key.update("two");
	key.update("one");
	one.update("ONE");
	asserts.equals(member.value(), "ONE");
	two.update("TWO");
	asserts.equals(member.value(), "ONE");
});

wtf.test(`Dynamic members being updated should propagate the changes back to the active member.`, (asserts) => {
	let state = make_state({ one: "one", two: "two" });
	let key = make_state("one" as "one" | "two");
	let one = state.one;
	let two = state.two;
	let member = state.member(key);
	key.update("two");
	key.update("one");
	member.update("ONE");
	asserts.equals(one.value(), "ONE");
	asserts.equals(two.value(), "two");
});
