import { ArrayValue, Callback, Computer, Observer, Predicate, RecordValue, StateFromAttribute, StateMapper, StateTupleFromValueTuple, Subscription, TupleRecord, Value, ValueMapper } from "./state";

type ExpansionOf<A> = A extends infer B ? { [C in keyof B]: B[C] } : never;
type ArrayElementType<A> = [A] extends [Array<infer B>] ? B : never;
type RecordButNotClass<A> = A extends { [key: string]: unknown; } ? A : never;
type RecursiveArray<A> = Array<A | RecursiveArray<A>>;
type RecursiveArrayType<A> = A extends Array<infer B> ? RecursiveArrayType<B> : A;

export type StateOrValue<A> = A | State<A>;

export type BasicStateEvents<A extends Value> = {
	"update": [
		state: BasicState<A>
	];
};

interface BasicState<in out A extends Value> {
	compute<B>(computer: Computer<A, B>): State<B>;

	observe(type: "update", observer: Observer<BasicStateEvents<A>["update"]>): Subscription;
	observe<B extends keyof BasicStateEvents<A>>(type: B, observer: Observer<BasicStateEvents<A>[B]>): Subscription;

	shadow(): State<A>;

	// This one seems to require binding between targets event types.
	subscribe<A, B extends TupleRecord<B> & BasicStateEvents<A>, C extends keyof B>(target: State<A>, type: C, callback: Callback<B[C]>): Subscription;

	unobserve(type: "update", observer: Observer<BasicStateEvents<A>["update"]>): void;
	unobserve<B extends keyof BasicStateEvents<A>>(type: B, observer: Observer<BasicStateEvents<A>[B]>): void;

	update(value: A): boolean;

	value(): A;
}

export type ArrayStateEvents<A extends ArrayValue> = BasicStateEvents<A> & {
	"insert": [
		state: State<A[number]>,
		index: number
	];
	"remove": [
		state: State<A[number]>,
		index: number
	];
};

interface ArrayState<in out A extends ArrayValue> extends BasicState<A> {
	[key: number]: State<A[number]>;

	append(...items: Array<StateOrValue<A[number]>>): void;

	element(index: number | State<number>): State<A[number]>;

	filter(predicate: Predicate<A[number]>): State<Array<A[number]>>;

	first(): State<A[number] | undefined>;

	insert(index: number, item: StateOrValue<A[number]>): State<A[number]>;

	last(): State<A[number] | undefined>;

	get length(): State<number>;

	mapStates<B>(mapper: StateMapper<A[number], B>): State<Array<B>>;

	mapValues<B>(mapper: ValueMapper<A[number], B>): State<Array<B>>;

	observe(type: "update", observer: Observer<ArrayStateEvents<A>["update"]>): Subscription;
	observe(type: "insert", observer: Observer<ArrayStateEvents<A>["insert"]>): Subscription;
	observe(type: "remove", observer: Observer<ArrayStateEvents<A>["remove"]>): Subscription;
	observe<B extends keyof ArrayStateEvents<A>>(type: B, observer: Observer<ArrayStateEvents<A>[B]>): Subscription;

	remove(index: number): void;

	spread(): ElementStates<A>;

	vacate(): boolean;

	[Symbol.iterator](): Iterator<State<A[number]>>;
}

export type ObjectStateEventsTuple<A extends RecordValue> = {
	[B in keyof A]: [
		state: State<A[B]>,
		key: B
	];
}[keyof A];

export type RecordStateEvents<A extends RecordValue> = BasicStateEvents<A> & {
	"attach": ObjectStateEventsTuple<A>;
	"detach": ObjectStateEventsTuple<A>;
};

interface RecordState<in out A extends RecordValue> extends BasicState<A> {
	observe(type: "update", observer: Observer<RecordStateEvents<A>["update"]>): Subscription;
	observe(type: "attach", observer: Observer<RecordStateEvents<A>["attach"]>): Subscription;
	observe(type: "detach", observer: Observer<RecordStateEvents<A>["detach"]>): Subscription;
	observe<B extends keyof RecordStateEvents<A>>(type: B, observer: Observer<RecordStateEvents<A>[B]>): Subscription;

	attach<B extends string, C>(key: B, item: StateOrValue<C>): State<ExpansionOf<A & { [key in B]: C; }>>;

	member<B extends keyof A>(key: StateOrValue<B>): State<A[B]>;

	detach<B extends keyof A>(key: B): State<ExpansionOf<Omit<A, B>>>;

	spread(): MemberStates<A>;
}

type ArrayType<A> = [A] extends [ArrayValue] ? A : any;
type RecordType<A> = [A] extends [RecordValue] ? A : any;
type BasicType<A> = [A] extends [Value] ? A : any;

type StateEvents<A> =
	ArrayStateEvents<ArrayType<A>> |
	RecordStateEvents<RecordType<A>> |
	BasicStateEvents<BasicType<A>>;

class StateImplementation<in out A> implements ArrayState<ArrayType<A>>, RecordState<RecordType<A>>, BasicState<BasicType<A>> {
	protected active_value: A;

	constructor(active_value: A) {
		this.active_value = active_value;
	}

	append(...items: StateOrValue<ArrayType<A>[number]>[]): void {
		throw new Error("Method not implemented.");
	}

	element(index: number | BasicState<number>): State<ArrayType<A>[number]> {
		throw new Error("Method not implemented.");
	}

	filter(predicate: Predicate<ArrayType<A>[number]>): ElementStates<ArrayType<A>[number][]> & ArrayState<ArrayType<A>[number][]> {
		throw new Error("Method not implemented.");
	}

	first(): State<ArrayType<A>[number] | undefined> {
		throw new Error("Method not implemented.");
	}

	last(): State<ArrayType<A>[number] | undefined> {
		throw new Error("Method not implemented.");
	}

	get length(): BasicState<number> {
		throw new Error("Method not implemented.");
	}

	mapStates<B>(mapper: StateMapper<ArrayType<A>[number], B>): ElementStates<B[]> & ArrayState<B[]> {
		throw new Error("Method not implemented.");
	}

	mapValues<B>(mapper: ValueMapper<ArrayType<A>[number], B>): ElementStates<B[]> & ArrayState<B[]> {
		throw new Error("Method not implemented.");
	}

	member<B extends keyof A>(key: StateOrValue<B>): State<A[B]> {
		throw new Error("Method not implemented.");
	}

	spread(): MemberStates<RecordType<A>>;
	spread(): ElementStates<ArrayType<A>>;
	spread(): MemberStates<RecordType<A>> | ElementStates<ArrayType<A>> {
		throw new Error("Method not implemented.");
	}

	vacate(): boolean {
		throw new Error("Method not implemented.");
	}

	[Symbol.iterator](): Iterator<State<ArrayType<A>[number]>, any, undefined> {
		throw new Error("Method not implemented.");
	}

	compute<B>(computer: Computer<A, B>): State<B> {
		throw new Error("Method not implemented.");
	}

	observe<B extends keyof StateEvents<A>>(type: B, observer: Observer<StateEvents<A>[B]>): Subscription {
		throw new Error("Method not implemented.");
	}

	shadow(): State<A> {
		throw new Error("Method not implemented.");
	}

	subscribe<A, B extends TupleRecord<B> & BasicStateEvents<A>, C extends keyof B>(target: State<A>, type: C, callback: Callback<B[C]>): Subscription {
		throw new Error("Method not implemented.");
	}

	unobserve<B extends keyof StateEvents<A>>(type: B, observer: Observer<StateEvents<A>[B]>): void {
		throw new Error("Method not implemented.");
	}

	attach<B extends string, C>(key: B, item: StateOrValue<C>): State<ExpansionOf<A & { [key in B]: C; }>> {
		throw new Error("Method not implemented.");
	}

	detach<B extends keyof A>(key: B): State<ExpansionOf<Omit<A, B>>> {
		throw new Error("Method not implemented.");
	}

	insert(index: number, item: StateOrValue<ArrayType<A>[number]>): State<ArrayType<A>[number]> {
		throw new Error("Method not implemented.");
	}

	remove(): void {
		throw new Error("Method not implemented.");
	}

	update(value: A): boolean {
		throw new Error("Method not implemented.");
	}

	value(): A {
		throw new Error("Method not implemented.");
	}

	[key: number]: State<ArrayType<A>[number]>;
}

export type ElementStates<A extends ArrayValue> = {
	[key: number]: State<A[number]>;
};

export type MemberStates<A extends RecordValue> = {
	[B in keyof A]-?: State<A[B]>;
};

type State<A> = (
	[A] extends [ArrayValue] ? /* ElementStates<A> &  */ArrayState<A> :
	[A] extends [RecordButNotClass<A>] ? MemberStates<A> & RecordState<A> :
	BasicState<A>
);

type Attribute<A> = State<A> | (
	A extends ArrayValue ? { [B in keyof A]: Attribute<A[B]>; } :
	A extends RecordValue ? A extends RecordButNotClass<A> ? { [B in keyof A]: Attribute<A[B]>; } : A :
	A
);

type ValueFromAttribute<A> = (
	A extends State<infer B> ? B :
	A extends ArrayValue ? { [B in keyof A]: ValueFromAttribute<A[B]>; } :
	A extends RecordValue ? A extends RecordButNotClass<A> ? { [B in keyof A]: ValueFromAttribute<A[B]>; } : A :
	A
);

function make_state<A>(value: A): State<A> {
	return new StateImplementation(value) as any;
};

function stateify<A extends Attribute<any>>(attribute: A): State<ValueFromAttribute<A>> {
	throw "";
}

function valueify<A extends Attribute<any>>(attribute: A): ValueFromAttribute<A> {
	throw "";
}

let state = stateify([make_state("a"), "b"]);
let state2 = stateify(["a", "b"] as ["a", "b"]);
let state3 = stateify({ one: "a", two: "b" });
let value = valueify([make_state("a"), "b"]);



























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

function two<A>(state: State<Array<A>>): void {
	state.observe("update", (state) => {
		state.update(state.value());
	});
	state.observe("insert", (state, index) => {
		state.update(state.value());
	});
	state.observe("remove", (state, index) => {
		state.update(state.value());
	});
	state.update(state.value());
}

function three<A>(state: State<{ [key: string]: A }>): void {
	state.observe("update", (state) => {
		state.update(state.value());
	});
	state.observe("attach", (state, key) => {
		state.update(state.value());
	});
	state.observe("detach", (state, key) => {
		state.update(state.value());
	});
	state.update(state.value());
}

function callable(state: State<string | undefined>): void {

}
// @ts-expect-error
callable(stateify<string>("string"));
// @ts-expect-error
callable(stateify<undefined>(undefined));
callable(stateify<string | undefined>(undefined));


export function squash<A extends RecordValue>(records: State<Array<A>>): State<A> {
	throw "";
};

{
	let records = stateify([
		{ one: "a" }
	] as Array<Record<string, string>>);
	let squashed = squash(records);
}

export function flatten<A extends RecursiveArray<any>>(states: State<Array<A>>): State<Array<RecursiveArrayType<A>>> {
	throw "";
};

{
	let array_00 = stateify(["b"]);
	let array_01 = stateify(["e"]);
	let array_10 = stateify(["h"]);
	let array_11 = stateify(["k"]);
	let array_0 = stateify([array_00, array_01]);
	let array_1 = stateify([array_10, array_11]);
	let array = stateify([array_0, array_1]);
	let flattened = flatten(array);

}
