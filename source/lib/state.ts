import { getOrderedIndex } from "./utils";

type ExpansionOf<A> = A extends infer B ? { [C in keyof B]: B[C] } : never;
type Mutable<A> = { -readonly [B in keyof A]: Mutable<A[B]> };
type RecursiveArray<A> = Array<A | RecursiveArray<A>>;
type RecursiveArrayType<A> = A extends Array<infer B> ? RecursiveArrayType<B> : A;
type RecordButNotClass<A> = A extends { [key: string]: unknown; } ? A : never;
type OptionalMembersOf<A> = { [B in keyof A as Omit<A, B> extends A ? B : never]: A[B]; };
type RequiredMembersOf<A> = { [B in keyof A as Omit<A, B> extends A ? never : B]: A[B]; };

export type StateOrValue<A> = A | State<A>;

export type Attribute<A> = State<A> | (
	A extends ArrayValue | ReadonlyArrayValue ? { -readonly [B in keyof A]: Attribute<A[B]>; } :
	A extends RecordValue ? A extends RecordButNotClass<A> ? {
		[B in keyof OptionalMembersOf<A>]?: State<A[B]> | Attribute<Exclude<A[B], undefined>>;
	} & {
		[B in keyof RequiredMembersOf<A>]: Attribute<A[B]>
	}: A :
	A
);

// TODO: Remove.
export type Attributes<A> = Attribute<A>;

export type ValueFromAttribute<A> = (
	A extends State<infer B> ? B :
	A extends ArrayValue | ReadonlyArrayValue ? { -readonly [B in keyof A]: ValueFromAttribute<A[B]>; } :
	A extends RecordValue ? A extends RecordButNotClass<A> ? { [B in keyof A]: ValueFromAttribute<A[B]>; } : A :
	A
);

export type StateFromAttribute<A> = State<ValueFromAttribute<A>>;

export type TupleRecord<A extends TupleRecord<A>> = { [C in keyof A]: any[]; };

export type PrimitiveValue = symbol | void | bigint | boolean | number | string | null | undefined;

export type ReferenceValue = Object;

export type Value = any;

export type ArrayValue = Value[];

export type ReadonlyArrayValue = readonly Value[];

export type RecordValue = { [key: string]: Value; };

export type StateMapper<A, B> = (state: State<A>, index: State<number>) => B | State<B>;

export type ValueMapper<A, B> = (value: A, index: number) => B;

export type Predicate<A> = (state: State<A>, index: State<number>) => State<boolean>;

export type Observer<A extends any[]> = (...args: A) => void;

export type Callback<A extends any[]> = (...args: A) => void;

export type Computer<A, B> = (value: A) => B;

export type CancellationToken = Subscription;

export type Subscription = (() => void) & {
	is_cancelled: State<boolean>;
};

export const Subscription = {
	create(is_cancelled: State<boolean>, callback: Callback<[]>): Subscription {
		let cancel = (() => {
			if (is_cancelled.value()) {
				return;
			}
			callback();
			is_cancelled.update(true);
		}) as Subscription;
		cancel.is_cancelled = is_cancelled;
		return cancel;
	}
};

// contravariant: State<Animal> is a subtype of State<Cat> (Cat and Animal contra-vary) (in)
// covariant: State<Cat> is a subtype of State<Animal> (Cat and Animal co-vary) (out)
// invariant: State<Cat> has no relation to State<Animal> (in out)

// Type distribution is prevented by wrapping generic types in single-element tuples.
export type State<A> = GenericState<A> & (
	A extends ArrayValue ? ArrayState<A> :
	A extends RecordButNotClass<A> ? MemberStates<A> & ObjectState<A> :
	PrimitiveState<A>
);

export type StateTupleFromValueTuple<A extends ArrayValue> = {
	[B in keyof A]: State<A[B]>;
};

export type ElementStates<A extends ArrayValue> = {
	[index: number]: State<A[number]>;
};

export type MemberStates<A extends RecordValue> = {
	[B in keyof A]-?: State<A[B]>;
};

const REGISTRY = typeof FinalizationRegistry === "function" ? new FinalizationRegistry<CancellationToken>((subscription) => subscription()) : undefined;















namespace value_from_attribute_value {
	type basic_state_1 = ValueFromAttribute<string>;
	type basic_state_2 = ValueFromAttribute<string | number>;
	type basic_state_3 = ValueFromAttribute<Element>;
	type basic_state_4 = ValueFromAttribute<Element | Date>;
	type basic_state_5 = ValueFromAttribute<{ key: string } | number>;
	type record_state_1 = ValueFromAttribute<{ one: string }>;
	type record_state_2 = ValueFromAttribute<{ one: string } | { one: string, two: string }>;
	type array_state_1 = ValueFromAttribute<string[]>;
	type array_state_2 = ValueFromAttribute<string[] | number[]>;
	type mixed_state_1 = ValueFromAttribute<string | { [key: string]: any }>;
}

namespace value_from_attribute_state {
	type basic_state_1 = ValueFromAttribute<State<string>>;
	type basic_state_2 = ValueFromAttribute<State<string | number>>;
	type basic_state_3 = ValueFromAttribute<State<Element>>;
	type basic_state_4 = ValueFromAttribute<State<Element | Date>>;
	type basic_state_5 = ValueFromAttribute<State<{ key: string } | number>>;
	type record_state_1 = ValueFromAttribute<State<{ one: string }>>;
	type record_state_2 = ValueFromAttribute<State<{ one: string } | { one: string, two: string }>>;
	type array_state_1 = ValueFromAttribute<State<string[]>>;
	type array_state_2 = ValueFromAttribute<State<string[] | number[]>>;
	type mixed_state_1 = ValueFromAttribute<State<string | { [key: string]: any }>>;
}

namespace state {
	type basic_state_1 = State<string>;
	type basic_state_2 = State<string | number>;
	type basic_state_3 = State<Element>;
	type basic_state_4 = State<Element | Date>;
	type basic_state_5 = State<{ key: string } | number>;
	type record_state_1 = State<{ one: string }>;
	type record_state_2 = State<{ one: string } | { one: string, two: string }>;
	type array_state_1 = State<string[]>;
	type array_state_2 = State<string[] | number[]>;
	type mixed_state_1 = State<string | { [key: string]: any }>;
}

namespace attribute {
	type basic_state_1 = Attribute<string>;
	type basic_state_2 = Attribute<string | number>;
	type basic_state_3 = Attribute<Element>;
	type basic_state_4 = Attribute<Element | Date>;
	type basic_state_5 = Attribute<{ key: string } | number>;
	type record_state_1 = Attribute<{ one: string }>;
	type record_state_2 = Attribute<{ one: string } | { one: string, two: string }>;
	type array_state_1 = Attribute<string[]>;
	type array_state_2 = Attribute<string[] | number[]>;
	type mixed_state_1 = Attribute<string | { [key: string]: any }>;
}

function one<A>(state: State<A>): void {
	state.observe("update", (state) => {
		state.update(state.value());
	});
	state.update(state.value());
}

function two<A>(state: State<RecordValue>): void {
	state.observe("attach", (state, key) => {
		state.update(state.value());
	});
	state.update(state.value());
}

function three<A>(state: State<ArrayValue>): void {
	state.observe("insert", (state, index) => {
		state.update(state.value());
	});
	state.update(state.value());
}





















export type AbstractStateEvents<A> = {
	"update": [
		state: GenericState<A> // GenericState is used since TypeScript does not retain the actual type constraints applied to A.
	];
};

export abstract class AbstractState<A, B extends TupleRecord<B> & AbstractStateEvents<A>> {
	protected observers: { [C in keyof B]?: Array<Observer<any>> };
	protected subscriptions: Array<Callback<any>>;

	protected notify_observers<C extends keyof B>(observers: Array<Observer<B[C]>> | undefined, type: C, ...args: [...B[C]]): void {
		if (observers == null) {
			return;
		}
		for (let index = 0; index < observers.length; index++) {
			observers[index](...args);
		}
	}

	protected notify<C extends keyof B>(type: C, ...args: [...B[C]]): void {
		// Prevent issues arising from mutating the array of observers while notifying by slicing.
		this.notify_observers(this.observers[type]?.slice(), type, ...args);
	}

	protected observe_weakly<C extends keyof B>(type: C, callback: Callback<B[C]>): CancellationToken {
		if (typeof WeakRef === "function") {
			let callback_reference = new WeakRef(callback);
			return this.observe(type, (...args) => {
				let callback = callback_reference.deref();
				if (callback != null) {
					callback(...args);
				}
			});
		} else {
			return this.observe(type, callback);
		}
	}

	constructor() {
		this.observers = {};
		this.subscriptions = [];
	}

	compute<C>(computer: Computer<A, C>): State<C> {
		let computed = make_state(computer(this.value()));
		this.observe("update", (state) => {
			computed.update(computer(state.value()));
		});
		return computed;
	}

	observe(type: "update", observer: Observer<AbstractStateEvents<A>["update"]>): CancellationToken;
	observe<C extends keyof B>(type: C, observer: Observer<B[C]>): CancellationToken;
	observe<C extends keyof B>(type: C, observer: Observer<B[C]>): CancellationToken {
		let observers = this.observers[type];
		if (observers == null) {
			this.observers[type] = observers = [];
		}
		observers.push(observer);
		return Subscription.create(make_state(false), () => {
			this.unobserve(type, observer);
		});
	}

	subscribe<A, B extends TupleRecord<B> & AbstractStateEvents<A>, C extends keyof B>(target: AbstractState<A, B>, type: C, callback: Callback<B[C]>): Subscription {
		let observer = target.observe_weakly(type, callback);
		REGISTRY?.register(this, observer);
		let subscriptions = this.subscriptions;
		subscriptions.push(callback);
		return Subscription.create(observer.is_cancelled, () => {
			observer();
			let index = subscriptions.lastIndexOf(callback);
			if (index < 0) {
				return;
			}
			subscriptions.splice(index, 1);
		});
	}

	unobserve(type: "update", observer: Observer<AbstractStateEvents<A>["update"]>): void;
	unobserve<C extends keyof B>(type: C, observer: Observer<B[C]>): void;
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

	abstract shadow(): State<A>;
	abstract update(value: A): boolean;
	abstract value(): A;
};

export type GenericState<A> = AbstractState<A, AbstractStateEvents<A>>;































export type PrimitiveStateEvents<A> = AbstractStateEvents<A> & {

};

export class PrimitiveState<A> extends AbstractState<A, PrimitiveStateEvents<A>> {
	protected lastValue: A;

	constructor(lastValue: A) {
		super();
		this.lastValue = lastValue;
	}

	observe(type: "update", observer: Observer<PrimitiveStateEvents<A>["update"]>): CancellationToken;
	observe<C extends keyof PrimitiveStateEvents<A>>(type: C, observer: Observer<PrimitiveStateEvents<A>[C]>): CancellationToken {
		return super.observe(type, observer);
	}

	shadow(): State<A> {
		let source = this;
		let controller: "source" | "shadow" | undefined;
		let shadow = make_state(source.value());
		shadow.subscribe(source, "update", (source) => {
			if (controller !== "shadow") {
				controller = "source";
				shadow.update(source.value());
				controller = undefined;
			}
		});
		shadow.observe("update", (shadow) => {
			if (controller !== "source") {
				controller = "shadow";
				source.update(shadow.value());
				controller = undefined;
			}
		});
		return shadow;
	}

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












































export type ArrayStateEvents<A extends ArrayValue> = AbstractStateEvents<A> & {
	"insert": [
		state: State<A[number]>,
		index: number
	];
	"remove": [
		state: State<A[number]>,
		index: number
	];
};

export class ArrayState<A extends ArrayValue> extends AbstractState<A, ArrayStateEvents<A>> implements ElementStates<A> {
	protected elements: Array<State<A[number]>>;
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

	constructor(elements: Array<State<A[number]>>) {
		super()
		this.elements = [ ...elements ];
		this.operating = false;
		this.currentLength = make_state(elements.length);
		this.isUndefined = false;
		for (let index = 0; index < this.elements.length; index++) {
			this.elements[index].observe("update", this.onElementUpdate);
		}
	}

	[index: number]: State<A[number]>;

	observe(type: "update", observer: Observer<ArrayStateEvents<A>["update"]>): CancellationToken;
	observe(type: "insert", observer: Observer<ArrayStateEvents<A>["insert"]>): CancellationToken;
	observe(type: "remove", observer: Observer<ArrayStateEvents<A>["remove"]>): CancellationToken;
	observe<C extends keyof ArrayStateEvents<A>>(type: C, observer: Observer<ArrayStateEvents<A>[C]>): CancellationToken {
		return super.observe(type, observer);
	}

	[Symbol.iterator](): Iterator<State<A[number]>> {
		return this.elements[Symbol.iterator]();
	}

	append(...items: Array<StateOrValue<A[number]>>): void {
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

	element(index: number | State<number>): State<A[number]> {
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

	filter(predicate: Predicate<A[number]>): State<Array<A[number]>> {
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

	first(): State<A[number] | undefined> {
		let state = make_state<A[number] | undefined>(undefined);
		state.update(this.elements[0]?.value());
		this.currentLength.observe("update", () => {
			state.update(this.elements[0]?.value());
		});
		// @ts-ignore
		state.observe("update", (state) => {
			let value = state.value();
			if (value == null) {
				return;
			}
			this.elements[0]?.update(value);
		});
		return state;
	}

	insert(index: number, item: StateOrValue<A[number]>): void {
		// The list of observers is snapshotted since new observers may be attached when updating currentLength which are then wrongly notified about the element being inserted.
		let insertObservers = this.observers["insert"]?.slice();
		if (index < 0 || index > this.elements.length) {
			throw new Error(`Expected index to be within bounds!`);
		}
		let element = item instanceof AbstractState ? item : make_state(item);
		this.elements.splice(index, 0, element);
		element.observe("update", this.onElementUpdate);
		this.currentLength.update(this.elements.length);
		if (true) {
			this.operate(() => {
				this.notify_observers(insertObservers, "insert", element, index);
			});
		}
		if (!this.operating) {
			this.notify("update", this);
		}
	}

	last(): State<A[number] | undefined> {
		let state = make_state<A[number] | undefined>(undefined);
		state.update(this.elements[this.elements.length - 1]?.value());
		this.currentLength.observe("update", () => {
			state.update(this.elements[this.elements.length - 1]?.value());
		});
		// @ts-ignore
		state.observe("update", (state) => {
			let value = state.value();
			if (value == null) {
				return;
			}
			this.elements[this.elements.length - 1]?.update(value);
		});
		return state;
	}

	get length(): State<number> {
		return this.currentLength;
	}

	mapStates<B>(mapper: StateMapper<A[number], B>): State<Array<B>> {
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

	mapValues<B>(mapper: ValueMapper<A[number], B>): State<Array<B>> {
		return this.mapStates((state, index) => state.compute((value) => mapper(value, index.value())));
	}

	remove(index: number): void {
		// The list of observers is snapshotted since new observers may be attached when updating currentLength which are then wrongly notified about the element being removed.
		let removeObservers = this.observers["remove"]?.slice();
		if (index < 0 || index >= this.elements.length) {
			throw new Error(`Expected index to be within bounds!`);
		}
		let element = this.elements[index];
		this.elements.splice(index, 1);
		element.unobserve("update", this.onElementUpdate);
		this.currentLength.update(this.elements.length);
		if (true) {
			this.operate(() => {
				this.notify_observers(removeObservers, "remove", element, index);
			});
		}
		if (!this.operating) {
			this.notify("update", this);
		}
	}

	spread(): Array<State<A[number]>> {
		return [ ...this.elements ];
	}

	vacate(): boolean {
		return this.update([] as any);
	}

	shadow(): State<A> {
		let source = this;
		let controller: "source" | "shadow" | undefined;
		let shadow = make_state([] as ArrayValue);
		for (let element of source.elements) {
			shadow.append(element.shadow());
		}
		shadow.subscribe(source, "insert", (element, index) => {
			if (controller !== "shadow") {
				controller = "source";
				shadow.insert(index, element.shadow());
				controller = undefined;
			}
		});
		shadow.subscribe(source, "remove", (element, index) => {
			if (controller !== "shadow") {
				controller = "source";
				shadow.remove(index);
				controller = undefined;
			}
		});
		shadow.subscribe(source, "update", (source) => {
			if (controller !== "shadow") {
				controller = "source";
				shadow.update(source.value() as any);
				controller = undefined;
			}
		});
		shadow.observe("insert", (element, index) => {
			if (controller !== "source") {
				controller = "shadow";
				source.insert(index, element.shadow());
				controller = undefined;
			}
		});
		shadow.observe("remove", (element, index) => {
			if (controller !== "source") {
				controller = "shadow";
				source.remove(index);
				controller = undefined;
			}
		});
		shadow.observe("update", (shadow) => {
			if (controller !== "source") {
				controller = "shadow";
				source.update(shadow.value() as A);
				controller = undefined;
			}
		});
		return shadow as any;
	}

	update(value: A): boolean {
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

	value(): A {
		if (this.isUndefined) {
			return undefined as any;
		}
		let lastValue = [] as ArrayValue;
		for (let index = 0; index < this.elements.length; index++) {
			lastValue.push(this.elements[index].value());
		}
		return lastValue as A;
	}
};























export type ObjectStateEventsTuple<A extends RecordValue> = {
	[B in keyof A]: [
		state: State<A[B]>,
		key: B
	];
}[keyof A];

export type ObjectStateEvents<A extends RecordValue> = AbstractStateEvents<A> & {
	"attach": ObjectStateEventsTuple<A>;
	"detach": ObjectStateEventsTuple<A>;
};

export class ObjectState<A extends RecordValue> extends AbstractState<A, ObjectStateEvents<A>> {
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

	observe(type: "update", observer: Observer<ObjectStateEvents<A>["update"]>): CancellationToken;
	observe(type: "attach", observer: Observer<ObjectStateEvents<A>["attach"]>): CancellationToken;
	observe(type: "detach", observer: Observer<ObjectStateEvents<A>["detach"]>): CancellationToken;
	observe<C extends keyof ObjectStateEvents<A>>(type: C, observer: Observer<ObjectStateEvents<A>[C]>): CancellationToken {
		return super.observe(type, observer);
	}

	attach<B extends string, C>(key: B, item: StateOrValue<C>): State<ExpansionOf<A & { [key in B]: C; }>> {
		if (key in this.members) {
			throw new Error(`Expected member with key ${String(key)} to be absent!`);
		}
		let member = item instanceof AbstractState ? item : make_state(item);
		this.members[key] = member as any;
		member.observe("update", this.onMemberUpdate);
		if (true) {
			this.operate(() => {
				this.notify("attach", member as any, key);
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
				this.attach(key as any, member as any);
			}
			return member;
		}
	}

	detach<B extends keyof A>(key: B): State<ExpansionOf<Omit<A, B>>> {
		if (!(key in this.members)) {
			throw new Error(`Expected member with key ${String(key)} to be present!`);
		}
		let member = this.members[key];
		delete this.members[key];
		member.unobserve("update", this.onMemberUpdate);
		if (true) {
			this.operate(() => {
				// @ts-ignore
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

	shadow(): State<A> {
		let source = this;
		let controller: "source" | "shadow" | undefined;
		let shadow = make_state({} as RecordValue);
		for (let key in source.members) {
			let member = source.members[key];
			shadow.attach(key, member.shadow());
		}
		shadow.subscribe(source as AbstractState<A, ObjectStateEvents<A>>, "attach", (member, key) => {
			if (controller !== "shadow") {
				controller = "source";
				shadow.attach(key as any, member.shadow());
				controller = undefined;
			}
		});
		shadow.subscribe(source as AbstractState<A, ObjectStateEvents<A>>, "detach", (member, key) => {
			if (controller !== "shadow") {
				controller = "source";
				shadow.detach(key as any);
				controller = undefined;
			}
		});
		shadow.subscribe(source as AbstractState<A, ObjectStateEvents<A>>, "update", (source) => {
			if (controller !== "shadow") {
				controller = "source";
				shadow.update(source.value());
				controller = undefined;
			}
		});
		shadow.observe("attach", (member, key) => {
			if (controller !== "source") {
				controller = "shadow";
				source.attach(key, member.shadow());
				controller = undefined;
			}
		});
		shadow.observe("detach", (member, key) => {
			if (controller !== "source") {
				controller = "shadow";
				source.detach(key);
				controller = undefined;
			}
		});
		shadow.observe("update", (shadow) => {
			if (controller !== "source") {
				controller = "shadow";
				source.update(shadow.value() as A);
				controller = undefined;
			}
		});
		return shadow as any;
	}

	update(value: A): boolean {
		let updated = false;
		this.operate(() => {
			let isUndefined = typeof value === "undefined";
			updated = (this.isUndefined && !isUndefined) || (!this.isUndefined && isUndefined);
			this.isUndefined = isUndefined;
			for (let key in this.members) {
				if (typeof value === "undefined" || !(key in value)) {
					this.detach(key);
					updated = true;
				}
			}
			for (let key in value) {
				if (!(key in this.members)) {
					this.attach(key, value[key]);
					updated = true;
				} else {
					let member = this.member(key);
					if (member.update(value[key] as any)) {
						updated = true;
					}
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
	return new Proxy(new PrimitiveState(value), {
		ownKeys(target) {
			return [];
		}
	});
};

export function make_array_state<A extends ArrayValue>(elements: Array<State<A[number]>>): ArrayState<A> {
	return new Proxy(new ArrayState(elements), {
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
	return new Proxy(new ObjectState(members), {
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

export function make_state<A>(value: A): State<A> {
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
		return make_primitive_state(value as any) as any;
	}
	throw new Error(`Expected code to be unreachable!`);
};

export function computed<A extends ArrayValue, B>(states: [...StateTupleFromValueTuple<A>], computer: (...args: [...A]) => B): State<B> {
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

export function stateify<A extends Attribute<any>>(attribute: A): State<ValueFromAttribute<A>> {
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

export function valueify<A extends Attribute<any>>(attribute: A): ValueFromAttribute<A> {
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

function fallback_array<A>(underlying: State<Array<A>>, fallbacked: State<Array<A>>, default_value: Array<A>, controller: State<"underlying" | "fallbacked" | undefined>): void {
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

function fallback_primitive<A extends PrimitiveValue>(underlying: PrimitiveState<A | undefined>, fallbacked: PrimitiveState<Exclude<A, undefined>>, default_value: Exclude<A, undefined>, controller: State<"underlying" | "fallbacked" | undefined>, computer: Computer<A | undefined, Exclude<A, undefined>>): void {
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
	let arrays = new Map<string, State<Array<any>>>();
	function attach_member(index: number, member: State<Value>, key: string): void {
		let array = arrays.get(key);
		if (array == null) {
			array = make_state(new Array<Value | symbol>(records.length.value()).fill(absent));
			arrays.set(key, array);
			squashed.attach(key, array.compute((values) => {
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
			array = make_state(new Array<Value | symbol>(records.length.value()).fill(absent));
			arrays.set(key, array);
		}
		array.remove(index);
		array.insert(index, absent);
		for (let member of array) {
			if (member.value() !== absent) {
				return;
			}
		}
		squashed.detach(key);
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
		let insert = record.observe("attach", (member, key) => {
			attach_member(index, member, key);
		});
		inserts.splice(index, 0, insert);
		let remove = record.observe("detach", (member, key) => {
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
		attach_record(record as any, index++);
	}
	records.observe("insert", (record, index) => {
		attach_record(record as any, index);
	});
	records.observe("remove", (record, index) => {
		detach_record(record as any, index);
	});
	return squashed as any;
};

export function fallback<A>(underlying: State<A | undefined>, default_value: Exclude<A, undefined>): State<Exclude<A, undefined>> {
	let computer = ((underlying_value) => typeof underlying_value === "undefined" ? default_value : underlying_value) as Computer<A | undefined, Exclude<A, undefined>>;
	let fallbacked = make_state(computer(underlying.value()));
	let controller = make_state(undefined as "underlying" | "fallbacked" | undefined);
	fallback_primitive(underlying as any, fallbacked as any, default_value as any, controller, computer as any);
	if (underlying instanceof ArrayState && fallbacked instanceof ArrayState && default_value instanceof Array) {
		fallback_array(underlying as State<Array<any>>, fallbacked as State<Array<any>>, default_value as Array<any>, controller);
	}
	return fallbacked;
};

export function merge<A extends RecordValue[]>(...states: StateTupleFromValueTuple<A>): State<MergedTuple<A>> {
	let records = make_state([] as Array<RecordValue>);
	for (let state of states) {
		records.append(state);
	}
	return squash(records) as any as State<MergedTuple<A>>;
};

export function flatten<A extends RecursiveArray<any>>(states: State<Array<A>>): State<Array<RecursiveArrayType<A>>> {
	let offsets = [] as Array<number>;
	let lengths = [] as Array<number>;
	let subscriptions_from_state = new Map<State<Array<A> | RecursiveArray<A>>, Array<CancellationToken>>();
	let flattened_states = make_state([] as Array<A>);
	function insert(state: State<A | RecursiveArray<A>>, index: number): void {
		let offset = (offsets[index - 1] ?? 0) + (lengths[index-1] ?? 0);
		let length = 0;
		if (state instanceof ArrayState) {
			// @ts-ignore
			state = state as State<Array<A | RecursiveArray<A>>>;
			let flattened = flatten(state as any);
			length = flattened.length.value();
			for (let i = 0; i < length; i++) {
				flattened_states.insert(offset + i, flattened.element(i) as any);
			}
			let subscriptions = [] as Array<CancellationToken>;
			subscriptions.push(flattened.observe("insert", (substate, subindex) => {
				offset = offsets[index];
				flattened_states.insert(offset + subindex, substate as any);
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
			subscriptions_from_state.set(state as any, subscriptions);
		} else {
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
			let typed_state = state as any as State<Array<A | RecursiveArray<A>>>;
			length = typed_state.length.value();
			for (let i = length - 1; i >= 0; i--) {
				flattened_states.remove(offset + i);
			}
			let subscriptions = subscriptions_from_state.get(typed_state) ?? [];
			for (let subscription of subscriptions) {
				subscription();
			}
			subscriptions_from_state.delete(typed_state);
		} else {
			length = 1;
			flattened_states.remove(offset);
		}
		for (let i = index + 1; i < offsets.length; i++) {
			offsets[i] -= length;
		}
		offsets.splice(index, 1);
		lengths.splice(index, 1);
	};
	for (let i = 0; i < states.length.value(); i++) {
		insert(states.element(i) as any, i);
	}
	states.observe("insert", (state, index) => {
		insert(state as any, index);
	});
	states.observe("remove", (state, index) => {
		remove(state as any, index);
	});
	return flattened_states as any;
};
