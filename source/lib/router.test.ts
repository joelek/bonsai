import * as wtf from "@joelek/wtf";
import * as router from "./router";
import * as codecs from "./codecs";

async function mock(callback: () => (void | Promise<void>)): Promise<void> {
	let window = globalThis["window"];
	globalThis["window"] = (() => {
		let listeners = [] as Array<Parameters<typeof window["addEventListener"]>>;
		let stack = [] as Array<Parameters<typeof window["history"]["pushState"]>>;
		let index = 0 as number;
		return {
			addEventListener(...[type, listener]: Parameters<typeof window["addEventListener"]>) {
				listeners.push([type, listener]);
			},
			history: {
				back() {
					this.go(-1);
				},
				forward() {
					this.go(+1);
				},
				go(delta) {
					if (delta == null || delta === 0) {
						// Reload.
					} else {
						let new_index = index + delta;
						if (new_index >= 0 && new_index < stack.length) {
							index = new_index;
							for (let [type, listener] of listeners) {
								if (type !== "popstate") {
									continue;
								}
								let event = { state: this.state } as PopStateEvent;
								if (typeof listener === "function") {
									listener(event);
								} else {
									listener.handleEvent(event);
								}
							}
						}
					}
				},
				pushState(data, unused, url) {
					data = JSON.parse(JSON.stringify(data));
					stack.splice(index + 1);
					stack.push([
						data,
						unused,
						url
					]);
					index += 1;
				},
				replaceState(data, unused, url) {
					data = JSON.parse(JSON.stringify(data));
					stack[index] = [
						data,
						unused,
						url
					];
				},
				get length() {
					return stack.length;
				},
				get state() {
					if (index >= 0 && index < stack.length) {
						return JSON.parse(JSON.stringify(stack[index][0]));
					} else {
						return null;
					}
				}
			},
			location: {
				origin: "http://localhost",
				pathname: "/base/route",
				search: ""
			},
			scrollTo(x, y) {}
		} as typeof window;
	})();
	let document = globalThis["document"];
	globalThis["document"] = (() => {
		return {
			baseURI: "http://localhost/base/",
			title: "Title"
		} as typeof document;
	})();
	await callback();
	globalThis["window"] = window;
	globalThis["document"] = document;
};

wtf.test(`It should initialize paths from pathname "/root/path" and basename "/root/base".`, async (assert) => {
	let observed = router.getInitialPaths("/root/path", "/root/base");
	let expected = ["path"];
	assert.equals(observed, expected);
});

wtf.test(`It should initialize paths from pathname "/root/path" and basename "/root/".`, async (assert) => {
	let observed = router.getInitialPaths("/root/path", "/root/");
	let expected = ["path"] as Array<string>;
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
	let codec = router.codec.static("static");
	await assert.throws(async () => {
		codec.decode({
			paths: [],
			parameters: []
		});
	});
});

wtf.test(`It should not throw an error when a static path component is present.`, async (assert) => {
	let codec = router.codec.static("static");
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
	let codec = router.codec.dynamic("key", codecs.Plain);
	await assert.throws(async () => {
		codec.decode({
			paths: [],
			parameters: []
		});
	});
});

wtf.test(`It should not throw an error when a dynamic path component is present.`, async (assert) => {
	let codec = router.codec.dynamic("key", codecs.Plain);
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
			.dynamic("key", codecs.Plain)
			.required("key", codecs.Plain)
	});
});

wtf.test(`It should throw an error when the same key is used for two dynamic paths.`, async (assert) => {
	await assert.throws(async () => {
		router.codec
			.dynamic("key", codecs.Plain)
			.dynamic("key", codecs.Plain)
	});
});

wtf.test(`It should throw an error when the same key is used for two parameters.`, async (assert) => {
	await assert.throws(async () => {
		router.codec
			.required("key", codecs.Plain)
			.required("key", codecs.Plain)
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

wtf.test(`A router should be initialized properly when there is no matching route.`, async (assert) => mock(() => {
	let instance = new router.Router({});
	assert.equals(instance.url.value(), "route");
	assert.equals(instance.element.value() == null, true);
}));

wtf.test(`A router should be initialized properly when there is a matching route.`, async (assert) => mock(() => {
	class RouteElement {};
	let instance = new router.Router({
		route: {
			codec: router.route("route"),
			factory: (options, title, router) => {
				return new RouteElement() as Element;
			}
		}
	});
	assert.equals(instance.url.value(), "route");
	assert.instanceof(instance.element.value(), RouteElement);
}));

wtf.test(`A router should be initialized properly when there is no matching route and a default route.`, async (assert) => mock(() => {
	class DefaultElement {};
	let instance = new router.Router({
		default: {
			codec: router.route("default"),
			factory: (options, title, router) => {
				return new DefaultElement() as Element;
			}
		}
	}, "default");
	assert.equals(instance.url.value(), "default");
	assert.instanceof(instance.element.value(), DefaultElement);
}));

wtf.test(`A router should be initialized properly when there is a matching route and a default route.`, async (assert) => mock(() => {
	class DefaultElement {};
	class RouteElement {};
	let instance = new router.Router({
		default: {
			codec: router.route("default"),
			factory: (options, title, router) => {
				return new DefaultElement() as Element;
			}
		},
		route: {
			codec: router.route("route"),
			factory: (options, title, router) => {
				return new RouteElement() as Element;
			}
		}
	}, "default");
	assert.equals(instance.url.value(), "route");
	assert.instanceof(instance.element.value(), RouteElement);
}));
