export type TupleRecord<A extends TupleRecord<A>> = { [C in keyof A]: any[]; };

export type PrimitiveValue = void | bigint | boolean | number | string | null | undefined;

export type ReferenceValue = Object;

export type Value = PrimitiveValue | ReferenceValue | Value[] | { [key: string]: Value; };

export type ArrayValue = Value[];

export type RecordValue = { [key: string]: Value; };

export type StateMapper<A extends Value, B extends Value> = (state: State<A>, index: State<number>) => B | State<B>;

export type ValueMapper<A extends Value, B extends Value> = (value: A, index: number) => B;

export type Observer<A extends any[]> = (...args: [...A]) => void;

export type Computer<A extends Value, B extends Value> = (value: A) => B;

export type CancellationToken = () => void;

export type State<A extends Value> = AbstractState<A, AbstractStateEvents<A>> & (
	A extends PrimitiveValue ? PrimitiveState<A> :
	A extends Array<infer B extends Value> ? ArrayState<B> :
	A extends RecordValue ? ObjectState<A> :
	A extends ReferenceValue ? ReferenceState<A> :
	never
);

export type States<A> = {
	[B in keyof A]: A[B] extends Value ? State<A[B]> : never;
};

export type AbstractStateEvents<A extends Value> = {
	"update": [
		state: AbstractState<A, AbstractStateEvents<A>>
	];
};

export abstract class AbstractState<A extends Value, B extends TupleRecord<B> & AbstractStateEvents<A>> {
	protected observers: { [C in keyof B]?: Array<Observer<B[C]>> };

	protected notify<C extends keyof B>(type: C, ...args: [...B[C]]): void {
		let observers = this.observers[type];
		if (observers == null) {
			return;
		}
		for (let index = 0; index < observers.length; index++) {
			observers[index](...args);
		}
	}

	constructor() {
		this.observers = {};
	}

	compute<C extends Value>(computer: Computer<A, C>): State<C> {
		let computed = stateify(computer(this.value()));
		this.observe("update", (state) => {
			computed.update(computer(state.value()));
		});
		return computed;
	}

	observe<C extends keyof B>(type: C, observer: Observer<B[C]>): CancellationToken {
		let observers = this.observers[type];
		if (observers == null) {
			this.observers[type] = observers = [];
		}
		observers.push(observer);
		return () => {
			this.unobserve(type, observer);
		};
	}

	unobserve<C extends keyof B>(type: C, observer: Observer<B[C]>): void {
		let observers = this.observers[type];
		if (observers == null) {
			return;
		}
		let index = observers.lastIndexOf(observer);
		if (index < 0) {
			return;
		}
		observers.splice(index, 1);
		if (observers.length === 0) {
			delete this.observers[type];
		}
	}

	abstract update(value: A): boolean;
	abstract value(): A;
};

export type PrimitiveStateEvents<A extends PrimitiveValue> = AbstractStateEvents<A> & {

};

export class PrimitiveState<A extends PrimitiveValue> extends AbstractState<A, PrimitiveStateEvents<A>> {
	protected lastValue: A;

	constructor(lastValue: A) {
		super();
		this.lastValue = lastValue;
	}

	update(value: A): boolean {
		let updated = false;
		if (value !== this.lastValue) {
			this.lastValue = value;
			updated = true;
		}
		if (updated) {
			this.notify("update", this);
		}
		return updated;
	}

	value(): A {
		return this.lastValue;
	}
};

export type ReferenceStateEvents<A extends ReferenceValue> = AbstractStateEvents<A> & {

};

export class ReferenceState<A extends ReferenceValue> extends AbstractState<A, ReferenceStateEvents<A>> {
	protected lastValue: A;

	constructor(lastValue: A) {
		super();
		this.lastValue = lastValue;
	}

	update(valu: A): boolean {
		let updated = false;
		if (valu !== this.lastValue) {
			this.lastValue = valu;
			updated = true;
		}
		if (updated) {
			this.notify("update", this);
		}
		return updated;
	}

	value(): A {
		return this.lastValue;
	}
};

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

export class ArrayState<A extends Value> extends AbstractState<Array<A>, ArrayStateEvents<A>> {
	protected elements: Array<State<A>>;
	protected updating: boolean;
	protected currentLength: State<number>;

	protected onElementUpdate = () => {
		if (!this.updating) {
			this.notify("update", this);
		}
	};

	constructor(elements: Array<State<A>>) {
		super()
		this.elements = [ ...elements ];
		this.updating = false;
		this.currentLength = stateify(elements.length);
		for (let index = 0; index < this.elements.length; index++) {
			this.elements[index].observe("update", this.onElementUpdate);
		}
	}

	[Symbol.iterator](): Iterator<State<A>> {
		return this.elements[Symbol.iterator]();
	}

	append(...items: Array<A | State<A>>): void {
		for (let item of items) {
			this.insert(this.elements.length, item);
		}
	}


	element(index: number | State<number>): State<A> {
		if (index instanceof AbstractState) {
			let element = this.element(index.value());
			let that = stateify(element.value());
			let subscription = element.observe("update", (state) => {
				that.update(state.value());
			});
			index.observe("update", (index) => {
				let element = this.element(index.value());
				subscription();
				that.update(element.value());
				subscription = element.observe("update", (state) => {
					that.update(state.value());
				});
			});
			that.observe("update", (that) => {
				this.element(index.value()).update(that.value());
			});
			return that;
		} else {
			if (index < 0 || index >= this.elements.length) {
				throw new Error(`Expected index to be within bounds!`);
			}
			return this.elements[index];
		}
	}

	insert(index: number, item: A | State<A>): void {
		if (index < 0 || index > this.elements.length) {
			throw new Error(`Expected index to be within bounds!`);
		}
		let element = item instanceof AbstractState ? item : stateify(item);
		this.elements.splice(index, 0, element);
		element.observe("update", this.onElementUpdate);
		this.currentLength.update(this.elements.length);
		this.notify("insert", element, index);
		this.notify("update", this);
	}

	length(): State<number> {
		return this.currentLength;
	}

	mapStates<B extends Value>(mapper: StateMapper<A, B>): ArrayState<B> {
		let that = stateify([] as Array<B>);
		let indexStates = [] as Array<State<number>>;
		this.observe("insert", (state, index) => {
			let indexState = stateify(index);
			indexStates.splice(index, 0, indexState);
			for (let i = index + 1; i < indexStates.length; i++) {
				indexStates[i].update(i);
			}
			let mapped = mapper(state, indexState);
			that.insert(index, mapped);
		});
		this.observe("remove", (state, index) => {
			indexStates.splice(index, 1);
			for (let i = index; i < indexStates.length; i++) {
				indexStates[i].update(i);
			}
			that.remove(index);
		});
		for (let index = 0; index < this.elements.length; index++) {
			let indexState = stateify(index);
			indexStates.splice(index, 0, indexState);
			let element = this.elements[index];
			let mapped = mapper(element, indexState);
			that.append(mapped);
		}
		return that;
	}

	mapValues<B extends Value>(mapper: ValueMapper<A, B>): ArrayState<B> {
		return this.mapStates((state, index) => state.compute((value) => mapper(value, index.value())));
	}

	remove(index: number): void {
		if (index < 0 || index >= this.elements.length) {
			throw new Error(`Expected index to be within bounds!`);
		}
		let element = this.elements[index];
		this.elements.splice(index, 1);
		element.unobserve("update", this.onElementUpdate);
		this.currentLength.update(this.elements.length);
		if (true) {
			this.notify("remove", element, index);
		}
		if (true) {
			this.notify("update", this);
		}
	}

	update(value: Array<A>): boolean {
		let updated = false;
		try {
			this.updating = true;
			let length = Math.min(this.elements.length, value?.length ?? 0);
			for (let index = 0; index < length; index++) {
				if (this.elements[index].update(value[index])) {
					updated = true;
				}
			}
			for (let index = this.elements.length - 1; index >= length; index--) {
				this.remove(index);
				updated = true;
			}
			for (let index = length; index < (value?.length ?? 0); index++) {
				this.append(value[index]);
				updated = true;
			}
		} finally {
			this.updating = false;
		}
		if (updated) {
			this.notify("update", this);
		}
		return updated;
	}

	vacate(): boolean {
		return this.update([]);
	}

	value(): Array<A> {
		let lastValue = [] as Array<A>;
		for (let index = 0; index < this.elements.length; index++) {
			lastValue.push(this.elements[index].value());
		}
		return lastValue;
	}
};

export type ObjectStateEvents<A extends Value> = AbstractStateEvents<A> & {

};

export class ObjectState<A extends RecordValue> extends AbstractState<A, ObjectStateEvents<A>> {
	protected members: States<A>;
	protected updating: boolean;

	protected onMemberUpdate = () => {
		if (!this.updating) {
			this.notify("update", this);
		}
	};

	constructor(members: States<A>) {
		super();
		this.members = { ...members };
		this.updating = false;
		for (let key in this.members) {
			this.members[key].observe("update", this.onMemberUpdate);
		}
	}

	member<B extends keyof A>(key: B, defaultValue?: A[B]): Exclude<States<A>[B], undefined> {
		let member = this.members[key] as Exclude<States<A>[B], undefined>;
		if (member == null) {
			this.members[key] = member = stateify(defaultValue) as any;
			this.members[key].observe("update", this.onMemberUpdate);
		}
		return member;
	}

	update(value: A): boolean {
		let updated = false;
		try {
			this.updating = true;
			for (let key in this.members) {
				let member = this.member(key);
				if (member.update(value?.[key] as any)) {
					updated = true;
				}
			}
			for (let key in value) {
				if (!(key in this.members)) {
					let member = this.member(key, value[key]);
					updated = true;
				}
			}
		} finally {
			this.updating = false;
		}
		if (updated) {
			this.notify("update", this);
		}
		return updated;
	}

	value(): A {
		let lastValue = {} as A;
		for (let key in this.members) {
			let member = this.member(key);
			let value = member.value();
			if (typeof value !== "undefined") {
				lastValue[key] = value;
			}
		}
		return lastValue;
	}
};

export function stateify<A extends Value>(value: A): State<A> {
	if (typeof value === "bigint") {
		return new PrimitiveState(value) as any;
	}
	if (typeof value === "boolean") {
		return new PrimitiveState(value) as any;
	}
	if (typeof value === "number") {
		return new PrimitiveState(value) as any;
	}
	if (typeof value === "string") {
		return new PrimitiveState(value) as any;
	}
	if (value === null) {
		return new PrimitiveState(value) as any;
	}
	if (typeof value === "undefined") {
		return new PrimitiveState(value) as any;
	}
	if (value instanceof Array) {
		let elements = [] as any;
		for (let index = 0; index < value.length; index++) {
			elements.push(stateify(value[index]));
		}
		return new ArrayState(elements) as any;
	}
	if (value instanceof Object && value.constructor === Object) {
		let members = {} as any;
		for (let key in value) {
			members[key] = stateify((value as any)[key]);
		}
		return new ObjectState(members) as any;
	}
	if (value instanceof Object) {
		return new ReferenceState(value) as any;
	}
	throw new Error(`Expected code to be unreachable!`);
};

export function computed<A extends Value[], B extends Value>(states: [...States<A>], computer: (...args: [...A]) => B): State<B> {
	let values = states.map((state) => state.value()) as [...A];
	let computed = stateify(computer(...values));
	for (let index = 0; index < states.length; index++) {
		let state = states[index];
		state.observe("update", (state) => {
			values[index] = state.value();
			computed.update(computer(...values));
		});
	}
	return computed;
};
