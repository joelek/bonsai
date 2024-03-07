"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const wtf = require("@joelek/wtf");
const v8 = require("v8");
const vm = require("vm");
const state_1 = require("./state");
if (typeof gc === "undefined") {
    v8.setFlagsFromString("--expose-gc");
    globalThis.gc = vm.runInNewContext("gc");
}
wtf.test(`Derived states should continue to work after the garbage collector is run.`, async (assert) => {
    assert.equals(typeof gc, "function");
    let registry = new FinalizationRegistry((callback) => callback());
    let a = (0, state_1.stateify)(1);
    let c = await new Promise((resolve, reject) => {
        let b = a.derive((value) => value + 1);
        let c = b.derive((value) => value + 1);
        let d = c.derive((value) => value + 1);
        registry.register(d, () => resolve(c));
        gc?.();
        setTimeout(reject, 30000);
    });
    assert.equals(c.value(), 3);
    a.update(2);
    assert.equals(c.value(), 4);
});
wtf.test(`Observed stateify({ a, b }) should continue to work after the garbage collector is run.`, async (assert) => {
    assert.equals(typeof gc, "function");
    let registry = new FinalizationRegistry((callback) => callback());
    let a = (0, state_1.stateify)(1);
    let b = (0, state_1.stateify)(2);
    let c = (0, state_1.stateify)(0);
    await new Promise((resolve, reject) => {
        let d = (0, state_1.stateify)({ a, b });
        d.observe("update", (state) => {
            let { a, b } = state.value();
            c.update(a + b);
        });
        let e = (0, state_1.stateify)({ a, b });
        registry.register(e, () => resolve());
        gc?.();
        setTimeout(reject, 30000);
    });
    assert.equals(c.value(), 0);
    a.update(2);
    b.update(3);
    assert.equals(c.value(), 5);
});
