"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Router = exports.getInitialState = exports.getInitialRoute = exports.getInitialIndex = exports.getInitialCache = exports.getBaseHref = exports.updateHistoryState = exports.getUrlFromRoute = exports.pathify = void 0;
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
    let element = document.head.querySelector("base[href]");
    if (element != null) {
        let attribute = element.getAttribute("href");
        if (attribute != null) {
            return attribute;
        }
    }
    return "/";
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
function getInitialRoute() {
    let location = window.location;
    let pathNameParts = location.pathname.split("/");
    let baseHrefParts = getBaseHref().split("/");
    let i = 0;
    while (i < pathNameParts.length && i < baseHrefParts.length && pathNameParts[i] === baseHrefParts[i]) {
        i++;
    }
    let paths = pathNameParts.slice(i).map((path) => decodeURIComponent(path));
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
            for (let i = this.cache.length(); i <= stateIndex; i++) {
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
        for (let i = this.cache.length() - 1; i >= index; i--) {
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
