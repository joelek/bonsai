"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.svg = exports.html = exports.makeFunctionalElementFactory = exports.FunctionalElementImplementation = exports.serializeStyle = exports.parseStyle = exports.serializeClass = exports.parseClass = exports.createNode = exports.serializeValue = void 0;
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
exports.serializeValue = serializeValue;
;
function createNode(value) {
    if (value instanceof Node) {
        return value;
    }
    else {
        return document.createTextNode(serializeValue(value));
    }
}
exports.createNode = createNode;
;
function parseClass(value) {
    let values = [];
    for (let chunk of value.trim().split(/\s+/)) {
        let value = chunk;
        if (value !== "") {
            values.push(value);
        }
    }
    return values;
}
exports.parseClass = parseClass;
;
function serializeClass(value) {
    if (value instanceof Array) {
        let array = value;
        return array
            .filter((value) => typeof value !== "undefined")
            .map(serializeValue)
            .join(" ");
    }
    else {
        return serializeValue(value);
    }
}
exports.serializeClass = serializeClass;
;
function parseStyle(value) {
    let values = {};
    for (let chunk of value.trim().split(";")) {
        let parts = chunk.split(":");
        let key = parts[0].trim();
        let value = parts.slice(1).join(":").trim();
        if (key !== "" && value !== "") {
            values[key] = value;
        }
    }
    return values;
}
exports.parseStyle = parseStyle;
;
function serializeStyle(value) {
    if (value instanceof Object && value.constructor === Object) {
        let object = value;
        return Object.entries(object)
            .filter(([key, value]) => typeof value !== "undefined")
            .map(([key, value]) => `${key}: ${serializeValue(value)}`)
            .join("; ");
    }
    else {
        return serializeValue(value);
    }
}
exports.serializeStyle = serializeStyle;
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
            if (Object.getOwnPropertyNames(bindings).length === 0 && Object.getOwnPropertySymbols(bindings).length === 0) {
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
                if (key === "class") {
                    value = serializeClass(value);
                }
                if (key === "style") {
                    value = serializeStyle(value);
                }
                this.setAttribute(key, serializeValue(value));
            }
        };
        let get = (key) => {
            let value = this.getAttribute(key);
            if (value == null) {
                return;
            }
            if (key === "class") {
                return parseClass(value);
            }
            if (key === "style") {
                return parseStyle(value);
            }
            return value;
        };
        let set = (key, value) => {
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
                if (key === "value") {
                    if (this instanceof HTMLInputElement || this instanceof HTMLTextAreaElement) {
                        let element = this;
                        element.onchange = (event) => {
                            state.update(element.value);
                        };
                    }
                }
            }
            else {
                if (key === "class") {
                    let values = [...value];
                    for (let index = 0; index < values.length; index++) {
                        let value = values[index];
                        if (value instanceof state_1.AbstractState) {
                            values[index] = value.value();
                            this.bindings = this.bindings ?? {};
                            (this.bindings[key] = this.bindings[key] ?? []).push(value.observe("update", (value) => {
                                values[index] = value.value();
                                update("class", values);
                            }));
                        }
                    }
                    update(key, values);
                }
                else if (key === "style") {
                    let values = { ...value };
                    for (let key in values) {
                        let value = values[key];
                        if (value instanceof state_1.AbstractState) {
                            values[key] = value.value();
                            this.bindings = this.bindings ?? {};
                            (this.bindings[key] = this.bindings[key] ?? []).push(value.observe("update", (value) => {
                                values[key] = value.value();
                                update("style", values);
                            }));
                        }
                    }
                    update(key, values);
                }
                else {
                    update(key, value);
                }
            }
            return this;
        };
        if (arguments.length === 1) {
            return get(key);
        }
        else {
            return set(key, value);
        }
    }
    listener(type, listener) {
        if (typeof listener === "undefined") {
            this[type] = undefined;
        }
        else {
            this[type] = (event) => {
                return listener(event, this);
            };
        }
        return this;
    }
    nodes(...children) {
        let getOffset = (forChildIndex) => {
            let offset = 0;
            for (let childIndex = 0; childIndex < forChildIndex; childIndex++) {
                let item = children[childIndex];
                if (item instanceof state_1.ArrayState) {
                    offset += item.length();
                }
                else if (item instanceof Array) {
                    offset += item.length;
                }
                else {
                    offset += 1;
                }
            }
            return offset;
        };
        this.unbind(INSERT);
        this.unbind(REMOVE);
        this.unbind(UPDATE);
        for (let index = this.childNodes.length - 1; index >= 0; index--) {
            this.childNodes[index].remove();
        }
        for (let childIndex = 0; childIndex < children.length; childIndex++) {
            let child = children[childIndex];
            if (child instanceof state_1.ArrayState) {
                let state = child;
                let bindings = this.bindings = this.bindings ?? {};
                let insertBindings = bindings[INSERT] ?? [];
                insertBindings[childIndex] = state.observe("insert", (state, index) => {
                    let value = state.value();
                    this.insertBefore(createNode(value), this.childNodes.item(getOffset(childIndex) + index));
                    let subscription = state.observe("update", (state) => {
                        let value = state.value();
                        this.replaceChild(createNode(value), this.childNodes.item(getOffset(childIndex) + index));
                    });
                    let updateBindings = bindings[UPDATE] ?? [];
                    updateBindings.splice(getOffset(childIndex) + index, 0, subscription);
                });
                let removeBindings = bindings[REMOVE] ?? [];
                removeBindings[childIndex] = state.observe("remove", (state, index) => {
                    this.childNodes[getOffset(childIndex) + index].remove();
                    let updateBindings = bindings[UPDATE] ?? [];
                    let subscription = updateBindings[getOffset(childIndex) + index];
                    if (subscription != null) {
                        subscription();
                        updateBindings.splice(getOffset(childIndex) + index, 1);
                        if (updateBindings.length === 0) {
                            delete bindings[UPDATE];
                        }
                    }
                });
                let updateBindings = bindings[UPDATE] ?? [];
                for (let index = 0; index < state.length(); index++) {
                    let element = state.element(index);
                    this.appendChild(createNode(element.value()));
                    updateBindings[getOffset(childIndex) + index] = element.observe("update", (state) => {
                        let value = state.value();
                        this.replaceChild(createNode(value), this.childNodes.item(getOffset(childIndex) + index));
                    });
                }
            }
            else if (child instanceof state_1.AbstractState) {
                let state = child;
                let bindings = this.bindings = this.bindings ?? {};
                let updateBindings = bindings[UPDATE] ?? [];
                this.appendChild(createNode(state.value()));
                updateBindings[getOffset(childIndex)] = state.observe("update", (state) => {
                    let value = state.value();
                    this.replaceChild(createNode(value), this.childNodes.item(getOffset(childIndex)));
                });
            }
            else {
                this.appendChild(createNode(child));
            }
        }
        return this;
    }
    process(callback) {
        callback(this);
        return this;
    }
    setAttribute(key, value) {
        super.setAttribute(key, value);
        if (key === "value") {
            if (this instanceof HTMLInputElement || this instanceof HTMLTextAreaElement) {
                this.value = value;
            }
        }
    }
}
exports.FunctionalElementImplementation = FunctionalElementImplementation;
;
function makeFunctionalElementFactory(namespace, tag) {
    let element = document.createElementNS(namespace, tag);
    let parentPrototype = Object.getPrototypeOf(element);
    let prototype = Object.create(parentPrototype);
    for (let [name, propertyDescriptor] of Object.entries(Object.getOwnPropertyDescriptors(FunctionalElementImplementation.prototype))) {
        if (name === "constructor") {
            continue;
        }
        Object.defineProperty(prototype, name, propertyDescriptor);
    }
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
        let parentPropertyDescriptor = Object.getOwnPropertyDescriptor(parentPrototype, "value");
        Object.defineProperty(prototype, "value", {
            get() {
                return parentPropertyDescriptor?.get?.call?.(this);
            },
            set(value) {
                let oldValue = this.value;
                parentPropertyDescriptor?.set?.call?.(this, value);
                let newValue = this.value;
                if (newValue !== oldValue) {
                    this.dispatchEvent(new Event("change", { bubbles: true }));
                }
            }
        });
    }
    return (...children) => {
        let element = document.createElementNS(namespace, tag);
        Object.setPrototypeOf(element, prototype);
        if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
            let that = element;
            that.addEventListener("change", (event) => {
                that.setAttribute("value", that.value);
            });
        }
        element.nodes(...children);
        return element;
    };
}
exports.makeFunctionalElementFactory = makeFunctionalElementFactory;
;
exports.html = new Proxy({}, {
    get: (target, key) => {
        let tag = key;
        let factory = target[tag];
        if (factory == null) {
            factory = target[tag] = makeFunctionalElementFactory("http://www.w3.org/1999/xhtml", tag);
        }
        return factory;
    }
});
exports.svg = new Proxy({}, {
    get: (target, key) => {
        let tag = key;
        let factory = target[tag];
        if (factory == null) {
            factory = target[tag] = makeFunctionalElementFactory("http://www.w3.org/2000/svg", tag);
        }
        return factory;
    }
});
