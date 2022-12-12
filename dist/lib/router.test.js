"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const wtf = require("@joelek/wtf");
const router = require("./router");
const codecs = require("./codecs");
wtf.test(`It should decode optional parameters.`, async (assert) => {
    let codec = router.codec.optional("key", codecs.Plain);
    let observed = codec.decode({
        paths: [],
        parameters: [
            {
                key: "key",
                value: "value"
            }
        ]
    });
    let expected = {
        key: "value"
    };
    assert.equals(observed, expected);
});
wtf.test(`It should not throw an error when an optional parameter is absent.`, async (assert) => {
    let codec = router.codec.optional("key", codecs.Plain);
    let observed = codec.decode({
        paths: [],
        parameters: []
    });
    let expected = {
        key: undefined
    };
    assert.equals(observed, expected);
});
wtf.test(`It should decode required parameters.`, async (assert) => {
    let codec = router.codec.required("key", codecs.Plain);
    let observed = codec.decode({
        paths: [],
        parameters: [
            {
                key: "key",
                value: "value"
            }
        ]
    });
    let expected = {
        key: "value"
    };
    assert.equals(observed, expected);
});
wtf.test(`It should throw an error when a required parameter is absent.`, async (assert) => {
    let codec = router.codec.required("key", codecs.Plain);
    await assert.throws(async () => {
        codec.decode({
            paths: [],
            parameters: []
        });
    });
});
wtf.test(`It should decode required parameters from the last parameter value.`, async (assert) => {
    let codec = router.codec.required("key", codecs.Plain);
    let observed = codec.decode({
        paths: [],
        parameters: [
            {
                key: "key",
                value: "value1"
            },
            {
                key: "key",
                value: "value2"
            }
        ]
    });
    let expected = {
        key: "value2"
    };
    assert.equals(observed, expected);
});
wtf.test(`It should throw an error when a static path component is absent.`, async (assert) => {
    let codec = router.codec.path("static");
    await assert.throws(async () => {
        codec.decode({
            paths: [],
            parameters: []
        });
    });
});
wtf.test(`It should not throw an error when a static path component is present.`, async (assert) => {
    let codec = router.codec.path("static");
    let observed = codec.decode({
        paths: [
            "static"
        ],
        parameters: []
    });
    let expected = {};
    assert.equals(observed, expected);
});
wtf.test(`It should throw an error when a dynamic path component is absent.`, async (assert) => {
    let codec = router.codec.path("key", codecs.Plain);
    await assert.throws(async () => {
        codec.decode({
            paths: [],
            parameters: []
        });
    });
});
wtf.test(`It should not throw an error when a dynamic path component is present.`, async (assert) => {
    let codec = router.codec.path("key", codecs.Plain);
    let observed = codec.decode({
        paths: [
            "value"
        ],
        parameters: []
    });
    let expected = {
        key: "value"
    };
    assert.equals(observed, expected);
});
wtf.test(`It should throw an error when the same key is used for a dynamic path and a parameter.`, async (assert) => {
    await assert.throws(async () => {
        router.codec
            .path("key", codecs.Plain)
            .required("key", codecs.Plain);
    });
});
wtf.test(`It should throw an error when the same key is used for two dynamic paths.`, async (assert) => {
    await assert.throws(async () => {
        router.codec
            .path("key", codecs.Plain)
            .path("key", codecs.Plain);
    });
});
wtf.test(`It should throw an error when the same key is used for two parameters.`, async (assert) => {
    await assert.throws(async () => {
        router.codec
            .required("key", codecs.Plain)
            .required("key", codecs.Plain);
    });
});
wtf.test(`It should throw an error when there are additional paths.`, async (assert) => {
    let codec = router.codec;
    await assert.throws(async () => {
        codec.decode({
            paths: [
                "value"
            ],
            parameters: []
        });
    });
});
