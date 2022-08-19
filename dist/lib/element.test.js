"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const wtf_1 = require("@joelek/wtf");
const element_1 = require("./element");
// remove double layers
// just use wtf as export
(0, wtf_1.suite)("", (suite) => {
    suite.case(`It should `, (assert) => {
        console.log(Object.entries(element_1.html));
        let a = element_1.html.a();
        //assert.equals(a, document.createElement("a"));
    });
});
