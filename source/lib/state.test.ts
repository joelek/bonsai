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
