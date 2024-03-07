import { getOrderedIndex } from "./utils";

type ExpansionOf<A> = A extends infer B ? { [C in keyof B]: B[C] } : never;
type Mutable<A> = { -readonly [B in keyof A]: Mutable<A[B]> };
type RecursiveArray<A> = Array<A | RecursiveArray<A>>;

export type StateOrValue<A extends Value> = A | State<A>;

export type Attribute<A extends Value> = State<A> | (
	A extends ArrayValue ? { [B in keyof A]: A[B] extends Value ? Attribute<A[B]> : never; } :
	A extends RecordValue ? { [B in keyof A]: A[B] extends Value ? Attribute<A[B]> : never; } :
	A
);

// TODO: Remove.
export type Attributes<A extends Value> = Attribute<A>;

export type ValueFromAttribute<A extends Attribute<Value>> =
	A extends State<infer B> ? B :
	A extends ArrayValue ? { [B in keyof A]: A[B] extends Attribute<infer C> ? ValueFromAttribute<C> : never; } :
	A extends RecordValue ? { [B in keyof A]: A[B] extends Attribute<infer C> ? ValueFromAttribute<C> : never; } :
	A
;

export type StateFromAttribute<A extends Attribute<Value>> = State<ValueFromAttribute<A>>;

export type TupleRecord<A extends TupleRecord<A>> = { [C in keyof A]: any[]; };

export type PrimitiveValue = symbol | void | bigint | boolean | number | string | null | undefined;

export type ReferenceValue = Object;

export type Value = PrimitiveValue | ReferenceValue | any[] | { [key: string]: any };

export type ArrayValue = Value[];

export type RecordValue = { [key: string]: Value; };

export type StateMapper<A extends Value, B extends Value> = (state: State<A>, index: State<number>) => B | State<B>;

export type ValueMapper<A extends Value, B extends Value> = (value: A, index: number) => B;

export type Predicate<A extends Value> = (state: State<A>, index: State<number>) => State<boolean>;

export type Observer<A extends any[]> = (...args: A) => void;

export type Computer<A extends Value, B extends Value> = (value: A) => B;

export type CancellationToken = () => void;

export type State<A extends Value> = AbstractState<A, AbstractStateEvents<A>> & (
	A extends PrimitiveValue ? PrimitiveState<A> :
	A extends ReadonlyArray<infer B extends Value> | Array<infer B extends Value> ? ElementStates<A> & ArrayState<B> :
	A extends RecordValue ? MemberStates<A> & ObjectState<A> :
	A extends ReferenceValue ? ReferenceState<A> :
	never
);

export type StateTupleFromValueTuple<A extends Value[]> = {
	[B in keyof A]: State<A[B]>;
};

export type ElementStates<A> = {
	[B in keyof A & number]: A[B] extends Value ? State<A[B]> : never;
};

export type MemberStates<A> = {
	[B in keyof A]-?: A[B] extends Value ? State<A[B]> : never;
};

export type AbstractStateEvents<A extends Value> = {
	"update": [
		state: AbstractState<A, AbstractStateEvents<A>>
	];
};

export abstract class AbstractState<A extends Value, B extends TupleRecord<B> & AbstractStateEvents<A>> {
	protected observers: { [C in keyof B]?: Array<Observer<any>> };

	protected notify<C extends keyof B>(type: C, ...args: [...B[C]]): void {
		let observers = this.observers[type];
		if (observers == null) {
			return;
		}
		// Prevent issues arising from mutating the array of observers while notifying.
		observers = [ ...observers ];
		for (let index = 0; index < observers.length; index++) {
			observers[index](...args);
		}
	}

	constructor() {
		this.observers = {};
	}

	compute<C extends Value>(computer: Computer<A, C>): State<C> {
		let computed = make_state(computer(this.value()));
		this.observe("update", (state) => {
			computed.update(computer(state.value()));
		});
		return computed;
	}

	observe<C extends keyof B>(type: C, observer: Observer<B[C]>): CancellationToken {
		let observers = this.observers[type];
		if (observers == null) {
			this.observers[type] = observers = [];
		}
		observers.push(observer);
		return () => {
			this.unobserve(type, observer);
		};
	}

	unobserve<C extends keyof B>(type: C, observer: Observer<B[C]>): void {
		let observers = this.observers[type];
		if (observers == null) {
			return;
		}
		let index = observers.lastIndexOf(observer);
		if (index < 0) {
			return;
		}
		observers.splice(index, 1);
		if (observers.length === 0) {
			delete this.observers[type];
		}
	}

	abstract update(value: A): boolean;
	abstract value(): A;
};

export type PrimitiveStateEvents<A extends PrimitiveValue> = AbstractStateEvents<A> & {

};

export abstract class PrimitiveState<A extends PrimitiveValue> extends AbstractState<A, PrimitiveStateEvents<A>> {
	protected lastValue: A;

	constructor(lastValue: A) {
		super();
		this.lastValue = lastValue;
	}
};

// Implement the abstract methods in secret in order for TypeScript not to handle them as if they were own properties.
export class PrimitiveStateImplementation<A extends PrimitiveValue> extends PrimitiveState<A> {
	update(value: A): boolean {
		let updated = false;
		if (value !== this.lastValue) {
			this.lastValue = value;
			updated = true;
		}
		if (updated) {
			this.notify("update", this);
		}
		return updated;
	}

	value(): A {
		return this.lastValue;
	}
};

export type ReferenceStateEvents<A extends ReferenceValue> = AbstractStateEvents<A> & {

};

export abstract class ReferenceState<A extends ReferenceValue> extends AbstractState<A, ReferenceStateEvents<A>> {
	protected lastValue: A;

	constructor(lastValue: A) {
		super();
		this.lastValue = lastValue;
	}
};

// Implement the abstract methods in secret in order for TypeScript not to handle them as if they were own properties.
export class ReferenceStateImplementation<A extends ReferenceValue> extends ReferenceState<A> {
	update(value: A): boolean {
		let updated = false;
		if (value !== this.lastValue) {
			this.lastValue = value;
			updated = true;
		}
		if (updated) {
			this.notify("update", this);
		}
		return updated;
	}

	value(): A {
		return this.lastValue;
	}
};

export type ArrayStateEvents<A extends Value> = AbstractStateEvents<Array<A>> & {
	"insert": [
		state: State<A>,
		index: number
	];
	"remove": [
		state: State<A>,
		index: number
	];
};

export abstract class ArrayState<A extends Value> extends AbstractState<Array<A>, ArrayStateEvents<A>> {
	protected elements: Array<State<A>>;
	protected operating: boolean;
	protected currentLength: State<number>;
	protected isUndefined: boolean;

	protected operate(callback: () => void): void {
		let operating = this.operating;
		this.operating = true;
		try {
			callback();
		} finally {
			this.operating = operating;
		}
	}

	protected onElementUpdate = () => {
		if (!this.operating) {
			this.notify("update", this);
		}
	};

	constructor(elements: Array<State<A>>) {
		super()
		this.elements = [ ...elements ];
		this.operating = false;
		this.currentLength = make_state(elements.length);
		this.isUndefined = false;
		for (let index = 0; index < this.elements.length; index++) {
			this.elements[index].observe("update", this.onElementUpdate);
		}
	}

	[Symbol.iterator](): Iterator<State<A>> {
		return this.elements[Symbol.iterator]();
	}

	append(...items: Array<StateOrValue<A>>): void {
		if (items.length === 0) {
			return;
		}
		this.operate(() => {
			for (let item of items) {
				this.insert(this.elements.length, item);
			}
		});
		if (!this.operating) {
			this.notify("update", this);
		}
	}

	element(index: number | State<number>): State<A> {
		if (index instanceof AbstractState) {
			let element = this.element(index.value());
			let that = make_state(element.value());
			let subscription = element.observe("update", (state) => {
				that.update(state.value());
			});
			index.observe("update", (index) => {
				element = this.element(index.value());
				subscription();
				that.update(element.value());
				subscription = element.observe("update", (state) => {
					that.update(state.value());
				});
			});
			that.observe("update", (that) => {
				element.update(that.value());
			});
			return that;
		} else {
			if (index < 0 || index >= this.elements.length) {
				throw new Error(`Expected index to be within bounds!`);
			}
			return this.elements[index];
		}
	}

	filter(predicate: Predicate<A>): State<Array<A>> {
		let filteredIndices = make_state([] as Array<number>);
		let indexStates = [] as Array<State<number>>;
		let subscriptions = [] as Array<CancellationToken>;
		this.observe("insert", (state, index) => {
			let indexState = make_state(index);
			indexStates.splice(index, 0, indexState);
			for (let i = index + 1; i < indexStates.length; i++) {
				indexStates[i].update(i);
			}
			let outcomeState = predicate(state, indexState);
			if (outcomeState.value()) {
				let orderedIndex = getOrderedIndex(filteredIndices.elements, (filteredIndex) => indexState.value() - filteredIndex.value());
				filteredIndices.insert(orderedIndex, indexState);
			}
			let subscription = outcomeState.observe("update", (outcome) => {
				let orderedIndex = getOrderedIndex(filteredIndices.elements, (filteredIndex) => indexState.value() - filteredIndex.value());
				let found = filteredIndices.elements[orderedIndex]?.value() === indexState.value();
				if (outcome.value()) {
					if (!found) {
						filteredIndices.insert(orderedIndex, indexState);
					}
				} else {
					if (found) {
						filteredIndices.remove(orderedIndex);
					}
				}
			});
			subscriptions.splice(index, 0, subscription);
		});
		this.observe("remove", (state, index) => {
			let indexState = indexStates[index];
			let orderedIndex = getOrderedIndex(filteredIndices.elements, (index) => indexState.value() - index.value());
			let found = filteredIndices.elements[orderedIndex]?.value() === indexState.value();
			if (found) {
				filteredIndices.remove(orderedIndex);
			}
			indexStates.splice(index, 1);
			for (let i = index; i < indexStates.length; i++) {
				indexStates[i].update(i);
			}
			let subscription = subscriptions[index];
			subscriptions.splice(index, 1);
			subscription();
		});
		for (let index = 0; index < this.elements.length; index++) {
			let indexState = make_state(index);
			indexStates.splice(index, 0, indexState);
			let element = this.elements[index];
			let outcomeState = predicate(element, indexState);
			if (outcomeState.value()) {
				filteredIndices.append(indexState);
			}
			let subscription = outcomeState.observe("update", (outcome) => {
				let orderedIndex = getOrderedIndex(filteredIndices.elements, (filteredIndex) => indexState.value() - filteredIndex.value());
				let found = filteredIndices.elements[orderedIndex]?.value() === indexState.value();
				if (outcome.value()) {
					if (!found) {
						filteredIndices.insert(orderedIndex, indexState);
					}
				} else {
					if (found) {
						filteredIndices.remove(orderedIndex);
					}
				}
			});
			subscriptions.splice(index, 0, subscription);
		}
		return filteredIndices.mapStates((state) => this.element(state));
	}

	first(): State<A | undefined> {
		let state = make_state<A | undefined>(undefined);
		state.update(this.elements[0]?.value());
		this.currentLength.observe("update", () => {
			state.update(this.elements[0]?.value());
		});
		state.observe("update", (state) => {
			let value = state.value();
			if (value == null) {
				return;
			}
			this.elements[0]?.update(value);
		});
		return state;
	}

	insert(index: number, item: StateOrValue<A>): void {
		if (index < 0 || index > this.elements.length) {
			throw new Error(`Expected index to be within bounds!`);
		}
		let element = item instanceof AbstractState ? item : make_state(item);
		this.elements.splice(index, 0, element);
		element.observe("update", this.onElementUpdate);
		this.currentLength.update(this.elements.length);
		if (true) {
			this.operate(() => {
				this.notify("insert", element, index);
			});
		}
		if (!this.operating) {
			this.notify("update", this);
		}
	}

	last(): State<A | undefined> {
		let state = make_state<A | undefined>(undefined);
		state.update(this.elements[this.elements.length - 1]?.value());
		this.currentLength.observe("update", () => {
			state.update(this.elements[this.elements.length - 1]?.value());
		});
		state.observe("update", (state) => {
			let value = state.value();
			if (value == null) {
				return;
			}
			this.elements[this.elements.length - 1]?.update(value);
		});
		return state;
	}

	length(): State<number> {
		return this.currentLength;
	}

	mapStates<B extends Value>(mapper: StateMapper<A, B>): State<Array<B>> {
		let that = make_state([] as Array<B>);
		let indexStates = [] as Array<State<number>>;
		this.observe("insert", (state, index) => {
			let indexState = make_state(index);
			indexStates.splice(index, 0, indexState);
			for (let i = index + 1; i < indexStates.length; i++) {
				indexStates[i].update(i);
			}
			let mapped = mapper(state, indexState);
			that.insert(index, mapped);
		});
		this.observe("remove", (state, index) => {
			indexStates.splice(index, 1);
			for (let i = index; i < indexStates.length; i++) {
				indexStates[i].update(i);
			}
			that.remove(index);
		});
		for (let index = 0; index < this.elements.length; index++) {
			let indexState = make_state(index);
			indexStates.splice(index, 0, indexState);
			let element = this.elements[index];
			let mapped = mapper(element, indexState);
			that.append(mapped);
		}
		return that;
	}

	mapValues<B extends Value>(mapper: ValueMapper<A, B>): State<Array<B>> {
		return this.mapStates((state, index) => state.compute((value) => mapper(value, index.value())));
	}

	remove(index: number): void {
		if (index < 0 || index >= this.elements.length) {
			throw new Error(`Expected index to be within bounds!`);
		}
		let element = this.elements[index];
		this.elements.splice(index, 1);
		element.unobserve("update", this.onElementUpdate);
		this.currentLength.update(this.elements.length);
		if (true) {
			this.operate(() => {
				this.notify("remove", element, index);
			});
		}
		if (!this.operating) {
			this.notify("update", this);
		}
	}

	spread(): Array<State<A>> {
		return [ ...this.elements ];
	}

	vacate(): boolean {
		return this.update([]);
	}
};

// Implement the abstract methods in secret in order for TypeScript not to handle them as if they were own properties.
export class ArrayStateImplementation<A extends Value> extends ArrayState<A> {
	update(value: Array<A>): boolean {
		let updated = false;
		this.operate(() => {
			let isUndefined = typeof value === "undefined";
			updated = (this.isUndefined && !isUndefined) || (!this.isUndefined && isUndefined);
			this.isUndefined = isUndefined;
			if (this.elements.length !== value?.length) {
				updated = true;
			} else {
				for (let index = 0; index < this.elements.length; index++) {
					let copy = make_state(this.elements[index].value());
					if (copy.update(value[index])) {
						updated = true;
						break;
					}
				}
			}
			if (updated) {
				for (let index = this.elements.length - 1; index >= 0; index--) {
					this.remove(index);
				}
				for (let index = 0; index < (value?.length ?? 0); index++) {
					this.append(value[index]);
				}
			}
		});
		if (updated) {
			this.notify("update", this);
		}
		return updated;
	}

	value(): Array<A> {
		if (this.isUndefined) {
			return undefined as any;
		}
		let lastValue = [] as Array<A>;
		for (let index = 0; index < this.elements.length; index++) {
			lastValue.push(this.elements[index].value());
		}
		return lastValue;
	}
};

export type ObjectStateEventsTuple<A extends RecordValue> = {
	[B in keyof A]: [state: State<A[B]>, key: B];
}[keyof A];

export type ObjectStateEvents<A extends RecordValue> = AbstractStateEvents<A> & {
	"insert": ObjectStateEventsTuple<A>;
	"remove": ObjectStateEventsTuple<A>;
};

export abstract class ObjectState<A extends RecordValue> extends AbstractState<A, ObjectStateEvents<A>> {
	protected members: MemberStates<A>;
	protected operating: boolean;
	protected isUndefined: boolean;

	protected operate(callback: () => void): void {
		let operating = this.operating;
		this.operating = true;
		try {
			callback();
		} finally {
			this.operating = operating;
		}
	}

	protected onMemberUpdate = () => {
		if (!this.operating) {
			this.notify("update", this);
		}
	};

	constructor(members: MemberStates<A>) {
		super();
		this.members = { ...members };
		this.operating = false;
		this.isUndefined = false;
		for (let key in this.members) {
			this.members[key].observe("update", this.onMemberUpdate);
		}
	}

	insert<B extends string, C extends Value>(key: B, item: StateOrValue<C>): State<ExpansionOf<A & { [key in B]: C; }>> {
		if (key in this.members) {
			throw new Error(`Expected member with key ${String(key)} to be absent!`);
		}
		let member = item instanceof AbstractState ? item : make_state(item);
		this.members[key] = member as any;
		member.observe("update", this.onMemberUpdate);
		if (true) {
			this.operate(() => {
				this.notify("insert", member as any, key);
			});
		}
		if (!this.operating) {
			this.notify("update", this);
		}
		return this as any;
	}

	member<B extends keyof A>(key: B | State<B>): State<A[B]> {
		if (key instanceof AbstractState) {
			let member = this.member(key.value());
			let that = make_state(member.value());
			let subscription = member.observe("update", (state) => {
				that.update(state.value());
			});
			key.observe("update", (key) => {
				member = this.member(key.value());
				subscription();
				that.update(member.value());
				subscription = member.observe("update", (state) => {
					that.update(state.value());
				});
			});
			that.observe("update", (that) => {
				member.update(that.value());
			});
			return that;
		} else {
			let member = this.members[key];
			if (member == null) {
				member = make_state(undefined) as any;
				this.insert(key as any, member);
			}
			return member;
		}
	}

	remove<B extends keyof A>(key: B): State<ExpansionOf<Omit<A, B>>> {
		if (!(key in this.members)) {
			throw new Error(`Expected member with key ${String(key)} to be present!`);
		}
		let member = this.members[key];
		delete this.members[key];
		member.unobserve("update", this.onMemberUpdate);
		if (true) {
			this.operate(() => {
				this.notify("remove", member, key);
			});
		}
		if (!this.operating) {
			this.notify("update", this);
		}
		return this as any;
	}

	spread(): MemberStates<A> {
		return { ...this.members };
	}
};

// Implement the abstract methods in secret in order for TypeScript not to handle them as if they were own properties.
export class ObjectStateImplementation<A extends RecordValue> extends ObjectState<A> {
	update(value: A): boolean {
		let updated = false;
		this.operate(() => {
			let isUndefined = typeof value === "undefined";
			updated = (this.isUndefined && !isUndefined) || (!this.isUndefined && isUndefined);
			this.isUndefined = isUndefined;
			for (let key in this.members) {
				let member = this.member(key);
				if (typeof value === "undefined" || !(key in value)) {
					this.remove(key);
					updated = true;
				} else {
					if (member.update(value[key] as any)) {
						updated = true;
					}
				}
			}
			for (let key in value) {
				if (!(key in this.members)) {
					this.insert(key, value[key]);
					updated = true;
				}
			}
		});
		if (updated) {
			this.notify("update", this);
		}
		return updated;
	}

	value(): A {
		if (this.isUndefined) {
			return undefined as any;
		}
		let lastValue = {} as A;
		for (let key in this.members) {
			let member = this.member(key);
			let value = member.value();
			lastValue[key as keyof A] = value;
		}
		return lastValue;
	}
};

export function make_primitive_state<A extends PrimitiveValue>(value: A): PrimitiveState<A> {
	return new Proxy(new PrimitiveStateImplementation(value), {
		ownKeys(target) {
			return [];
		}
	});
};

export function make_array_state<A extends Value>(elements: Array<State<A>>): ArrayState<A> {
	return new Proxy(new ArrayStateImplementation(elements), {
		get(target: any, key: any) {
			if (key in target) {
				return target[key];
			} else {
				return target.element(key);
			}
		},
		getOwnPropertyDescriptor(target, key) {
			if (key in target) {
				return Object.getOwnPropertyDescriptor(target, key);
			} else {
				return Object.getOwnPropertyDescriptor(target.spread(), key);
			}
		},
		ownKeys(target) {
			return Object.getOwnPropertyNames(target.spread());
		}
	});
};

export function make_object_state<A extends RecordValue>(members: MemberStates<A>): ObjectState<A> {
	return new Proxy(new ObjectStateImplementation(members), {
		get(target: any, key: any) {
			if (key in target) {
				return target[key];
			} else {
				return target.member(key);
			}
		},
		getOwnPropertyDescriptor(target, key) {
			if (key in target) {
				return Object.getOwnPropertyDescriptor(target, key);
			} else {
				return Object.getOwnPropertyDescriptor(target.spread(), key);
			}
		},
		ownKeys(target) {
			return Object.getOwnPropertyNames(target.spread());
		}
	});
};

export function make_reference_state<A extends ReferenceValue>(value: A): ReferenceState<A> {
	return new Proxy(new ReferenceStateImplementation(value), {
		ownKeys(target) {
			return [];
		}
	});
};

export function make_state<A extends Value>(value: A): State<A> {
	if (typeof value === "symbol") {
		return make_primitive_state(value) as any;
	}
	if (typeof value === "bigint") {
		return make_primitive_state(value) as any;
	}
	if (typeof value === "boolean") {
		return make_primitive_state(value) as any;
	}
	if (typeof value === "number") {
		return make_primitive_state(value) as any;
	}
	if (typeof value === "string") {
		return make_primitive_state(value) as any;
	}
	if (value === null) {
		return make_primitive_state(value as any) as any;
	}
	if (typeof value === "undefined") {
		return make_primitive_state(value) as any;
	}
	if (value instanceof Array) {
		let elements = [] as any;
		for (let index = 0; index < value.length; index++) {
			elements.push(make_state(value[index]));
		}
		return make_array_state(elements) as any;
	}
	if (value instanceof Object && value.constructor === Object) {
		let members = {} as any;
		for (let key in value) {
			members[key] = make_state((value as any)[key]);
		}
		return make_object_state(members) as any;
	}
	if (value instanceof Object) {
		return make_reference_state(value) as any;
	}
	throw new Error(`Expected code to be unreachable!`);
};

export function computed<A extends Value[], B extends Value>(states: [...StateTupleFromValueTuple<A>], computer: (...args: [...A]) => B): State<B> {
	let values = states.map((state) => state.value()) as [...A];
	let computed = make_state(computer(...values));
	for (let index = 0; index < states.length; index++) {
		let state = states[index];
		state.observe("update", (state) => {
			values[index] = state.value();
			computed.update(computer(...values));
		});
	}
	return computed;
};

export function stateify<A extends Attribute<Value>>(attribute: A): StateFromAttribute<A> {
	if (attribute instanceof AbstractState) {
		return attribute as any;
	}
	if (attribute instanceof Array) {
		let states = [] as Array<State<Value>>;
		for (let element of attribute) {
			states.push(stateify(element) as any);
		}
		return make_array_state(states) as any;
	}
	if (attribute instanceof Object && attribute.constructor === Object) {
		let states = {} as Record<string, State<Value>>;
		for (let key in attribute) {
			states[key] = stateify((attribute as any)[key]) as any;
		}
		return make_object_state(states) as any;
	}
	return make_state(attribute) as any;
};

export function valueify<A extends Attribute<Value>>(attribute: A): ValueFromAttribute<A> {
	if (attribute instanceof AbstractState) {
		return attribute.value() as any;
	}
	if (attribute instanceof Array) {
		let values = [] as Array<Value>;
		for (let element of attribute) {
			values.push(valueify(element) as any);
		}
		return values as any;
	}
	if (attribute instanceof Object && attribute.constructor === Object) {
		let values = {} as Record<string, Value>;
		for (let key in attribute) {
			values[key] = valueify((attribute as any)[key]);
		}
		return values as any;
	}
	return attribute as any;
};

export type MergedPair<A extends RecordValue, B extends RecordValue> = ExpansionOf<{
	[C in keyof A | keyof B]: C extends keyof A & keyof B
		? undefined extends B[C]
			? Exclude<B[C], undefined> | A[C]
			: B[C]
		: C extends keyof A
			? A[C]
			: C extends keyof B
				? B[C]
				: never;
}>;

export type MergedTuple<A extends RecordValue[]> = ExpansionOf<
	A extends [infer B extends RecordValue, infer C extends RecordValue, ...infer D extends RecordValue[]]
		? MergedTuple<[MergedPair<B, C>, ...D]>
		: A extends [infer B extends RecordValue, infer C extends RecordValue]
			? MergedPair<B, C>
			: A extends [infer B extends RecordValue]
				? B
				: {}
>;

function fallback_array<A extends Value>(underlying: State<Array<A>>, fallbacked: State<Array<A>>, default_value: Array<A>, controller: State<"underlying" | "fallbacked" | undefined>): void {
	fallbacked.observe("insert", (element, index) => {
		if (controller.value() !== "underlying") {
			controller.update("fallbacked");
			if (typeof underlying.value() === "undefined") {
				underlying.update(default_value);
			}
			underlying.insert(index, element);
			controller.update(undefined);
		}
	});
	fallbacked.observe("remove", (element, index) => {
		if (controller.value() !== "underlying") {
			controller.update("fallbacked");
			if (typeof underlying.value() === "undefined") {
				underlying.update(default_value);
			}
			underlying.remove(index);
			controller.update(undefined);
		}
	});
	underlying.observe("insert", (element, index) => {
		if (controller.value() !== "fallbacked") {
			controller.update("underlying");
			fallbacked.insert(index, element);
			controller.update(undefined);
		}
	});
	underlying.observe("remove", (element, index) => {
		if (controller.value() !== "fallbacked") {
			controller.update("underlying");
			fallbacked.remove(index);
			controller.update(undefined);
		}
	});
};

function fallback_primitive<A extends Value>(underlying: State<A | undefined>, fallbacked: State<Exclude<A, undefined>>, default_value: Exclude<A, undefined>, controller: State<"underlying" | "fallbacked" | undefined>, computer: Computer<A | undefined, Exclude<A, undefined>>): void {
	underlying.observe("update", (underlying) => {
		if (controller.value() !== "fallbacked") {
			controller.update("underlying");
			fallbacked.update(computer(underlying.value()));
			controller.update(undefined);
		}
	});
	fallbacked.observe("update", (fallbacked) => {
		if (controller.value() !== "underlying") {
			controller.update("fallbacked");
			underlying.update(fallbacked.value());
			controller.update(undefined);
		}
	});
};

export function squash<A extends RecordValue>(records: State<Array<A>>): State<A> {
	let squashed = make_state({} as RecordValue);
	let absent = Symbol();
	let arrays = new Map<string, State<Array<Value | symbol>>>();
	function attach_member(index: number, member: State<Value>, key: string): void {
		let array = arrays.get(key);
		if (array == null) {
			array = make_state(new Array<Value | symbol>(records.length().value()).fill(absent));
			arrays.set(key, array);
			squashed.insert(key, array.compute((values) => {
				for (let value of values.reverse()) {
					if (typeof value !== "undefined" && value !== absent) {
						return value;
					}
				}
			}));
		}
		array.remove(index);
		array.insert(index, member);
	}
	function detach_member(index: number, member: State<Value>, key: string): void {
		let array = arrays.get(key);
		if (array == null) {
			array = make_state(new Array<Value | symbol>(records.length().value()).fill(absent));
			arrays.set(key, array);
		}
		array.remove(index);
		array.insert(index, absent);
		for (let member of array) {
			if (member.value() !== absent) {
				return;
			}
		}
		squashed.remove(key);
		arrays.delete(key);
	}
	let inserts = [] as Array<CancellationToken>;
	let removes = [] as Array<CancellationToken>;
	function attach_record(record: State<RecordValue>, index: number): void {
		for (let [key, array] of arrays.entries()) {
			array.insert(index, absent);
		}
		for (let key in record) {
			let member = record[key];
			attach_member(index, member, key);
		}
		let insert = record.observe("insert", (member, key) => {
			attach_member(index, member, key);
		});
		inserts.splice(index, 0, insert);
		let remove = record.observe("remove", (member, key) => {
			detach_member(index, member, key);
		});
		removes.splice(index, 0, remove);
	}
	function detach_record(record: State<RecordValue>, index: number): void {
		for (let key in record) {
			let member = record[key];
			detach_member(index, member, key);
		}
		inserts[index]();
		inserts.splice(index, 1);
		removes[index]();
		removes.splice(index, 1);
		for (let [key, array] of arrays.entries()) {
			array.remove(index);
		}
	}
	let index = 0;
	for (let record of records) {
		attach_record(record, index++);
	}
	records.observe("insert", (record, index) => {
		attach_record(record, index);
	});
	records.observe("remove", (record, index) => {
		detach_record(record, index);
	});
	return squashed as State<A>;
};

export function fallback<A extends Value>(underlying: State<A | undefined>, default_value: Exclude<A, undefined>): State<Exclude<A, undefined>> {
	let computer = ((underlying_value) => typeof underlying_value === "undefined" ? default_value : underlying_value) as Computer<A | undefined, Exclude<A, undefined>>;
	let fallbacked = make_state(computer(underlying.value()));
	let controller = make_state(undefined as "underlying" | "fallbacked" | undefined);
	fallback_primitive(underlying, fallbacked, default_value, controller, computer);
	if (underlying instanceof ArrayState && fallbacked instanceof ArrayState && default_value instanceof Array) {
		fallback_array(underlying, fallbacked, default_value, controller);
	}
	return fallbacked;
};

export function merge<A extends RecordValue[]>(...states: StateTupleFromValueTuple<A>): State<MergedTuple<A>> {
	let records = make_state([] as Array<RecordValue>);
	for (let state of states) {
		records.append(state);
	}
	return squash(records) as State<MergedTuple<A>>;
};

export function flatten<A extends PrimitiveValue | ReferenceValue>(states: State<Array<A | RecursiveArray<A>>>): State<Array<A>> {
	let offsets = [] as Array<number>;
	let lengths = [] as Array<number>;
	let subscriptions_from_state = new Map<State<Array<A> | RecursiveArray<A>>, Array<CancellationToken>>();
	let flattened_states = make_state([] as Array<A>);
	function insert(state: State<A | RecursiveArray<A>>, index: number): void {
		let offset = (offsets[index - 1] ?? 0) + (lengths[index-1] ?? 0);
		let length = 0;
		if (state instanceof ArrayState) {
			state = state as State<Array<A | RecursiveArray<A>>>;
			let flattened = flatten(state as State<Array<A | RecursiveArray<A>>>);
			length = flattened.length().value();
			for (let i = 0; i < length; i++) {
				flattened_states.insert(offset + i, flattened.element(i));
			}
			let subscriptions = [] as Array<CancellationToken>;
			subscriptions.push(flattened.observe("insert", (substate, subindex) => {
				offset = offsets[index];
				flattened_states.insert(offset + subindex, substate);
				lengths[index] += 1;
				for (let i = index + 1; i < offsets.length; i++) {
					offsets[i] += 1;
				}
			}));
			subscriptions.push(flattened.observe("remove", (substate, subindex) => {
				offset = offsets[index];
				flattened_states.remove(offset + subindex);
				lengths[index] -= 1;
				for (let i = index + 1; i < offsets.length; i++) {
					offsets[i] -= 1;
				}
			}));
			subscriptions_from_state.set(state, subscriptions);
		} else {
			state = state as State<A>;
			length = 1;
			flattened_states.insert(offset, state as State<A>);
		}
		offsets.splice(index, 0, offset);
		lengths.splice(index, 0, length);
		for (let i = index + 1; i < offsets.length; i++) {
			offsets[i] += length;
		}
	};
	function remove(state: State<A | RecursiveArray<A>>, index: number): void {
		let offset = offsets[index];
		let length = 0;
		if (state instanceof ArrayState) {
			state = state as State<Array<A | RecursiveArray<A>>>;
			length = state.length().value();
			for (let i = length - 1; i >= 0; i--) {
				flattened_states.remove(offset + i);
			}
			let subscriptions = subscriptions_from_state.get(state) ?? [];
			for (let subscription of subscriptions) {
				subscription();
			}
			subscriptions_from_state.delete(state);
		} else {
			state = state as State<A>;
			length = 1;
			flattened_states.remove(offset);
		}
		for (let i = index + 1; i < offsets.length; i++) {
			offsets[i] -= length;
		}
		offsets.splice(index, 1);
		lengths.splice(index, 1);
	};
	for (let i = 0; i < states.length().value(); i++) {
		insert(states.element(i), i);
	}
	states.observe("insert", (state, index) => {
		insert(state, index);
	});
	states.observe("remove", (state, index) => {
		remove(state, index);
	});
	return flattened_states;
};
