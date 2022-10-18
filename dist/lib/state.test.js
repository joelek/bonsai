"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const wtf = require("@joelek/wtf");
const state_1 = require("./state");
wtf.test(`It should not output undefined member values in object values.`, (assert) => {
    let state = (0, state_1.stateify)({ required: undefined });
    assert.equals(state.value(), {});
});
wtf.test(`It should support updating optional object members to undefined values.`, (assert) => {
    let state = (0, state_1.stateify)({ data: { page: "" } });
    state.update({ data: undefined });
    assert.equals(state.value(), { data: {} });
});
wtf.test(`It should support updating optional array members to undefined values.`, (assert) => {
    let state = (0, state_1.stateify)({ data: [] });
    state.update({ data: undefined });
    assert.equals(state.value(), { data: [] });
});
wtf.test(`It should initialize optional members lazily when updated.`, (assert) => {
    let state = (0, state_1.stateify)({});
    state.update({ optional: undefined });
    let optional = state.member("optional", false);
    assert.equals(optional.value(), undefined);
});
wtf.test(`It should initialize optional members lazily when accessed.`, (assert) => {
    let state = (0, state_1.stateify)({});
    let optional = state.member("optional", false);
    assert.equals(optional.value(), false);
});
