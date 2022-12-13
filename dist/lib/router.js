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
    let query = "";
    for (let parameter of route.parameters) {
        query += `${encodeURIComponent(parameter.key)}=${encodeURIComponent(parameter.value)}`;
    }
    let url = (query !== "") ? `${path}?${query}` : path;
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
    let url = new URL(document.body.baseURI);
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
    for (let one in location.search.split("&")) {
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
    element = (0, state_1.stateify)(undefined);
    url = (0, state_1.stateify)(undefined);
    onPopState = (event) => {
        let historyState = event.state;
        this.state.update(historyState);
    };
    parseRoute(route) {
        for (let page in this.factories) {
            try {
                let factory = this.factories[page];
                let options = factory.codec.decode(route);
                return {
                    page,
                    options
                };
            }
            catch (error) { }
        }
        let page = this.defaultPage;
        let options = {};
        return {
            page,
            options
        };
    }
    constructor(factories, defaultPage) {
        this.factories = { ...factories };
        this.defaultPage = defaultPage;
        this.documentTitle = document.title;
        this.cache = (0, state_1.stateify)(getInitialCache());
        this.state = (0, state_1.stateify)(getInitialState());
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
        stateIndex.compute((stateIndex) => {
            let entry = this.cache.element(stateIndex);
            if (entry.value().element == null) {
                let entryTitle = entry.member("title");
                let entryRoute = entry.member("route");
                let entryElement = entry.member("element");
                let parsedRoute = this.parseRoute(stateRoute.value());
                let factory = this.factories[parsedRoute.page];
                let options = (0, state_1.stateify)(parsedRoute.options);
                entryElement.update(factory.factory(options, entryTitle, this));
                options.compute((options) => {
                    entryRoute.update(factory.codec.encode(options));
                });
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
        window.addEventListener("popstate", this.onPopState);
    }
    navigate(page, options) {
        let factory = this.factories[page];
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
        window.scrollTo({ top: 0, left: 0 });
        return false;
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
    withDynamicPath(key, codec) {
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
    withStaticPath(value) {
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
    path(value, codec) {
        if (typeof codec === "undefined") {
            return this.withStaticPath(value);
        }
        else {
            return this.withDynamicPath(value, codec);
        }
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
            codec = codec.path(key, CODECS[type] ?? codecs_1.Plain);
        }
        else {
            codec = codec.path(pathPart);
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
