"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.svg = exports.html = void 0;
const state_1 = require("./state");
function serializeValue(value) {
    if (typeof value === "string") {
        return value;
    }
    if (typeof value === "undefined") {
        return "";
    }
    return JSON.stringify(value, (key, value) => {
        if (typeof value === "bigint") {
            return `${value}`;
        }
        else {
            return value;
        }
    });
}
;
function createNode(value) {
    if (value instanceof Node) {
        return value;
    }
    else {
        return document.createTextNode(serializeValue(value));
    }
}
;
const INSERT = Symbol();
const REMOVE = Symbol();
const UPDATE = Symbol();
class FunctionalElementImplementation extends Element {
    bindings;
    unbind(key) {
        let bindings = this.bindings;
        if (bindings != null) {
            let subscriptions = bindings[key];
            if (subscriptions != null) {
                for (let subscription of subscriptions) {
                    if (subscription == null) {
                        continue;
                    }
                    subscription();
                }
                delete bindings[key];
            }
            if (Object.getOwnPropertyDescriptors(bindings).length === 0) {
                delete this.bindings;
            }
        }
    }
    attribute(key, value) {
        let update = (key, value) => {
            if (typeof value === "undefined") {
                this.removeAttribute(key);
            }
            else {
                this.setAttribute(key, serializeValue(value));
            }
        };
        this.unbind(key);
        if (value instanceof state_1.AbstractState) {
            let state = value;
            let bindings = this.bindings;
            if (bindings == null) {
                this.bindings = bindings = {};
            }
            bindings[key] = [
                state.observe("update", (state) => {
                    update(key, state.value());
                })
            ];
            update(key, state.value());
        }
        else {
            update(key, value);
        }
        return this;
    }
    listener(type, listener) {
        if (typeof listener === "undefined") {
            this[type] = undefined;
        }
        else {
            this[type] = (event) => {
                listener(event, this);
            };
        }
        return this;
    }
    nodes(items) {
        this.unbind(INSERT);
        this.unbind(REMOVE);
        this.unbind(UPDATE);
        for (let index = this.childNodes.length - 1; index >= 0; index--) {
            this.childNodes[index].remove();
        }
        if (items instanceof state_1.ArrayState) {
            let bindings = this.bindings = (this.bindings ?? {});
            bindings[INSERT] = [
                items.observe("insert", (state, index) => {
                    let value = state.value();
                    this.insertBefore(createNode(value), null);
                    let subscription = state.observe("update", (state) => {
                        let value = state.value();
                        this.replaceChild(createNode(value), this.childNodes.item(index));
                    });
                    let subscriptions = bindings[UPDATE];
                    if (subscriptions == null) {
                        bindings[UPDATE] = subscriptions = [];
                    }
                    subscriptions.splice(index, 0, subscription);
                })
            ];
            bindings[REMOVE] = [
                items.observe("remove", (state, index) => {
                    this.childNodes[index].remove();
                    let subscriptions = bindings[UPDATE];
                    if (subscriptions == null) {
                        return;
                    }
                    let subscription = subscriptions[index];
                    if (subscription != null) {
                        subscription();
                        subscriptions.splice(index, 1);
                        if (subscriptions.length === 0) {
                            delete bindings[UPDATE];
                        }
                    }
                })
            ];
            bindings[UPDATE] = [];
            for (let index = 0; index < items.length(); index++) {
                let item = items.element(index);
                this.appendChild(createNode(item.value()));
                let subscriber = item.observe("update", (state) => {
                    let value = state.value();
                    this.replaceChild(createNode(value), this.childNodes.item(index));
                });
                bindings[UPDATE][index] = subscriber;
            }
        }
        else {
            for (let index = 0; index < items.length; index++) {
                let item = items[index];
                if (item instanceof state_1.AbstractState) {
                    let bindings = this.bindings = (this.bindings ?? {});
                    bindings[UPDATE] = (bindings[UPDATE] ?? []);
                    this.appendChild(createNode(item.value()));
                    let subscriber = item.observe("update", (state) => {
                        let value = state.value();
                        this.replaceChild(createNode(value), this.childNodes.item(index));
                    });
                    bindings[UPDATE][index] = subscriber;
                }
                else {
                    this.appendChild(createNode(item));
                }
            }
        }
        return this;
    }
    process(callback) {
        callback(this);
        return this;
    }
}
;
function makeFunctionalElementFactory(namespace, tag) {
    let prototype = Object.create(Object.getPrototypeOf(document.createElementNS(namespace, tag)));
    for (let [name, propertyDescriptor] of Object.entries(Object.getOwnPropertyDescriptors(FunctionalElementImplementation.prototype))) {
        if (name === "constructor") {
            continue;
        }
        Object.defineProperty(prototype, name, propertyDescriptor);
    }
    return (classAttribute) => {
        let element = document.createElementNS(namespace, tag);
        Object.setPrototypeOf(element, prototype);
        element.attribute("class", classAttribute);
        return element;
    };
}
;
const HTML_ELEMENT_TAG_NAMES = [
    "a",
    "abbr",
    "address",
    "area",
    "article",
    "aside",
    "audio",
    "b",
    "base",
    "bdi",
    "bdo",
    "blockquote",
    "body",
    "br",
    "button",
    "canvas",
    "caption",
    "cite",
    "code",
    "col",
    "colgroup",
    "data",
    "datalist",
    "dd",
    "del",
    "details",
    "dfn",
    "dialog",
    "dir",
    "div",
    "dl",
    "dt",
    "em",
    "embed",
    "fieldset",
    "figcaption",
    "figure",
    "font",
    "footer",
    "form",
    "frame",
    "frameset",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "head",
    "header",
    "hgroup",
    "hr",
    "html",
    "i",
    "iframe",
    "img",
    "input",
    "ins",
    "kbd",
    "label",
    "legend",
    "li",
    "link",
    "main",
    "map",
    "mark",
    "marquee",
    "menu",
    "meta",
    "meter",
    "nav",
    "noscript",
    "object",
    "ol",
    "optgroup",
    "option",
    "output",
    "p",
    "param",
    "picture",
    "pre",
    "progress",
    "q",
    "rp",
    "rt",
    "ruby",
    "s",
    "samp",
    "script",
    "section",
    "select",
    "slot",
    "small",
    "source",
    "span",
    "strong",
    "style",
    "sub",
    "summary",
    "sup",
    "table",
    "tbody",
    "td",
    "template",
    "textarea",
    "tfoot",
    "th",
    "thead",
    "time",
    "title",
    "tr",
    "track",
    "u",
    "ul",
    "var",
    "video",
    "wbr"
];
exports.html = (() => {
    let factories = {};
    for (let tag of HTML_ELEMENT_TAG_NAMES) {
        factories[tag] = makeFunctionalElementFactory("http://www.w3.org/1999/xhtml", tag);
    }
    return factories;
})();
const SVG_ELEMENT_TAG_NAMES = [
    "a",
    "animate",
    "animateMotion",
    "animateTransform",
    "circle",
    "clipPath",
    "defs",
    "desc",
    "ellipse",
    "feBlend",
    "feColorMatrix",
    "feComponentTransfer",
    "feComposite",
    "feConvolveMatrix",
    "feDiffuseLighting",
    "feDisplacementMap",
    "feDistantLight",
    "feDropShadow",
    "feFlood",
    "feFuncA",
    "feFuncB",
    "feFuncG",
    "feFuncR",
    "feGaussianBlur",
    "feImage",
    "feMerge",
    "feMergeNode",
    "feMorphology",
    "feOffset",
    "fePointLight",
    "feSpecularLighting",
    "feSpotLight",
    "feTile",
    "feTurbulence",
    "filter",
    "foreignObject",
    "g",
    "image",
    "line",
    "linearGradient",
    "marker",
    "mask",
    "metadata",
    "mpath",
    "path",
    "pattern",
    "polygon",
    "polyline",
    "radialGradient",
    "rect",
    "script",
    "set",
    "stop",
    "style",
    "svg",
    "switch",
    "symbol",
    "text",
    "textPath",
    "title",
    "tspan",
    "use",
    "view"
];
exports.svg = (() => {
    let factories = {};
    for (let tag of SVG_ELEMENT_TAG_NAMES) {
        factories[tag] = makeFunctionalElementFactory("http://www.w3.org/2000/svg", tag);
    }
    return factories;
})();
