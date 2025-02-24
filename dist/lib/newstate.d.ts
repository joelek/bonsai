type ExpansionOf<A> = A extends infer B ? {
    [C in keyof B]: B[C];
} : never;
type RecordButNotClass<A> = A extends {
    [key: string]: unknown;
} ? A : never;
type RecursiveArray<A> = Array<A | RecursiveArray<A>>;
type TupleButNotArray<A> = Extract<keyof A, `${number}`> extends number ? never : A;
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
export type ReadableStateMapper<A, B> = (state: ReadableState<A>, index: ReadableState<number>) => ReadableState<B>;
export type ReadableStateMapper2<A, B> = (state: ReadableState<A>, index: ReadableState<number>) => B;
export type WritableStateMapper<A, B> = (state: WritableState<A>, index: ReadableState<number>) => ReadableState<B>;
export type WritableStateMapper2<A, B> = (state: WritableState<A>, index: ReadableState<number>) => B;
export type StateFromAttribute<A> = WritableValueFromAttribute<A> extends ValueFromAttribute<A> ? WritableState<ValueFromAttribute<A>> : ReadableState<ValueFromAttribute<A>>;
export type StateTupleFromValueTuple<A extends ArrayValue> = {
    [B in keyof A]: ReadableOrWritableState<A[B]>;
};
export type MergedPair<A extends RecordValue, B extends RecordValue> = ExpansionOf<{
    [C in keyof A | keyof B]: C extends keyof A & keyof B ? undefined extends B[C] ? Exclude<B[C], undefined> | A[C] : B[C] : C extends keyof A ? A[C] : C extends keyof B ? B[C] : never;
}>;
export type MergedTuple<A extends RecordValue[]> = ExpansionOf<A extends [infer B extends RecordValue, infer C extends RecordValue, ...infer D extends RecordValue[]] ? MergedTuple<[MergedPair<B, C>, ...D]> : A extends [infer B extends RecordValue, infer C extends RecordValue] ? MergedPair<B, C> : A extends [infer B extends RecordValue] ? B : {}>;
export type ValueMapper<A, B> = (value: A, index: number) => B;
export type Predicate<A> = (state: ReadableState<A>, index: ReadableState<number>) => ReadableState<boolean>;
export type Observer<A extends any[]> = (...args: [...A]) => void;
export type Callback<A extends any[]> = (...args: [...A]) => void;
export type Computer<A, B> = (value: A) => B;
export type CancellationToken = Subscription;
export type Subscription = (() => void) & {
    is_cancelled: ReadableState<boolean>;
};
export declare const Subscription: {
    create(is_cancelled: WritableState<boolean>, callback: Callback<[]>): Subscription;
};
export type ObserveOptions = {
    weakly?: boolean;
};
export interface Observable<A extends TupleRecord<A>> {
    observe<B extends keyof A>(type: B, observer: Observer<A[B]>, options?: ObserveOptions): Subscription;
    subscribe(subscription: Subscription): Subscription;
    unobserve<B extends keyof A>(type: B, observer: Observer<A[B]>): void;
}
export interface AbstractReadableState<A extends Value, B extends TupleRecord<B>> extends Observable<B> {
    compute<C>(computer: Computer<A, C>): WritableState<C>;
    shadow(): ReadableState<A>;
    value(): A;
}
export interface AbstractWritableState<in out A extends Value, B extends TupleRecord<B>> extends Observable<B> {
    compute<C>(computer: Computer<A, C>): WritableState<C>;
    shadow(): WritableState<A>;
    value(): A;
    update(value: A): boolean;
}
export type ReadableBasicStateEvents<A extends Value> = {
    "update": [
        state: ReadableState<A>
    ];
};
export interface ReadableBasicState<A extends Value> extends AbstractReadableState<A, ReadableBasicStateEvents<A>> {
}
export type WritableBasicStateEvents<A extends Value> = {
    "update": [
        state: WritableState<A>
    ];
};
export interface WritableBasicState<in out A extends Value> extends AbstractWritableState<A, WritableBasicStateEvents<A>> {
}
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
}
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
}
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
}
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
    member<B extends keyof A, C extends A[B]>(key: ReadableStateOrValue<B>): WritableState<C>;
    detach<B extends keyof A>(key: B): WritableState<ExpansionOf<Omit<A, B>>>;
    spread(): WritableMemberStates<A>;
}
type ArrayType<A> = [A] extends [ArrayValue] ? A : any;
type RecordType<A> = [A] extends [RecordValue] ? A : any;
type BasicType<A> = [A] extends [Value] ? A : any;
export type ReadableStateEvents<A> = ReadableArrayStateEvents<ArrayType<A>> & ReadableRecordStateEvents<RecordType<A>> & ReadableBasicStateEvents<BasicType<A>>;
export type WritableStateEvents<A> = WritableArrayStateEvents<ArrayType<A>> & WritableRecordStateEvents<RecordType<A>> & WritableBasicStateEvents<BasicType<A>>;
export declare class StateImplementation<A> implements WritableArrayState<ArrayType<A>>, WritableRecordState<RecordType<A>>, WritableBasicState<BasicType<A>> {
    constructor();
    append(...items: ReadableStateOrValue<ArrayType<A>[number]>[]): void;
    element(index: number | ReadableState<number>): WritableState<ArrayType<A>[number]>;
    filter(predicate: Predicate<ArrayType<A>[number]>): WritableState<Array<ArrayType<A>[number]>>;
    first(): WritableState<ArrayType<A>[number] | undefined>;
    last(): WritableState<ArrayType<A>[number] | undefined>;
    get length(): ReadableState<number>;
    mapStates<B>(mapper: WritableStateMapper<ArrayType<A>[number], WritableState<B>> | WritableStateMapper2<ArrayType<A>[number], B>): ReadableState<Array<B>>;
    mapValues<B>(mapper: ValueMapper<ArrayType<A>[number], B>): ReadableState<Array<B>>;
    member<B extends keyof RecordType<A>, C extends RecordType<A>[B]>(key: ReadableStateOrValue<B>): WritableState<C>;
    spread(): WritableElementStates<ArrayType<A>>;
    spread(): WritableMemberStates<RecordType<A>>;
    vacate(): boolean;
    [Symbol.iterator](): Iterator<WritableState<ArrayType<A>[number]>>;
    compute<B>(computer: Computer<A, B>): WritableState<B>;
    observe<B extends keyof WritableStateEvents<A>>(type: B, observer: Observer<WritableStateEvents<A>[B]>): Subscription;
    shadow(): WritableState<ArrayType<A>>;
    shadow(): WritableState<RecordType<A>>;
    shadow(): WritableState<BasicType<A>>;
    subscribe(subscription: Subscription): Subscription;
    unobserve<B extends keyof WritableStateEvents<A>>(type: B, observer: Observer<WritableStateEvents<A>[B]>): void;
    attach<B extends string, C>(key: B, item: WritableStateOrValue<C>): void;
    detach<B extends keyof RecordType<A>>(key: B): WritableState<ExpansionOf<Omit<RecordType<A>, B>>>;
    insert(index: number, item: WritableStateOrValue<ArrayType<A>[number]>): WritableState<ArrayType<A>[number]>;
    remove(index: number): void;
    update(value: A): boolean;
    value(): A;
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
export type ReadableStateEvents2<A> = TupleRecord<any> & ([
    A
] extends [ArrayValue] ? [
    A
] extends [TupleButNotArray<A>] ? ReadableArrayStateEvents<A> : ReadableArrayStateEvents<A> : [
    A
] extends [RecordButNotClass<A>] ? ReadableRecordStateEvents<A> : ReadableBasicStateEvents<A>);
export type ReadableState<A> = ([
    A
] extends [ArrayValue] ? [
    A
] extends [TupleButNotArray<A>] ? ReadableArrayState<A> & {
    [B in keyof A]: ReadableState<A[B]>;
} : ReadableArrayState<A> & ReadableElementStates<A> : [
    A
] extends [RecordButNotClass<A>] ? ReadableMemberStates<A> & ReadableRecordState<A> : unknown) & ReadableBasicState<A>;
export type GenericReadableState<A> = ReadableBasicState<A>;
export type WritableStateEvents2<A> = TupleRecord<any> & ([
    A
] extends [ArrayValue] ? [
    A
] extends [TupleButNotArray<A>] ? WritableArrayStateEvents<A> : WritableArrayStateEvents<A> : [
    A
] extends [RecordButNotClass<A>] ? WritableRecordStateEvents<A> : WritableBasicStateEvents<A>);
export type WritableState<A> = ([
    A
] extends [ArrayValue] ? [
    A
] extends [TupleButNotArray<A>] ? WritableArrayState<A> & {
    [B in keyof A]: WritableState<A[B]>;
} : WritableArrayState<A> & WritableElementStates<A> : [
    A
] extends [RecordButNotClass<A>] ? WritableMemberStates<A> & WritableRecordState<A> : unknown) & WritableBasicState<A>;
export type GenericWritableState<A> = WritableBasicState<A>;
export type GenericState<A> = GenericReadableState<A> | GenericWritableState<A>;
export type State<A> = WritableState<A>;
export type ReadableOrWritableState<A> = ReadableState<A> | WritableState<A>;
export type ReadableStateOrValue<A> = A | ReadableState<A>;
export type WritableStateOrValue<A> = A | WritableState<A>;
export type StateOrValue<A> = A | ReadableOrWritableState<A>;
export type Attribute<A> = ReadableOrWritableState<A> | (A extends ArrayValue ? {
    [B in keyof A]: Attribute<A[B]>;
} : A extends RecordValue ? {
    [B in keyof A]: Attribute<A[B]>;
} : A);
export type WritableAttribute<A> = WritableState<A> | (A extends ArrayValue ? {
    [B in keyof A]: WritableAttribute<A[B]>;
} : A extends RecordValue ? {
    [B in keyof A]: WritableAttribute<A[B]>;
} : A);
export type ReadableAttribute<A> = ReadableState<A> | (A extends ArrayValue ? {
    [B in keyof A]: ReadableAttribute<A[B]>;
} : A extends RecordValue ? {
    [B in keyof A]: ReadableAttribute<A[B]>;
} : A);
export type Attributes<A> = Attribute<A>;
export type ValueFromAttribute<A> = (A extends ReadableOrWritableState<infer B> ? B : A extends ArrayValue ? {
    [B in keyof A]: ValueFromAttribute<A[B]>;
} : A extends RecordValue ? A extends RecordButNotClass<A> ? {
    [B in keyof A]: ValueFromAttribute<A[B]>;
} : A : A);
export type ReadableValueFromAttribute<A> = (A extends ReadableState<infer B> ? B : A extends ArrayValue ? {
    [B in keyof A]: ReadableValueFromAttribute<A[B]>;
} : A extends RecordValue ? A extends RecordButNotClass<A> ? {
    [B in keyof A]: ReadableValueFromAttribute<A[B]>;
} : A : A);
export type WritableValueFromAttribute<A> = (A extends WritableState<infer B> ? B : A extends ArrayValue ? {
    [B in keyof A]: WritableValueFromAttribute<A[B]>;
} : A extends RecordValue ? A extends RecordButNotClass<A> ? {
    [B in keyof A]: WritableValueFromAttribute<A[B]>;
} : A : A);
export declare function make_state<A>(value: A): WritableState<A>;
export declare function stateify<A>(attribute: WritableAttribute<A>, generic: true): WritableState<A>;
export declare function stateify<A>(attribute: ReadableAttribute<A>, generic: true): ReadableState<A>;
export declare function stateify<A extends Attribute<unknown>>(attribute: A): StateFromAttribute<A>;
export declare function valueify<A>(attribute: WritableAttribute<A>, generic: true): A;
export declare function valueify<A>(attribute: ReadableAttribute<A>, generic: true): A;
export declare function valueify<A extends Attribute<unknown>>(attribute: A): ValueFromAttribute<A>;
export declare function squash<A extends RecordValue>(records: ReadableOrWritableState<Array<A>>): ReadableState<A>;
export declare function flatten<A extends PrimitiveValue | ReferenceValue>(states: ReadableOrWritableState<Array<A | RecursiveArray<A>>>): ReadableState<Array<A>>;
export declare function merge<A extends RecordValue[]>(...states: StateTupleFromValueTuple<A>): ReadableState<MergedTuple<A>>;
export declare function fallback<A>(underlying: WritableState<A | undefined>, default_value: Exclude<A, undefined>): WritableState<Exclude<A, undefined>>;
export declare function computed<A extends ArrayValue, B>(states: [...StateTupleFromValueTuple<A>], computer: (...args: [...A]) => B): WritableState<B>;
export {};
