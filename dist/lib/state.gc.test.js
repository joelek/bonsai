"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const wtf = require("@joelek/wtf");
const v8 = require("v8");
const vm = require("vm");
const state_1 = require("./state");
if (typeof globalThis.gc === "undefined") {
    v8.setFlagsFromString("--expose-gc");
    globalThis.gc = vm.runInNewContext("gc");
}
const MAX_WAIT_MS = 30000;
wtf.test(`Subscribed states should be automatically reclaimed by the garbage collector.`, async (assert) => {
    let a = (0, state_1.stateify)(1);
    await new Promise((resolve, reject) => {
        let b = (0, state_1.stateify)(2);
        let subscription = b.subscribe(a, "update", (a) => { });
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
