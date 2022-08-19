import "../dom";
import { suite } from "@joelek/wtf";
import { html } from "./element";

suite("", (suite) => {
	suite.case(`It should initialize factories lazily.`, (assert) => {
		assert.equals(Object.entries(html).length, 0);
		html.a();
		assert.equals(Object.entries(html).length, 1);
		html.a();
		assert.equals(Object.entries(html).length, 1);

let f = html.p()
	.attribute("test", "a")
;


console.log(f.getAttribute("test"))

	});
});
