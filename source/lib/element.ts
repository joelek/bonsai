import { AbstractState, ArrayValue, Attribute, CancellationToken, flatten, RecordValue, State, stateify, Value } from "./state";

export type AttributeRecord = { [key: string]: Attribute<Value>; };

export type AttributeRecordMapper = (attributes: AttributeRecord) => AttributeRecord;

export type AttributeArray = Attribute<Value>[];

export type AttributeArrayMapper = (attributes: AttributeArray) => AttributeArray;

export type Child = Array<Child> | (Value | Node) | State<Value | Node>;

export type Children = Array<Child | State<Child>>;

export type FunctionalElementListener<A extends Event, B extends Element> = (event: A, element: B) => void;

export type FunctionalElementEventMap<A> = {
	[B in keyof A]: Event;
};

export type AttributeAugmentations<A extends FunctionalElementEventMap<A>, B extends Element> = {
	[key: string]: Attribute<Value>;
};

export type ClassAugmentations<A extends FunctionalElementEventMap<A>, B extends Element> = {
	["class"]?: AttributeArray | AttributeArrayMapper;
};

export type StyleAugmentations<A extends FunctionalElementEventMap<A>, B extends Element> = {
	["style"]?: AttributeRecord | AttributeRecordMapper;
};

export type ListenerAugmentations<A extends FunctionalElementEventMap<A>, B extends Element> = {
	[C in `on${keyof A & string}`]?: C extends `on${infer D extends keyof A & string}` ? FunctionalElementListener<A[D], B> : never;
};

export type Augmentations<A extends FunctionalElementEventMap<A>, B extends Element> = AttributeAugmentations<A, B> & ClassAugmentations<A, B> & StyleAugmentations<A, B> & ListenerAugmentations<A, B>;

export type ElementAugmentations<A extends FunctionalElementEventMap<A>, B extends Element> = Augmentations<A, B> & {
	["class"]?: AttributeArray;
	["style"]?: AttributeRecord;
};

export function serializeValue(value: Value): string {
	if (typeof value === "string") {
		return value;
	}
	if (typeof value === "undefined") {
		return "";
	}
	return JSON.stringify(value, (key, value) => {
		if (typeof value === "bigint") {
			return `${value}`;
		} else {
			return value;
		}
	});
};

export function createNode(value: Value | Node): Node {
	if (value instanceof Node) {
		return value;
	} else if (value instanceof Promise) {
		let placeholder = document.createTextNode("");
		value
			.catch(() => undefined)
			.then((value) => placeholder.replaceWith(createNode(value)));
		return placeholder;
	} else {
		return document.createTextNode(serializeValue(value));
	}
};

export function parseClass(value: string): Array<string> {
	let values = [] as Array<string>;
	for (let chunk of value.trim().split(/\s+/)) {
		let value = chunk;
		if (value !== "") {
			values.push(value);
		}
	}
	return values;
};

export function serializeClass(value: Value): string | undefined {
	if (value instanceof Array) {
		let array = value as ArrayValue;
		return array
			.filter((value) => typeof value !== "undefined")
			.map(serializeValue)
			.join(" ") || undefined;
	} else {
		return serializeValue(value);
	}
};

export function parseStyle(value: string): Record<string, string> {
	let values = {} as Record<string, string>;
	for (let chunk of value.trim().split(";")) {
		let parts = chunk.split(":");
		let key = parts[0].trim();
		let value = parts.slice(1).join(":").trim();
		if (key !== "" && value !== "") {
			values[key] = value;
		}
	}
	return values;
};

export function serializeStyle(value: Value): string | undefined {
	if (value instanceof Object && value.constructor === Object) {
		let object = value as RecordValue;
		return Object.entries(object)
			.filter(([key, value]) => typeof value !== "undefined")
			.map(([key, value]) => `${key}: ${serializeValue(value)}`)
			.join("; ") || undefined;
	} else {
		return serializeValue(value);
	}
};

const INSERT = Symbol();
const REMOVE = Symbol();
const UPDATE = Symbol();
const CLASS = Symbol();
const STYLE = Symbol();

export class FunctionalElementImplementation<A extends FunctionalElementEventMap<A>> extends Element {
	protected [CLASS]?: AttributeArray;
	protected [STYLE]?: AttributeRecord;
	protected bindings?: { [key: string | symbol]: Array<CancellationToken | undefined> | undefined; };

	protected unbind(key: string | symbol): void {
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

	attribute<A extends string>(key: A extends "class" | "style" ? never : A): string | undefined;
	attribute(key: "class"): AttributeArray;
	attribute(key: "style"): AttributeRecord;
	attribute<A extends string>(key: A extends "class" | "style" ? never : A, attribute: Attribute<Value>): this;
	attribute<A extends AttributeArray>(key: "class", attribute: A | AttributeArrayMapper | undefined): this;
	attribute<A extends AttributeRecord>(key: "style", attribute: A | AttributeRecordMapper | undefined): this;
	attribute(key: string, attribute?: Attribute<Value> | AttributeArrayMapper | AttributeRecordMapper | undefined): this | string | AttributeArray | AttributeRecord | undefined {
		let update = (key: string, value: Value) => {
			if (key === "class") {
				value = serializeClass(value);
			}
			if (key === "style") {
				value = serializeStyle(value);
			}
			if (typeof value === "undefined") {
				this.removeAttribute(key);
			} else {
				this.setAttribute(key, serializeValue(value));
			}
		};
		let get = (key: string) => {
			let value = this.getAttribute(key);
			if (key === "class") {
				return [ ...(this[CLASS] ?? parseClass(value ?? "")) ];
			}
			if (key === "style") {
				return { ...(this[STYLE] ?? parseStyle(value ?? "")) };
			}
			if (value == null) {
				return;
			}
			return value;
		};
		let set = (key: string, attribute: Attribute<Value> | AttributeArrayMapper | AttributeRecordMapper | undefined) => {
			this.unbind(key);
			if (attribute instanceof AbstractState) {
				let state = attribute as AbstractState<any, any>;
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
					if (this instanceof HTMLInputElement || this instanceof HTMLTextAreaElement || this instanceof HTMLSelectElement) {
						let element = this;
						element.onchange = (event) => {
							state.update(element.value);
						};
					}
				}
			} else {
				if (typeof attribute === "undefined") {
					if (key === "class") {
						delete this[CLASS];
					} else if (key === "style") {
						delete this[STYLE];
					}
					update(key, attribute);
				} else {
					if (key === "class") {
						if (typeof attribute === "function") {
							attribute = (attribute as AttributeArrayMapper)(get("class") as AttributeArray);
						}
						let attributes = this[CLASS] = [ ...attribute as AttributeArray ];
						let values = [] as ArrayValue;
						for (let index = 0; index < attributes.length; index++) {
							let attribute = attributes[index];
							if (attribute instanceof AbstractState) {
								let state = attribute as AbstractState<any, any>;
								values[index] = attribute.value();
								this.bindings = this.bindings ?? {};
								(this.bindings["class"] = this.bindings["class"] ?? []).push(state.observe("update", (value) => {
									values[index] = value.value();
									update("class", values);
								}));
							} else {
								values[index] = attribute;
							}
						}
						update(key, values);
					} else if (key === "style") {
						if (typeof attribute === "function") {
							attribute = (attribute as AttributeRecordMapper)(get("style") as AttributeRecord);
						}
						let attributes = this[STYLE] = { ...attribute as AttributeRecord };
						let values = {} as RecordValue;
						for (let key in attributes) {
							let attribute = attributes[key];
							if (attribute instanceof AbstractState) {
								let state = attribute as AbstractState<any, any>;
								values[key] = attribute.value();
								this.bindings = this.bindings ?? {};
								(this.bindings["style"] = this.bindings["style"] ?? []).push(state.observe("update", (value) => {
									values[key] = value.value();
									update("style", values);
								}));
							} else {
								values[key] = attribute;
							}
						}
						update(key, values);
					} else {
						update(key, attribute);
					}
				}
			}
			return this;
		};
		if (arguments.length === 1) {
			return get(key);
		} else {
			return set(key, attribute);
		}
	}

	augment(augmentations: Augmentations<A, this>): this {
		for (let key in augmentations) {
			let augmentation = augmentations[key as keyof Augmentations<A, this>];
			if (/^on(.+)/.test(key)) {
				this.listener(key as `on${keyof A & string}`, augmentation as FunctionalElementListener<A[keyof A], this>);
			} else {
				this.attribute(key, augmentation);
			}
		}
		return this;
	}

	listener<B extends keyof A & string>(type: `on${B}`, listener: FunctionalElementListener<A[B], this> | undefined): this {
		if (typeof listener === "undefined") {
			(this as any)[type] = undefined;
		} else {
			(this as any)[type] = (event: A[B]) => {
				return listener(event, this);
			};
		}
		return this;
	}

	nodes(...children: Children): this {
		this.unbind(INSERT);
		this.unbind(REMOVE);
		this.unbind(UPDATE);
		for (let index = this.childNodes.length - 1; index >= 0; index--) {
			this.childNodes[index].remove();
		}
		let bindings = this.bindings = this.bindings ?? {};
		let update_bindings = bindings[UPDATE] = bindings[UPDATE] ?? [];
		let state = flatten(stateify(children));
		for (let child of state) {
			let node = createNode(child.value());
			this.appendChild(node);
			update_bindings.push(child.observe("update", (state) => {
				let new_node = createNode(state.value());
				this.replaceChild(new_node, node);
				node = new_node;
			}));
		}
		let insert_bindings = bindings[INSERT] = bindings[INSERT] ?? [];
		insert_bindings.push(state.observe("insert", (state, index) => {
			let node = createNode(state.value());
			this.insertBefore(node, this.childNodes.item(index));
			update_bindings.splice(index, 0, state.observe("update", (state) => {
				let new_node = createNode(state.value());
				this.replaceChild(new_node, node);
				node = new_node;
			}))
		}));
		let remove_bindings = bindings[REMOVE] = bindings[REMOVE] ?? [];
		remove_bindings.push(state.observe("remove", (state, index) => {
			this.removeChild(this.childNodes.item(index));
			let subscription = update_bindings[index];
			subscription?.();
			update_bindings.splice(index, 1);
		}));
		return this;
	}

	process(callback: (element: this) => void): this {
		callback(this);
		return this;
	}

	removeAttribute(key: string): void {
		super.removeAttribute(key);
		if (key === "value") {
			if (this instanceof HTMLInputElement || this instanceof HTMLTextAreaElement || this instanceof HTMLSelectElement) {
				this.value = "";
			}
		}
	}

	setAttribute(key: string, value: string): void {
		super.setAttribute(key, value);
		if (key === "value") {
			if (this instanceof HTMLInputElement || this instanceof HTMLTextAreaElement || this instanceof HTMLSelectElement) {
				this.value = value;
			}
		}
	}
};

export type FunctionalElement<A extends FunctionalElementEventMap<A>, B extends Element> = FunctionalElementImplementation<A> & B;
export type FunctionalElementFactory<A extends FunctionalElementEventMap<A>, B extends Element> = (agumentations?: ElementAugmentations<A, B>, ...children: Children) => FunctionalElement<A, B>;

export type Namespace = "http://www.w3.org/1999/xhtml" | "http://www.w3.org/2000/svg";

export function makeFunctionalElementFactory<A extends FunctionalElementEventMap<A>, B extends Element>(namespace: Namespace, tag: string): FunctionalElementFactory<A, B> {
	let element = document.createElementNS(namespace, tag);
	let parentPrototype = Object.getPrototypeOf(element);
	let prototype = Object.create(parentPrototype);
	for (let [name, propertyDescriptor] of Object.entries(Object.getOwnPropertyDescriptors(FunctionalElementImplementation.prototype))) {
		if (name === "constructor") {
			continue;
		}
		Object.defineProperty(prototype, name, propertyDescriptor);
	}
	if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
		let parentPropertyDescriptor = Object.getOwnPropertyDescriptor(parentPrototype, "value");
		Object.defineProperty(prototype, "value", {
			get(this: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement) {
				return parentPropertyDescriptor?.get?.call?.(this);
			},
			set(this: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, value: any) {
				let oldValue = this.value;
				try {
					// Not all input element values may be changed programmatically.
					parentPropertyDescriptor?.set?.call?.(this, value);
				} catch (error) {}
				let newValue = this.value;
				if (newValue !== oldValue) {
					this.dispatchEvent(new Event("change", { bubbles: true }));
				}
			}
		});
	}
	return (agumentations?: ElementAugmentations<A, B>, ...children: Children) => {
		let element = document.createElementNS(namespace, tag) as FunctionalElement<A, B>;
		Object.setPrototypeOf(element, prototype);
		if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
			let that = element;
			that.addEventListener("change", (event) => {
				that.setAttribute("value", that.value);
			});
		}
		if (agumentations != null) {
			element.augment(agumentations);
		}
		element.nodes(...children);
		return element;
	}
};

export type HTMLElementAugmentations<B extends Element> = ElementAugmentations<HTMLElementEventMap, B>;
export type FunctionalHTMLElement<A extends HTMLElement> = FunctionalElement<HTMLElementEventMap, A>;
export type FunctionalHTMLElementFactory<A extends HTMLElement> = FunctionalElementFactory<HTMLElementEventMap, A>;
export type FunctionalHTMLElementFactories = {
	[A in keyof HTMLElementTagNameMap]: FunctionalHTMLElementFactory<HTMLElementTagNameMap[A]>;
};

export const html = new Proxy({} as FunctionalHTMLElementFactories, {
	get: (target, key) => {
		let tag = key as keyof FunctionalHTMLElementFactories;
		let factory = target[tag];
		if (factory == null) {
			factory = target[tag] = makeFunctionalElementFactory("http://www.w3.org/1999/xhtml", tag) as any;
		}
		return factory;
	}
});

export type SVGElementAugmentations<B extends Element> = ElementAugmentations<SVGElementEventMap, B>;
export type FunctionalSVGElement<A extends SVGElement> = FunctionalElement<SVGElementEventMap, A>;
export type FunctionalSVGElementFactory<A extends SVGElement> = FunctionalElementFactory<SVGElementEventMap, A>;
export type FunctionalSVGElementFactories = {
	[A in keyof SVGElementTagNameMap]: FunctionalSVGElementFactory<SVGElementTagNameMap[A]>;
};

export const svg = new Proxy({} as FunctionalSVGElementFactories, {
	get: (target, key) => {
		let tag = key as keyof FunctionalSVGElementFactories;
		let factory = target[tag];
		if (factory == null) {
			factory = target[tag] = makeFunctionalElementFactory("http://www.w3.org/2000/svg", tag) as any;
		}
		return factory;
	}
});
