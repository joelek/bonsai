type ExpansionOf<A> = A extends infer B ? {
    [C in keyof B]: B[C];
} : never;
type RecursiveArray<A> = Array<A | RecursiveArray<A>>;
type RecursiveArrayType<A> = A extends Array<infer B> ? RecursiveArrayType<B> : A;
type RecordButNotClass<A> = A extends {
    [key: string]: unknown;
} ? A : never;
type OptionalMembersOf<A> = {
    [B in keyof A as Omit<A, B> extends A ? B : never]: A[B];
};
type RequiredMembersOf<A> = {
    [B in keyof A as Omit<A, B> extends A ? never : B]: A[B];
};
export type StateOrValue<A> = A | State<A>;
export type Attribute<A> = State<A> | (A extends ArrayValue | ReadonlyArrayValue ? {
    -readonly [B in keyof A]: Attribute<A[B]>;
} : A extends RecordValue ? A extends RecordButNotClass<A> ? {
    [B in keyof OptionalMembersOf<A>]?: State<A[B]> | Attribute<Exclude<A[B], undefined>>;
} & {
    [B in keyof RequiredMembersOf<A>]: Attribute<A[B]>;
} : A : A);
export type Attributes<A> = Attribute<A>;
export type ValueFromAttribute<A> = (A extends State<infer B> ? B : A extends ArrayValue | ReadonlyArrayValue ? {
    -readonly [B in keyof A]: ValueFromAttribute<A[B]>;
} : A extends RecordValue ? A extends RecordButNotClass<A> ? {
    [B in keyof A]: ValueFromAttribute<A[B]>;
} : A : A);
export type StateFromAttribute<A> = State<ValueFromAttribute<A>>;
export type TupleRecord<A extends TupleRecord<A>> = {
    [C in keyof A]: any[];
};
export type PrimitiveValue = symbol | void | bigint | boolean | number | string | null | undefined;
export type ReferenceValue = Object;
export type Value = any;
export type ArrayValue = Value[];
export type ReadonlyArrayValue = readonly Value[];
export type RecordValue = {
    [key: string]: Value;
};
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
export declare const Subscription: {
    create(is_cancelled: State<boolean>, callback: Callback<[]>): Subscription;
};
export type State<A> = GenericState<A> & (A extends ArrayValue ? ArrayState<A> : A extends RecordButNotClass<A> ? MemberStates<A> & ObjectState<A> : PrimitiveState<A>);
export type StateTupleFromValueTuple<A extends ArrayValue> = {
    [B in keyof A]: State<A[B]>;
};
export type ElementStates<A extends ArrayValue> = {
    [index: number]: State<A[number]>;
};
export type MemberStates<A extends RecordValue> = {
    [B in keyof A]-?: State<A[B]>;
};
export type AbstractStateEvents<A> = {
    "update": [
        state: GenericState<A>
    ];
};
export declare abstract class AbstractState<A, B extends TupleRecord<B> & AbstractStateEvents<A>> {
    protected observers: {
        [C in keyof B]?: Array<Observer<any>>;
    };
    protected subscriptions: Array<Callback<any>>;
    protected notify_observers<C extends keyof B>(observers: Array<Observer<B[C]>> | undefined, type: C, ...args: [...B[C]]): void;
    protected notify<C extends keyof B>(type: C, ...args: [...B[C]]): void;
    protected observe_weakly<C extends keyof B>(type: C, callback: Callback<B[C]>): CancellationToken;
    constructor();
    compute<C>(computer: Computer<A, C>): State<C>;
    observe(type: "update", observer: Observer<AbstractStateEvents<A>["update"]>): CancellationToken;
    observe<C extends keyof B>(type: C, observer: Observer<B[C]>): CancellationToken;
    subscribe<A, B extends TupleRecord<B> & AbstractStateEvents<A>, C extends keyof B>(target: AbstractState<A, B>, type: C, callback: Callback<B[C]>): Subscription;
    unobserve(type: "update", observer: Observer<AbstractStateEvents<A>["update"]>): void;
    unobserve<C extends keyof B>(type: C, observer: Observer<B[C]>): void;
    abstract shadow(): State<A>;
    abstract update(value: A): boolean;
    abstract value(): A;
}
export type GenericState<A> = AbstractState<A, AbstractStateEvents<A>>;
export type PrimitiveStateEvents<A> = AbstractStateEvents<A> & {};
export declare class PrimitiveState<A> extends AbstractState<A, PrimitiveStateEvents<A>> {
    protected lastValue: A;
    constructor(lastValue: A);
    observe(type: "update", observer: Observer<PrimitiveStateEvents<A>["update"]>): CancellationToken;
    shadow(): State<A>;
    update(value: A): boolean;
    value(): A;
}
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
export declare class ArrayState<A extends ArrayValue> extends AbstractState<A, ArrayStateEvents<A>> implements ElementStates<A> {
    protected elements: Array<State<A[number]>>;
    protected operating: boolean;
    protected currentLength: State<number>;
    protected isUndefined: boolean;
    protected operate(callback: () => void): void;
    protected onElementUpdate: () => void;
    constructor(elements: Array<State<A[number]>>);
    [index: number]: State<A[number]>;
    observe(type: "update", observer: Observer<ArrayStateEvents<A>["update"]>): CancellationToken;
    observe(type: "insert", observer: Observer<ArrayStateEvents<A>["insert"]>): CancellationToken;
    observe(type: "remove", observer: Observer<ArrayStateEvents<A>["remove"]>): CancellationToken;
    [Symbol.iterator](): Iterator<State<A[number]>>;
    append(...items: Array<StateOrValue<A[number]>>): void;
    element(index: number | State<number>): State<A[number]>;
    filter(predicate: Predicate<A[number]>): State<Array<A[number]>>;
    first(): State<A[number] | undefined>;
    insert(index: number, item: StateOrValue<A[number]>): void;
    last(): State<A[number] | undefined>;
    get length(): State<number>;
    mapStates<B>(mapper: StateMapper<A[number], B>): State<Array<B>>;
    mapValues<B>(mapper: ValueMapper<A[number], B>): State<Array<B>>;
    remove(index: number): void;
    spread(): Array<State<A[number]>>;
    vacate(): boolean;
    shadow(): State<A>;
    update(value: A): boolean;
    value(): A;
}
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
export declare class ObjectState<A extends RecordValue> extends AbstractState<A, ObjectStateEvents<A>> {
    protected members: MemberStates<A>;
    protected operating: boolean;
    protected isUndefined: boolean;
    protected operate(callback: () => void): void;
    protected onMemberUpdate: () => void;
    constructor(members: MemberStates<A>);
    observe(type: "update", observer: Observer<ObjectStateEvents<A>["update"]>): CancellationToken;
    observe(type: "attach", observer: Observer<ObjectStateEvents<A>["attach"]>): CancellationToken;
    observe(type: "detach", observer: Observer<ObjectStateEvents<A>["detach"]>): CancellationToken;
    attach<B extends string, C>(key: B, item: StateOrValue<C>): State<ExpansionOf<A & {
        [key in B]: C;
    }>>;
    member<B extends keyof A>(key: B | State<B>): State<A[B]>;
    detach<B extends keyof A>(key: B): State<ExpansionOf<Omit<A, B>>>;
    spread(): MemberStates<A>;
    shadow(): State<A>;
    update(value: A): boolean;
    value(): A;
}
export declare function make_primitive_state<A extends PrimitiveValue>(value: A): PrimitiveState<A>;
export declare function make_array_state<A extends ArrayValue>(elements: Array<State<A[number]>>): ArrayState<A>;
export declare function make_object_state<A extends RecordValue>(members: MemberStates<A>): ObjectState<A>;
export declare function make_state<A>(value: A): State<A>;
export declare function computed<A extends ArrayValue, B>(states: [...StateTupleFromValueTuple<A>], computer: (...args: [...A]) => B): State<B>;
export declare function stateify<A extends Attribute<any>>(attribute: A): State<ValueFromAttribute<A>>;
export declare function valueify<A extends Attribute<any>>(attribute: A): ValueFromAttribute<A>;
export type MergedPair<A extends RecordValue, B extends RecordValue> = ExpansionOf<{
    [C in keyof A | keyof B]: C extends keyof A & keyof B ? undefined extends B[C] ? Exclude<B[C], undefined> | A[C] : B[C] : C extends keyof A ? A[C] : C extends keyof B ? B[C] : never;
}>;
export type MergedTuple<A extends RecordValue[]> = ExpansionOf<A extends [infer B extends RecordValue, infer C extends RecordValue, ...infer D extends RecordValue[]] ? MergedTuple<[MergedPair<B, C>, ...D]> : A extends [infer B extends RecordValue, infer C extends RecordValue] ? MergedPair<B, C> : A extends [infer B extends RecordValue] ? B : {}>;
export declare function squash<A extends RecordValue>(records: State<Array<A>>): State<A>;
export declare function fallback<A>(underlying: State<A | undefined>, default_value: Exclude<A, undefined>): State<Exclude<A, undefined>>;
export declare function merge<A extends RecordValue[]>(...states: StateTupleFromValueTuple<A>): State<MergedTuple<A>>;
export declare function flatten<A extends RecursiveArray<any>>(states: State<Array<A>>): State<Array<RecursiveArrayType<A>>>;
export {};
