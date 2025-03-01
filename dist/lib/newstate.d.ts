import { ArrayValue, Callback, Computer, Observer, Predicate, RecordValue, StateMapper, Subscription, TupleRecord, Value, ValueMapper } from "./state";
type ExpansionOf<A> = A extends infer B ? {
    [C in keyof B]: B[C];
} : never;
type RecordButNotClass<A> = A extends {
    [key: string]: unknown;
} ? A : never;
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
    attach<B extends string, C>(key: B, item: StateOrValue<C>): State<ExpansionOf<A & {
        [key in B]: C;
    }>>;
    member<B extends keyof A>(key: StateOrValue<B>): State<A[B]>;
    detach<B extends keyof A>(key: B): State<ExpansionOf<Omit<A, B>>>;
    spread(): MemberStates<A>;
}
export type ElementStates<A extends ArrayValue> = {
    [key: number]: State<A[number]>;
};
export type MemberStates<A extends RecordValue> = {
    [B in keyof A]-?: State<A[B]>;
};
type State<A> = ([
    A
] extends [ArrayValue] ? ArrayState<A> : [
    A
] extends [RecordButNotClass<A>] ? MemberStates<A> & RecordState<A> : BasicState<A>);
export declare function squash<A extends RecordValue>(records: State<Array<A>>): State<A>;
export declare function flatten<A extends RecursiveArray<any>>(states: State<Array<A>>): State<Array<RecursiveArrayType<A>>>;
export {};
