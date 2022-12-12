import { OptionCodec } from "./codecs";
import { RecordValue, State } from "./state";
export type ExpansionOf<A> = A extends infer B ? {
    [C in keyof B]: B[C];
} : never;
export type QueryParameter = {
    key: string;
    value: string;
};
export type QueryParameters = Array<QueryParameter>;
export type Route = {
    paths: Array<string>;
    parameters: QueryParameters;
};
export type PageFactory<A extends RecordValue> = {
    codec: RouteCodec<A>;
    factory: (options: State<A>, title: State<string>, router: Router<any>) => Element;
};
export type PageOptions<A extends PageOptions<A>> = {
    [B in keyof A]: A[B] extends RecordValue ? A[B] : never;
};
export type EmptyPageOptions<A extends PageOptions<A>> = {
    [B in keyof A & string]: {} extends A[B] ? B : never;
}[keyof A & string];
export type PageFactories<A extends PageOptions<A>> = {
    [B in keyof A]: A[B] extends RecordValue ? PageFactory<A[B]> : never;
};
export declare function pathify(string: string): string;
export declare function getUrlFromRoute(route: Route): string;
export type RouteCodec<A> = {
    decode(route: Route): A;
    encode(options: A): Route;
};
export type HistoryState = {
    route: Route;
    index: number;
};
export type CacheEntry = {
    element?: Element;
    route?: Route;
    title: string;
};
export declare function updateHistoryState(historyState: HistoryState): void;
export declare function getBaseHref(): string;
export declare function getInitialCache(): Array<CacheEntry>;
export declare function getInitialIndex(): number;
export declare function getInitialRoute(): Route;
export declare function getInitialState(): HistoryState;
export type ParsedRoute = {
    page: string;
    options: RecordValue;
};
export declare class Router<A extends PageOptions<A>> {
    protected factories: PageFactories<A>;
    protected defaultPage: string;
    protected documentTitle: string;
    protected cache: State<Array<CacheEntry>>;
    protected state: State<HistoryState>;
    readonly element: State<Element | undefined>;
    readonly url: State<string | undefined>;
    protected onPopState: (event: PopStateEvent) => void;
    protected parseRoute(route: Route): ParsedRoute;
    constructor(factories: PageFactories<A>, defaultPage: EmptyPageOptions<A>);
    navigate<B extends keyof A>(page: B, options: A[B]): boolean;
}
export declare class RouteCodecImplementation<A extends {}> implements RouteCodec<A> {
    protected pathCodecs: Array<{
        key?: string;
        codec: OptionCodec<any>;
    }>;
    protected parameterCodecs: Record<string, OptionCodec<any>>;
    protected assertKeyAvailable(key: string): void;
    protected withDynamicPath<B extends string, C extends any>(key: B, codec: OptionCodec<C>): RouteCodecImplementation<ExpansionOf<A & {
        [key in B]: C;
    }>>;
    protected withStaticPath(value: string): RouteCodecImplementation<A>;
    constructor(pathCodecs: Array<{
        key?: string;
        codec: OptionCodec<any>;
    }>, parameterCodecs: Record<string, OptionCodec<any>>);
    decode(route: Route): A;
    encode(options: A): Route;
    optional<B extends string, C extends any>(key: B, codec: OptionCodec<C>): RouteCodecImplementation<ExpansionOf<A & {
        [key in B]: C | undefined;
    }>>;
    required<B extends string, C extends any>(key: B, codec: OptionCodec<C>): RouteCodecImplementation<ExpansionOf<A & {
        [key in B]: C;
    }>>;
    path(value: string): RouteCodecImplementation<A>;
    path<B extends string, C extends any>(key: B, codec: OptionCodec<C>): RouteCodecImplementation<ExpansionOf<A & {
        [key in B]: C;
    }>>;
}
export declare const codec: RouteCodecImplementation<{}>;
