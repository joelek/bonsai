import { ArrayState, State, CancellationToken, Value } from "./state";
export declare type Attribute = Value | State<Value>;
export declare type Attributes = {
    [key: string]: Attribute;
};
export declare type Children = Array<ArrayState<Node | Value> | Value | Node | State<Value | Node>>;
export declare type FunctionalElementListener<A extends Event, B extends Element> = (event: A, element: B) => void;
export declare type FunctionalElementEventMap<A> = {
    [B in keyof A]: Event;
};
export declare function serializeValue(value: Value): string;
export declare function createNode(value: Value | Node): Node;
export declare function parseClass(value: string): Array<string>;
export declare function serializeClass(value: Value): string;
export declare function parseStyle(value: string): Record<string, string>;
export declare function serializeStyle(value: Value): string;
export declare class FunctionalElementImplementation<A extends FunctionalElementEventMap<A>> extends Element {
    protected bindings?: {
        [key: string | symbol]: Array<CancellationToken | undefined> | undefined;
    };
    protected unbind(key: string | symbol): void;
    attribute<A extends string>(key: A extends "class" | "style" ? never : A): string | undefined;
    attribute(key: "class"): Array<string> | undefined;
    attribute(key: "style"): Record<string, string> | undefined;
    attribute<A extends string>(key: A extends "class" | "style" ? never : A, value: Attribute): this;
    attribute<A extends Array<Value>>(key: "class", value: A | State<A> | undefined): this;
    attribute<A extends Record<string, Value>>(key: "style", value: A | State<A> | undefined): this;
    listener<B extends keyof A & string>(type: `on${B}`, listener: FunctionalElementListener<A[B], this> | undefined): this;
    nodes(...children: Children): this;
    process(callback: (element: this) => void): this;
    setAttribute(key: string, value: string): void;
}
export declare type FunctionalElement<A extends FunctionalElementEventMap<A>, B extends Element> = FunctionalElementImplementation<A> & B;
export declare type FunctionalElementFactory<A extends FunctionalElementEventMap<A>, B extends Element> = (...children: Children) => FunctionalElement<A, B>;
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
