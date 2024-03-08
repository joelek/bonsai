import * as wtf from "@joelek/wtf";
import * as v8 from "v8";
import * as vm from "vm";
import { State, stateify } from "./state";

if (typeof globalThis.gc === "undefined") {
	v8.setFlagsFromString("--expose-gc");
	globalThis.gc = vm.runInNewContext("gc");
}

const REGISTRY = new FinalizationRegistry<() => void>((callback) => callback());
const MAX_WAIT_MS = 30000;

wtf.test(`Derived states should continue to work after the garbage collector is run.`, async (assert) => {
	let a = stateify(1 as number);
	let c = await new Promise<State<number>>((resolve, reject) => {
		let b = a.derive((value) => value + 1);
		let c = b.derive((value) => value + 1);
		let d = c.derive((value) => value + 1);
		REGISTRY.register(d, () => resolve(c));
		setTimeout(reject, MAX_WAIT_MS);
	});
	assert.equals(c.value(), 3);
	a.update(2);
	assert.equals(c.value(), 4);
});

wtf.test(`Observed stateify({ a, b }) should continue to work after the garbage collector is run.`, async (assert) => {
	let a = stateify(1 as number);
	let b = stateify(2 as number);
	let c = stateify(0 as number);
	await new Promise<void>((resolve, reject) => {
		let d = stateify({ a, b });
		d.observe("update", (state) => {
			let { a, b } = state.value();
			c.update(a + b);
		});
		let e = stateify({ a, b });
		REGISTRY.register(e, () => resolve());
		setTimeout(reject, MAX_WAIT_MS);
	});
	assert.equals(c.value(), 0);
	a.update(2);
	b.update(3);
	assert.equals(c.value(), 5);
});

wtf.test(`Shadow states should continue to work after the garbage collector is run.`, async (assert) => {
	let a = stateify(1 as number);
	let c = await new Promise<State<number>>((resolve, reject) => {
		let b = a.shadow();
		let c = b.shadow();
		let d = c.shadow();
		REGISTRY.register(d, () => resolve(c));
		setTimeout(reject, MAX_WAIT_MS);
	});
	assert.equals(c.value(), 1);
	a.update(2);
	assert.equals(c.value(), 2);
	c.update(1);
	assert.equals(a.value(), 1);
});

setTimeout(() => (globalThis.gc as any)(true));
