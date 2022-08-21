"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const wtf_1 = require("@joelek/wtf");
const state_1 = require("./state");
(0, wtf_1.suite)("state", (suite) => {
    suite.case(`It should not output undefined member values in object values.`, (assert) => {
        let state = (0, state_1.stateify)({ required: undefined });
        assert.equals(state.value(), {});
    });
    suite.case(`It should support updating optional members to undefined values.`, (assert) => {
        let state = (0, state_1.stateify)({ data: { page: "" } });
        state.update({ data: undefined });
        assert.equals(state.value(), { data: {} });
    });
    suite.case(`It should initialize optional members lazily when updated.`, (assert) => {
        let state = (0, state_1.stateify)({});
        state.update({ optional: undefined });
        let optional = state.member("optional", false);
        assert.equals(optional.value(), undefined);
    });
    suite.case(`It should initialize optional members lazily when accessed.`, (assert) => {
        let state = (0, state_1.stateify)({});
        let optional = state.member("optional", false);
        assert.equals(optional.value(), false);
    });
});
