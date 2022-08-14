export declare type TupleRecord<A extends TupleRecord<A>> = {
    [C in keyof A]: any[];
};
export declare type PrimitiveValue = void | bigint | boolean | number | string | null | undefined;
export declare type ReferenceValue = Object;
export declare type Value = PrimitiveValue | ReferenceValue | Value[] | {
    [key: string]: Value;
};
export declare type ArrayValue = Value[];
export declare type RecordValue = {
    [key: string]: Value;
};
export declare type StateMapper<A extends Value, B extends Value> = (state: State<A>) => B | State<B>;
export declare type ValueMapper<A extends Value, B extends Value> = (value: A) => B;
export declare type Observer<A extends any[]> = (...args: [...A]) => void;
export declare type Computer<A extends Value, B extends Value> = (value: A) => B;
export declare type CancellationToken = () => void;
export declare type State<A extends Value> = AbstractState<A, AbstractStateEvents<A>> & (A extends PrimitiveValue ? PrimitiveState<A> : A extends Array<infer B extends Value> ? ArrayState<B> : A extends RecordValue ? ObjectState<A> : A extends ReferenceValue ? ReferenceState<A> : never);
export declare type States<A> = {
    [B in keyof A]: A[B] extends Value ? State<A[B]> : never;
};
export declare type AbstractStateEvents<A extends Value> = {
    "update": [
        state: AbstractState<A, AbstractStateEvents<A>>
    ];
};
export declare abstract class AbstractState<A extends Value, B extends TupleRecord<B> & AbstractStateEvents<A>> {
    protected observers: {
        [C in keyof B]?: Array<Observer<B[C]>>;
    };
    protected notify<C extends keyof B>(type: C, ...args: [...B[C]]): void;
    constructor();
    compute<C extends Value>(computer: Computer<A, C>): State<C>;
    observe<C extends keyof B>(type: C, observer: Observer<B[C]>): CancellationToken;
    unobserve<C extends keyof B>(type: C, observer: Observer<B[C]>): void;
    abstract update(value: A): boolean;
    abstract value(): A;
}
export declare type PrimitiveStateEvents<A extends PrimitiveValue> = AbstractStateEvents<A> & {};
export declare class PrimitiveState<A extends PrimitiveValue> extends AbstractState<A, PrimitiveStateEvents<A>> {
    protected lastValue: A;
    constructor(lastValue: A);
    update(value: A): boolean;
    value(): A;
}
export declare type ReferenceStateEvents<A extends ReferenceValue> = AbstractStateEvents<A> & {};
export declare class ReferenceState<A extends ReferenceValue> extends AbstractState<A, ReferenceStateEvents<A>> {
    protected lastValue: A;
    constructor(lastValue: A);
    update(valu: A): boolean;
    value(): A;
}
export declare type ArrayStateEvents<A extends Value> = AbstractStateEvents<Array<A>> & {
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
    protected onElementUpdate: () => void;
    constructor(elements: Array<State<A>>);
    [Symbol.iterator](): Iterator<State<A>>;
    append(item: A | State<A>): void;
    element(index: number | State<number>): State<A>;
    insert(index: number, item: A | State<A>): void;
    length(): number;
    mapStates<B extends Value>(mapper: StateMapper<A, B>): ArrayState<B>;
    mapValues<B extends Value>(mapper: ValueMapper<A, B>): ArrayState<B>;
    remove(index: number): void;
    update(value: Array<A>): boolean;
    value(): Array<A>;
}
export declare type ObjectStateEvents<A extends Value> = AbstractStateEvents<A> & {};
export declare class ObjectState<A extends RecordValue> extends AbstractState<A, ObjectStateEvents<A>> {
    protected members: States<A>;
    protected updating: boolean;
    protected onMemberUpdate: () => void;
    constructor(members: States<A>);
    member<B extends keyof A>(key: B): States<A>[B];
    update(value: A): boolean;
    value(): A;
}
export declare function stateify<A extends Value>(value: A): State<A>;
export declare function computed<A extends Value[], B extends Value>(states: [...States<A>], computer: (...args: [...A]) => B): State<B>;
