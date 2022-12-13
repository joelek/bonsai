"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const wtf = require("@joelek/wtf");
const router = require("./router");
const codecs = require("./codecs");
wtf.test(`It should initialize paths from pathname "/root/path" and basename "/root/base".`, async (assert) => {
    let observed = router.getInitialPaths("/root/path", "/root/base");
    let expected = ["path"];
    assert.equals(observed, expected);
});
wtf.test(`It should initialize paths from pathname "/root/path" and basename "/root/".`, async (assert) => {
    let observed = router.getInitialPaths("/root/path", "/root/");
    let expected = ["path"];
    assert.equals(observed, expected);
});
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
wtf.test(`It should parse static path components.`, async (assert) => {
    let codec = router.route("static");
    let observed = codec.decode({
        paths: [
            "static"
        ],
        parameters: []
    });
    let expected = {};
    assert.equals(observed, expected);
});
wtf.test(`It should parse multiple static path components.`, async (assert) => {
    let codec = router.route("static1/static2");
    let observed = codec.decode({
        paths: [
            "static1",
            "static2"
        ],
        parameters: []
    });
    let expected = {};
    assert.equals(observed, expected);
});
wtf.test(`It should parse dynamic path components with no type.`, async (assert) => {
    let codec = router.route("<key>");
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
wtf.test(`It should parse dynamic path components with plain type.`, async (assert) => {
    let codec = router.route("<key:plain>");
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
wtf.test(`It should parse dynamic path components with integer type.`, async (assert) => {
    let codec = router.route("<key:integer>");
    let observed = codec.decode({
        paths: [
            "1"
        ],
        parameters: []
    });
    let expected = {
        key: 1
    };
    assert.equals(observed, expected);
});
wtf.test(`It should parse dynamic path components with boolean type.`, async (assert) => {
    let codec = router.route("<key:boolean>");
    let observed = codec.decode({
        paths: [
            "true"
        ],
        parameters: []
    });
    let expected = {
        key: true
    };
    assert.equals(observed, expected);
});
wtf.test(`It should parse multiple dynamic path components.`, async (assert) => {
    let codec = router.route("<key1>/<key2>");
    let observed = codec.decode({
        paths: [
            "value1",
            "value2"
        ],
        parameters: []
    });
    let expected = {
        key1: "value1",
        key2: "value2"
    };
    assert.equals(observed, expected);
});
wtf.test(`It should parse required query parameters with no type.`, async (assert) => {
    let codec = router.route("?<key>");
    let observed = codec.decode({
        paths: [
            ""
        ],
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
wtf.test(`It should parse required query parameters with plain type.`, async (assert) => {
    let codec = router.route("?<key:plain>");
    let observed = codec.decode({
        paths: [
            ""
        ],
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
wtf.test(`It should parse required query parameters with integer type.`, async (assert) => {
    let codec = router.route("?<key:integer>");
    let observed = codec.decode({
        paths: [
            ""
        ],
        parameters: [
            {
                key: "key",
                value: "1"
            }
        ]
    });
    let expected = {
        key: 1
    };
    assert.equals(observed, expected);
});
wtf.test(`It should parse required query parameters with boolean type.`, async (assert) => {
    let codec = router.route("?<key:boolean>");
    let observed = codec.decode({
        paths: [
            ""
        ],
        parameters: [
            {
                key: "key",
                value: "true"
            }
        ]
    });
    let expected = {
        key: true
    };
    assert.equals(observed, expected);
});
wtf.test(`It should parse multiple required query parameters.`, async (assert) => {
    let codec = router.route("?<key1>&<key2>");
    let observed = codec.decode({
        paths: [
            ""
        ],
        parameters: [
            {
                key: "key1",
                value: "value1"
            },
            {
                key: "key2",
                value: "value2"
            }
        ]
    });
    let expected = {
        key1: "value1",
        key2: "value2"
    };
    assert.equals(observed, expected);
});
wtf.test(`It should parse optional query parameters with no type.`, async (assert) => {
    let codec = router.route("?[key]");
    let observed = codec.decode({
        paths: [
            ""
        ],
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
wtf.test(`It should parse optional query parameters with plain type.`, async (assert) => {
    let codec = router.route("?[key:plain]");
    let observed = codec.decode({
        paths: [
            ""
        ],
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
wtf.test(`It should parse optional query parameters with integer type.`, async (assert) => {
    let codec = router.route("?[key:integer]");
    let observed = codec.decode({
        paths: [
            ""
        ],
        parameters: [
            {
                key: "key",
                value: "1"
            }
        ]
    });
    let expected = {
        key: 1
    };
    assert.equals(observed, expected);
});
wtf.test(`It should parse optional query parameters with boolean type.`, async (assert) => {
    let codec = router.route("?[key:boolean]");
    let observed = codec.decode({
        paths: [
            ""
        ],
        parameters: [
            {
                key: "key",
                value: "true"
            }
        ]
    });
    let expected = {
        key: true
    };
    assert.equals(observed, expected);
});
wtf.test(`It should parse multiple optional query parameters.`, async (assert) => {
    let codec = router.route("?[key1]&[key2]");
    let observed = codec.decode({
        paths: [
            ""
        ],
        parameters: [
            {
                key: "key1",
                value: "value1"
            },
            {
                key: "key2",
                value: "value2"
            }
        ]
    });
    let expected = {
        key1: "value1",
        key2: "value2"
    };
    assert.equals(observed, expected);
});
