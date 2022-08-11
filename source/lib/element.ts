import { ArrayState, AbstractState, State, CancellationToken, Value } from "./state";

type Attribute = Value | State<Value>;

type Attributes = {
	[key: string]: Attribute;
};

type FunctionalElementListener<A extends Event, B extends Element> = (event: A, element: B) => void;

type FunctionalElementEventMap<A> = {
	[B in keyof A]: Event;
};

type FunctionalElementListeners<A extends FunctionalElementEventMap<A>, B extends Element> = {
	[C in `on${keyof A & string}`]?: C extends `on${infer D extends keyof A & string}` ? FunctionalElementListener<A[D], FunctionalElement<A, B>> : never;
};

function serializeValue(value: Value): string {
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

function createNode(value: Value | Node): Node {
	if (value instanceof Node) {
		return value;
	} else {
		return document.createTextNode(serializeValue(value));
	}
};

const INSERT = Symbol();
const REMOVE = Symbol();
const UPDATE = Symbol();

class FunctionalElementImplementation<A extends FunctionalElementEventMap<A>> extends Element {
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
			if (Object.getOwnPropertyDescriptors(bindings).length === 0) {
				delete this.bindings;
			}
		}
	}

	attribute(key: string, value?: Attribute): this {
		let update = (key: string, value?: Value): void => {
			if (typeof value === "undefined") {
				this.removeAttribute(key);
			} else {
				this.setAttribute(key, serializeValue(value));
			}
		};
		this.unbind(key);
		if (value instanceof AbstractState) {
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
		} else {
			update(key, value);
		}
		return this;
	}

	listener<B extends keyof A & string>(type: `on${B}`, listener?: FunctionalElementListener<A[B], this> | undefined): this {
		if (typeof listener === "undefined") {
			(this as any)[type] = undefined;
		} else {
			(this as any)[type] = (event: A[B]) => {
				listener(event, this);
			};
		}
		return this;
	}

	nodes<A extends Value | Node>(items: ArrayState<A> | Array<Value | Node | State<Value | Node>>): this {
		this.unbind(INSERT);
		this.unbind(REMOVE);
		this.unbind(UPDATE);
		for (let index = this.childNodes.length - 1; index >= 0; index--) {
			this.childNodes[index].remove();
		}
		if (items instanceof ArrayState) {
			let bindings = this.bindings = (this.bindings ?? {});
			bindings[INSERT] = [
				items.observe("insert", (state, index) => {
					let value = state.value();
					this.insertBefore(createNode(value), this.childNodes.item(index));
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
		} else {
			for (let index = 0; index < items.length; index++) {
				let item = items[index];
				if (item instanceof AbstractState) {
					let bindings = this.bindings = (this.bindings ?? {});
					bindings[UPDATE] = (bindings[UPDATE] ?? []);
					this.appendChild(createNode(item.value()));
					let subscriber = item.observe("update", (state) => {
						let value = state.value();
						this.replaceChild(createNode(value), this.childNodes.item(index));
					});
					bindings[UPDATE][index] = subscriber;
				} else {
					this.appendChild(createNode(item));
				}
			}
		}
		return this;
	}

	process(callback: (element: this) => void): this {
		callback(this);
		return this;
	}
};

type FunctionalElement<A extends FunctionalElementEventMap<A>, B extends Element> = FunctionalElementImplementation<A> & B;
type FunctionalElementFactory<A extends FunctionalElementEventMap<A>, B extends Element> = (classAttribute?: Attribute) => FunctionalElement<A, B>;

type Namespace = "http://www.w3.org/1999/xhtml" | "http://www.w3.org/2000/svg";

function makeFunctionalElementFactory<A extends FunctionalElementEventMap<A>, B extends Element>(namespace: Namespace, tag: string): FunctionalElementFactory<A, B> {
	let prototype = Object.create(Object.getPrototypeOf(document.createElementNS(namespace, tag)));
	for (let [name, propertyDescriptor] of Object.entries(Object.getOwnPropertyDescriptors(FunctionalElementImplementation.prototype))) {
		if (name === "constructor") {
			continue;
		}
		Object.defineProperty(prototype, name, propertyDescriptor);
	}
	return (classAttribute?: Attribute) => {
		let element = document.createElementNS(namespace, tag) as FunctionalElement<A, B>;
		Object.setPrototypeOf(element, prototype);
		element.attribute("class", classAttribute);
		return element;
	}
};

type FunctionalHTMLElement<A extends HTMLElement> = FunctionalElement<HTMLElementEventMap, A>;
type FunctionalHTMLElementFactory<A extends HTMLElement> = FunctionalElementFactory<HTMLElementEventMap, A>;
type FunctionalHTMLElementFactories = {
	[A in keyof HTMLElementTagNameMap]: FunctionalHTMLElementFactory<HTMLElementTagNameMap[A]>;
};

export const html = new Proxy({} as FunctionalHTMLElementFactories, {
	get: (target, key) => {
		let tag = key as keyof FunctionalHTMLElementFactories;
		let factory = target[tag];
		if (factory == null) {
			factory = target[tag] = makeFunctionalElementFactory("http://www.w3.org/1999/xhtml", tag) as any
		}
		return factory;
	}
});

type FunctionalSVGElement<A extends SVGElement> = FunctionalElement<SVGElementEventMap, A>;
type FunctionalSVGElementFactory<A extends SVGElement> = FunctionalElementFactory<SVGElementEventMap, A>;
type FunctionalSVGElementFactories = {
	[A in keyof SVGElementTagNameMap]: FunctionalSVGElementFactory<SVGElementTagNameMap[A]>;
};

export const svg = new Proxy({} as FunctionalSVGElementFactories, {
	get: (target, key) => {
		let tag = key as keyof FunctionalSVGElementFactories;
		let factory = target[tag];
		if (factory == null) {
			factory = target[tag] = makeFunctionalElementFactory("http://www.w3.org/2000/svg", tag) as any
		}
		return factory;
	}
});
