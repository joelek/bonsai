"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.route = exports.codec = exports.RouteCodecImplementation = exports.Router = exports.getInitialState = exports.getInitialRoute = exports.getInitialPaths = exports.getInitialIndex = exports.getInitialCache = exports.getBaseHref = exports.updateHistoryState = exports.getUrlFromRoute = exports.pathify = void 0;
const codecs_1 = require("./codecs");
const state_1 = require("./state");
function pathify(string) {
    return string
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[\|\/\\\_\-]/g, " ")
        .replace(/[^a-z0-9 ]/g, "")
        .trim()
        .split(/[ ]+/g)
        .join("-");
}
exports.pathify = pathify;
;
function getUrlFromRoute(route) {
    let path = route.paths.map((path) => encodeURIComponent(path)).join("/");
    let parts = [];
    for (let parameter of route.parameters) {
        parts.push(`${encodeURIComponent(parameter.key)}=${encodeURIComponent(parameter.value)}`);
    }
    let search = parts.length === 0 ? "" : "?" + parts.join("&");
    let url = path + search;
    return url;
}
exports.getUrlFromRoute = getUrlFromRoute;
;
function updateHistoryState(historyState) {
    let url = getUrlFromRoute(historyState.route);
    window.history.replaceState(historyState, "", url);
}
exports.updateHistoryState = updateHistoryState;
;
function getBaseHref() {
    let url = new URL(document.baseURI);
    if (url.origin !== window.location.origin) {
        throw new Error(`Expected basename origin and location origin to be identical!`);
    }
    return url.pathname;
}
exports.getBaseHref = getBaseHref;
;
function getInitialCache() {
    return [];
}
exports.getInitialCache = getInitialCache;
;
function getInitialIndex() {
    return 0;
}
exports.getInitialIndex = getInitialIndex;
;
function getInitialPaths(pathname, basename) {
    let pathnameParts = pathname.split("/");
    let basenameParts = basename.split("/").slice(0, -1);
    for (let i = 0; i < basenameParts.length; i++) {
        if (basenameParts[i] !== pathnameParts[i]) {
            throw new Error(`Expected basename to be a prefix of the pathname!`);
        }
    }
    let paths = pathnameParts.slice(basenameParts.length).map((path) => decodeURIComponent(path));
    return paths;
}
exports.getInitialPaths = getInitialPaths;
;
function getInitialRoute() {
    let location = window.location;
    let paths = getInitialPaths(location.pathname, getBaseHref());
    let parameters = [];
    let search = location.search;
    if (search.startsWith("?")) {
        for (let one in search.slice(1).split("&")) {
            let two = one.split("=");
            if (two.length !== 2) {
                continue;
            }
            let key = decodeURIComponent(two[0]);
            let value = decodeURIComponent(two[1]);
            parameters.push({
                key,
                value
            });
        }
    }
    return {
        paths,
        parameters
    };
}
exports.getInitialRoute = getInitialRoute;
;
function getInitialState() {
    let historyState = (window.history.state || undefined);
    if (historyState == null) {
        let index = getInitialIndex();
        let route = getInitialRoute();
        historyState = {
            route,
            index
        };
    }
    return historyState;
}
exports.getInitialState = getInitialState;
;
class Router {
    factories;
    defaultPage;
    documentTitle;
    cache;
    state;
    element = (0, state_1.make_state)(undefined);
    url = (0, state_1.make_state)(undefined);
    constructor(factories, defaultPage) {
        this.factories = (0, state_1.make_state)(factories);
        this.defaultPage = (0, state_1.make_state)(defaultPage);
        this.documentTitle = document.title;
        this.cache = (0, state_1.make_state)(getInitialCache());
        this.state = (0, state_1.make_state)(getInitialState());
        let stateRoute = this.state.member("route");
        let stateIndex = this.state.member("index");
        this.state.compute((state) => {
            updateHistoryState(state);
        });
        stateRoute.compute((stateRoute) => {
            this.url.update(getUrlFromRoute(stateRoute));
        });
        stateIndex.compute((stateIndex) => {
            for (let i = this.cache.length().value(); i <= stateIndex; i++) {
                this.cache.append({
                    title: this.documentTitle
                });
            }
        });
        let parsedRoute = (0, state_1.make_state)(undefined);
        let computedParsedRoute = (0, state_1.computed)([stateRoute, this.defaultPage, this.factories], (stateRoute, defaultPage, factories) => {
            for (let page in factories) {
                try {
                    let factory = factories[page];
                    let options = factory.codec.decode(stateRoute);
                    return {
                        page,
                        options
                    };
                }
                catch (error) { }
            }
            if (typeof defaultPage !== "undefined") {
                let page = defaultPage;
                let options = {};
                return {
                    page,
                    options
                };
            }
        });
        computedParsedRoute.compute((computedParsedRoute) => {
            parsedRoute.update(computedParsedRoute);
        });
        (0, state_1.computed)([stateIndex, parsedRoute], (stateIndex, parsedRoute) => {
            let entry = this.cache.element(stateIndex);
            let entryTitle = entry.member("title");
            let entryRoute = entry.member("route");
            let entryElement = entry.member("element");
            if (parsedRoute == null) {
                entryTitle.update(this.documentTitle);
                entryRoute.update(undefined);
                entryElement.update(undefined);
            }
            else {
                if (entryElement.value() == null) {
                    let factory = this.factories.value()[parsedRoute.page];
                    let options = (0, state_1.make_state)(parsedRoute.options);
                    entryElement.update(factory.factory(options, entryTitle, this));
                    options.compute((options) => {
                        entryRoute.update(factory.codec.encode(options));
                    });
                }
            }
        });
        let entry = this.cache.element(stateIndex);
        let entryElement = entry.member("element");
        let entryTitle = entry.member("title");
        let entryRoute = entry.member("route");
        entryElement.compute((entryElement) => {
            this.element.update(entryElement);
        });
        entryTitle.compute((entryTitle) => {
            document.title = entryTitle;
        });
        entryRoute.compute((entryRoute) => {
            if (entryRoute != null) {
                stateRoute.update(entryRoute);
            }
        });
        window.addEventListener("popstate", (event) => {
            let historyState = event.state;
            this.state.update(historyState);
        });
    }
    add(page, factory) {
        this.factories.update({
            ...this.factories.value(),
            [page]: factory
        });
        return this;
    }
    default(page) {
        this.defaultPage.update(page);
        return this;
    }
    navigate(page, options) {
        let factory = this.factories.value()[page];
        let index = this.state.value().index + 1;
        let route = factory.codec.encode(options);
        for (let i = this.cache.length().value() - 1; i >= index; i--) {
            this.cache.remove(i);
        }
        // Index needs to be specified after route since index changes trigger page initialization which reads route.
        let historyState = {
            route,
            index
        };
        let url = getUrlFromRoute(route);
        window.history.pushState(historyState, "", url);
        this.state.update(historyState);
        window.scrollTo(0, 0);
        return false;
    }
    remove(page) {
        this.factories.update({
            ...this.factories.value(),
            [page]: undefined
        });
        return this;
    }
}
exports.Router = Router;
;
class RouteCodecImplementation {
    pathCodecs;
    parameterCodecs;
    assertKeyAvailable(key) {
        if (typeof this.parameterCodecs[key] !== "undefined" || typeof this.pathCodecs.find((pathCodec) => pathCodec.key === key) !== "undefined") {
            throw new Error(`Expected key "${key}" to be available!`);
        }
    }
    constructor(pathCodecs, parameterCodecs) {
        this.pathCodecs = pathCodecs;
        this.parameterCodecs = parameterCodecs;
    }
    decode(route) {
        if (route.paths.length !== this.pathCodecs.length) {
            throw new Error(`Expected ${this.pathCodecs.length} paths!`);
        }
        let options = {};
        for (let i = 0; i < this.pathCodecs.length; i++) {
            let pathCodec = this.pathCodecs[i];
            let path = route.paths[i];
            options = {
                ...options,
                ...pathCodec.codec.decode(path)
            };
        }
        for (let key in this.parameterCodecs) {
            let parameterCodec = this.parameterCodecs[key];
            let queryParameter = route.parameters.filter((parameter) => parameter.key === key).pop();
            options = {
                ...options,
                ...parameterCodec.decode(queryParameter?.value)
            };
        }
        return options;
    }
    dynamic(key, codec) {
        this.assertKeyAvailable(key);
        let pathCodec = {
            decode(string) {
                return {
                    [key]: codec.decode(string)
                };
            },
            encode(options) {
                return codec.encode(options[key]);
            }
        };
        return new RouteCodecImplementation([
            ...this.pathCodecs,
            {
                key: key,
                codec: pathCodec
            },
        ], this.parameterCodecs);
    }
    encode(options) {
        let paths = [];
        let parameters = [];
        for (let pathCodec of this.pathCodecs) {
            let value = pathCodec.codec.encode(options);
            if (typeof value !== "undefined") {
                paths.push(value);
            }
        }
        for (let key in this.parameterCodecs) {
            let parameterCodec = this.parameterCodecs[key];
            let value = parameterCodec.encode(options);
            if (typeof value !== "undefined") {
                parameters.push({
                    key: key,
                    value: value
                });
            }
        }
        return {
            paths,
            parameters
        };
    }
    optional(key, codec) {
        this.assertKeyAvailable(key);
        let optionalCodec = codecs_1.Union.of(codec, codecs_1.Undefined);
        let parameterCodec = {
            decode(string) {
                return {
                    [key]: optionalCodec.decode(string)
                };
            },
            encode(options) {
                return optionalCodec.encode(options[key]);
            }
        };
        return new RouteCodecImplementation(this.pathCodecs, {
            ...this.parameterCodecs,
            [key]: parameterCodec
        });
    }
    required(key, codec) {
        this.assertKeyAvailable(key);
        let parameterCodec = {
            decode(string) {
                return {
                    [key]: codec.decode(string)
                };
            },
            encode(options) {
                return codec.encode(options[key]);
            }
        };
        return new RouteCodecImplementation(this.pathCodecs, {
            ...this.parameterCodecs,
            [key]: parameterCodec
        });
    }
    static(value) {
        let pathCodec = {
            decode(string) {
                if (string !== value) {
                    throw new Error(`Expected path "${string}" to be "${value}"!`);
                }
                return {};
            },
            encode(options) {
                return value;
            }
        };
        return new RouteCodecImplementation([
            ...this.pathCodecs,
            {
                key: undefined,
                codec: pathCodec
            },
        ], this.parameterCodecs);
    }
}
exports.RouteCodecImplementation = RouteCodecImplementation;
;
exports.codec = new RouteCodecImplementation([], {});
const CODECS = {
    plain: codecs_1.Plain,
    integer: codecs_1.Integer,
    boolean: codecs_1.Boolean
};
function route(route) {
    let routeParts = route.split("?");
    let pathParts = routeParts.slice(0, 1).join("?");
    let parameterParts = routeParts.slice(1).join("?");
    let codec = new RouteCodecImplementation([], {});
    for (let pathPart of pathParts.split("/")) {
        if (pathPart.startsWith("<") && pathPart.endsWith(">")) {
            let innerParts = pathPart.slice(1, -1).split(":");
            let key = innerParts.slice(0, 1).join(":");
            let type = innerParts.slice(1).join(":");
            codec = codec.dynamic(key, CODECS[type] ?? codecs_1.Plain);
        }
        else {
            codec = codec.static(decodeURIComponent(pathPart));
        }
    }
    for (let parameterPart of parameterParts.split("&")) {
        if (parameterPart.startsWith("<") && parameterPart.endsWith(">")) {
            let innerParts = parameterPart.slice(1, -1).split(":");
            let key = innerParts.slice(0, 1).join(":");
            let type = innerParts.slice(1).join(":");
            codec = codec.required(key, CODECS[type] ?? codecs_1.Plain);
        }
        else if (parameterPart.startsWith("[") && parameterPart.endsWith("]")) {
            let innerParts = parameterPart.slice(1, -1).split(":");
            let key = innerParts.slice(0, 1).join(":");
            let type = innerParts.slice(1).join(":");
            codec = codec.optional(key, CODECS[type] ?? codecs_1.Plain);
        }
    }
    return codec;
}
exports.route = route;
;
