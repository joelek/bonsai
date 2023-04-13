import { Boolean, Integer, OptionCodec, Plain, Undefined, Union } from "./codecs";
import { RecordValue, make_state, State } from "./state";

export type ExpansionOf<A> = A extends infer B ? { [C in keyof B]: B[C] } : never;

export type QueryParameter = {
	key: string;
	value: string;
};

export type QueryParameters = Array<QueryParameter>;

export type Route = {
	paths: Array<string>,
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

export function pathify(string: string): string {
	return string
		.toLowerCase()
		.normalize("NFKD")
		.replace(/[\|\/\\\_\-]/g, " ")
		.replace(/[^a-z0-9 ]/g, "")
		.trim()
		.split(/[ ]+/g)
		.join("-");
};

export function getUrlFromRoute(route: Route): string {
	let path = route.paths.map((path) => encodeURIComponent(path)).join("/");
	let query = "";
	for (let parameter of route.parameters) {
		query += `${encodeURIComponent(parameter.key)}=${encodeURIComponent(parameter.value)}`;
	}
	let url = (query !== "") ? `${path}?${query}` : path;
	return url;
};

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

export function updateHistoryState(historyState: HistoryState): void {
	let url = getUrlFromRoute(historyState.route);
	window.history.replaceState(historyState, "", url);
};

export function getBaseHref(): string {
	let url = new URL(document.body.baseURI);
	if (url.origin !== window.location.origin) {
		throw new Error(`Expected basename origin and location origin to be identical!`);
	}
	return url.pathname;
};

export function getInitialCache(): Array<CacheEntry> {
	return [];
};

export function getInitialIndex(): number {
	return 0;
};

export function getInitialPaths(pathname: string, basename: string): Array<string> {
	let pathnameParts = pathname.split("/");
	let basenameParts = basename.split("/").slice(0, -1);
	for (let i = 0; i < basenameParts.length; i++) {
		if (basenameParts[i] !== pathnameParts[i]) {
			throw new Error(`Expected basename to be a prefix of the pathname!`);
		}
	}
	let paths = pathnameParts.slice(basenameParts.length).map((path) => decodeURIComponent(path));
	return paths;
};

export function getInitialRoute(): Route {
	let location = window.location;
	let paths = getInitialPaths(location.pathname, getBaseHref());
	let parameters = [] as QueryParameters;
	for (let one in location.search.split("&")) {
		let two = one.split("=");
		if (two.length !== 2) {
			continue;
		}
		let key = decodeURIComponent(two[0]);
		let value = decodeURIComponent(two[1]);
		parameters.push({
			key,
			value
		});
	}
	return {
		paths,
		parameters
	};
};

export function getInitialState(): HistoryState {
	let historyState = (window.history.state || undefined) as HistoryState | undefined;
	if (historyState == null) {
		let index = getInitialIndex();
		let route = getInitialRoute();
		historyState = {
			route,
			index
		};
	}
	return historyState;
};

export type ParsedRoute = {
	page: string;
	options: RecordValue;
};

export class Router<A extends PageOptions<A>> {
	protected factories: PageFactories<A>;
	protected defaultPage: string | undefined;
	protected documentTitle: string;
	protected cache: State<Array<CacheEntry>>;
	protected state: State<HistoryState>;

	readonly element = make_state(undefined as Element | undefined);
	readonly url = make_state(undefined as string | undefined);

	protected onPopState = (event: PopStateEvent) => {
		let historyState = event.state as HistoryState;
		this.state.update(historyState);
	};

	protected parseRoute(route: Route): ParsedRoute | undefined {
		for (let page in this.factories) {
			try {
				let factory = this.factories[page];
				let options = factory.codec.decode(route);
				return {
					page,
					options
				};
			} catch (error) {}
		}
		if (typeof this.defaultPage !== "undefined") {
			let page = this.defaultPage;
			let options = {};
			return {
				page,
				options
			};
		}
	}

	constructor(factories: PageFactories<A>, defaultPage?: EmptyPageOptions<A>) {
		this.factories = factories;
		this.defaultPage = defaultPage;
		this.documentTitle = document.title;
		this.cache = make_state(getInitialCache());
		this.state = make_state(getInitialState());
		let stateRoute = this.state.member("route");
		let stateIndex = this.state.member("index");
		this.state.compute((state) => {
			updateHistoryState(state);
		});
		stateRoute.compute((stateRoute) => {
			this.url.update(getUrlFromRoute(stateRoute));
		});
		stateIndex.compute((stateIndex) => {
			for (let i = this.cache.length().value(); i <= stateIndex; i++) {
				this.cache.append({
					title: this.documentTitle
				});
			}
		});
		stateIndex.compute((stateIndex) => {
			let entry = this.cache.element(stateIndex);
			if (entry.value().element == null) {
				let entryTitle = entry.member("title");
				let entryRoute = entry.member("route");
				let entryElement = entry.member("element");
				let parsedRoute = this.parseRoute(stateRoute.value());
				if (typeof parsedRoute !== "undefined") {
					let factory = this.factories[parsedRoute.page as keyof A];
					let options = make_state(parsedRoute.options as any);
					entryElement.update(factory.factory(options as any, entryTitle, this));
					options.compute((options) => {
						entryRoute.update(factory.codec.encode(options));
					});
				}
			}
		});
		let entry = this.cache.element(stateIndex);
		let entryElement = entry.member("element");
		let entryTitle = entry.member("title");
		let entryRoute = entry.member("route");
		entryElement.compute((entryElement) => {
			this.element.update(entryElement);
		});
		entryTitle.compute((entryTitle) => {
			document.title = entryTitle;
		});
		entryRoute.compute((entryRoute) => {
			if (entryRoute != null) {
				stateRoute.update(entryRoute);
			}
		});
		window.addEventListener("popstate", this.onPopState);
	}

	navigate<B extends keyof A>(page: B, options: A[B]): boolean {
		let factory = this.factories[page];
		let index = this.state.value().index + 1;
		let route = factory.codec.encode(options);
		for (let i = this.cache.length().value() - 1; i >= index; i--) {
			this.cache.remove(i);
		}
		// Index needs to be specified after route since index changes trigger page initialization which reads route.
		let historyState: HistoryState = {
			route,
			index
		};
		let url = getUrlFromRoute(route);
		window.history.pushState(historyState, "", url);
		this.state.update(historyState);
		window.scrollTo({ top: 0, left: 0 });
		return false;
	}
};

export class RouteCodecImplementation<A extends {}> implements RouteCodec<A> {
	protected pathCodecs: Array<{ key?: string, codec: OptionCodec<any> }>;
	protected parameterCodecs: Record<string, OptionCodec<any>>;

	protected assertKeyAvailable(key: string): void {
		if (typeof this.parameterCodecs[key] !== "undefined" || typeof this.pathCodecs.find((pathCodec) => pathCodec.key === key) !== "undefined") {
			throw new Error(`Expected key "${key}" to be available!`);
		}
	}

	constructor(pathCodecs: Array<{ key?: string, codec: OptionCodec<any> }>, parameterCodecs: Record<string, OptionCodec<any>>) {
		this.pathCodecs = pathCodecs;
		this.parameterCodecs = parameterCodecs;
	}

	decode(route: Route): A {
		if (route.paths.length !== this.pathCodecs.length) {
			throw new Error(`Expected ${this.pathCodecs.length} paths!`);
		}
		let options = {} as A;
		for (let i = 0; i < this.pathCodecs.length; i++) {
			let pathCodec = this.pathCodecs[i];
			let path = route.paths[i];
			options = {
				...options,
				...pathCodec.codec.decode(path)
			};
		}
		for (let key in this.parameterCodecs) {
			let parameterCodec = this.parameterCodecs[key];
			let queryParameter = route.parameters.filter((parameter) => parameter.key === key).pop();
			options = {
				...options,
				...parameterCodec.decode(queryParameter?.value)
			};
		}
		return options;
	}

	dynamic<B extends string, C extends any>(key: B, codec: OptionCodec<C>): RouteCodecImplementation<ExpansionOf<A & { [key in B]: C }>> {
		this.assertKeyAvailable(key);
		let pathCodec: OptionCodec<{ [key in B]: C }> = {
			decode(string) {
				return {
					[key]: codec.decode(string)
				} as { [key in B]: C };
			},
			encode(options) {
				return codec.encode(options[key]);
			}
		};
		return new RouteCodecImplementation([
			...this.pathCodecs,
			{
				key: key,
				codec: pathCodec
			},
		], this.parameterCodecs);
	}

	encode(options: A): Route {
		let paths = [] as Array<string>;
		let parameters = [] as QueryParameters;
		for (let pathCodec of this.pathCodecs) {
			let value = pathCodec.codec.encode(options);
			if (typeof value !== "undefined") {
				paths.push(value);
			}
		}
		for (let key in this.parameterCodecs) {
			let parameterCodec = this.parameterCodecs[key];
			let value = parameterCodec.encode(options);
			if (typeof value !== "undefined") {
				parameters.push({
					key: key,
					value: value
				});
			}
		}
		return {
			paths,
			parameters
		};
	}

	optional<B extends string, C extends any>(key: B, codec: OptionCodec<C>): RouteCodecImplementation<ExpansionOf<A & { [key in B]: C | undefined }>> {
		this.assertKeyAvailable(key);
		let optionalCodec = Union.of(codec, Undefined);
		let parameterCodec: OptionCodec<{ [key in B]: C | undefined }> = {
			decode(string) {
				return {
					[key]: optionalCodec.decode(string)
				} as { [key in B]: C | undefined };
			},
			encode(options) {
				return optionalCodec.encode(options[key]);
			}
		};
		return new RouteCodecImplementation(this.pathCodecs, {
			...this.parameterCodecs,
			[key]: parameterCodec
		});
	}

	required<B extends string, C extends any>(key: B, codec: OptionCodec<C>): RouteCodecImplementation<ExpansionOf<A & { [key in B]: C }>> {
		this.assertKeyAvailable(key);
		let parameterCodec: OptionCodec<{ [key in B]: C }> = {
			decode(string) {
				return {
					[key]: codec.decode(string)
				} as { [key in B]: C };
			},
			encode(options) {
				return codec.encode(options[key]);
			}
		};
		return new RouteCodecImplementation(this.pathCodecs, {
			...this.parameterCodecs,
			[key]: parameterCodec
		});
	}

	static(value: string): RouteCodecImplementation<A> {
		let pathCodec: OptionCodec<{}> = {
			decode(string) {
				if (string !== value) {
					throw new Error(`Expected path "${string}" to be "${value}"!`);
				}
				return {};
			},
			encode(options) {
				return value;
			}
		};
		return new RouteCodecImplementation([
			...this.pathCodecs,
			{
				key: undefined,
				codec: pathCodec
			},
		], this.parameterCodecs);
	}
};

export const codec = new RouteCodecImplementation([], {});

const CODECS: Record<string, OptionCodec<any>> = {
	plain: Plain,
	integer: Integer,
	boolean: Boolean
};

type ParsedKey<A extends string> = A extends `${infer B}:${infer C}` ? B : A;

type ParsedType<A extends string> = A extends `${infer B}:${infer C}` ? C extends keyof infer D extends {
	plain: string;
	integer: number;
	boolean: boolean;
} ? D[C] : string : string;

type ParsedRequiredOption<A extends string> = {
	[C in ParsedKey<A>]: ParsedType<A>;
};

type ParsedOptionalOption<A extends string> = {
	[C in ParsedKey<A>]?: ParsedType<A>;
};

type ParsedPath<A extends string> = A extends `<${infer B}>` ? ParsedRequiredOption<B> : {};

type ParsedPaths<A extends string> = A extends `${infer B}/${infer C}` ? ParsedPath<B> & ParsedPaths<C> : ParsedPath<A>;

type ParsedParameter<A extends string> = A extends `<${infer B}>` ? ParsedRequiredOption<B> : A extends `[${infer B}]` ? ParsedOptionalOption<B> : {};

type ParsedParameters<A extends string> = A extends `${infer B}&${infer C}` ? ParsedParameter<B> & ParsedParameters<C> : ParsedParameter<A>;

type ParsedOptions<A extends string> = A extends `${infer B}?${infer C}` ? ParsedPaths<B> & ParsedParameters<C> : ParsedPaths<A>;

export function route<A extends string>(route: A): RouteCodecImplementation<ExpansionOf<ParsedOptions<A>>> {
	let routeParts = route.split("?");
	let pathParts = routeParts.slice(0, 1).join("?");
	let parameterParts = routeParts.slice(1).join("?");
	let codec = new RouteCodecImplementation([], {});
	for (let pathPart of pathParts.split("/")) {
		if (pathPart.startsWith("<") && pathPart.endsWith(">")) {
			let innerParts = pathPart.slice(1, -1).split(":");
			let key = innerParts.slice(0, 1).join(":");
			let type = innerParts.slice(1).join(":");
			codec = codec.dynamic(key, CODECS[type] ?? Plain);
		} else {
			codec = codec.static(decodeURIComponent(pathPart));
		}
	}
	for (let parameterPart of parameterParts.split("&")) {
		if (parameterPart.startsWith("<") && parameterPart.endsWith(">")) {
			let innerParts = parameterPart.slice(1, -1).split(":");
			let key = innerParts.slice(0, 1).join(":");
			let type = innerParts.slice(1).join(":");
			codec = codec.required(key, CODECS[type] ?? Plain);
		} else if (parameterPart.startsWith("[") && parameterPart.endsWith("]")) {
			let innerParts = parameterPart.slice(1, -1).split(":");
			let key = innerParts.slice(0, 1).join(":");
			let type = innerParts.slice(1).join(":");
			codec = codec.optional(key, CODECS[type] ?? Plain);
		}
	}
	return codec as RouteCodecImplementation<ExpansionOf<ParsedOptions<A>>>;
};
