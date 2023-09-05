import { getOrderedIndex } from "./utils";

type ExpansionOf<A> = A extends infer B ? { [C in keyof B]: B[C] } : never;

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

export type PrimitiveValue = void | bigint | boolean | number | string | null | undefined;

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
	A extends Array<infer B extends Value> ? IndexStates<A> & ArrayState<B> :
	A extends RecordValue ? States<A> & ObjectState<A> :
	A extends ReferenceValue ? ReferenceState<A> :
	never
);

export type StateTupleFromValueTuple<A extends Value[]> = {
	[B in keyof A]: State<A[B]>;
};

export type IndexStates<A> = {
	[B in keyof A & number]: A[B] extends Value ? State<A[B]> : never;
};

export type States<A> = {
	// The correct type signature is with optionals removed but this breaks TypeScript performance.
	[B in keyof A]/* -? */: A[B] extends Value ? State<A[B]> : never;
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

	fallback(defaultValue: Exclude<A, undefined>): State<Exclude<A, undefined>> {
		let computer = ((value) => typeof value !== "undefined" ? value : defaultValue) as Computer<A, Exclude<A, undefined>>;
		let computed = this.compute(computer);
		computed.observe("update", (state) => {
			let value = state.value();
			if (make_state(defaultValue).update(value)) {
				this.update(value);
			} else {
				this.update(undefined as any);
			}
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
	protected updating: boolean;
	protected currentLength: State<number>;
	protected isUndefined: boolean;

	protected onElementUpdate = () => {
		if (!this.updating) {
			this.notify("update", this);
		}
	};

	constructor(elements: Array<State<A>>) {
		super()
		this.elements = [ ...elements ];
		this.updating = false;
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
		for (let item of items) {
			this.insert(this.elements.length, item);
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
			this.notify("insert", element, index);
		}
		if (!this.updating) {
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
			this.notify("remove", element, index);
		}
		if (!this.updating) {
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
		try {
			this.updating = true;
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
		} finally {
			this.updating = false;
		}
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

export type ObjectStateEvents<A extends Value> = AbstractStateEvents<A> & {

};

export abstract class ObjectState<A extends RecordValue> extends AbstractState<A, ObjectStateEvents<A>> {
	protected members: States<A>;
	protected updating: boolean;
	protected isUndefined: boolean;

	protected onMemberUpdate = () => {
		if (!this.updating) {
			this.notify("update", this);
		}
	};

	constructor(members: States<A>) {
		super();
		this.members = { ...members };
		this.updating = false;
		this.isUndefined = false;
		for (let key in this.members) {
			this.members[key].observe("update", this.onMemberUpdate);
		}
	}

	member<B extends keyof A>(key: B): State<A[B]> {
		let member = this.members[key];
		if (member == null) {
			this.members[key] = member = make_state(undefined) as any;
			this.members[key].observe("update", this.onMemberUpdate);
			this.onMemberUpdate();
		}
		return member as any;
	}

	spread(): States<A> {
		return { ...this.members };
	}
};

// Implement the abstract methods in secret in order for TypeScript not to handle them as if they were own properties.
export class ObjectStateImplementation<A extends RecordValue> extends ObjectState<A> {
	update(value: A): boolean {
		let updated = false;
		try {
			this.updating = true;
			let isUndefined = typeof value === "undefined";
			updated = (this.isUndefined && !isUndefined) || (!this.isUndefined && isUndefined);
			this.isUndefined = isUndefined;
			for (let key in this.members) {
				let member = this.member(key);
				if (member.update(value?.[key] as any)) {
					updated = true;
				}
			}
			for (let key in value) {
				if (!(key in this.members)) {
					let member = this.member(key);
					member.update(value[key]);
					updated = true;
				}
			}
		} finally {
			this.updating = false;
		}
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
			if (typeof value !== "undefined") {
				lastValue[key] = value;
			}
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

export function make_object_state<A extends RecordValue>(members: States<A>): ObjectState<A> {
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

export type Merged<A extends RecordValue, B extends RecordValue> = ExpansionOf<{
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

export function merge<A extends RecordValue, B extends RecordValue>(one: Attributes<A>, two: Attributes<B>): Attributes<Merged<A, B>> {
	let one_state = stateify(one);
	let two_state = stateify(two);
	let merged = stateify({}) as State<Merged<A, B>>;
	(merged as any).members = new Proxy({} as RecordValue, {
		get(target, key) {
			if (!(key in target)) {
				let one_member = one_state.member(key as any) as State<Value>;
				let two_member = two_state.member(key as any) as State<Value>;
				target[key as any] = computed([one_member, two_member], (one_member, two_member) => typeof two_member !== "undefined" ? two_member : one_member) as State<Value>;
			}
			return target[key as any];
		}
	});
	one_state.compute((one) => {
		for (let key in one_state) {
			merged.member(key as never);
		}
	});
	two_state.compute((two) => {
		for (let key in two_state) {
			merged.member(key as never);
		}
	});
	return merged;
};
