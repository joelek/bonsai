import * as wtf from "@joelek/wtf";
import { stateify } from "./state";

wtf.test(`It should not output undefined member values in object values.`, (assert) => {
	let state = stateify({ required: undefined });
	assert.equals(state.value(), {});
});

wtf.test(`It should support updating optional object members to undefined values.`, (assert) => {
	let state = stateify({ data: { page: "" } } as { data?: { page: string } });
	state.update({ data: undefined });
	assert.equals(state.value(), { data: {} });
});

wtf.test(`It should support updating optional array members to undefined values.`, (assert) => {
	let state = stateify({ data: [] } as { data?: string[] });
	state.update({ data: undefined });
	assert.equals(state.value(), { data: [] });
});

wtf.test(`It should initialize optional members lazily when updated.`, (assert) => {
	let state = stateify({} as { optional?: boolean });
	state.update({ optional: undefined });
	let optional = state.member("optional", false);
	assert.equals(optional.value(), undefined);
});

wtf.test(`It should initialize optional members lazily when accessed.`, (assert) => {
	let state = stateify({} as { optional?: boolean });
	let optional = state.member("optional", false);
	assert.equals(optional.value(), false);
});

wtf.test(`It should filter arrays.`, (assert) => {
	let original = stateify(["a", "B", "c", "D", "e"] as Array<string>);
	let filtered = original.filter((state) => state.compute((value) => value === value.toLowerCase()));
	assert.equals(original.value(), ["a", "B", "c", "D", "e"]);
	assert.equals(filtered.value(), ["a", "c", "e"]);
});

wtf.test(`A filtered array should be updated when the elements in the original array are updated from the start.`, (assert) => {
	let original = stateify(["a", "B", "c", "D", "e"] as Array<string>)
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
	let original = stateify(["a", "B", "c", "D", "e"] as Array<string>)
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
	let original = stateify(["a", "B", "c", "D", "e"] as Array<string>)
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
	let original = stateify(["a", "B", "c", "D", "e"] as Array<string>)
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
	let original = stateify([] as Array<string>)
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
	let original = stateify([] as Array<string>)
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
	let original = stateify(["a", "B", "c", "D", "e"] as Array<string>)
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
	let original = stateify(["a", "B", "c", "D", "e"] as Array<string>)
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
