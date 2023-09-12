type ExpansionOf<A> = A extends infer B ? { [C in keyof B]: B[C] } : never;

export abstract class AbstractState<A> {
	abstract value(): A;
};

export class PrimitiveStateImplementation<A> extends AbstractState<A> {
	constructor(protected last_value: A) {
		super();
	}

	value(): A {
		return this.last_value;
	}
};

export class ArrayStateImplementation<A> extends AbstractState<A> {
	constructor(protected last_value: A) {
		super();
	}

	value(): A {
		return this.last_value;
	}
};

export class RecordStateImplementation<A> extends AbstractState<A> {
	constructor(protected last_value: A) {
		super();
	}

	value(): A {
		return this.last_value;
	}
};

export type ArrayStateIndexSignature<A> = { [B in keyof A]: State<A[B]>; };
export type ArrayState<A> = ArrayStateImplementation<A> & ArrayStateIndexSignature<A>;

export type RecordStateIndexSignature<A> = { [B in keyof A]: State<A[B]>; };
export type RecordState<A> = RecordStateImplementation<A> & RecordStateIndexSignature<A>;

export type PrimitiveStateIndexSignature<A> = { [B in keyof A]: State<A[B]>; };
export type PrimitiveState<A> = PrimitiveStateImplementation<A> & PrimitiveStateIndexSignature<A>;


export type AnyArray = any[];
export type AnyRecord = { [key: string]: any; };

export type State<A> =
	A extends AnyArray ? ArrayState<A> :
	A extends AnyRecord ? RecordState<A> :
	PrimitiveState<A>;














export type Attribute<A> = State<A> | (
	A extends AnyArray ? { [B in keyof A]: Attribute<A[B]>; } :
	A extends AnyRecord ? { [B in keyof A]: Attribute<A[B]>; } :
	A
);

export type StateFromAttribute<A> = State<ValueFromAttribute<A>>;

export type ValueFromAttribute<A> = (
	A extends State<infer B> ? B :
	A extends AnyArray ? { [B in keyof A]: ValueFromAttribute<A[B]>; } :
	A extends AnyRecord ? { [B in keyof A]: ValueFromAttribute<A[B]>; } :
	A
);

function stateify<A>(attribute: Attribute<A>): StateFromAttribute<A> {
	throw "";
};

function valueify<A>(attribute: Attribute<A>): ValueFromAttribute<A> {
	throw "";
};

function fallback<A>(state: State<A | undefined>, value: Exclude<A, undefined>): State<Exclude<A, undefined>> {
	throw "";
};

function spread<A>(attribute: Attribute<A>): undefined extends A ? { [B in keyof Exclude<A, undefined>]?: Attribute<Exclude<A, undefined>[B] | undefined>; } : { [B in keyof A]: Attribute<A[B]>; } {
	throw "";
};

let a!: Attribute<{ required_primitive: string, optional_primitive?: string, required_array: string[], optional_array?: string[], required_record: { test: string }, optional_record?: { test: string } }>;

let s = stateify(a);
let s1 = stateify(a.required_primitive);
let s2 = stateify(a.optional_primitive);
let s2_fall = fallback(s2, "");
let s3 = stateify(a.required_array);
let s4 = stateify(a.optional_array);
let s4_fall = fallback(s4, []);
let s5 = stateify(a.required_record);
let s6 = stateify(a.optional_record);
let s6_fall = fallback(s6, { test: "" });

let s1_value = s1.value();
let s2_value = s2.value();
let s3_value = s3.value();
let s4_value = s4.value();
let s5_value = s5.value();
let s6_value = s6.value();

let v = valueify(a);
let v1 = valueify(a.required_primitive);
let v2 = valueify(a.optional_primitive);
let v3 = valueify(a.required_array);
let v4 = valueify(a.optional_array);
let v5 = valueify(a.required_record);
let v6 = valueify(a.optional_record);

let sv = stateify(valueify(a));
let vs = valueify(stateify(a));

let spread_from_v5_simple = { ...v5 };
let spread_from_v5 = { ...spread(v5) };
let spread_from_v5_state = stateify(spread_from_v5);
let spread_from_v5_value = valueify(spread_from_v5);
let spread_from_s5_simple = { ...s5 };
let spread_from_s5 = { ...spread(s5) };
let spread_from_s5_state = stateify(spread_from_s5);
let spread_from_s5_value = valueify(spread_from_s5);

let spread_from_v6_simple = { ...v6 };
let spread_from_v6 = { ...spread(v6) };
let spread_from_v6_state = stateify(spread_from_v6);
let spread_from_v6_value = valueify(spread_from_v6);
let spread_from_s6_simple = { ...s6 };
let spread_from_s6 = { ...spread(s6) };
let spread_from_s6_state = stateify(spread_from_s6);
let spread_from_s6_value = valueify(spread_from_s6);






type Generic<A> = {
	array: Array<A>;
	record: A;
};

function test<A>(attributes: Attribute<Generic<A>>): void {
	let av = valueify(attributes.array)[0] as A;
	let rv = valueify(attributes.record) as A;
	let as = stateify(attributes.array)[0] as State<A>;
	let rs = stateify(attributes.record) as State<A>;
}
