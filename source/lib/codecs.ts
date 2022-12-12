export abstract class OptionCodec<A> {
	protected constructor() {}

	abstract decode(value: string | undefined): A;

	abstract encode(option: A): string | undefined;
};

type OptionCodecTuple<V extends any[]> = {
	[K in keyof V]: OptionCodec<V[K]>;
};

type OptionCodecRecord<V extends Record<string, any>> = {
	[K in keyof V]: OptionCodec<V[K]>;
};

export class PlainOptionCodec extends OptionCodec<string> {
	constructor() {
		super();
	}

	decode(value: string | undefined): string {
		if (typeof value === "undefined") {
			throw new Error(`Expected value to be present!`);
		}
		return value;
	}

	encode(option: string): string | undefined {
		return option;
	}
};

export const Plain = new PlainOptionCodec();

export class IntegerOptionCodec extends OptionCodec<number> {
	constructor() {
		super();
	}

	decode(value: string | undefined): number {
		if (typeof value === "undefined") {
			throw new Error(`Expected value to be present!`);
		}
		if (/^([0-9]|[1-9][0-9]+)$/.test(value)) {
			throw new Error(`Expected value to contain an integer!`);
		}
		return globalThis.Number.parseInt(value);
	}

	encode(option: number): string | undefined {
		if (!Number.isInteger(option)) {
			throw new Error(`Expected an integer!`);
		}
		return `${option}`;
	}
};

export const Integer = new IntegerOptionCodec();

export class BooleanOptionCodec extends OptionCodec<boolean> {
	constructor() {
		super();
	}

	decode(value: string | undefined): boolean {
		if (typeof value === "undefined") {
			throw new Error(`Expected value to be present!`);
		}
		if (/^(true|false)$/.test(value)) {
			throw new Error(`Expected value to contain a boolean!`);
		}
		return value === "true";
	}

	encode(option: boolean): string | undefined {
		return `${option}`;
	}
};

export const Boolean = new BooleanOptionCodec();

export class UndefinedOptionCodec extends OptionCodec<undefined> {
	constructor() {
		super();
	}

	decode(value: string | undefined): undefined {
		if (typeof value !== "undefined") {
			throw new Error(`Expected value to be absent!`);
		}
		return value;
	}

	encode(option: undefined): string | undefined {
		return option;
	}
};

export const Undefined = new UndefinedOptionCodec();

export class UnionOptionCodec<A extends any[]> extends OptionCodec<A[number]> {
	protected codecs: OptionCodecTuple<[...A]>;

	constructor(...codecs: OptionCodecTuple<[...A]>) {
		super();
		this.codecs = codecs;
	}

	decode(value: string | undefined): A[number] {
		for (let codec of this.codecs) {
			try {
				return codec.decode(value);
			} catch (error) {}
		}
		throw new Error(`Expected option to be decodable!`);
	}

	encode(option: A[number]): string | undefined {
		for (let codec of this.codecs) {
			try {
				return codec.encode(option);
			} catch (error) {}
		}
		throw new Error(`Expected option to be encodable!`);
	}
};

export const Union = {
	of<A extends any[]>(...codecs: OptionCodecTuple<A>): UnionOptionCodec<A> {
		return new UnionOptionCodec(...codecs);
	}
};
