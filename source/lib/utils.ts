export function getOrderedIndex<A>(array: Array<A>, collator: (value: A) => number): number {
	function recursive(offset: number, length: number): number {
		if (length <= 0) {
			return offset;
		}
		let pivot = offset + (length >> 1);
		let outcome = collator(array[pivot]);
		if (outcome === 0) {
			return pivot;
		}
		if (outcome < 0) {
			return recursive(offset, pivot - offset);
		} else {
			return recursive(pivot + 1, length - (pivot + 1) - offset);
		}
	};
	return recursive(0, array.length);
};

type IterableWeakMapEntry<A extends object, B> = {
	keyref: WeakRef<A>;
	value: B;
};

export class IterableWeakMap<A extends object, B> implements Map<A, B> {
	protected keyrefs: Set<WeakRef<A>>;
	protected registry: FinalizationRegistry<WeakRef<A>>;
	protected map: WeakMap<A, IterableWeakMapEntry<A, B>>;
	protected current_size: number;

	constructor(iterable?: Iterable<[A, B]>) {
		this.keyrefs = new Set<WeakRef<A>>();
		this.registry = new FinalizationRegistry<WeakRef<A>>((keyref) => {
			this.keyrefs.delete(keyref);
			this.current_size -= 1;
		});
		this.map = new WeakMap<A, IterableWeakMapEntry<A, B>>();
		this.current_size = 0;
		for (let [key, value] of iterable ?? []) {
			this.set(key, value);
		}
	}

	get size(): number {
		return this.current_size;
	}

	get [Symbol.toStringTag](): string {
		return "IterableWeakMap";
	}

	[Symbol.iterator](): IterableIterator<[A, B]> {
		return this.entries();
	}

	* entries(): Generator<[A, B]> {
		for (let keyref of this.keyrefs) {
			let key = keyref.deref();
			if (key != null) {
				let entry = this.map.get(key);
				if (entry != null) {
					yield [key, entry.value];
				}
			}
		}
	}

	* keys(): Generator<A> {
		for (let keyref of this.keyrefs) {
			let key = keyref.deref();
			if (key != null) {
				yield key;
			}
		}
	}

	* values(): Generator<B> {
		for (let keyref of this.keyrefs) {
			let key = keyref.deref();
			if (key != null) {
				let entry = this.map.get(key);
				if (entry != null) {
					yield entry.value;
				}
			}
		}
	}

	clear(): void {
		for (let keyref of this.keyrefs) {
			let key = keyref.deref();
			if (key != null) {
				this.registry.unregister(key);
			}
		}
		this.keyrefs.clear();
		this.map = new WeakMap<A, IterableWeakMapEntry<A, B>>();
	}

	delete(key: A): boolean {
		let entry = this.map.get(key);
		if (entry == null) {
			return false;
		} else {
			this.map.delete(key);
			this.keyrefs.delete(entry.keyref);
			this.registry.unregister(key);
			return true;
		}
	}

	forEach(callback: (value: B, key: A, map: Map<A, B>) => void, self?: any): void {
		for (let [key, value] of this) {
			callback.call(self, value, key, this);
		}
	}

	get(key: A): B | undefined {
		return this.map.get(key)?.value;
	}

	has(key: A): boolean {
		return this.map.has(key);
	}

	set(key: A, value: B): this {
		let entry = this.map.get(key);
		if (entry == null) {
			let keyref = new WeakRef<A>(key);
			this.registry.register(key, keyref, key);
			this.current_size += 1;
			entry = {
				keyref,
				value
			};
			this.keyrefs.add(keyref);
			this.map.set(key, entry);
		} else {
			entry.value = value;
		}
		return this;
	}
};



type IterableWeakSetEntry<A extends object> = {
	keyref: WeakRef<A>;
};

export class IterableWeakSet<A extends object> implements Set<A> {
	protected keyrefs: Set<WeakRef<A>>;
	protected registry: FinalizationRegistry<WeakRef<A>>;
	protected map: WeakMap<A, IterableWeakSetEntry<A>>;
	protected current_size: number;

	constructor(iterable?: Iterable<A>) {
		this.keyrefs = new Set<WeakRef<A>>();
		this.registry = new FinalizationRegistry<WeakRef<A>>((keyref) => {
			this.keyrefs.delete(keyref);
			this.current_size -= 1;
		});
		this.map = new WeakMap<A, IterableWeakSetEntry<A>>();
		this.current_size = 0;
		for (let key of iterable ?? []) {
			this.add(key);
		}
	}

	get size(): number {
		return this.current_size;
	}

	get [Symbol.toStringTag](): string {
		return "IterableWeakSet";
	}

	[Symbol.iterator](): IterableIterator<A> {
		return this.values();
	}

	* entries(): Generator<[A, A]> {
		for (let keyref of this.keyrefs) {
			let key = keyref.deref();
			if (key != null) {
				yield [key, key];
			}
		}
	}

	* keys(): Generator<A> {
		for (let keyref of this.keyrefs) {
			let key = keyref.deref();
			if (key != null) {
				yield key;
			}
		}
	}

	* values(): Generator<A> {
		for (let keyref of this.keyrefs) {
			let key = keyref.deref();
			if (key != null) {
				yield key;
			}
		}
	}

	add(key: A): this {
		let entry = this.map.get(key);
		if (entry == null) {
			let keyref = new WeakRef<A>(key);
			this.registry.register(key, keyref, key);
			this.current_size += 1;
			entry = {
				keyref
			};
			this.keyrefs.add(keyref);
			this.map.set(key, entry);
		}
		return this;
	}

	clear(): void {
		for (let keyref of this.keyrefs) {
			let key = keyref.deref();
			if (key != null) {
				this.registry.unregister(key);
			}
		}
		this.keyrefs.clear();
		this.map = new WeakMap<A, IterableWeakSetEntry<A>>();
	}

	delete(key: A): boolean {
		let entry = this.map.get(key);
		if (entry == null) {
			return false;
		} else {
			this.map.delete(key);
			this.keyrefs.delete(entry.keyref);
			this.registry.unregister(key);
			return true;
		}
	}

	forEach(callback: (value: A, key: A, set: Set<A>) => void, self?: any): void {
		for (let key of this) {
			callback.call(self, key, key, this);
		}
	}

	has(key: A): boolean {
		return this.map.has(key);
	}
};
