import { RecordValue, stateify, State } from "./state";

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
	let element = document.head.querySelector("base[href]");
	if (element != null) {
		let attribute = element.getAttribute("href");
		if (attribute != null) {
			return attribute;
		}
	}
	return "/";
};

export function getInitialCache(): Array<CacheEntry> {
	return [];
};

export function getInitialIndex(): number {
	return 0;
};

export function getInitialRoute(): Route {
	let location = window.location;
	let pathNameParts = location.pathname.split("/");
	let baseHrefParts = getBaseHref().split("/");
	let i = 0;
	while (i < pathNameParts.length && i < baseHrefParts.length && pathNameParts[i] === baseHrefParts[i]) {
		i++;
	}
	let paths = pathNameParts.slice(i).map((path) => decodeURIComponent(path));
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
	protected defaultPage: string;
	protected documentTitle: string;
	protected cache: State<Array<CacheEntry>>;
	protected state: State<HistoryState>;

	readonly element = stateify(undefined as Element | undefined);
	readonly url = stateify(undefined as string | undefined);

	protected onPopState = (event: PopStateEvent) => {
		let historyState = event.state as HistoryState;
		this.state.update(historyState);
	};

	protected parseRoute(route: Route): ParsedRoute {
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
		let page = this.defaultPage;
		let options = {};
		return {
			page,
			options
		};
	}

	constructor(factories: PageFactories<A>, defaultPage: EmptyPageOptions<A>) {
		this.factories = { ...factories };
		this.defaultPage = defaultPage;
		this.documentTitle = document.title;
		this.cache = stateify(getInitialCache());
		this.state = stateify(getInitialState());
		let stateRoute = this.state.member("route");
		let stateIndex = this.state.member("index");
		this.state.compute((state) => {
			updateHistoryState(state);
		});
		stateRoute.compute((stateRoute) => {
			this.url.update(getUrlFromRoute(stateRoute));
		});
		stateIndex.compute((stateIndex) => {
			for (let i = this.cache.length(); i <= stateIndex; i++) {
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
				let factory = this.factories[parsedRoute.page as keyof A];
				let options = stateify(parsedRoute.options as any);
				entryElement.update(factory.factory(options as any, entryTitle, this));
				options.compute((options) => {
					entryRoute.update(factory.codec.encode(options));
				});
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
		for (let i = this.cache.length() - 1; i >= index; i--) {
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
