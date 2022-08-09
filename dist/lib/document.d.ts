import { ArrayState, State, CancellationToken, Value } from "./state";
declare type Attribute = Value | State<Value>;
declare type FunctionalElementListener<A extends Event, B extends Element> = (event: A, element: B) => void;
declare type FunctionalElementEventMap<A> = {
    [B in keyof A]: Event;
};
declare class FunctionalElementImplementation<A extends FunctionalElementEventMap<A>> extends Element {
    protected bindings?: {
        [key: string | symbol]: Array<CancellationToken | undefined> | undefined;
    };
    protected unbind(key: string | symbol): void;
    attribute(key: string, value?: Attribute): this;
    listener<B extends keyof A & string>(type: `on${B}`, listener?: FunctionalElementListener<A[B], this> | undefined): this;
    nodes<A extends Value | Node>(items: ArrayState<A> | Array<Value | Node | State<Value | Node>>): this;
    process(callback: (element: this) => void): this;
}
declare type FunctionalElement<A extends FunctionalElementEventMap<A>, B extends Element> = FunctionalElementImplementation<A> & B;
declare type FunctionalElementFactory<A extends FunctionalElementEventMap<A>, B extends Element> = (classAttribute?: Attribute) => FunctionalElement<A, B>;
declare type FunctionalHTMLElementFactory<A extends HTMLElement> = FunctionalElementFactory<HTMLElementEventMap, A>;
declare type FunctionalHTMLElementFactories = {
    [A in keyof HTMLElementTagNameMap]: FunctionalHTMLElementFactory<HTMLElementTagNameMap[A]>;
};
export declare const html: FunctionalHTMLElementFactories;
declare type FunctionalSVGElementFactory<A extends SVGElement> = FunctionalElementFactory<SVGElementEventMap, A>;
declare type FunctionalSVGElementFactories = {
    [A in keyof SVGElementTagNameMap]: FunctionalSVGElementFactory<SVGElementTagNameMap[A]>;
};
export declare const svg: FunctionalSVGElementFactories;
export {};
