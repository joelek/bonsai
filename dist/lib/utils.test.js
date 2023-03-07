"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const wtf = require("@joelek/wtf");
const utils = require("./utils");
wtf.test(`It should locate the index for 0 in [2, 4, 6, 8].`, (assert) => {
    let observed = utils.getOrderedIndex([2, 4, 6, 8], (value) => 0 - value);
    let expected = 0;
    assert.equals(observed, expected);
});
wtf.test(`It should locate the index for 1 in [2, 4, 6, 8].`, (assert) => {
    let observed = utils.getOrderedIndex([2, 4, 6, 8], (value) => 1 - value);
    let expected = 0;
    assert.equals(observed, expected);
});
wtf.test(`It should locate the index for 2 in [2, 4, 6, 8].`, (assert) => {
    let observed = utils.getOrderedIndex([2, 4, 6, 8], (value) => 2 - value);
    let expected = 0;
    assert.equals(observed, expected);
});
wtf.test(`It should locate the index for 3 in [2, 4, 6, 8].`, (assert) => {
    let observed = utils.getOrderedIndex([2, 4, 6, 8], (value) => 3 - value);
    let expected = 1;
    assert.equals(observed, expected);
});
wtf.test(`It should locate the index for 4 in [2, 4, 6, 8].`, (assert) => {
    let observed = utils.getOrderedIndex([2, 4, 6, 8], (value) => 4 - value);
    let expected = 1;
    assert.equals(observed, expected);
});
wtf.test(`It should locate the index for 5 in [2, 4, 6, 8].`, (assert) => {
    let observed = utils.getOrderedIndex([2, 4, 6, 8], (value) => 5 - value);
    let expected = 2;
    assert.equals(observed, expected);
});
wtf.test(`It should locate the index for 6 in [2, 4, 6, 8].`, (assert) => {
    let observed = utils.getOrderedIndex([2, 4, 6, 8], (value) => 6 - value);
    let expected = 2;
    assert.equals(observed, expected);
});
wtf.test(`It should locate the index for 7 in [2, 4, 6, 8].`, (assert) => {
    let observed = utils.getOrderedIndex([2, 4, 6, 8], (value) => 7 - value);
    let expected = 3;
    assert.equals(observed, expected);
});
wtf.test(`It should locate the index for 8 in [2, 4, 6, 8].`, (assert) => {
    let observed = utils.getOrderedIndex([2, 4, 6, 8], (value) => 8 - value);
    let expected = 3;
    assert.equals(observed, expected);
});
wtf.test(`It should locate the index for 9 in [2, 4, 6, 8].`, (assert) => {
    let observed = utils.getOrderedIndex([2, 4, 6, 8], (value) => 9 - value);
    let expected = 4;
    assert.equals(observed, expected);
});
wtf.test(`It should locate the index for 9 in [2, 4, 6, 8].`, (assert) => {
    let observed = utils.getOrderedIndex([2, 4, 6, 8], (value) => 10 - value);
    let expected = 4;
    assert.equals(observed, expected);
});
wtf.test(`It should locate the index for 0 in [1, 3, 5, 7, 9].`, (assert) => {
    let observed = utils.getOrderedIndex([1, 3, 5, 7, 9], (value) => 0 - value);
    let expected = 0;
    assert.equals(observed, expected);
});
wtf.test(`It should locate the index for 1 in [1, 3, 5, 7, 9].`, (assert) => {
    let observed = utils.getOrderedIndex([1, 3, 5, 7, 9], (value) => 1 - value);
    let expected = 0;
    assert.equals(observed, expected);
});
wtf.test(`It should locate the index for 2 in [1, 3, 5, 7, 9].`, (assert) => {
    let observed = utils.getOrderedIndex([1, 3, 5, 7, 9], (value) => 2 - value);
    let expected = 1;
    assert.equals(observed, expected);
});
wtf.test(`It should locate the index for 3 in [1, 3, 5, 7, 9].`, (assert) => {
    let observed = utils.getOrderedIndex([1, 3, 5, 7, 9], (value) => 3 - value);
    let expected = 1;
    assert.equals(observed, expected);
});
wtf.test(`It should locate the index for 4 in [1, 3, 5, 7, 9].`, (assert) => {
    let observed = utils.getOrderedIndex([1, 3, 5, 7, 9], (value) => 4 - value);
    let expected = 2;
    assert.equals(observed, expected);
});
wtf.test(`It should locate the index for 5 in [1, 3, 5, 7, 9].`, (assert) => {
    let observed = utils.getOrderedIndex([1, 3, 5, 7, 9], (value) => 5 - value);
    let expected = 2;
    assert.equals(observed, expected);
});
wtf.test(`It should locate the index for 6 in [1, 3, 5, 7, 9].`, (assert) => {
    let observed = utils.getOrderedIndex([1, 3, 5, 7, 9], (value) => 6 - value);
    let expected = 3;
    assert.equals(observed, expected);
});
wtf.test(`It should locate the index for 7 in [1, 3, 5, 7, 9].`, (assert) => {
    let observed = utils.getOrderedIndex([1, 3, 5, 7, 9], (value) => 7 - value);
    let expected = 3;
    assert.equals(observed, expected);
});
wtf.test(`It should locate the index for 8 in [1, 3, 5, 7, 9].`, (assert) => {
    let observed = utils.getOrderedIndex([1, 3, 5, 7, 9], (value) => 8 - value);
    let expected = 4;
    assert.equals(observed, expected);
});
wtf.test(`It should locate the index for 9 in [1, 3, 5, 7, 9].`, (assert) => {
    let observed = utils.getOrderedIndex([1, 3, 5, 7, 9], (value) => 9 - value);
    let expected = 4;
    assert.equals(observed, expected);
});
wtf.test(`It should locate the index for 10 in [1, 3, 5, 7, 9].`, (assert) => {
    let observed = utils.getOrderedIndex([1, 3, 5, 7, 9], (value) => 10 - value);
    let expected = 5;
    assert.equals(observed, expected);
});
