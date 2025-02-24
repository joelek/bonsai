type ExpansionOf<A> = A extends infer B ? {
    [C in keyof B]: B[C];
} : never;
type RecursiveArray<A> = Array<A | RecursiveArray<A>>;
type IsClass<A> = A extends {
    [key: string]: unknown;
} ? false : true;
export type StateOrValue<A> = A | State<A>;
export type Attribute<A> = State<A> | (A extends ArrayValue ? {
    [B in keyof A]: Attribute<A[B]>;
} : A extends RecordValue ? IsClass<A> extends true ? A : {
    [B in keyof A]: Attribute<A[B]>;
} : A);
export type Attributes<A> = Attribute<A>;
export type ValueFromAttribute<A extends Attribute<Value>> = A extends State<infer B> ? B : A extends ArrayValue ? {
    [B in keyof A]: A[B] extends Attribute<infer C> ? ValueFromAttribute<C> : never;
} : A extends RecordValue ? IsClass<A> extends true ? A : {
    [B in keyof A]: A[B] extends Attribute<infer C> ? ValueFromAttribute<C> : never;
} : A;
export type StateFromAttribute<A extends Attribute<Value>> = State<ValueFromAttribute<A>>;
export type TupleRecord<A extends TupleRecord<A>> = {
    [C in keyof A]: any[];
};
export type PrimitiveValue = symbol | void | bigint | boolean | number | string | null | undefined;
export type ReferenceValue = Object;
export type Value = any;
export type ArrayValue = Value[];
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
export type State<A> = AbstractState<A, AbstractStateEvents<A>> & (A extends PrimitiveValue ? PrimitiveState<A> : A extends ReadonlyArray<infer B> | Array<infer B> ? ElementStates<A> & ArrayState<B> : A extends Object ? IsClass<A> extends true ? ReferenceState<A> : MemberStates<A> & ObjectState<A> : never);
export type StateTupleFromValueTuple<A extends ArrayValue> = {
    [B in keyof A]: State<A[B]>;
};
export type ElementStates<A> = {
    [B in keyof A & number]: State<A[B]>;
};
export type MemberStates<A> = {
    [B in keyof A]-?: State<A[B]>;
};
export type AbstractStateEvents<A> = {
    "update": [
        state: AbstractState<A, AbstractStateEvents<A>>
    ];
};
export declare abstract class AbstractState<in out A, in out B extends TupleRecord<B> & AbstractStateEvents<A>> {
    protected observers: {
        [C in keyof B]?: Array<Observer<any>>;
    };
    protected subscriptions: Array<Callback<any>>;
    protected notify<C extends keyof B>(type: C, ...args: [...B[C]]): void;
    protected observe_weakly<C extends keyof B>(type: C, callback: Callback<B[C]>): CancellationToken;
    constructor();
    compute<C>(computer: Computer<A, C>): State<C>;
    observe<C extends keyof B>(type: C, observer: Observer<B[C]>): CancellationToken;
    subscribe<A, B extends TupleRecord<B> & AbstractStateEvents<A>, C extends keyof B>(target: AbstractState<A, B>, type: C, callback: Callback<B[C]>): Subscription;
    unobserve<C extends keyof B>(type: C, observer: Observer<B[C]>): void;
    abstract shadow(): State<A>;
    abstract update(value: A): boolean;
    abstract value(): A;
}
export type PrimitiveStateEvents<A extends PrimitiveValue> = AbstractStateEvents<A> & {};
export declare abstract class PrimitiveState<A extends PrimitiveValue> extends AbstractState<A, PrimitiveStateEvents<A>> {
    protected lastValue: A;
    constructor(lastValue: A);
}
export declare class PrimitiveStateImplementation<A extends PrimitiveValue> extends PrimitiveState<A> {
    shadow(): State<A>;
    update(value: A): boolean;
    value(): A;
}
export type ReferenceStateEvents<A extends ReferenceValue> = AbstractStateEvents<A> & {};
export declare abstract class ReferenceState<A extends ReferenceValue> extends AbstractState<A, ReferenceStateEvents<A>> {
    protected lastValue: A;
    constructor(lastValue: A);
}
export declare class ReferenceStateImplementation<A extends ReferenceValue> extends ReferenceState<A> {
    shadow(): State<A>;
    update(value: A): boolean;
    value(): A;
}
export type ArrayStateEvents<A> = AbstractStateEvents<Array<A>> & {
    "insert": [
        state: State<A>,
        index: number
    ];
    "remove": [
        state: State<A>,
        index: number
    ];
};
export declare abstract class ArrayState<A> extends AbstractState<Array<A>, ArrayStateEvents<A>> {
    protected elements: Array<State<A>>;
    protected operating: boolean;
    protected currentLength: State<number>;
    protected isUndefined: boolean;
    protected operate(callback: () => void): void;
    protected onElementUpdate: () => void;
    constructor(elements: Array<State<A>>);
    [Symbol.iterator](): Iterator<State<A>>;
    append(...items: Array<StateOrValue<A>>): void;
    element(index: number | State<number>): State<A>;
    filter(predicate: Predicate<A>): State<Array<A>>;
    first(): State<A | undefined>;
    insert(index: number, item: StateOrValue<A>): void;
    last(): State<A | undefined>;
    get length(): State<number>;
    mapStates<B>(mapper: StateMapper<A, B>): State<Array<B>>;
    mapValues<B>(mapper: ValueMapper<A, B>): State<Array<B>>;
    remove(index: number): void;
    spread(): Array<State<A>>;
    vacate(): boolean;
}
export declare class ArrayStateImplementation<A> extends ArrayState<A> {
    shadow(): State<Array<A>>;
    update(value: Array<A>): boolean;
    value(): Array<A>;
}
export type ObjectStateEventsTuple<A extends RecordValue> = {
    [B in keyof A]: [state: State<A[B]>, key: B];
}[keyof A];
export type ObjectStateEvents<A extends RecordValue> = AbstractStateEvents<A> & {
    "insert": ObjectStateEventsTuple<A>;
    "remove": ObjectStateEventsTuple<A>;
};
export declare abstract class ObjectState<A extends RecordValue> extends AbstractState<A, ObjectStateEvents<A>> {
    protected members: MemberStates<A>;
    protected operating: boolean;
    protected isUndefined: boolean;
    protected operate(callback: () => void): void;
    protected onMemberUpdate: () => void;
    constructor(members: MemberStates<A>);
    insert<B extends string, C>(key: B, item: StateOrValue<C>): State<ExpansionOf<A & {
        [key in B]: C;
    }>>;
    member<B extends keyof A>(key: B | State<B>): State<A[B]>;
    remove<B extends keyof A>(key: B): State<ExpansionOf<Omit<A, B>>>;
    spread(): MemberStates<A>;
}
export declare class ObjectStateImplementation<A extends RecordValue> extends ObjectState<A> {
    shadow(): State<A>;
    update(value: A): boolean;
    value(): A;
}
export declare function make_primitive_state<A extends PrimitiveValue>(value: A): PrimitiveState<A>;
export declare function make_array_state<A>(elements: Array<State<A>>): ArrayState<A>;
export declare function make_object_state<A extends RecordValue>(members: MemberStates<A>): ObjectState<A>;
export declare function make_reference_state<A extends ReferenceValue>(value: A): ReferenceState<A>;
export declare function make_state<A>(value: A): State<A>;
export declare function computed<A extends ArrayValue, B>(states: [...StateTupleFromValueTuple<A>], computer: (...args: [...A]) => B): State<B>;
export declare function stateify<A extends Attribute<Value>>(attribute: A): State<ValueFromAttribute<A>>;
export declare function valueify<A extends Attribute<Value>>(attribute: A): ValueFromAttribute<A>;
export type MergedPair<A extends RecordValue, B extends RecordValue> = ExpansionOf<{
    [C in keyof A | keyof B]: C extends keyof A & keyof B ? undefined extends B[C] ? Exclude<B[C], undefined> | A[C] : B[C] : C extends keyof A ? A[C] : C extends keyof B ? B[C] : never;
}>;
export type MergedTuple<A extends RecordValue[]> = ExpansionOf<A extends [infer B extends RecordValue, infer C extends RecordValue, ...infer D extends RecordValue[]] ? MergedTuple<[MergedPair<B, C>, ...D]> : A extends [infer B extends RecordValue, infer C extends RecordValue] ? MergedPair<B, C> : A extends [infer B extends RecordValue] ? B : {}>;
export declare function squash<A extends RecordValue>(records: State<Array<A>>): State<A>;
export declare function fallback<A>(underlying: State<A | undefined>, default_value: Exclude<A, undefined>): State<Exclude<A, undefined>>;
export declare function merge<A extends RecordValue[]>(...states: StateTupleFromValueTuple<A>): State<MergedTuple<A>>;
export declare function flatten<A extends PrimitiveValue | ReferenceValue>(states: State<Array<A | RecursiveArray<A>>>): State<Array<A>>;
export {};
