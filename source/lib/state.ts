export type TupleRecord<A extends TupleRecord<A>> = { [C in keyof A]: any[]; };

export type PrimitiveValue = bigint | boolean | number | string | null | undefined;

export type ReferenceValue = Object;

export type Value = PrimitiveValue | ReferenceValue | Value[] | { [key: string]: Value; };

export type ArrayValue = Value[];

export type RecordValue = { [key: string]: Value; };

export type StateMapper<A extends Value, B extends Value> = (state: State<A>) => B | State<B>;

export type ValueMapper<A extends Value, B extends Value> = (value: A) => B;

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
		let computed = state(computer(this.value()));
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

	protected onElementUpdate = () => {
		if (!this.updating) {
			this.notify("update", this);
		}
	};

	constructor(elements: Array<State<A>>) {
		super()
		this.elements = [ ...elements ];
		this.updating = false;
		for (let index = 0; index < this.elements.length; index++) {
			this.elements[index].observe("update", this.onElementUpdate);
		}
	}

	[Symbol.iterator](): Iterator<State<A>> {
		return this.elements[Symbol.iterator]();
	}

	append(item: A | State<A>): void {
		this.insert(this.elements.length, item);
	}


	element(index: number): State<A> {
		if (index < 0 || index >= this.elements.length) {
			throw new Error(`Expected index to be within bounds!`);
		}
		return this.elements[index];
	}

	insert(index: number, item: A | State<A>): void {
		if (index < 0 || index > this.elements.length) {
			throw new Error(`Expected index to be within bounds!`);
		}
		let element = item instanceof AbstractState ? item : state(item);
		this.elements.splice(index, 0, element);
		element.observe("update", this.onElementUpdate);
		this.notify("insert", element, index);
		this.notify("update", this);
	}

	length(): number {
		return this.elements.length;
	}

	mapStates<B extends Value>(mapper: StateMapper<A, B>): ArrayState<B> {
		let that = state([] as Array<B>);
		this.observe("insert", (state, index) => {
			let mapped = mapper(state);
			that.insert(index, mapped);
		});
		this.observe("remove", (state, index) => {
			that.remove(index);
		});
		for (let index = 0; index < this.elements.length; index++) {
			let element = this.elements[index];
			let mapped = mapper(element);
			that.append(mapped);
		}
		return that;
	}

	mapValues<B extends Value>(mapper: ValueMapper<A, B>): ArrayState<B> {
		return this.mapStates((state) => state.compute((value) => mapper(value)));
	}

	remove(index: number): void {
		if (index < 0 || index >= this.elements.length) {
			throw new Error(`Expected index to be within bounds!`);
		}
		let element = this.elements[index];
		this.elements.splice(index, 1);
		element.unobserve("update", this.onElementUpdate);
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
			let length = Math.min(this.elements.length, value.length);
			for (let index = 0; index < length; index++) {
				if (this.elements[index].update(value[index])) {
					updated = true;
				}
			}
			for (let index = this.elements.length - 1; index >= length; index--) {
				this.remove(index);
				updated = true;
			}
			for (let index = length; index < value.length; index++) {
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

	protected onMemberUpdate = () => {
		this.notify("update", this);
	};

	constructor(members: States<A>) {
		super();
		this.members = { ...members };
		for (let key in this.members) {
			this.members[key].observe("update", this.onMemberUpdate);
		}
	}

	member<B extends keyof A>(key: B): States<A>[B] {
		return this.members[key];
	}

	update(value: A): boolean {
		let updated = false;
		for (let key in value) {
			if (this.members[key].update(value[key])) {
				updated = true;
			}
		}
		if (updated) {
			this.notify("update", this);
		}
		return updated;
	}

	value(): A {
		let lastValue = {} as A;
		for (let key in this.members) {
			lastValue[key] = this.members[key].value();
		}
		return lastValue;
	}
};

export function state<A extends Value>(value: A): State<A> {
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
	if (value === undefined) {
		return new PrimitiveState(value) as any;
	}
	if (value instanceof Array) {
		let elements = [] as any;
		for (let index = 0; index < value.length; index++) {
			elements.push(state(value[index]));
		}
		return new ArrayState(elements) as any;
	}
	if (value instanceof Object && value.constructor === Object) {
		let members = {} as any;
		for (let key in value) {
			members[key] = state((value as any)[key]);
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
	let computed = state(computer(...values));
	for (let index = 0; index < states.length; index++) {
		let state = states[index];
		state.observe("update", (state) => {
			values[index] = state.value();
			computed.update(computer(...values));
		});
	}
	return computed;
};
