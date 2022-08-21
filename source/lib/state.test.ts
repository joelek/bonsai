import { suite } from "@joelek/wtf";
import { stateify } from "./state";

suite("state", (suite) => {
	suite.case(`It should not output undefined member values in object values.`, (assert) => {
		let state = stateify({ required: undefined });
		assert.equals(state.value(), {});
	});

	suite.case(`It should initialize optional members lazily when updated.`, (assert) => {
		let state = stateify({} as { optional?: boolean });
		state.update({ optional: undefined });
		let optional = state.member("optional", false);
		assert.equals(optional.value(), undefined);
	});

	suite.case(`It should initialize optional members lazily when accessed.`, (assert) => {
		let state = stateify({} as { optional?: boolean });
		let optional = state.member("optional", false);
		assert.equals(optional.value(), false);
	});
});
