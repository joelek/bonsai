import * as wtf from "@joelek/wtf";
import { Attribute, Attributes, make_state, State, stateify, StateOrValue, valueify } from "./state";

wtf.test(`It should support assignment from empty string literal to any string.`, (assert) => {
	let string: State<string> = make_state("");
});

wtf.test(`It should not output undefined member values in object values.`, (assert) => {
	let state = make_state({ required: undefined });
	assert.equals(state.value(), {});
});

wtf.test(`It should support updating optional object members to undefined values.`, (assert) => {
	let state = make_state({ object: { primitive: "a" } } as { object?: { primitive: string } });
	let object_state = state.member("object");
	state.update({ object: undefined });
	assert.equals(state.value(), {});
	state.update({ object: { primitive: "b" } });
	assert.equals(state.value(), { object: { primitive: "b" }});
	assert.equals(object_state.value(), { primitive: "b" });
});

wtf.test(`It should support updating optional array members to undefined values.`, (assert) => {
	let state = make_state({ array: ["a"] } as { array?: string[] });
	let array_state = state.member("array");
	state.update({ array: undefined });
	assert.equals(state.value(), {});
	state.update({ array: ["b"] });
	assert.equals(state.value(), { array: ["b"] });
	assert.equals(array_state.value(), ["b"]);
});

wtf.test(`It should initialize optional members lazily when updated.`, (assert) => {
	let state = make_state({} as { optional?: boolean });
	state.update({ optional: undefined });
	let optional = state.member("optional");
	assert.equals(state.value(), {});
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
	let optional = stateify(attributes).member("optional").fallback({ required: "optreq2" });
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
	};
	let attributes: Attributes<Type> = {
		one: {
			one: make_state("a"),
			two: "b"
		},
		two: make_state({
			one: "c",
			two: "d"
		})
	};
	let one_one = attributes.one.one;
	assert.equals(valueify(one_one), "a");
	let one_two = attributes.one.two;
	assert.equals(valueify(one_two), "b");
	let two_one = attributes.two.one;
	assert.equals(valueify(two_one), "c");
	let two_two = attributes.two.two;
	assert.equals(valueify(two_two), "d");
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
	states.mapStates((state, index) => state.key);
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

/*
wtf.test(`State<[string, string] | undefined> should be assignable to Attribute<[string, string] | undefined>.`, (assert) => {
	let attribute: Attribute<[string, string] | undefined> = stateify<[string, string] | undefined>(["one", "two"]);
});
 */

wtf.test(`State<[string, string]> should be assignable to Attribute<[string, string] | undefined>.`, (assert) => {
	let attribute: Attribute<[string, string] | undefined> = stateify<[string, string]>(["one", "two"]);
});

wtf.test(`State<undefined> should be assignable to Attribute<[string, string] | undefined>.`, (assert) => {
	let attribute: Attribute<[string, string] | undefined> = stateify<undefined>(undefined);
});

wtf.test(`Fallback states should use the underlying value when the underlying value is defined.`, (assert) => {
	let underlying = make_state("underlying" as string | undefined);
	let fallback = underlying.fallback("default");
	assert.equals(underlying.value(), "underlying");
	assert.equals(fallback.value(), "underlying");
});

wtf.test(`Fallback states should use the default value when the underlying value is undefined.`, (assert) => {
	let underlying = make_state(undefined as string | undefined);
	let fallback = underlying.fallback("default");
	assert.equals(underlying.value(), undefined);
	assert.equals(fallback.value(), "default");
});

wtf.test(`Fallback states should propagate updated values back to the underlying state.`, (assert) => {
	let underlying = make_state(undefined as string | undefined);
	let fallback = underlying.fallback("default");
	assert.equals(underlying.value(), undefined);
	assert.equals(fallback.value(), "default");
	fallback.update("updated");
	assert.equals(underlying.value(), "updated");
	assert.equals(fallback.value(), "updated");
});

wtf.test(`Fallback states should not propagate the default value back to the underlying state when the fallback state is updated.`, (assert) => {
	let underlying = make_state("underlying" as string | undefined);
	let fallback = underlying.fallback("default");
	assert.equals(underlying.value(), "underlying");
	assert.equals(fallback.value(), "underlying");
	fallback.update("default");
	assert.equals(underlying.value(), undefined);
	assert.equals(fallback.value(), "default");
});

wtf.test(`Fallback states should not propagate the default value back to the underlying state when the underlying state is updated.`, (assert) => {
	let underlying = make_state("underlying" as string | undefined);
	let fallback = underlying.fallback("default");
	assert.equals(underlying.value(), "underlying");
	assert.equals(fallback.value(), "underlying");
	underlying.update(undefined);
	assert.equals(underlying.value(), undefined);
	assert.equals(fallback.value(), "default");
});
