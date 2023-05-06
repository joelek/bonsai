import { ArrayState, State, CancellationToken, Value, RecordValue } from "./state";
export type Attribute<A extends Value> = A | State<A>;
export type Attributes<A extends RecordValue> = State<A> | {
    [B in keyof A]: A[B] extends RecordValue ? Attributes<A[B]> : Attribute<A[B]>;
};
export type AttributeRecord = {
    [key: string]: Attribute<Value>;
};
export type AttributeRecordMapper = (attributes: AttributeRecord) => AttributeRecord;
export type AttributeArray = Attribute<Value>[];
export type AttributeArrayMapper = (attributes: AttributeArray) => AttributeArray;
export type Children = Array<ArrayState<Node | Value> | Value | Node | State<Value | Node>>;
export type FunctionalElementListener<A extends Event, B extends Element> = (event: A, element: B) => void;
export type FunctionalElementEventMap<A> = {
    [B in keyof A]: Event;
};
export declare function serializeValue(value: Value): string;
export declare function createNode(value: Value | Node): Node;
export declare function parseClass(value: string): Array<string>;
export declare function serializeClass(value: Value): string | undefined;
export declare function parseStyle(value: string): Record<string, string>;
export declare function serializeStyle(value: Value): string | undefined;
declare const CLASS: unique symbol;
declare const STYLE: unique symbol;
export declare class FunctionalElementImplementation<A extends FunctionalElementEventMap<A>> extends Element {
    protected [CLASS]?: AttributeArray;
    protected [STYLE]?: AttributeRecord;
    protected bindings?: {
        [key: string | symbol]: Array<CancellationToken | undefined> | undefined;
    };
    protected unbind(key: string | symbol): void;
    attribute<A extends string>(key: A extends "class" | "style" ? never : A): string | undefined;
    attribute(key: "class"): AttributeArray;
    attribute(key: "style"): AttributeRecord;
    attribute<A extends string>(key: A extends "class" | "style" ? never : A, attribute: Attribute<Value>): this;
    attribute<A extends AttributeArray>(key: "class", attribute: A | AttributeArrayMapper | undefined): this;
    attribute<A extends AttributeRecord>(key: "style", attribute: A | AttributeRecordMapper | undefined): this;
    listener<B extends keyof A & string>(type: `on${B}`, listener: FunctionalElementListener<A[B], this> | undefined): this;
    nodes(...children: Children): this;
    process(callback: (element: this) => void): this;
    setAttribute(key: string, value: string): void;
}
export type FunctionalElement<A extends FunctionalElementEventMap<A>, B extends Element> = FunctionalElementImplementation<A> & B;
export type FunctionalElementFactory<A extends FunctionalElementEventMap<A>, B extends Element> = (...children: Children) => FunctionalElement<A, B>;
export type Namespace = "http://www.w3.org/1999/xhtml" | "http://www.w3.org/2000/svg";
export declare function makeFunctionalElementFactory<A extends FunctionalElementEventMap<A>, B extends Element>(namespace: Namespace, tag: string): FunctionalElementFactory<A, B>;
export type FunctionalHTMLElement<A extends HTMLElement> = FunctionalElement<HTMLElementEventMap, A>;
export type FunctionalHTMLElementFactory<A extends HTMLElement> = FunctionalElementFactory<HTMLElementEventMap, A>;
export type FunctionalHTMLElementFactories = {
    [A in keyof HTMLElementTagNameMap]: FunctionalHTMLElementFactory<HTMLElementTagNameMap[A]>;
};
export declare const html: FunctionalHTMLElementFactories;
export type FunctionalSVGElement<A extends SVGElement> = FunctionalElement<SVGElementEventMap, A>;
export type FunctionalSVGElementFactory<A extends SVGElement> = FunctionalElementFactory<SVGElementEventMap, A>;
export type FunctionalSVGElementFactories = {
    [A in keyof SVGElementTagNameMap]: FunctionalSVGElementFactory<SVGElementTagNameMap[A]>;
};
export declare const svg: FunctionalSVGElementFactories;
export {};
