type ExpansionOf<A> = A extends infer B ? { [C in keyof B]: B[C] } : never;
type ArrayElementType<A> = [A] extends [Array<infer B>] ? B : never;
type RecordButNotClass<A> = A extends { [key: string]: unknown; } ? A : never;
type RecursiveArray<A> = Array<A | RecursiveArray<A>>;
type RecursiveArrayType<A> = A extends Array<infer B> ? RecursiveArrayType<B> : A;

export type TupleRecord<A extends TupleRecord<A>> = { [C in keyof A]: any[]; };

export type PrimitiveValue = symbol | void | bigint | boolean | number | string | null | undefined;

export type ReferenceValue = Object;

export type Value = any;

export type ArrayValue = Value[];

export type ReadonlyArrayValue = readonly Value[];

export type RecordValue = { [key: string]: Value; };

export type ReadableStateMapper<A, B> = (state: ReadableState<A>, index: ReadableState<number>) => B | ReadableState<B>;

export type ValueMapper<A, B> = (value: A, index: number) => B;

export type ReadablePredicate<A> = (state: ReadableState<A>, index: ReadableState<number>) => ReadableState<boolean>;

export type Observer<A extends any[]> = (...args: A) => void;

export type Callback<A extends any[]> = (...args: A) => void;

export type Computer<A, B> = (value: A) => B;

export type CancellationToken = Subscription;

export type Subscription = (() => void) & {
	is_cancelled: ReadableState<boolean>;
};

export const Subscription = {
	create(is_cancelled: WritableState<boolean>, callback: Callback<[]>): Subscription {
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










export type ReadableStateOrValue<A> = A | ReadableState<A>;

export type WritableStateOrValue<A> = A | WritableState<A>;

export type ReadableBasicStateEvents<A extends Value> = {
	"update": [
		state: ReadableBasicState<A>
	];
};

export interface ReadableBasicState<A extends Value> {
	compute<B>(computer: Computer<A, B>): ReadableState<B>;

	observe(type: "update", observer: Observer<ReadableBasicStateEvents<A>["update"]>): Subscription;
	observe<B extends keyof ReadableBasicStateEvents<A>>(type: B, observer: Observer<ReadableBasicStateEvents<A>[B]>): Subscription;

	shadow(): ReadableState<A>;

	// This one seems to require binding between targets event types.
	subscribe<A, B extends TupleRecord<B>, C extends keyof B>(target: State<A>, type: C, callback: Callback<B[C]>): Subscription;

	unobserve(type: "update", observer: Observer<ReadableBasicStateEvents<A>["update"]>): void;
	unobserve<B extends keyof ReadableBasicStateEvents<A>>(type: B, observer: Observer<ReadableBasicStateEvents<A>[B]>): void;

	value(): A;
};

export type WritableBasicStateEvents<A extends Value> = {
	"update": [
		state: WritableBasicState<A>
	];
};

export interface WritableBasicState<A extends Value> {
	compute<B>(computer: Computer<A, B>): ReadableState<B>;

	observe(type: "update", observer: Observer<WritableBasicStateEvents<A>["update"]>): Subscription;
	observe<B extends keyof WritableBasicStateEvents<A>>(type: B, observer: Observer<WritableBasicStateEvents<A>[B]>): Subscription;

	shadow(): WritableState<A>;

	// This one seems to require binding between targets event types.
	subscribe<A, B extends TupleRecord<B>, C extends keyof B>(target: State<A>, type: C, callback: Callback<B[C]>): Subscription;

	unobserve(type: "update", observer: Observer<WritableBasicStateEvents<A>["update"]>): void;
	unobserve<B extends keyof WritableBasicStateEvents<A>>(type: B, observer: Observer<WritableBasicStateEvents<A>[B]>): void;

	value(): A;

	update(value: A): boolean;
};

export type ReadableArrayStateEvents<A extends ArrayValue> = ReadableBasicStateEvents<A> & {
	"insert": [
		state: ReadableState<A[number]>,
		index: number
	];
	"remove": [
		state: ReadableState<A[number]>,
		index: number
	];
};

export interface ReadableArrayState<A extends ArrayValue> extends ReadableBasicState<A> {
	element(index: number | ReadableState<number>): ReadableState<A[number]>;

	filter(predicate: ReadablePredicate<A[number]>): ReadableState<Array<A[number]>>;

	first(): ReadableState<A[number] | undefined>;

	last(): ReadableState<A[number] | undefined>;

	get length(): ReadableState<number>;

	mapStates<B>(mapper: ReadableStateMapper<A[number], B>): ReadableState<Array<B>>;

	mapValues<B>(mapper: ValueMapper<A[number], B>): ReadableState<Array<B>>;

	observe(type: "update", observer: Observer<ReadableArrayStateEvents<A>["update"]>): Subscription;
	observe(type: "insert", observer: Observer<ReadableArrayStateEvents<A>["insert"]>): Subscription;
	observe(type: "remove", observer: Observer<ReadableArrayStateEvents<A>["remove"]>): Subscription;
	observe<B extends keyof ReadableArrayStateEvents<A>>(type: B, observer: Observer<ReadableArrayStateEvents<A>[B]>): Subscription;

	spread(): ReadableElementStates<A>;

	[Symbol.iterator](): Iterator<ReadableState<A[number]>>;
};

export type WritableArrayStateEvents<A extends ArrayValue> = WritableBasicStateEvents<A> & {
	"insert": [
		state: WritableState<A[number]>,
		index: number
	];
	"remove": [
		state: WritableState<A[number]>,
		index: number
	];
};

export interface WritableArrayState<A extends ArrayValue> extends WritableBasicState<A> {
	append(...items: Array<ReadableStateOrValue<A[number]>>): void;

	element(index: number | ReadableState<number>): ReadableState<A[number]>;

	filter(predicate: ReadablePredicate<A[number]>): ReadableState<Array<A[number]>>;

	first(): ReadableState<A[number] | undefined>;

	insert(index: number, item: ReadableStateOrValue<A[number]>): ReadableState<A[number]>;

	last(): ReadableState<A[number] | undefined>;

	get length(): ReadableState<number>;

	mapStates<B>(mapper: ReadableStateMapper<A[number], B>): ReadableState<Array<B>>;

	mapValues<B>(mapper: ValueMapper<A[number], B>): ReadableState<Array<B>>;

	observe(type: "update", observer: Observer<WritableArrayStateEvents<A>["update"]>): Subscription;
	observe(type: "insert", observer: Observer<WritableArrayStateEvents<A>["insert"]>): Subscription;
	observe(type: "remove", observer: Observer<WritableArrayStateEvents<A>["remove"]>): Subscription;
	observe<B extends keyof WritableArrayStateEvents<A>>(type: B, observer: Observer<WritableArrayStateEvents<A>[B]>): Subscription;

	remove(index: number): void;

	spread(): WritableElementStates<A>;

	vacate(): boolean;

	[Symbol.iterator](): Iterator<WritableState<A[number]>>;
};

export type ReadableRecordStateEventsTuple<A extends RecordValue> = {
	[B in keyof A]: [
		state: ReadableState<A[B]>,
		key: B
	];
}[keyof A];

export type ReadableRecordStateEvents<A extends RecordValue> = ReadableBasicStateEvents<A> & {
	"attach": ReadableRecordStateEventsTuple<A>;
	"detach": ReadableRecordStateEventsTuple<A>;
};

export interface ReadableRecordState<A extends RecordValue> extends ReadableBasicState<A> {
	observe(type: "update", observer: Observer<ReadableRecordStateEvents<A>["update"]>): Subscription;
	observe(type: "attach", observer: Observer<ReadableRecordStateEvents<A>["attach"]>): Subscription;
	observe(type: "detach", observer: Observer<ReadableRecordStateEvents<A>["detach"]>): Subscription;
	observe<B extends keyof ReadableRecordStateEvents<A>>(type: B, observer: Observer<ReadableRecordStateEvents<A>[B]>): Subscription;

	member<B extends keyof A>(key: ReadableStateOrValue<B>): ReadableState<A[B]>;

	spread(): ReadableMemberStates<A>;
};

export type WritableRecordStateEventsTuple<A extends RecordValue> = {
	[B in keyof A]: [
		state: WritableState<A[B]>,
		key: B
	];
}[keyof A];

export type WritableRecordStateEvents<A extends RecordValue> = WritableBasicStateEvents<A> & {
	"attach": WritableRecordStateEventsTuple<A>;
	"detach": WritableRecordStateEventsTuple<A>;
};

export interface WritableRecordState<A extends RecordValue> extends WritableBasicState<A> {
	observe(type: "update", observer: Observer<WritableRecordStateEvents<A>["update"]>): Subscription;
	observe(type: "attach", observer: Observer<WritableRecordStateEvents<A>["attach"]>): Subscription;
	observe(type: "detach", observer: Observer<WritableRecordStateEvents<A>["detach"]>): Subscription;
	observe<B extends keyof WritableRecordStateEvents<A>>(type: B, observer: Observer<WritableRecordStateEvents<A>[B]>): Subscription;

	attach<B extends string, C>(key: B, item: WritableStateOrValue<C>): WritableState<ExpansionOf<A & { [key in B]: C; }>>;

	member<B extends keyof A>(key: WritableStateOrValue<B>): WritableState<A[B]>;

	detach<B extends keyof A>(key: B): WritableState<ExpansionOf<Omit<A, B>>>;

	spread(): WritableMemberStates<A>;
};

type ArrayType<A> = [A] extends [ArrayValue] ? A : any;
type RecordType<A> = [A] extends [RecordValue] ? A : any;
type BasicType<A> = [A] extends [Value] ? A : any;

type ReadableStateEvents<A> =
	ReadableArrayStateEvents<ArrayType<A>> |
	ReadableRecordStateEvents<RecordType<A>> |
	ReadableBasicStateEvents<BasicType<A>>;

class StateImplementation<A> implements WritableArrayState<ArrayType<A>>, WritableRecordState<RecordType<A>>, WritableBasicState<BasicType<A>> {
	protected active_value: A;

	constructor(active_value: A) {
		this.active_value = active_value;
	}

	append(...items: ReadableStateOrValue<ArrayType<A>[number]>[]): void {
		throw new Error("Method not implemented.");
	}

	element(index: number | ReadableBasicState<number>): ReadableState<ArrayType<A>[number]> {
		throw new Error("Method not implemented.");
	}

	filter(predicate: ReadablePredicate<ArrayType<A>[number]>): ReadableElementStates<ArrayType<A>[number][]> & ReadableArrayState<ArrayType<A>[number][]> {
		throw new Error("Method not implemented.");
	}

	first(): ReadableState<ArrayType<A>[number] | undefined> {
		throw new Error("Method not implemented.");
	}

	last(): ReadableState<ArrayType<A>[number] | undefined> {
		throw new Error("Method not implemented.");
	}

	get length(): ReadableBasicState<number> {
		throw new Error("Method not implemented.");
	}

	mapStates<B>(mapper: ReadableStateMapper<ArrayType<A>[number], B>): ReadableElementStates<B[]> & ReadableArrayState<B[]> {
		throw new Error("Method not implemented.");
	}

	mapValues<B>(mapper: ValueMapper<ArrayType<A>[number], B>): ReadableElementStates<B[]> & ReadableArrayState<B[]> {
		throw new Error("Method not implemented.");
	}

	member<B extends keyof A>(key: ReadableStateOrValue<B>): ReadableState<A[B]>;
	member<B extends keyof A>(key: WritableStateOrValue<B>): WritableState<A[B]>;
	member<B extends keyof A>(key: ReadableStateOrValue<B> | WritableStateOrValue<B>): ReadableState<A[B]> | WritableState<A[B]> {
		throw new Error("Method not implemented.");
	}

	spread(): WritableMemberStates<RecordType<A>>;
	spread(): WritableElementStates<ArrayType<A>>;
	spread(): WritableMemberStates<RecordType<A>> | WritableElementStates<ArrayType<A>> {
		throw new Error("Method not implemented.");
	}

	vacate(): boolean {
		throw new Error("Method not implemented.");
	}

	[Symbol.iterator](): Iterator<ReadableState<ArrayType<A>[number]>>;
	[Symbol.iterator](): Iterator<WritableState<ArrayType<A>[number]>>;
	[Symbol.iterator](): Iterator<ReadableState<ArrayType<A>[number]>> | Iterator<WritableState<ArrayType<A>[number]>> {
		throw new Error("Method not implemented.");
	}

	compute<B>(computer: Computer<A, B>): ReadableState<B> {
		throw new Error("Method not implemented.");
	}

	observe<B extends keyof ReadableStateEvents<A>>(type: B, observer: Observer<ReadableStateEvents<A>[B]>): Subscription {
		throw new Error("Method not implemented.");
	}

	shadow(): ReadableState<A>;
	shadow(): WritableState<A>;
	shadow(): ReadableState<A> | WritableState<A> {
		throw new Error("Method not implemented.");
	}

	subscribe<A, B extends TupleRecord<B>, C extends keyof B>(target: State<A>, type: C, callback: Callback<B[C]>): Subscription {
		throw new Error("Method not implemented.");
	}

	unobserve<B extends keyof ReadableStateEvents<A>>(type: B, observer: Observer<ReadableStateEvents<A>[B]>): void {
		throw new Error("Method not implemented.");
	}

	attach<B extends string, C>(key: B, item: ReadableStateOrValue<C>): WritableState<ExpansionOf<A & { [key in B]: C; }>>;
	attach<B extends string, C>(key: B, item: WritableStateOrValue<C>): WritableState<ExpansionOf<A & { [key in B]: C; }>>;
	attach<B extends string, C>(key: B, item: ReadableStateOrValue<C> | WritableStateOrValue<C>): WritableState<ExpansionOf<A & { [key in B]: C; }>> {
		throw new Error("Method not implemented.");
	}

	detach<B extends keyof A>(key: B): ReadableState<ExpansionOf<Omit<A, B>>>;
	detach<B extends keyof A>(key: B): WritableState<ExpansionOf<Omit<A, B>>>;
	detach<B extends keyof A>(key: B): ReadableState<ExpansionOf<Omit<A, B>>> | WritableState<ExpansionOf<Omit<A, B>>> {
		throw new Error("Method not implemented.");
	}

	insert(index: number, item: ReadableStateOrValue<ArrayType<A>[number]>): ReadableState<ArrayType<A>[number]> {
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

	[key: number]: WritableState<ArrayType<A>[number]>;
}

export type ReadableElementStates<A extends ArrayValue> = {
	[key: number]: ReadableState<A[number]>;
};

export type ReadableMemberStates<A extends RecordValue> = {
	[B in keyof A]-?: ReadableState<A[B]>;
};

export type WritableElementStates<A extends ArrayValue> = {
	[key: number]: WritableState<A[number]>;
};

export type WritableMemberStates<A extends RecordValue> = {
	[B in keyof A]-?: WritableState<A[B]>;
};

export type ReadableState2<A> = (
	[A] extends [ArrayValue] ? ReadableElementStates<A> & ReadableArrayState<A> :
	[A] extends [RecordButNotClass<A>] ? ReadableMemberStates<A> & ReadableRecordState<A> :
	ReadableBasicState<A>
);

export type ReadableState<A> = ReadableState2<A> | (
	A extends ArrayValue ? ReadableElementStates<A> & ReadableArrayState<A> :
	A extends RecordButNotClass<A> ? ReadableMemberStates<A> & ReadableRecordState<A> :
	ReadableBasicState<A>
);

export type WritableState<A> = (
	[A] extends [ArrayValue] ? WritableElementStates<A> & WritableArrayState<A> :
	[A] extends [RecordButNotClass<A>] ? WritableMemberStates<A> & WritableRecordState<A> :
	WritableBasicState<A>
);

export type State<A> = ReadableState<A> | WritableState<A>;

export type StateOrValue<A> = A | State<A>;

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

function make_state<A>(value: A): WritableState<A> {
	return new StateImplementation(value) as any;
};

/* logic: return writable state only when attribute is value, else readable state */
function stateify<A extends Attribute<any>>(attribute: A): ReadableState<ValueFromAttribute<A>> {
	throw "";
};

function valueify<A extends Attribute<any>>(attribute: A): ValueFromAttribute<A> {
	throw "";
};

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

namespace value_from_attribute_readable_state {
	type basic_state_1 = ValueFromAttribute<ReadableState<string>>;
	type basic_state_2 = ValueFromAttribute<ReadableState<string | number>>;
	type basic_state_3 = ValueFromAttribute<ReadableState<Element>>;
	type basic_state_4 = ValueFromAttribute<ReadableState<Element | Date>>;
	type basic_state_5 = ValueFromAttribute<ReadableState<{ key: string } | number>>;
	type record_state_1 = ValueFromAttribute<ReadableState<{ one: string }>>;
	type record_state_2 = ValueFromAttribute<ReadableState<{ one: string } | { one: string, two: string }>>;
	type array_state_1 = ValueFromAttribute<ReadableState<string[]>>;
	type array_state_2 = ValueFromAttribute<ReadableState<string[] | number[]>>;
	type mixed_state_1 = ValueFromAttribute<ReadableState<string | { [key: string]: any }>>;
}

namespace state {
	type basic_state_1 = ReadableState<string>;
	type basic_state_2 = ReadableState<string | number>;
	type basic_state_3 = ReadableState<Element>;
	type basic_state_4 = ReadableState<Element | Date>;
	type basic_state_5 = ReadableState<{ key: string } | number>;
	type record_state_1 = ReadableState<{ one: string }>;
	type record_state_2 = ReadableState<{ one: string } | { one: string, two: string }>;
	type array_state_1 = ReadableState<string[]>;
	type array_state_2 = ReadableState<string[] | number[]>;
	type mixed_state_1 = ReadableState<string | { [key: string]: any }>;
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

function one<A>(state: WritableState<A>): void {
	state.observe("update", (state) => {
		state.update(state.value());
	});
	state.update(state.value());
}

function two<A>(state: WritableState<Array<A>>): void {
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

function three<A>(state: WritableState<{ [key: string]: A }>): void {
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

// Attribute should accept any value or state.
function function_expecting_attribute(attribute: Attribute<string | undefined>): void {
	let value = valueify(attribute);
}
function_expecting_attribute(undefined as any as ReadableState<string>);
function_expecting_attribute(undefined as any as ReadableState<undefined>);
function_expecting_attribute(undefined as any as ReadableState<string | undefined>);
function_expecting_attribute(undefined as any as WritableState<string>);
function_expecting_attribute(undefined as any as WritableState<undefined>);
function_expecting_attribute(undefined as any as WritableState<string | undefined>);
function_expecting_attribute(undefined as any as string);
function_expecting_attribute(undefined as any as undefined);
function_expecting_attribute(undefined as any as string | undefined);

// ReadableState should be covariant. Any state that can be guaranteed to only contain string, undefined or string | undefined should be accepted.
function function_expecting_readable_state(attribute: ReadableState<string | undefined>): void {
	let value = valueify(attribute);
	let shadow = attribute.shadow();
}
function_expecting_readable_state(undefined as any as ReadableState<string>);
function_expecting_readable_state(undefined as any as ReadableState<undefined>);
function_expecting_readable_state(undefined as any as ReadableState<string | undefined>);
function_expecting_readable_state(undefined as any as WritableState<string>);
function_expecting_readable_state(undefined as any as WritableState<undefined>);
function_expecting_readable_state(undefined as any as WritableState<string | undefined>);
// @ts-expect-error
function_expecting_readable_state(undefined as any as string);
// @ts-expect-error
function_expecting_readable_state(undefined as any as undefined);
// @ts-expect-error
function_expecting_readable_state(undefined as any as string | undefined);

// WritableState should be invariant. Only state containing exactly string | undefined should be accepted.
function function_expecting_writable_state(attribute: WritableState<string | undefined>): void {
	let value = valueify(attribute);
	let shadow = attribute.shadow();
}
// @ts-expect-error
function_expecting_writable_state(undefined as any as ReadableState<string>);
// @ts-expect-error
function_expecting_writable_state(undefined as any as ReadableState<undefined>);
// @ts-expect-error
function_expecting_writable_state(undefined as any as ReadableState<string | undefined>);
// @ts-expect-error
function_expecting_writable_state(undefined as any as WritableState<string>);
// @ts-expect-error
function_expecting_writable_state(undefined as any as WritableState<undefined>);
function_expecting_writable_state(undefined as any as WritableState<string | undefined>);
// @ts-expect-error
function_expecting_writable_state(undefined as any as string);
// @ts-expect-error
function_expecting_writable_state(undefined as any as undefined);
// @ts-expect-error
function_expecting_writable_state(undefined as any as string | undefined);


export function squash<A extends RecordValue>(records: ReadableState<Array<A>>): ReadableState<A> {
	throw "";
};

{
	let records = stateify([
		{ one: "a" }
	] as Array<Record<string, string>>);
	let squashed = squash(records);
}

export function flatten<A extends RecursiveArray<any>>(states: ReadableState<Array<A>>): ReadableState<Array<RecursiveArrayType<A>>> {
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
