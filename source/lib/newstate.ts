type ExpansionOf<A> = A extends infer B ? { [C in keyof B]: B[C] } : never;
type ArrayElementType<A> = [A] extends [Array<infer B>] ? B : never;
type RecordButNotClass<A> = A extends { [key: string]: unknown; } ? A : never;
type RecursiveArray<A> = Array<A | RecursiveArray<A>>;
type RecursiveArrayType<A> = A extends Array<infer B> ? RecursiveArrayType<B> : A;
type IsTuple<A> = Extract<keyof A, `${number}`> extends number ? false : true;
type TupleButNotArray<A> = Extract<keyof A, `${number}`> extends number ? never : A;
type EventOnMap<A extends TupleRecord<A>> = {
	[B in keyof A & string as `on${B}`]: (...args: [...A[B]]) => A[B];
};

export type TupleRecord<A extends TupleRecord<A>> = { [C in keyof A]: any[]; };

export type PrimitiveValue = symbol | void | bigint | boolean | number | string | null | undefined;

export type ReferenceValue = Object;

export type Value = any;

export type ArrayValue = Value[];

export type ReadonlyArrayValue = readonly Value[];

export type RecordValue = { [key: string]: Value; };

export type ReadableStateMapper<A, B> = (state: ReadableState<A>, index: ReadableState<number>) => ReadableState<B>;
export type ReadableStateMapper2<A, B> = (state: ReadableState<A>, index: ReadableState<number>) => B;

export type WritableStateMapper<A, B> = (state: WritableState<A>, index: ReadableState<number>) => ReadableState<B>;
export type WritableStateMapper2<A, B> = (state: WritableState<A>, index: ReadableState<number>) => B;

// this is heavy
export type StateFromAttribute<A> = WritableValueFromAttribute<A> extends ValueFromAttribute<A> ? WritableState<ValueFromAttribute<A>> : ReadableState<ValueFromAttribute<A>>

export type StateTupleFromValueTuple<A extends ArrayValue> = {
	[B in keyof A]: ReadableOrWritableState<A[B]>;
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

export type ValueMapper<A, B> = (value: A, index: number) => B;

export type Predicate<A> = (state: ReadableState<A>, index: ReadableState<number>) => ReadableState<boolean>;

export type Observer<A extends any[]> = (...args: [...A]) => void;

export type Callback<A extends any[]> = (...args: [...A]) => void;

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




export type ObserveOptions = {
	weakly?: boolean;
};

export interface Observable<A extends TupleRecord<A>> {
	observe<B extends keyof A>(type: B, observer: Observer<A[B]>, options?: ObserveOptions): Subscription;
	subscribe(subscription: Subscription): Subscription;
	unobserve<B extends keyof A>(type: B, observer: Observer<A[B]>): void;
};












export interface AbstractReadableState<A extends Value, B extends TupleRecord<B>> extends Observable<B> {
	compute<C>(computer: Computer<A, C>): WritableState<C>;

	shadow(): ReadableState<A>;

	value(): A;
};

export interface AbstractWritableState<in out A extends Value, B extends TupleRecord<B>> extends Observable<B> {
	compute<C>(computer: Computer<A, C>): WritableState<C>;

	shadow(): WritableState<A>;

	value(): A;

	update(value: A): boolean;
};















export type ReadableBasicStateEvents<A extends Value> = {
	"update": [
		state: ReadableState<A>
	];
};

export interface ReadableBasicState<A extends Value> extends AbstractReadableState<A, ReadableBasicStateEvents<A>> {

};

export type WritableBasicStateEvents<A extends Value> = {
	"update": [
		state: WritableState<A>
	];
};

export interface WritableBasicState<in out A extends Value> extends AbstractWritableState<A, WritableBasicStateEvents<A>> {

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

export interface ReadableArrayState<A extends ArrayValue> extends AbstractReadableState<A, ReadableArrayStateEvents<A>> {
	element(index: number | ReadableState<number>): ReadableState<A[number]>;

	filter(predicate: Predicate<A[number]>): ReadableState<Array<A[number]>>;

	first(): ReadableState<A[number] | undefined>;

	last(): ReadableState<A[number] | undefined>;

	get length(): ReadableState<number>;

	mapStates<B>(mapper: ReadableStateMapper2<A[number], ReadableState<B>>): ReadableState<Array<B>>;
	mapStates<B>(mapper: ReadableStateMapper2<A[number], B>): ReadableState<Array<B>>;

	mapValues<B>(mapper: ValueMapper<A[number], B>): ReadableState<Array<B>>;

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

export interface WritableArrayState<in out A extends ArrayValue> extends AbstractWritableState<A, WritableArrayStateEvents<A>> {
	append(...items: Array<ReadableStateOrValue<A[number]>>): void;

	element(index: number | ReadableState<number>): WritableState<A[number]>;

	filter(predicate: Predicate<A[number]>): WritableState<Array<A[number]>>;

	first(): WritableState<A[number] | undefined>;

	insert(index: number, item: WritableStateOrValue<A[number]>): WritableState<A[number]>;

	last(): WritableState<A[number] | undefined>;

	get length(): ReadableState<number>;

	mapStates<B>(mapper: WritableStateMapper2<A[number], ReadableState<B>>): ReadableState<Array<B>>;
	mapStates<B>(mapper: WritableStateMapper2<A[number], WritableState<B>>): ReadableState<Array<B>>;
	mapStates<B>(mapper: WritableStateMapper2<A[number], B>): ReadableState<Array<B>>;

	mapValues<B>(mapper: ValueMapper<A[number], B>): ReadableState<Array<B>>;

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

export interface ReadableRecordState<A extends RecordValue> extends AbstractReadableState<A, ReadableRecordStateEvents<A>> {
	member<B extends keyof A, C extends A[B]>(key: ReadableStateOrValue<B>): ReadableState<C>;

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

export interface WritableRecordState<in out A extends RecordValue> extends AbstractWritableState<A, WritableRecordStateEvents<A>> {
	attach<B extends string, C>(key: B, item: WritableStateOrValue<C>): void;
	//attach<B extends string, C>(key: B, item: WritableStateOrValue<C>): WritableState<ExpansionOf<A & { [key in B]: C; }>>;

	member<B extends keyof A, C extends A[B]>(key: ReadableStateOrValue<B>): WritableState<C>;

	detach<B extends keyof A>(key: B): WritableState<ExpansionOf<Omit<A, B>>>;

	spread(): WritableMemberStates<A>;
};

























type ArrayType<A> = [A] extends [ArrayValue] ? A : any;
type RecordType<A> = [A] extends [RecordValue] ? A : any;
type BasicType<A> = [A] extends [Value] ? A : any;

export type ReadableStateEvents<A> =
	ReadableArrayStateEvents<ArrayType<A>> &
	ReadableRecordStateEvents<RecordType<A>> &
	ReadableBasicStateEvents<BasicType<A>>;

export type WritableStateEvents<A> =
	WritableArrayStateEvents<ArrayType<A>> &
	WritableRecordStateEvents<RecordType<A>> &
	WritableBasicStateEvents<BasicType<A>>;

export class StateImplementation<A> implements WritableArrayState<ArrayType<A>>, WritableRecordState<RecordType<A>>, WritableBasicState<BasicType<A>> {
	constructor() {
		throw new Error("Method not implemented.");
	}

	append(...items: ReadableStateOrValue<ArrayType<A>[number]>[]): void {
		throw new Error("Method not implemented.");
	}

	element(index: number | ReadableState<number>): WritableState<ArrayType<A>[number]> {
		throw new Error("Method not implemented.");
	}

	filter(predicate: Predicate<ArrayType<A>[number]>): WritableState<Array<ArrayType<A>[number]>> {
		throw new Error("Method not implemented.");
	}

	first(): WritableState<ArrayType<A>[number] | undefined> {
		throw new Error("Method not implemented.");
	}

	last(): WritableState<ArrayType<A>[number] | undefined> {
		throw new Error("Method not implemented.");
	}

	get length(): ReadableState<number> {
		throw new Error("Method not implemented.");
	}

	mapStates<B>(mapper: WritableStateMapper<ArrayType<A>[number], WritableState<B>> | WritableStateMapper2<ArrayType<A>[number], B>): ReadableState<Array<B>> {
		throw new Error("Method not implemented.");
	}

	mapValues<B>(mapper: ValueMapper<ArrayType<A>[number], B>): ReadableState<Array<B>> {
		throw new Error("Method not implemented.");
	}

	member<B extends keyof RecordType<A>, C extends RecordType<A>[B]>(key: ReadableStateOrValue<B>): WritableState<C> {
		throw new Error("Method not implemented.");
	}

	spread(): WritableElementStates<ArrayType<A>>;
	spread(): WritableMemberStates<RecordType<A>>;
	spread(): WritableMemberStates<RecordType<A>> | WritableElementStates<ArrayType<A>> {
		throw new Error("Method not implemented.");
	}

	vacate(): boolean {
		throw new Error("Method not implemented.");
	}

	[Symbol.iterator](): Iterator<WritableState<ArrayType<A>[number]>> {
		throw new Error("Method not implemented.");
	}

	compute<B>(computer: Computer<A, B>): WritableState<B> {
		throw new Error("Method not implemented.");
	}

	observe<B extends keyof WritableStateEvents<A>>(type: B, observer: Observer<WritableStateEvents<A>[B]>): Subscription {
		throw new Error("Method not implemented.");
	}

	shadow(): WritableState<ArrayType<A>>;
	shadow(): WritableState<RecordType<A>>;
	shadow(): WritableState<BasicType<A>>;
	shadow(): WritableState<ArrayType<A>> | WritableState<RecordType<A>> | WritableState<BasicType<A>> {
		throw new Error("Method not implemented.");
	}

	subscribe(subscription: Subscription): Subscription {
		throw new Error("Method not implemented.");
	}

	unobserve<B extends keyof WritableStateEvents<A>>(type: B, observer: Observer<WritableStateEvents<A>[B]>): void {
		throw new Error("Method not implemented.");
	}

	attach<B extends string, C>(key: B, item: WritableStateOrValue<C>): void {
	//attach<B extends string, C>(key: B, item: WritableStateOrValue<C>): WritableState<ExpansionOf<RecordType<A> & { [key in B]: C; }>> {
		throw new Error("Method not implemented.");
	}

	detach<B extends keyof RecordType<A>>(key: B): WritableState<ExpansionOf<Omit<RecordType<A>, B>>> {
		throw new Error("Method not implemented.");
	}

	insert(index: number, item: WritableStateOrValue<ArrayType<A>[number]>): WritableState<ArrayType<A>[number]> {
		throw new Error("Method not implemented.");
	}

	remove(index: number): void {
		throw new Error("Method not implemented.");
	}

	update(value: A): boolean {
		throw new Error("Method not implemented.");
	}

	value(): A {
		throw new Error("Method not implemented.");
	}
}























export type ReadableElementStates<A extends ArrayValue> = {
	[index: number]: ReadableState<A[number]>;
};

export type ReadableMemberStates<A extends RecordValue> = {
	[B in keyof A]-?: ReadableState<A[B]>;
};

export type WritableElementStates<A extends ArrayValue> = {
	[index: number]: WritableState<A[number]>;
};

export type WritableMemberStates<A extends RecordValue> = {
	[B in keyof A]-?: WritableState<A[B]>;
};

export type ReadableStateEvents2<A> = TupleRecord<any> & (
	[A] extends [ArrayValue] ?
		[A] extends [TupleButNotArray<A>] ?
			ReadableArrayStateEvents<A> :
			ReadableArrayStateEvents<A>:
	[A] extends [RecordButNotClass<A>] ?
		ReadableRecordStateEvents<A> :
	ReadableBasicStateEvents<A>
);

export type ReadableState<A> = (
	[A] extends [ArrayValue] ?
		[A] extends [TupleButNotArray<A>] ?
			ReadableArrayState<A> & { [B in keyof A]: ReadableState<A[B]>; } :
			ReadableArrayState<A> & ReadableElementStates<A> :
	[A] extends [RecordButNotClass<A>] ? ReadableMemberStates<A> & ReadableRecordState<A> :
	unknown
) & ReadableBasicState<A>;

export type GenericReadableState<A> = ReadableBasicState<A>;

export type WritableStateEvents2<A> = TupleRecord<any> & (
	[A] extends [ArrayValue] ?
		[A] extends [TupleButNotArray<A>] ?
			WritableArrayStateEvents<A> :
			WritableArrayStateEvents<A>:
	[A] extends [RecordButNotClass<A>] ?
		WritableRecordStateEvents<A> :
	WritableBasicStateEvents<A>
);

export type WritableState<A> = (
	[A] extends [ArrayValue] ?
		[A] extends [TupleButNotArray<A>] ?
			WritableArrayState<A> & { [B in keyof A]: WritableState<A[B]>; } :
			WritableArrayState<A> & WritableElementStates<A> :
	[A] extends [RecordButNotClass<A>] ? WritableMemberStates<A> & WritableRecordState<A> :
	unknown
) & WritableBasicState<A>;

export type GenericWritableState<A> = WritableBasicState<A>;

export type GenericState<A> = GenericReadableState<A> | GenericWritableState<A>;

export type State<A> = WritableState<A>;

export type ReadableOrWritableState<A> = ReadableState<A> | WritableState<A>;

export type ReadableStateOrValue<A> = A | ReadableState<A>;

export type WritableStateOrValue<A> = A | WritableState<A>;

export type StateOrValue<A> = A | ReadableOrWritableState<A>;

export type Attribute<A> = ReadableOrWritableState<A> | (
	A extends ArrayValue ?
		{ [B in keyof A]: Attribute<A[B]>; } :
	A extends RecordValue ?
		{ [B in keyof A]: Attribute<A[B]>; } :
	A
);

export type WritableAttribute<A> = WritableState<A> | (
	A extends ArrayValue ?
		{ [B in keyof A]: WritableAttribute<A[B]>; } :
	A extends RecordValue ?
		{ [B in keyof A]: WritableAttribute<A[B]>; } :
	A
);

export type ReadableAttribute<A> = ReadableState<A> | (
	A extends ArrayValue ?
		{ [B in keyof A]: ReadableAttribute<A[B]>; } :
	A extends RecordValue ?
		{ [B in keyof A]: ReadableAttribute<A[B]>; } :
	A
);

{
	let state6: Attribute<false | true | undefined> = undefined as any as ReadableState<false | true>;
	let state8: Attribute<"one" | "two" | undefined> = undefined as any as ReadableState<"one" | "two">;
	type k1 = Attribute<boolean | undefined>;
	type k2 = ReadableState<boolean | undefined>;
	type k3 = WritableState<boolean | undefined>;
}


export type Attributes<A> = Attribute<A>;

export type ValueFromAttribute<A> = (
	A extends ReadableOrWritableState<infer B> ? B :
	A extends ArrayValue ? { [B in keyof A]: ValueFromAttribute<A[B]>; } :
	A extends RecordValue ? A extends RecordButNotClass<A> ? { [B in keyof A]: ValueFromAttribute<A[B]>; } : A :
	A
);

export type ReadableValueFromAttribute<A> = (
	A extends ReadableState<infer B> ? B :
	A extends ArrayValue ? { [B in keyof A]: ReadableValueFromAttribute<A[B]>; } :
	A extends RecordValue ? A extends RecordButNotClass<A> ? { [B in keyof A]: ReadableValueFromAttribute<A[B]>; } : A :
	A
);

export type WritableValueFromAttribute<A> = (
	A extends WritableState<infer B> ? B :
	A extends ArrayValue ? { [B in keyof A]: WritableValueFromAttribute<A[B]>; } :
	A extends RecordValue ? A extends RecordButNotClass<A> ? { [B in keyof A]: WritableValueFromAttribute<A[B]>; } : A :
	A
);



























export function make_state<A>(value: A): WritableState<A> {
	return new StateImplementation() as any;
};

export function stateify<A>(attribute: WritableAttribute<A>, generic: true): WritableState<A>;
export function stateify<A>(attribute: ReadableAttribute<A>, generic: true): ReadableState<A>;
export function stateify<A extends Attribute<unknown>>(attribute: A): StateFromAttribute<A>;
export function stateify<A extends Attribute<unknown>>(attribute: A): StateFromAttribute<A> {
	throw "";
};

{
	let a: WritableState<string> = stateify(undefined as any as string);
	// @ts-expect-error
	let b: WritableState<string> = stateify(undefined as any as ReadableState<string>);
	let c: WritableState<string> = stateify(undefined as any as WritableState<string>);
	let d: WritableState<[string, string]> = stateify(undefined as any as [string, string]);
	// @ts-expect-error
	let e: WritableState<[string, string]> = stateify(undefined as any as [string, ReadableState<string>]);
	let f: WritableState<[string, string]> = stateify(undefined as any as [string, WritableState<string>]);
	// @ts-expect-error
	let g: WritableState<[string, string]> = stateify(undefined as any as [ReadableState<string>, WritableState<string>]);


	let h = stateify(undefined as any as ReadableAttribute<string>);
	let i = stateify(undefined as any as WritableAttribute<string>);
}

export function valueify<A>(attribute: WritableAttribute<A>, generic: true): A;
export function valueify<A>(attribute: ReadableAttribute<A>, generic: true): A;
export function valueify<A extends Attribute<unknown>>(attribute: A): ValueFromAttribute<A>;
export function valueify<A extends Attribute<unknown>>(attribute: A): ValueFromAttribute<A> {
	throw "";
};

let state0a: WritableState<string> = stateify(["a", 5] as [string, number])[0];
let state0b: WritableState<number> = stateify(["a", 5] as [string, number])[1];

let state1 = stateify([make_state("a"), "b"]);
let state2 = stateify(["a", "b"] as ["a", "b"]);
let state3 = stateify({ one: "a", two: "b" });

let value1 = valueify([make_state("a"), "b"]);
let value2 = valueify(["a", "b"] as ["a", "b"]);
let value3 = valueify({ one: "a", two: "b" });

let state4: Attribute<string | undefined> = undefined as any as ReadableState<string>;
let state5: Attribute<string | undefined> = undefined as any as WritableState<string>;
let state6: Attribute<boolean | undefined> = undefined as any as ReadableState<boolean>;
let state7: Attribute<boolean | undefined> = undefined as any as WritableState<boolean>;
let state8: Attribute<"one" | "two" | undefined> = undefined as any as ReadableState<"one" | "two">;
let state9: Attribute<"one" | "two" | undefined> = undefined as any as WritableState<"one" | "two">;
























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

namespace value_from_attribute_writable_state {
	type basic_state_1 = ValueFromAttribute<WritableState<string>>;
	type basic_state_2 = ValueFromAttribute<WritableState<string | number>>;
	type basic_state_3 = ValueFromAttribute<WritableState<Element>>;
	type basic_state_4 = ValueFromAttribute<WritableState<Element | Date>>;
	type basic_state_5 = ValueFromAttribute<WritableState<{ key: string } | number>>;
	type record_state_1 = ValueFromAttribute<WritableState<{ one: string }>>;
	type record_state_2 = ValueFromAttribute<WritableState<{ one: string } | { one: string, two: string }>>;
	type array_state_1 = ValueFromAttribute<WritableState<string[]>>;
	type array_state_2 = ValueFromAttribute<WritableState<string[] | number[]>>;
	type mixed_state_1 = ValueFromAttribute<WritableState<string | { [key: string]: any }>>;
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

function function_expecting_generic_readable_attribute<A>(attribute: ReadableAttribute<A>): void {
	let value = valueify(attribute, true);
	let state = stateify(attribute, true);
	assertType<typeof value, A>(value);
	assertType<typeof state, ReadableState<A>>(state);
}

function_expecting_generic_readable_attribute(undefined as any as ReadableState<string>);
function_expecting_generic_readable_attribute(undefined as any as ReadableState<undefined>);
function_expecting_generic_readable_attribute(undefined as any as ReadableState<string | undefined>);
function_expecting_generic_readable_attribute(undefined as any as ReadableState<"literal">);
function_expecting_generic_readable_attribute(undefined as any as WritableState<string>);
function_expecting_generic_readable_attribute(undefined as any as WritableState<undefined>);
function_expecting_generic_readable_attribute(undefined as any as WritableState<string | undefined>);
function_expecting_generic_readable_attribute(undefined as any as WritableState<"literal">);
function_expecting_generic_readable_attribute(undefined as any as string);
function_expecting_generic_readable_attribute(undefined as any as undefined);
function_expecting_generic_readable_attribute(undefined as any as string | undefined);
function_expecting_generic_readable_attribute(undefined as any as "literal");

function function_expecting_generic_readable_attribute_array_a<A>(attribute: ReadableAttribute<Array<A>>): void {
	let value = valueify(attribute, true);
	let state = stateify(attribute, true);
	assertType<typeof value, Array<A>>(value);
	assertType<typeof state, ReadableState<Array<A>>>(state);
}

function_expecting_generic_readable_attribute_array_a(undefined as any as ReadableState<Array<string>>);
function_expecting_generic_readable_attribute_array_a(undefined as any as WritableState<Array<string>>);
function_expecting_generic_readable_attribute_array_a(undefined as any as Array<string>);

function function_expecting_readable_attribute_record_a<A>(attribute: ReadableAttribute<{ [key: string]: A }>): void {
	let value = valueify(attribute, true);
	let state = stateify(attribute, true);
	assertType<typeof value, { [key: string]: A }>(value);
	assertType<typeof state, ReadableState<{ [key: string]: A }>>(state);
}

function_expecting_readable_attribute_record_a(undefined as any as ReadableState<{ [key: string]: string }>);
function_expecting_readable_attribute_record_a(undefined as any as WritableState<{ [key: string]: string }>);
function_expecting_readable_attribute_record_a(undefined as any as { [key: string]: string });

function function_expecting_generic_writable_attribute<A>(attribute: WritableAttribute<A>): void {
	let value = valueify(attribute, true);
	let state = stateify(attribute, true);
	assertType<typeof value, A>(value);
	assertType<typeof state, WritableState<A>>(state);
}
// @ts-expect-error
function_expecting_generic_writable_attribute(undefined as any as ReadableState<string>);
// @ts-expect-error
function_expecting_generic_writable_attribute(undefined as any as ReadableState<undefined>);
// @ts-expect-error
function_expecting_generic_writable_attribute(undefined as any as ReadableState<string | undefined>);
// @ts-expect-error
function_expecting_generic_writable_attribute(undefined as any as ReadableState<"literal">);
function_expecting_generic_writable_attribute(undefined as any as WritableState<string>);
function_expecting_generic_writable_attribute(undefined as any as WritableState<undefined>);
function_expecting_generic_writable_attribute(undefined as any as WritableState<string | undefined>);
function_expecting_generic_writable_attribute(undefined as any as WritableState<"literal">);
function_expecting_generic_writable_attribute(undefined as any as string);
function_expecting_generic_writable_attribute(undefined as any as undefined);
function_expecting_generic_writable_attribute(undefined as any as string | undefined);
function_expecting_generic_writable_attribute(undefined as any as "literal");

function function_expecting_generic_writable_attribute_array_a<A>(attribute: WritableAttribute<Array<A>>): void {
	let value = valueify(attribute, true);
	let state = stateify(attribute, true);
	assertType<typeof value, Array<A>>(value);
	assertType<typeof state, WritableState<Array<A>>>(state);
}

// @ts-expect-error
function_expecting_generic_writable_attribute_array_a(undefined as any as ReadableState<Array<string>>);
function_expecting_generic_writable_attribute_array_a(undefined as any as WritableState<Array<string>>);
function_expecting_generic_writable_attribute_array_a(undefined as any as Array<string>);

function function_expecting_writable_attribute_record_a<A>(attribute: WritableAttribute<{ [key: string]: A }>): void {
	let value = valueify(attribute, true);
	let state = stateify(attribute, true);
	assertType<typeof value, { [key: string]: A }>(value);
	assertType<typeof state, WritableState<{ [key: string]: A }>>(state);
}

// @ts-expect-error
function_expecting_writable_attribute_record_a(undefined as any as ReadableState<{ [key: string]: string }>);
function_expecting_writable_attribute_record_a(undefined as any as WritableState<{ [key: string]: string }>);
function_expecting_writable_attribute_record_a(undefined as any as { [key: string]: string });

function function_expecting_readable_state_a<A>(state: ReadableState<A>): void {
	state.observe("update", (state) => {
		let value = state.value();
	});
	state.compute((f) => 0)
	let value = state.value();
	assertType<typeof value, A>(value);
	let shadow = state.shadow();
	assertType<typeof shadow, ReadableState<A>>(shadow);
}

function_expecting_readable_state_a(undefined as any as ReadableState<string>);
function_expecting_readable_state_a(undefined as any as ReadableState<Array<string>>);
function_expecting_readable_state_a(undefined as any as ReadableState<{ [key: string]: string }>);
function_expecting_readable_state_a(undefined as any as ReadableState<{ one: string, two: number }>);
function_expecting_readable_state_a(undefined as any as WritableState<string>);
function_expecting_readable_state_a(undefined as any as WritableState<Array<string>>);
function_expecting_readable_state_a(undefined as any as WritableState<{ [key: string]: string }>);
function_expecting_readable_state_a(undefined as any as WritableState<{ one: string, two: number }>);

function function_expecting_readable_state_array_a<A>(state: ReadableState<Array<A>>): void {
	state.observe("update", (state) => {
		let value = state.value();
	});
	state.observe("insert", (state, index) => {
		let value = state.value();
	});
	state.observe("remove", (state, index) => {
		let value = state.value();
	});
	let element1 = state.element(0);
	let element2 = state[0];
	let mapped1 = state.mapStates((f) => 0);
	let mapped2 = state.mapStates((f) => stateify(0));
}

function_expecting_readable_state_array_a(undefined as any as ReadableState<Array<string>>);
function_expecting_readable_state_array_a(undefined as any as WritableState<Array<string>>);

function function_expecting_readable_state_record_a<A>(state: ReadableState<{ [key: string]: A }>): void {
	state.observe("update", (state) => {
		let value = state.value();
	});
	state.observe("attach", (state, key) => {
		let value = state.value();
	});
	state.observe("detach", (state, key) => {
		let value = state.value();
	});
	let member1 = state.member("key");
	let member2 = state["key"];
}

function_expecting_readable_state_record_a(undefined as any as ReadableState<{ [key: string]: string }>);
function_expecting_readable_state_record_a(undefined as any as WritableState<{ [key: string]: string }>);

function function_expecting_writable_state_a<A>(state: WritableState<A>): void {
	state.observe("update", (state) => {
		state.update(state.value());
	});
	state.update(state.value());
	let value = state.value();
	assertType<typeof value, A>(value);
	let shadow = state.shadow();
	assertType<typeof shadow, WritableState<A>>(shadow);
}

// @ts-expect-error
function_expecting_writable_state_a(undefined as any as ReadableState<string>);
// @ts-expect-error
function_expecting_writable_state_a(undefined as any as ReadableState<Array<string>>);
// @ts-expect-error
function_expecting_writable_state_a(undefined as any as ReadableState<{ [key: string]: string }>);
// @ts-expect-error
function_expecting_writable_state_a(undefined as any as ReadableState<{ one: string, two: number }>);
function_expecting_writable_state_a(undefined as any as WritableState<string>);
function_expecting_writable_state_a(undefined as any as WritableState<Array<string>>);
function_expecting_writable_state_a(undefined as any as WritableState<{ [key: string]: string }>);
function_expecting_writable_state_a(undefined as any as WritableState<{ one: string, two: number }>);

function function_expecting_writable_state_array_a<A>(state: WritableState<Array<A>>): void {
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
	let element1 = state.element(0);
	let element2 = state[0];
	let mapped1 = state.mapStates((f) => 0);
	let mapped2 = state.mapStates((f) => stateify(0));
}

// @ts-expect-error
function_expecting_writable_state_array_a(undefined as any as ReadableState<Array<string>>);
function_expecting_writable_state_array_a(undefined as any as WritableState<Array<string>>);

function function_expecting_writable_state_record_a<A>(state: WritableState<{ [key: string]: A }>): void {
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
	let member1 = state.member("key");
	let member2 = state["key"];
	assertType<typeof member1, WritableState<A>>(member1);
	assertType<typeof member2, WritableState<A>>(member2);
}

type IfEquals<T, U, Y=T, N=never> =
  (<G>() => G extends T ? 1 : 2) extends
  (<G>() => G extends U ? 1 : 2) ? Y : N;

function assertType<A, B>(type: IfEquals<A, B>): void {}

// @ts-expect-error
function_expecting_writable_state_record_a(undefined as any as ReadableState<{ [key: string]: string }>);
function_expecting_writable_state_record_a(undefined as any as WritableState<{ [key: string]: string }>);

// ReadableAttribute should accept any value or state.
function function_expecting_readable_attribute(attribute: ReadableAttribute<string | undefined>) {
	let value = valueify(attribute);
	let state = stateify(attribute);
	assertType<typeof value, string | undefined>(value);
	assertType<typeof state, ReadableState<string | undefined>>(state);
}
function_expecting_readable_attribute(undefined as any as ReadableState<string>);
function_expecting_readable_attribute(undefined as any as ReadableState<undefined>);
function_expecting_readable_attribute(undefined as any as ReadableState<string | undefined>);
function_expecting_readable_attribute(undefined as any as ReadableState<"literal">);
function_expecting_readable_attribute(undefined as any as WritableState<string>);
function_expecting_readable_attribute(undefined as any as WritableState<undefined>);
function_expecting_readable_attribute(undefined as any as WritableState<string | undefined>);
function_expecting_readable_attribute(undefined as any as WritableState<"literal">);
function_expecting_readable_attribute(undefined as any as string);
function_expecting_readable_attribute(undefined as any as undefined);
function_expecting_readable_attribute(undefined as any as string | undefined);
function_expecting_readable_attribute(undefined as any as "literal");

// WritableAttribute should only accept state containing exactly string | undefined or values assignable to string | undefined.
function function_expecting_writable_attribute(attribute: WritableAttribute<string | undefined>): void {
	let value = valueify(attribute);
	let state = stateify(attribute);
	assertType<typeof value, string | undefined>(value);
	assertType<typeof state, WritableState<string | undefined>>(state);
}
// @ts-expect-error
function_expecting_writable_attribute(undefined as any as ReadableState<string>);
// @ts-expect-error
function_expecting_writable_attribute(undefined as any as ReadableState<undefined>);
// @ts-expect-error
function_expecting_writable_attribute(undefined as any as ReadableState<string | undefined>);
// @ts-expect-error
function_expecting_writable_attribute(undefined as any as ReadableState<"literal">);
// @ts-expect-error
function_expecting_writable_attribute(undefined as any as WritableState<string>);
// @ts-expect-error
function_expecting_writable_attribute(undefined as any as WritableState<undefined>);
function_expecting_writable_attribute(undefined as any as WritableState<string | undefined>);
// @ts-expect-error
function_expecting_writable_attribute(undefined as any as WritableState<"literal">);
function_expecting_writable_attribute(undefined as any as string);
function_expecting_writable_attribute(undefined as any as undefined);
function_expecting_writable_attribute(undefined as any as string | undefined);
function_expecting_writable_attribute(undefined as any as "literal");

// Attribute should accept any value or state.
function function_expecting_attribute(attribute: Attribute<string | undefined>): void {
	let value = valueify(attribute);
	let state = stateify(attribute);
	assertType<typeof value, string | undefined>(value);
	assertType<typeof state, ReadableState<string | undefined>>(state);
}
function_expecting_attribute(undefined as any as ReadableState<string>);
function_expecting_attribute(undefined as any as ReadableState<undefined>);
function_expecting_attribute(undefined as any as ReadableState<string | undefined>);
function_expecting_attribute(undefined as any as ReadableState<"literal">);
function_expecting_attribute(undefined as any as WritableState<string>);
function_expecting_attribute(undefined as any as WritableState<undefined>);
function_expecting_attribute(undefined as any as WritableState<string | undefined>);
function_expecting_attribute(undefined as any as WritableState<"literal">);
function_expecting_attribute(undefined as any as string);
function_expecting_attribute(undefined as any as undefined);
function_expecting_attribute(undefined as any as string | undefined);
function_expecting_attribute(undefined as any as "literal");

// ReadableState should be covariant. Any state that can be guaranteed to only contain string, undefined or string | undefined should be accepted.
function function_expecting_readable_state(attribute: ReadableState<string | undefined>): void {
	let value = valueify(attribute);
	let shadow = attribute.shadow();
	let computed = attribute.compute((value) => value);
	attribute.observe("update", (state) => {
		let value = state.value();
	});
}
function_expecting_readable_state(undefined as any as ReadableState<string>);
function_expecting_readable_state(undefined as any as ReadableState<undefined>);
function_expecting_readable_state(undefined as any as ReadableState<string | undefined>);
function_expecting_readable_state(undefined as any as ReadableState<"literal">);
function_expecting_readable_state(undefined as any as WritableState<string>);
function_expecting_readable_state(undefined as any as WritableState<undefined>);
function_expecting_readable_state(undefined as any as WritableState<string | undefined>);
function_expecting_readable_state(undefined as any as WritableState<"literal">);
// @ts-expect-error
function_expecting_readable_state(undefined as any as string);
// @ts-expect-error
function_expecting_readable_state(undefined as any as undefined);
// @ts-expect-error
function_expecting_readable_state(undefined as any as string | undefined);
// @ts-expect-error
function_expecting_readable_state(undefined as any as "literal");

// WritableState should be invariant. Only state containing exactly string | undefined should be accepted.
function function_expecting_writable_state(attribute: WritableState<string | undefined>): void {
	let value = valueify(attribute);
	let shadow = attribute.shadow();
	let computed = attribute.compute((value) => value);
	attribute.observe("update", (state) => {
		let value = state.value();
	});
}
// @ts-expect-error
function_expecting_writable_state(undefined as any as ReadableState<string>);
// @ts-expect-error
function_expecting_writable_state(undefined as any as ReadableState<undefined>);
// @ts-expect-error
function_expecting_writable_state(undefined as any as ReadableState<string | undefined>);
// @ts-expect-error
function_expecting_writable_state(undefined as any as ReadableState<"literal">);
// @ts-expect-error
function_expecting_writable_state(undefined as any as WritableState<string>);
// @ts-expect-error
function_expecting_writable_state(undefined as any as WritableState<undefined>);
function_expecting_writable_state(undefined as any as WritableState<string | undefined>);
// @ts-expect-error
function_expecting_writable_state(undefined as any as WritableState<"literal">);
// @ts-expect-error
function_expecting_writable_state(undefined as any as string);
// @ts-expect-error
function_expecting_writable_state(undefined as any as undefined);
// @ts-expect-error
function_expecting_writable_state(undefined as any as string | undefined);
// @ts-expect-error
function_expecting_writable_state(undefined as any as "literal");


export function squash<A extends RecordValue>(records: ReadableOrWritableState<Array<A>>): ReadableState<A> {
	throw "";
};

{
	let records = stateify([
		{ one: "a" }
	] as Array<Record<string, string>>);
	let squashed = squash(records);
}
export function flatten<A extends PrimitiveValue | ReferenceValue>(states: ReadableOrWritableState<Array<A | RecursiveArray<A>>>): ReadableState<Array<A>> {
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
	// TODO: test with complex arrays containing objects
}

export function merge<A extends RecordValue[]>(...states: StateTupleFromValueTuple<A>): ReadableState<MergedTuple<A>> {
	throw "";
};

{
	let one = stateify({ a: 1 });
	let two = stateify({ a: null as string | null });
	let merged: Attributes<{ a: string | null }> = merge(one, two);
}

export function fallback<A>(underlying: WritableState<A | undefined>, default_value: Exclude<A, undefined>): WritableState<Exclude<A, undefined>> {
	throw "";
};

{
	fallback(make_state("string" as string | undefined), "hello");
}

export function computed<A extends ArrayValue, B>(states: [...StateTupleFromValueTuple<A>], computer: (...args: [...A]) => B): WritableState<B> {
	throw "";
};

{
	computed([make_state(5), make_state("string")], (a, b) => {

	});
}







{
	type Inner = {
		inner_writable_string: WritableAttribute<string>;
		inner_readable_string: ReadableAttribute<string>;
	};

	function inner(outer: Inner): void {

	}

	type Outer = {
		inner: Inner;
		outer_writable_string: WritableAttribute<string>;
		outer_readable_string: ReadableAttribute<string>;
	};

	// require/optional?

	function outer(outer: Outer): void {
		return inner(outer.inner);
	}

	let string = "string";
	let readable_string = make_state("string") as ReadableState<string>;
	let writable_string = make_state("string") as WritableState<string>;

	outer({
		inner: {
			inner_writable_string: writable_string,
			inner_readable_string: readable_string
		},
		outer_writable_string: writable_string,
		outer_readable_string: readable_string
	});
}
