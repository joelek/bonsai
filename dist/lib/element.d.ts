import { ArrayState, State, CancellationToken, Value } from "./state";
export declare type Attribute = Value | State<Value>;
export declare type Attributes = {
    [key: string]: Attribute;
};
export declare type FunctionalElementListener<A extends Event, B extends Element> = (event: A, element: B) => void;
export declare type FunctionalElementEventMap<A> = {
    [B in keyof A]: Event;
};
export declare type FunctionalElementListeners<A extends FunctionalElementEventMap<A>, B extends Element> = {
    [C in `on${keyof A & string}`]?: C extends `on${infer D extends keyof A & string}` ? FunctionalElementListener<A[D], FunctionalElement<A, B>> : never;
};
export declare class FunctionalElementImplementation<A extends FunctionalElementEventMap<A>> extends Element {
    protected bindings?: {
        [key: string | symbol]: Array<CancellationToken | undefined> | undefined;
    };
    protected unbind(key: string | symbol): void;
    attribute(key: string, value?: Attribute): this;
    listener<B extends keyof A & string>(type: `on${B}`, listener?: FunctionalElementListener<A[B], this> | undefined): this;
    nodes<A extends Value | Node>(items: ArrayState<A> | Array<Value | Node | State<Value | Node>>): this;
    process(callback: (element: this) => void): this;
}
export declare type FunctionalElement<A extends FunctionalElementEventMap<A>, B extends Element> = FunctionalElementImplementation<A> & B;
export declare type FunctionalElementFactory<A extends FunctionalElementEventMap<A>, B extends Element> = (classAttribute?: Attribute) => FunctionalElement<A, B>;
export declare type Namespace = "http://www.w3.org/1999/xhtml" | "http://www.w3.org/2000/svg";
export declare function makeFunctionalElementFactory<A extends FunctionalElementEventMap<A>, B extends Element>(namespace: Namespace, tag: string): FunctionalElementFactory<A, B>;
export declare type FunctionalHTMLElement<A extends HTMLElement> = FunctionalElement<HTMLElementEventMap, A>;
export declare type FunctionalHTMLElementFactory<A extends HTMLElement> = FunctionalElementFactory<HTMLElementEventMap, A>;
export declare type FunctionalHTMLElementFactories = {
    [A in keyof HTMLElementTagNameMap]: FunctionalHTMLElementFactory<HTMLElementTagNameMap[A]>;
};
export declare const html: FunctionalHTMLElementFactories;
export declare type FunctionalSVGElement<A extends SVGElement> = FunctionalElement<SVGElementEventMap, A>;
export declare type FunctionalSVGElementFactory<A extends SVGElement> = FunctionalElementFactory<SVGElementEventMap, A>;
export declare type FunctionalSVGElementFactories = {
    [A in keyof SVGElementTagNameMap]: FunctionalSVGElementFactory<SVGElementTagNameMap[A]>;
};
export declare const svg: FunctionalSVGElementFactories;
