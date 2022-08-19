type Mutable<A> = {
	-readonly [B in keyof A]: A[B];
};

export enum DOMExceptionType {
	INDEX_SIZE_ERR = 1,
	DOMSTRING_SIZE_ERR = 2,
	HIERARCHY_REQUEST_ERR = 3,
	WRONG_DOCUMENT_ERR = 4,
	INVALID_CHARACTER_ERR = 5,
	NO_DATA_ALLOWED_ERR = 6,
	NO_MODIFICATION_ALLOWED_ERR = 7,
	NOT_FOUND_ERR = 8,
	NOT_SUPPORTED_ERR = 9,
	INUSE_ATTRIBUTE_ERR = 10,
	INVALID_STATE_ERR = 11,
	SYNTAX_ERR = 12,
	INVALID_MODIFICATION_ERR = 13,
	NAMESPACE_ERR = 14,
	INVALID_ACCESS_ERR = 15,
	VALIDATION_ERR = 16,
	TYPE_MISMATCH_ERR = 17,
	SECURITY_ERR = 18,
	NETWORK_ERR = 19,
	ABORT_ERR = 20,
	URL_MISMATCH_ERR = 21,
	QUOTA_EXCEEDED_ERR = 22,
	TIMEOUT_ERR = 23,
	INVALID_NODE_TYPE_ERR = 24,
	DATA_CLONE_ERR = 25
};

export enum DOMExceptionNames {
	Error = 0,
	IndexSizeError = 1,
	DOMStringSizeError = 2,
	HierarchyRequestError = 3,
	WrongDocumentError = 4,
	InvalidCharacterError = 5,
	NoDataAllowedError = 6,
	NoModificationAllowedError = 7,
	NotFoundError = 8,
	NotSupportedError = 9,
	InvalidStateError = 11,
	InUseAttributeError = 10,
	SyntaxError = 12,
	InvalidModificationError = 13,
	NamespaceError = 14,
	InvalidAccessError = 15,
	ValidationError = 16,
	TypeMismatchError = 17,
	SecurityError = 18,
	NetworkError = 19,
	AbortError = 20,
	URLMismatchError = 21,
	QuotaExceededError = 22,
	TimeoutError = 23,
	InvalidNodeTypeError = 24,
	DataCloneError = 25
};

// @ts-ignore
export class DOMExceptionImplementation implements DOMException {
	protected $message: string;
	protected $name: keyof typeof DOMExceptionNames;
	protected $code: number;

	constructor(message?: string, name?: keyof typeof DOMExceptionNames) {
		this.$message = message ?? "";
		this.$name = name ?? "Error";
		this.$code = DOMExceptionNames[this.$name] ?? 0;
	}

	get code(): number {
		return this.$code;
	}

	get message(): string {
		return this.$message;
	}

	get name(): string {
		return this.$name;
	}
};

// TODO: Expose codes

// @ts-ignore
globalThis.DOMException = DOMExceptionImplementation;

export class EventTargetImplementation implements Partial<EventTarget> {
	constructor() {}
};

globalThis.EventTarget = EventTargetImplementation as any;

export class NodeImplementation extends EventTargetImplementation implements Partial<Node> {
	protected $ownerDocument: Document | null;

	constructor(ownerDocument: Document | null) {
		super();
		this.$ownerDocument = ownerDocument;
	}

	get ownerDocument(): Document | null {
		return this.$ownerDocument;
	}
};

globalThis.Node = NodeImplementation as any;

export class AttrImplementation extends NodeImplementation implements Partial<Attr> {
	protected $namespaceURI: string | null;
	protected $prefix: string | null;
	protected $localName: string;
	protected $name: string;
	protected $value: string;
	protected $ownerElement: Element | null;

	constructor(ownerDocument: Document, namespaceURI: string | null, prefix: string | null, localName: string, name: string, value: string) {
		super(ownerDocument);
		this.$namespaceURI = namespaceURI;
		this.$prefix = prefix;
		this.$localName = localName;
		this.$name = name;
		this.$value = value;
		this.$ownerElement = null;
	}

	get localName(): string {
		return this.$localName;
	}

	get name(): string {
		return this.$name;
	}

	get namespaceURI(): string | null {
		return this.$namespaceURI;
	}

	get ownerDocument(): Document {
		return super.ownerDocument as Document;
	}

	get ownerElement(): Element | null {
		return this.$ownerElement;
	}

	// NB: This is not compliant with the specification.
	set ownerElement(ownerElement: Element | null) {
		this.$ownerElement = ownerElement;
	}

	get prefix(): string | null {
		return this.$prefix;
	}

	get specified(): boolean {
		return true;
	}

	get value(): string {
		return this.$value;
	}

	set value(value: string) {
		this.$value = value;
	}

	static createFromLocalName(document: Document, localName: string): Attr {
		let namespaceURI = null;
		let prefix = null;
		let name = localName;
		let value = "";
		return new this(document, namespaceURI, prefix, localName, name, value) as any;
	}
};

globalThis.Attr = AttrImplementation as any;

export class TextImplementation extends NodeImplementation implements Partial<Text> {
	protected $data: string;

	constructor(ownerDocument: Document, data: string) {
		super(ownerDocument);
		this.$data = data;
	}

	get ownerDocument(): Document {
		return this.$ownerDocument as Document;
	}

	isEqualNode(otherNode: Node | null): boolean {
		if (!(otherNode instanceof TextImplementation)) {
			return false;
		}
		if (!(this.$data === otherNode.$data)) {
			return false;
		}
		return true;
	}
};

globalThis.Text = TextImplementation as any;

export class NodeListImplementation implements NodeList {
	protected $nodes: Array<Node>;

	protected constructor(nodes: Array<Node>, live: boolean) {
		this.$nodes = live ? nodes : [...nodes];
	}

	[index: number]: Node;

	[Symbol.iterator](): Iterator<Node> {
		return this.$nodes[Symbol.iterator]();
	}

	get length(): number {
		return this.$nodes.length;
	}

	entries(): Iterator<[number, Node]> {
		return this.$nodes.entries();
	}

	forEach(callback: (value: Node, index: number, nodeList: NodeList) => void, thisArg?: any): void {
		return this.$nodes.forEach((value, index) => callback(value, index, this), thisArg);
	}

	item(index: number): Node | null {
		return this.$nodes[index] ?? null;
	}

	keys(): Iterator<number> {
		return this.$nodes.keys();
	}

	values(): Iterator<Node> {
		return this.$nodes.values();
	}

	static create(nodes: Array<Node>, live: boolean): NodeListImplementation {
		return new Proxy(new NodeListImplementation(nodes, live), {
			get(target, property, receiver) {
				if (typeof property === "number") {
					return target.$nodes[property];
				}
				return target[property as keyof NodeListImplementation];
			}
		});
	}
};

globalThis.NodeList = NodeListImplementation as any;

export class NamedNodeMapImplementation implements NamedNodeMap {
	protected $element: Element;
	protected $attributes: Array<Attr>;

	protected findNamedItemIndex(qualifiedName: string): number {
		if (this.$element.namespaceURI === "http://www.w3.org/1999/xhtml" && this.$element.ownerDocument.doctype?.name === "html") {
			qualifiedName = qualifiedName.replace(/([A-Z]+)/g, (substring) => substring.toLowerCase());
		}
		return this.$attributes.findIndex((attribute) => attribute.name === qualifiedName);
	}

	protected findNamedItemIndexNS(namespaceURI: string | null, localName: string): number {
		namespaceURI = namespaceURI || null;
		return this.$attributes.findIndex((attribute) => attribute.namespaceURI === namespaceURI && attribute.localName === localName);
	}

	protected constructor(element: Element, attributes: Array<Attr>) {
		this.$element = element;
		this.$attributes = attributes;
	}

	[index: number]: Attr;
	//[qualifiedName: string]: Attr | null;

	get length(): number {
		return this.$attributes.length;
	}

	getNamedItem(qualifiedName: string): Attr | null {
		return this.$attributes[this.findNamedItemIndex(qualifiedName)] ?? null;
	}

	getNamedItemNS(namespaceURI: string | null, localName: string): Attr | null {
		return this.$attributes[this.findNamedItemIndexNS(namespaceURI, localName)] ?? null;
	}

	item(index: number): Attr | null {
		return this.$attributes[index] ?? null;
	}

	removeNamedItem(qualifiedName: string): Attr {
		let index = this.findNamedItemIndex(qualifiedName);
		let attribute = (this.$attributes[index] ?? null) as Attr | null;
		if (attribute === null) {
			throw new DOMExceptionImplementation(undefined, "NotFoundError");
		}
		// TODO: Handle attribute changes.
		this.$attributes.splice(index, 1);
		(attribute as Mutable<Attr>).ownerElement = null;
		return attribute;
	}

	removeNamedItemNS(namespaceURI: string | null, localName: string): Attr {
		let index = this.findNamedItemIndexNS(namespaceURI, localName);
		let attribute = (this.$attributes[index] ?? null) as Attr | null;
		if (attribute === null) {
			throw new DOMExceptionImplementation(undefined, "NotFoundError");
		}
		// TODO: Handle attribute changes.
		this.$attributes.splice(index, 1);
		(attribute as Mutable<Attr>).ownerElement = null;
		return attribute;
	}

	setNamedItem(attribute: Attr): Attr | null {
		if (attribute.ownerElement !== null && attribute.ownerElement !== this.$element) {
			throw new DOMExceptionImplementation(undefined, "InUseAttributeError");
		}
		let index = this.findNamedItemIndex(attribute.name);
		let oldAttribute = (this.$attributes[index] ?? null) as Attr | null;
		if (oldAttribute === attribute) {
			return attribute;
		}
		if (oldAttribute !== null) {
			// TODO: Handle attribute changes.
			this.$attributes.splice(index, 1, attribute);
			(attribute as Mutable<Attr>).ownerElement = this.$element;
			(oldAttribute as Mutable<Attr>).ownerElement = null;
		} else {
			// TODO: Handle attribute changes.
			this.$attributes.push(attribute);
			(attribute as Mutable<Attr>).ownerElement = this.$element;
		}
		return oldAttribute;
	}

	setNamedItemNS(attribute: Attr): Attr | null {
		if (attribute.ownerElement !== null && attribute.ownerElement !== this.$element) {
			throw new DOMExceptionImplementation(undefined, "InUseAttributeError");
		}
		let index = this.findNamedItemIndexNS(attribute.namespaceURI, attribute.localName);
		let oldAttribute = (this.$attributes[index] ?? null) as Attr | null;
		if (oldAttribute === attribute) {
			return attribute;
		}
		if (oldAttribute !== null) {
			// TODO: Handle attribute changes.
			this.$attributes.splice(index, 1, attribute);
			(attribute as Mutable<Attr>).ownerElement = this.$element;
			(oldAttribute as Mutable<Attr>).ownerElement = null;
		} else {
			// TODO: Handle attribute changes.
			this.$attributes.push(attribute);
			(attribute as Mutable<Attr>).ownerElement = this.$element;
		}
		return oldAttribute;
	}

	static create(element: Element, attributes: Array<Attr>): NamedNodeMapImplementation {
		return new Proxy(new NamedNodeMapImplementation(element, attributes), {
			get(target, property, receiver) {
				if (typeof property === "number") {
					return target.$attributes[property];
				}
				if (typeof property === "string" && !(property in target)) {
					return target.getNamedItem(property);
				}
				return target[property as keyof NamedNodeMapImplementation];
			}
		});
	}
};

globalThis.NamedNodeMap = NamedNodeMapImplementation as any;

export class ElementImplementation extends NodeImplementation implements Partial<Element> {
	protected $namespaceURI: string | null;
	protected $qualifiedName: string;
	protected $attributesArray: Array<Attr>;
	protected $attributes: NamedNodeMapImplementation;
	protected $childNodesArray: Array<Node>; // TODO: Move to NodeImplementation.
	protected $childNodes: NodeList; // TODO: Move to NodeImplementation.

	constructor(ownerDocument: Document, namespaceURI: string | null, qualifiedName: string) {
		super(ownerDocument);
		this.$namespaceURI = namespaceURI;
		this.$qualifiedName = qualifiedName;
		this.$attributesArray = [];
		this.$attributes = NamedNodeMapImplementation.create(this as any, this.$attributesArray);
		this.$childNodesArray = [];
		this.$childNodes = NodeListImplementation.create(this.$childNodesArray, true);
	}

	get ownerDocument(): Document {
		return this.$ownerDocument as Document;
	}

	get attributes(): NamedNodeMap {
		return this.$attributes;
	}

	get childNodes(): NodeListOf<ChildNode> {
		return this.$childNodes as NodeListOf<ChildNode>;
	}

	getAttribute(qualifiedName: string): string | null {
		let attribute = this.$attributes.getNamedItem(qualifiedName);
		if (attribute == null) {
			return null;
		}
		return attribute.value;
	}

	getAttributeNS(namespaceURL: string | null, localName: string): string | null {
		let attribute = this.$attributes.getNamedItemNS(namespaceURL, localName);
		if (attribute == null) {
			return null;
		}
		return attribute.value;
	}

	removeAttribute(qualifiedName: string): void {
		let attribute = this.$attributes.getNamedItemNS(this.$namespaceURI, qualifiedName);
		if (attribute == null) {
			return;
		}
		let index = this.$attributesArray.indexOf(attribute);
		if (index >= 0) {
			this.$attributesArray.splice(index, 1);
		}
	}

	setAttribute(qualifiedName: string, value: string): void {
		// TODO: Assert that qualifiedName matches Name production from XML standard.
		if (false) {
			throw new DOMExceptionImplementation(undefined, "InvalidCharacterError");
		}
		// TODO: Generalize qualifiedName conversion.
		if (this.$namespaceURI === "http://www.w3.org/1999/xhtml" && this.$ownerDocument?.doctype?.name === "html") {
			qualifiedName = qualifiedName.replace(/([A-Z]+)/g, (substring) => substring.toLowerCase());
		}
		let attribute = this.$attributes.getNamedItem(qualifiedName);
		if (attribute === null) {
			attribute = this.ownerDocument.createAttribute(qualifiedName);
			attribute.value = value;
		}
		this.$attributes.setNamedItem(attribute);
	}

	setAttributeNS(namespaceURL: string | null, qualifiedName: string, value: string): void {
		namespaceURL = namespaceURL || null;
		// TODO: Assert that qualifiedName matches Name production from XML standard.
		if (false) {
			throw new DOMExceptionImplementation(undefined, "InvalidCharacterError");
		}
		let prefix: string | null = null;
		let localName = qualifiedName;
		throw "Not done";
	}

	appendChild<T extends Node>(node: T): T {
		this.$childNodesArray.push(node);
		return node;
	}

	replaceChild<T extends Node>(node: Node, child: T): T {
		let index = this.$childNodesArray.indexOf(child);
		if (index >= 0) {
			this.$childNodesArray.splice(index, 1, node);
		}
		return child;
	}

	insertBefore<T extends Node>(node: T, child: Node | null): T {
		let index = child == null ? this.$childNodesArray.length : this.$childNodesArray.indexOf(child);
		if (index >= 0) {
			this.$childNodesArray.splice(index, 0, node);
		}
		return node;
	}

	isEqualNode(otherNode: Node | null): boolean {
		if (!(otherNode instanceof ElementImplementation)) {
			return false;
		}
		if (!(this.$namespaceURI === otherNode.$namespaceURI)) {
			return false;
		}
		if (!(this.$qualifiedName === otherNode.$qualifiedName)) {
			return false;
		}
		// TODO: Attributes
		// TODO: Children
		return true;
	}
};

globalThis.Element = ElementImplementation as any;

export class HTMLElementImplementation extends ElementImplementation implements Partial<HTMLElement> {
	constructor(ownerDocument: Document, qualifiedName: string) {
		super(ownerDocument, "http://www.w3.org/1999/xhtml", qualifiedName);
	}
};

globalThis.HTMLElement = HTMLElementImplementation as any;

export class SVGElementImplementation extends ElementImplementation implements Partial<SVGElement> {
	constructor(ownerDocument: Document, qualifiedName: string) {
		super(ownerDocument, "http://www.w3.org/2000/svg", qualifiedName);
	}
};

globalThis.SVGElement = SVGElementImplementation as any;

export class DocumentImplementation extends NodeImplementation implements Partial<Document> {
	constructor() {
		super(null);
	}

	get ownerDocument(): null {
		return null;
	}

	createAttribute(localName: string): Attr {
		let attribute = AttrImplementation.createFromLocalName(this as any, localName);
		return attribute as any;
	}

	createAttributeNS(namespaceURL: string | null, qualifiedName: string): Attr {
		throw "";
	}

	createElementNS<A extends keyof HTMLElementTagNameMap>(namespaceURI: "http://www.w3.org/1999/xhtml", qualifiedName: A): HTMLElementTagNameMap[A];
	createElementNS(namespaceURI: "http://www.w3.org/1999/xhtml", qualifiedName: string): HTMLElement;
	createElementNS<A extends keyof SVGElementTagNameMap>(namespaceURI: "http://www.w3.org/2000/svg", qualifiedName: A): SVGElementTagNameMap[A];
	createElementNS(namespaceURI: "http://www.w3.org/2000/svg", qualifiedName: string): SVGElement;
	createElementNS(namespaceURI: string | null, qualifiedName: string, options?: ElementCreationOptions): Element;
	createElementNS(namespace: string | null, qualifiedName: string, options?: string | ElementCreationOptions): Element {
		return new ElementImplementation(this as any, namespace, qualifiedName) as any;
	}

	createTextNode(data: string): Text {
		return new TextImplementation(this as any, data) as any;
	}
};

globalThis.Document = DocumentImplementation as any;

globalThis.document = new DocumentImplementation() as any;
