export declare function getOrderedIndex<A>(array: Array<A>, collator: (value: A) => number): number;
type IterableWeakMapEntry<A extends object, B> = {
    keyref: WeakRef<A>;
    value: B;
};
export declare class IterableWeakMap<A extends object, B> implements Map<A, B> {
    protected keyrefs: Set<WeakRef<A>>;
    protected registry: FinalizationRegistry<WeakRef<A>>;
    protected map: WeakMap<A, IterableWeakMapEntry<A, B>>;
    protected current_size: number;
    constructor(iterable?: Iterable<[A, B]>);
    get size(): number;
    get [Symbol.toStringTag](): string;
    [Symbol.iterator](): IterableIterator<[A, B]>;
    entries(): Generator<[A, B]>;
    keys(): Generator<A>;
    values(): Generator<B>;
    clear(): void;
    delete(key: A): boolean;
    forEach(callback: (value: B, key: A, map: Map<A, B>) => void, self?: any): void;
    get(key: A): B | undefined;
    has(key: A): boolean;
    set(key: A, value: B): this;
    static IS_SUPPORTED: boolean;
    static create<A extends object, B>(iterable?: Iterable<[A, B]>): Map<A, B>;
}
type IterableWeakSetEntry<A extends object> = {
    keyref: WeakRef<A>;
};
export declare class IterableWeakSet<A extends object> implements Set<A> {
    protected keyrefs: Set<WeakRef<A>>;
    protected registry: FinalizationRegistry<WeakRef<A>>;
    protected map: WeakMap<A, IterableWeakSetEntry<A>>;
    protected current_size: number;
    constructor(iterable?: Iterable<A>);
    get size(): number;
    get [Symbol.toStringTag](): string;
    [Symbol.iterator](): IterableIterator<A>;
    entries(): Generator<[A, A]>;
    keys(): Generator<A>;
    values(): Generator<A>;
    add(key: A): this;
    clear(): void;
    delete(key: A): boolean;
    forEach(callback: (value: A, key: A, set: Set<A>) => void, self?: any): void;
    has(key: A): boolean;
    static IS_SUPPORTED: boolean;
    static create<A extends object>(iterable?: Iterable<A>): Set<A>;
}
export {};
