import { ArrayState, AbstractState, State, CancellationToken, Value, RecordValue, ArrayValue, AbstractStateEvents } from "./state";

export type Attribute<A extends Value> = A | State<A>;

export type AttributeRecord = { [key: string]: Attribute<Value>; };

export type AttributeArray = Attribute<Value>[];

export type Children = Array<ArrayState<Node | Value> | Value | Node | State<Value | Node>>;

export type FunctionalElementListener<A extends Event, B extends Element> = (event: A, element: B) => void;

export type FunctionalElementEventMap<A> = {
	[B in keyof A]: Event;
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
	attribute(key: "class"): AttributeArray | undefined;
	attribute(key: "style"): AttributeRecord | undefined;
	attribute<A extends string>(key: A extends "class" | "style" ? never : A, attribute: Attribute<Value>): this;
	attribute<A extends AttributeArray>(key: "class", attribute: A | undefined): this;
	attribute<A extends AttributeRecord>(key: "style", attribute: A | undefined): this;
	attribute(key: string, attribute?: Attribute<Value>): this | string | AttributeArray | AttributeRecord | undefined {
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
			if (value == null) {
				return;
			}
			if (key === "class") {
				return [ ...(this[CLASS] ?? parseClass(value)) ];
			}
			if (key === "style") {
				return { ...(this[STYLE] ?? parseStyle(value)) };
			}
			return value;
		};
		let set = (key: string, attribute: Attribute<Value>) => {
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
					if (this instanceof HTMLInputElement || this instanceof HTMLTextAreaElement) {
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
		let getOffset = (forChildIndex: number): number => {
			let offset = 0;
			for (let childIndex = 0; childIndex < forChildIndex; childIndex++) {
				let item = children[childIndex];
				if (item instanceof ArrayState) {
					offset += item.length().value();
				} else if (item instanceof Array) {
					offset += item.length;
				} else {
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
			if (child instanceof ArrayState) {
				let state = child as ArrayState<Value | Node>;
				let bindings = this.bindings = this.bindings ?? {};
				let insertBindings = bindings[INSERT] = bindings[INSERT] ?? [];
				insertBindings[childIndex] = state.observe("insert", (state, index) => {
					let value = state.value();
					this.insertBefore(createNode(value), this.childNodes.item(getOffset(childIndex) + index));
					let subscription = state.observe("update", (state) => {
						let value = state.value();
						this.replaceChild(createNode(value), this.childNodes.item(getOffset(childIndex) + index));
					});
					let updateBindings = bindings[UPDATE] = bindings[UPDATE] ?? [];
					updateBindings.splice(getOffset(childIndex) + index, 0, subscription);
				});
				let removeBindings = bindings[REMOVE] = bindings[REMOVE] ?? [];
				removeBindings[childIndex] = state.observe("remove", (state, index) => {
					this.childNodes[getOffset(childIndex) + index].remove();
					let updateBindings = bindings[UPDATE] = bindings[UPDATE] ?? [];
					let subscription = updateBindings[getOffset(childIndex) + index];
					if (subscription != null) {
						subscription();
						updateBindings.splice(getOffset(childIndex) + index, 1);
						if (updateBindings.length === 0) {
							delete bindings[UPDATE];
						}
					}
				});
				let updateBindings = bindings[UPDATE] = bindings[UPDATE] ?? [];
				for (let index = 0; index < state.length().value(); index++) {
					let element = state.element(index);
					this.appendChild(createNode(element.value()));
					updateBindings[getOffset(childIndex) + index] = element.observe("update", (state) => {
						let value = state.value();
						this.replaceChild(createNode(value), this.childNodes.item(getOffset(childIndex) + index));
					});
				}
			} else if (child instanceof AbstractState) {
				let state = child as AbstractState<Node | Value, AbstractStateEvents<Node | Value>>;
				let bindings = this.bindings = this.bindings ?? {};
				let updateBindings = bindings[UPDATE] = bindings[UPDATE] ?? [];
				this.appendChild(createNode(state.value()));
				updateBindings[getOffset(childIndex)] = state.observe("update", (state) => {
					let value = state.value();
					this.replaceChild(createNode(value), this.childNodes.item(getOffset(childIndex)));
				});
			} else {
				this.appendChild(createNode(child));
			}
		}
		return this;
	}

	process(callback: (element: this) => void): this {
		callback(this);
		return this;
	}

	setAttribute(key: string, value: string): void {
		super.setAttribute(key, value);
		if (key === "value") {
			if (this instanceof HTMLInputElement || this instanceof HTMLTextAreaElement) {
				this.value = value;
			}
		}
	}
};

export type FunctionalElement<A extends FunctionalElementEventMap<A>, B extends Element> = FunctionalElementImplementation<A> & B;
export type FunctionalElementFactory<A extends FunctionalElementEventMap<A>, B extends Element> = (...children: Children) => FunctionalElement<A, B>;

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
	if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
		let parentPropertyDescriptor = Object.getOwnPropertyDescriptor(parentPrototype, "value");
		Object.defineProperty(prototype, "value", {
			get(this: HTMLInputElement | HTMLTextAreaElement) {
				return parentPropertyDescriptor?.get?.call?.(this);
			},
			set(this: HTMLInputElement | HTMLTextAreaElement, value: any) {
				let oldValue = this.value;
				parentPropertyDescriptor?.set?.call?.(this, value);
				let newValue = this.value;
				if (newValue !== oldValue) {
					this.dispatchEvent(new Event("change", { bubbles: true }));
				}
			}
		});
	}
	return (...children: Children) => {
		let element = document.createElementNS(namespace, tag) as FunctionalElement<A, B>;
		Object.setPrototypeOf(element, prototype);
		if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
			let that = element;
			that.addEventListener("change", (event) => {
				that.setAttribute("value", that.value);
			});
		}
		element.nodes(...children);
		return element;
	}
};

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
