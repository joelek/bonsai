import * as wtf from "@joelek/wtf";
import * as v8 from "v8";
import * as vm from "vm";
import { stateify } from "./state";

if (typeof globalThis.gc === "undefined") {
	v8.setFlagsFromString("--expose-gc");
	globalThis.gc = vm.runInNewContext("gc");
}

const MAX_WAIT_MS = 30000;

wtf.test(`Subscribed states should be automatically reclaimed by the garbage collector.`, async (assert) => {
	let a = stateify(1 as number);
	await new Promise<void>((resolve, reject) => {
		let b = stateify(2 as number);
		let subscription = b.subscribe(a, "update", (a) => {});
		subscription.is_cancelled.observe("update", (is_cancelled) => {
			if (is_cancelled.value()) {
				resolve();
			}
		});
		setTimeout(reject, MAX_WAIT_MS);
		globalThis.gc?.();
	});
});
/*
wtf.test(`Subscribed states should not be automatically reclaimed by the garbage collector when there are references around.`, async (assert) => {
	let a = stateify(1 as number);
	let b = a.shadow().compute((a) => a);
	globalThis.gc?.();
	await new Promise<void>((resolve, reject) => {
		setTimeout(resolve, MAX_WAIT_MS);
	});
	a.update(2);
	assert.equals(b.value(), 2);
});
 */
