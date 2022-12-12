export declare abstract class OptionCodec<A> {
    protected constructor();
    abstract decode(value: string | undefined): A;
    abstract encode(option: A): string | undefined;
}
type OptionCodecTuple<V extends any[]> = {
    [K in keyof V]: OptionCodec<V[K]>;
};
export declare class PlainOptionCodec extends OptionCodec<string> {
    constructor();
    decode(value: string | undefined): string;
    encode(option: string): string | undefined;
}
export declare const Plain: PlainOptionCodec;
export declare class IntegerOptionCodec extends OptionCodec<number> {
    constructor();
    decode(value: string | undefined): number;
    encode(option: number): string | undefined;
}
export declare const Integer: IntegerOptionCodec;
export declare class BooleanOptionCodec extends OptionCodec<boolean> {
    constructor();
    decode(value: string | undefined): boolean;
    encode(option: boolean): string | undefined;
}
export declare const Boolean: BooleanOptionCodec;
export declare class UndefinedOptionCodec extends OptionCodec<undefined> {
    constructor();
    decode(value: string | undefined): undefined;
    encode(option: undefined): string | undefined;
}
export declare const Undefined: UndefinedOptionCodec;
export declare class UnionOptionCodec<A extends any[]> extends OptionCodec<A[number]> {
    protected codecs: OptionCodecTuple<[...A]>;
    constructor(...codecs: OptionCodecTuple<[...A]>);
    decode(value: string | undefined): A[number];
    encode(option: A[number]): string | undefined;
}
export declare const Union: {
    of<A extends any[]>(...codecs: OptionCodecTuple<A>): UnionOptionCodec<A>;
};
export {};
