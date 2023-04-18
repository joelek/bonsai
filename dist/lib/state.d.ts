export type TupleRecord<A extends TupleRecord<A>> = {
    [C in keyof A]: any[];
};
export type PrimitiveValue = void | bigint | boolean | number | string | null | undefined;
export type ReferenceValue = Object;
export type Value = PrimitiveValue | ReferenceValue | Value[] | {
    [key: string]: Value;
};
export type ArrayValue = Value[];
export type RecordValue = {
    [key: string]: Value;
};
export type StateMapper<A extends Value, B extends Value> = (state: State<A>, index: State<number>) => B | State<B>;
export type ValueMapper<A extends Value, B extends Value> = (value: A, index: number) => B;
export type Predicate<A extends Value> = (state: State<A>, index: State<number>) => State<boolean>;
export type Observer<A extends any[]> = (...args: A) => void;
export type Computer<A extends Value, B extends Value> = (value: A) => B;
export type CancellationToken = () => void;
export type State<A extends Value> = AbstractState<A, AbstractStateEvents<A>> & (A extends PrimitiveValue ? PrimitiveState<A> : A extends Array<infer B extends Value> ? IndexStates<A> & ArrayState<B> : A extends RecordValue ? States<A> & ObjectState<A> : A extends ReferenceValue ? ReferenceState<A> : never);
export type IndexStates<A> = {
    [B in keyof A & number]: A[B] extends Value ? State<A[B]> : never;
};
export type States<A> = {
    [B in keyof A]: A[B] extends Value ? State<A[B]> : never;
};
export type AbstractStateEvents<A extends Value> = {
    "update": [
        state: AbstractState<A, AbstractStateEvents<A>>
    ];
};
export declare abstract class AbstractState<A extends Value, B extends TupleRecord<B> & AbstractStateEvents<A>> {
    protected observers: {
        [C in keyof B]?: Array<Observer<any>>;
    };
    protected notify<C extends keyof B>(type: C, ...args: [...B[C]]): void;
    constructor();
    compute<C extends Value>(computer: Computer<A, C>): State<C>;
    observe<C extends keyof B>(type: C, observer: Observer<B[C]>): CancellationToken;
    unobserve<C extends keyof B>(type: C, observer: Observer<B[C]>): void;
    abstract update(value: A): boolean;
    abstract value(): A;
}
export type PrimitiveStateEvents<A extends PrimitiveValue> = AbstractStateEvents<A> & {};
export declare class PrimitiveState<A extends PrimitiveValue> extends AbstractState<A, PrimitiveStateEvents<A>> {
    protected lastValue: A;
    constructor(lastValue: A);
    update(value: A): boolean;
    value(): A;
}
export type ReferenceStateEvents<A extends ReferenceValue> = AbstractStateEvents<A> & {};
export declare class ReferenceState<A extends ReferenceValue> extends AbstractState<A, ReferenceStateEvents<A>> {
    protected lastValue: A;
    constructor(lastValue: A);
    update(valu: A): boolean;
    value(): A;
}
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
export declare class ArrayState<A extends Value> extends AbstractState<Array<A>, ArrayStateEvents<A>> {
    protected elements: Array<State<A>>;
    protected updating: boolean;
    protected currentLength: State<number>;
    protected onElementUpdate: () => void;
    constructor(elements: Array<State<A>>);
    [Symbol.iterator](): Iterator<State<A>>;
    append(...items: Array<A | State<A>>): void;
    element(index: number | State<number>): State<A>;
    filter(predicate: Predicate<A>): State<Array<A>>;
    first(): State<A | undefined>;
    insert(index: number, item: A | State<A>): void;
    last(): State<A | undefined>;
    length(): State<number>;
    mapStates<B extends Value>(mapper: StateMapper<A, B>): State<Array<B>>;
    mapValues<B extends Value>(mapper: ValueMapper<A, B>): State<Array<B>>;
    remove(index: number): void;
    update(value: Array<A>): boolean;
    vacate(): boolean;
    value(): Array<A>;
}
export type ObjectStateEvents<A extends Value> = AbstractStateEvents<A> & {};
export declare class ObjectState<A extends RecordValue> extends AbstractState<A, ObjectStateEvents<A>> {
    protected members: States<A>;
    protected updating: boolean;
    protected onMemberUpdate: () => void;
    constructor(members: States<A>);
    member<B extends keyof A>(key: B): State<A[B]>;
    member<B extends keyof A, C extends A[B]>(key: B, defaultValue: C): State<Exclude<A[B], undefined> | C>;
    update(value: A): boolean;
    value(): A;
}
export declare function make_state<A extends Value>(value: A): State<A>;
export declare function computed<A extends Value[], B extends Value>(states: [...States<A>], computer: (...args: [...A]) => B): State<B>;
export declare function stateify<A extends Value>(attribute: A | State<A>): State<A>;
export declare function valueify<A extends Value>(attribute: A | State<A>): A;
