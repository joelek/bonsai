# @joelek/bonsai

Lightweight, functional and robust library for creating reactive web components. Written completely in TypeScript.

```ts
import { html } from "@joelek/bonsai";

let ul = html.ul()
	.attribute("class", ["my-list"])
	.listener("onclick", (event, element) => {})
	.nodes(
		html.li("One"),
		html.li("Two")
	);
```

## Background

One of the fundamental technologies that make the world wide web possible is the HTML standard. The standard is declarative and fragments may be formatted so that the hierarchical structure becomes visually represented.

```html
<ul class="my-list" onclick="onclick">
	<li>One</li>
	<li>Two</li>
</ul>
```

An unordered list with class name `my-list` and interactivity when clicked is declared in the example above. The list is declared to have two list items with text nodes `One` and `Two`, respectively. The list is also unintendedly declared to have white space text nodes in between the elements themselves. Although usually not a problem, the additional text nodes do generate unnecessary overhead for the web browser to handle.

Behaviour is traditionally defined in separate JavaScript files.

```ts
function onclick(event) {}
```

Formatting and animation declarations are traditionally defined in CSS files.

```css
.my-list {}
```

The three technologies are connected through the identifier `onclick` and through the class name `my-list`. Both are defined in global namespaces which are shared by all fragments in a document. This results in severe scaling issues which has lead to the emergence of certain practices of which clever naming standards for class names and deferred interactivity through `querySelectorAll()` provide some mitigation.

The use of `querySelectorAll()` is not ideal as it simply selects all elements matching the given selector. If the class name is updated in the fragment without it also being updated in the code, behaviour stops working. If new fragments using identical class names are introduced, those fragments will gain unintended behaviour. Preventing this becomes the, often manual, responsibility of the programmer.

In addition to this, programatically generated HTML fragments can suffer from severe security-related issues. Consider for instance the fragment below where the text node has been maliciously replaced by a `script` element. The elment was inserted by tricking the generator into encoding the string `<script>console.log("Not cool!")</script>` directly into the fragment without any input sanitization.

```html
<ul class="my-list" onclick="onclick">
	<li><script>console.log("Not cool!")</script></li>
	<li>Two</li>
</ul>
```

The browser has no way of distinguishing between structure and data when parsing the fragment and parses this as a `script` element. The script may even be executed depending on context unless proper security policies are enforced!

This has lead to the re-emergence of combining fragments, behaviour, formatting and animation declarations into isolated units.

It is possible to create isolated units using pure JavaScript but since the API is imperative, visual representation of structural hierarchy is lost. The API is also quite verbose as seen in the example below in which a list almost identical to the one in the previous example is generated.

```ts
let ul = document.createElement("ul");
ul.addEventListener("click", (event) => {});
ul.setAttribute("class", "my-list");
let li1 = document.createElement("li");
li1.appendChild(document.createTextNode("One"));
ul.appendChild(li1);
let li2 = document.createElement("li");
li2.appendChild(document.createTextNode("Two"));
ul.appendChild(li2);
```

The API design leads to a whole new set of maintenance problems which several frameworks and libraries have attempted to solve. This has even lead to the evolution of entirely new languages such as `JSX` and `TSX` which through their transpilation steps can catch errors before they ever reach the end user.

## Features

### Functional Element

Bonsai uses a pure, code-based approach for solving the isolation, scalability and maintenance problems of writing web components. The functional element API is easy to learn and creates a visual representation of the structural hierarchy.

```ts
import { html } from "@joelek/bonsai";

let ul = html.ul()
	.attribute("class", ["my-list"])
	.listener("onclick", (event, element) => {})
	.nodes(
		html.li("One"),
		html.li("Two")
	);
```

Bonsai provides functional subclasses for all HTML and SVG element classes in the DOM. The subclasses are safe, scalable and have great interoperability with other libraries or existing code.

### Interactive State

Bonsai can be used to build reactive web components without the additional overhead and drawbacks of performing document updates using virtual fragments and through diffing algorithms.

The interactive state API provides functionality for creating data models as well as the way in which the models are transformed into and presented as web components. When the data model is updated, so are the affected parts of the component.

State may be bound to an attribute of an element as shown in the example below.

```ts
import { html, stateify } from "@joelek/bonsai";

let state = stateify(["my-list"]); // State with type Array<string> is created.

let ul = html.ul()
	.attribute("class", state) // State is implicitly bound to the class attribute.
	.nodes(
		html.li("One"),
		html.li("Two")
	);

state.update(["my-new-list"]); // State instantly updates the class attribute.
```

State may be bound to the child nodes of an element as shown in the example below.

```ts
import { html, stateify } from "@joelek/bonsai";

let state = stateify(["One", "Two"]); // State with type Array<string> is created.

let ul = html.ul()
	.attribute("class", ["my-list"])
	.nodes(state.mapStates((state) => // State is mapped for each element in the array.
		html.li(state) // State is implicitly bound to the child nodes.
	));

state.append("Three"); // State instantly updates the child nodes.
```

A correct set of mutations is applied to the fragment when the state is updated as the state is bound directly to the fragment. This in contrast to diffing algorithms where a certain amount of guesswork has to be done regarding which set of mutations to apply.

Consider the two examples below. One algorithm may consider the list as having been updated with an insert in between the two list items. Another algorithm may consider the second list item as having been removed and two new items as having been inserted. A third algorithm may consider the entire list as having been recreated.

```html
<ul>
	<li>One</li>
	<li>Two</li>
</ul>
```

```html
<ul>
	<li>One</li>
	<li>One and a half</li>
	<li>Two</li>
</ul>
```

All three algoritms produce mutation sets that when applied update the fragment correctly. Although choosing the incorrect mutation set may have unintended side-effects that at best irritate the programmer and at worst break the end user experience.

### Reactive Components

Bonsai can be used to create reactive web components by combining functional elements with interactive state. A scalable pattern is demonstrated in the example below.

```ts
import { html, stateify, State, Children } from "@joelek/bonsai";

const CLASS_NAME = "my-list";

document.head.appendChild(html.style(`
	.${CLASS_NAME} {

	}
`));

export type MyList = State<Array<string>>;

export function MyList(state: MyList, /* ...children: Children */) {
	return html.ul()
		.attribute("class", [CLASS_NAME])
		.nodes(state.mapStates((state) =>
			html.li(state)
		));
};
```

```ts
import { stateify } from "@joelek/bonsai";
import { MyList } from "./MyList";

let state = stateify<Array<string>>([]);
document.body.appendChild(MyList(state));
state.append("One");
state.append("Two");
```

### Client-side routing

Bonsai features a router module that may be used for client-side routing.

```ts
import { html, State, Router, Route, QueryParameters } from "@joelek/bonsai";

export type StartPageOptions = {};

export const StartPage = {
	codec: {
		decode(route: Route): StartPageOptions {
			if (route.paths.length !== 1 || route.paths[0] !== "start") {
				throw new Error();
			}
			return {};
		},
		encode(options: StartPageOptions): Route {
			let paths = ["start"];
			let parameters = [] as QueryParameters;
			return {
				paths,
				parameters
			};
		}
	},
	factory(model: State<StartPageOptions>, title: State<string>, router: Router<any>) {
		return html.h1("Start Page");
	}
};
```

```ts
import { html, State, Router, Route, QueryParameters } from "@joelek/bonsai";

export type ContactPageOptions = {};

export const ContactPage = {
	codec: {
		decode(route: Route): ContactPageOptions {
			if (route.paths.length !== 1 || route.paths[0] !== "contact") {
				throw new Error();
			}
			return {};
		},
		encode(options: ContactPageOptions): Route {
			let paths = ["contact"];
			let parameters = [] as QueryParameters;
			return {
				paths,
				parameters
			};
		}
	},
	factory(model: State<ContactPageOptions>, title: State<string>, router: Router<any>) {
		return html.h1("Contact Page");
	}
};
```

```ts
import { html, Router } from "@joelek/bonsai";
import { StartPage } from "./StartPage";
import { ContactPage } from "./ContactPage";

const ROUTER = new Router({
	start: StartPage,
	contact: ContactPage
}, "start");

document.body.appendChild(
	html.div(
		html.p(
			html.a("Start")
				.listener("onclick", (event, element) => ROUTER.navigate("start", {})),
			html.a("Contact")
				.listener("onclick", (event, element) => ROUTER.navigate("contact", {}))
		),
		html.p("Current route:", ROUTER.url),
		ROUTER.element
	)
);
```

* The router exposes the current route through the `url` state.
* The router exposes the current element through the `element` state.

## API

### Functional Element

Functional elements are created through the factory functions defined in the `html` and `svg` modules.

```ts
import { html, svg } from "@joelek/bonsai";

let div = html.div();
let circle = svg.circle();
```

Child nodes may be set for an element through the factory function.

```ts
let p = html.p("One", "Two");
```

#### Attribute

An attribute may be get for the element through the `attribute(key)` method.

* The `key` argument must be used to specify the attribute key.

An attribute may be set for the element through the `attribute(key, value)` method.

* The `key` argument must be used to specify the attribute key.
* The `value` argument must be used to specify the attribute value.

The attribute with the given `key` may be removed from the element by explicitly specifying the `value` argument as undefined.

The `class` attribute will automatically be parsed and serialized as an array of class names.
The `style` attribute will automatically be parsed and serialized as a record of style properties.

#### Listener

A listener may be added to the element through the `listener(type, listener)` method.

* The `type` argument must be used to specify the event type using the `on*` format.
* The `listener` argument must be used to specify the listener.

There may only be a single listener added to each element for each unique event type. The listener added for the given `type` may be removed by explicitly specifying the `listener` argument as undefined. Default behaviour may be prevented through the listener returning false.

#### Nodes

Child nodes may be set for the element through the `nodes(...children)` method.

* The `children` argument may be used to specify the child nodes. State is bound to the element and may be used to update the child nodes dynamically.

#### Process

An element may be processed in a processing block through the `process(callback)` method.

* The `callback` argument must be used to specify the callback.

#### Serialization

Values set as attributes or child nodes will be serialized into the document using a simple algorithm. The algorithm serializes primitive values into strings and uses JSON-serialization for composite values. This provides maximum flexibility for the programmer with one caveat which is illustrated in the example below.

```ts
let p1 = html.p(1, 2); // Creates a paragraph with two text nodes containing "1" and "2", respectively.
let p2 = html.p([1, 2]); // Creates a paragraph with one text node containing "[1, 2]".
```

Please note that the `class` and `style` attributes use custom serialization rules and also support deserialization in contrast to regular attributes.

### Interactive State

State should be created through the `stateify()` function. The function adapts to its input and creates an instance of the appropriate class.

```ts
import { stateify } from "@joelek/bonsai";

let one = stateify(1);
let two = stateify(2);
```

Multiple states may be combined into a single state using the `computed()` function.

```ts
import { stateify, computed } from "@joelek/bonsai";

let one = stateify(1);
let two = stateify(2);
let sum = computed([one, two], (one, two) => one + two);
```

#### Compute

New state may be computed from existing state through the `compute(computer)` method. The method returns the new state.

* The `computer` argument must be used to specify how the new value should be computed from the existing value.

#### Observe

State may be observed for events through the `observe(type, observer)` method. The method returns a cancellation token that may be used to remove the corresponding observer from the state.

* The `type` argument must be used to specify the event type to observe.
* The `observer` argument must be used to specify the observer.

#### Unobserve

Observed state may be unobserved through the `unobserve(type, observer)` method.

* The `type` argument must be used to specify the event type to unobserve.
* The `observer` argument must be used to specify the observer.

#### Update

The value of a state may be updated through the `update(value)` method. The method returns a boolean signaling whether the value was different from the existing value or not.

* The `value` argument must be used to specify the new value.

#### Value

The value of a state may be retrieved through the `value()` method. The method returns a copy of the value stored.

### PrimitiveState

An instance of `PrimitiveState` is created when a primitive is passed to the `stateify()` function. The `PrimitiveState` class extends from the `State` class.

* Instances of `PrimitiveState` emit an `update` event when the stored value changes.

Primitive values are bigint, boolean, number, string, null and undefined.

### ArrayState

An instance of `ArrayState` is created when an array is passed to the `stateify()` function. The `ArrayState` class extends from the `State` class.

* Instances of `ArrayState` emit an `update` event when the stored value changes.
* Instances of `ArrayState` emit an `insert` event when an element is inserted.
* Instances of `ArrayState` emit an `remove` event when an element is removed.

#### Append

Values or states may be appended to the array through the `append(item)` method.

* The `item` argument must be used to specify the value or state to append.

#### Element

Elements may be retrieved from the array through the `element(index)` method.

* The `index` argument must be used to specify the index value or state of the element.

An error is thrown when the index is out of bounds.

#### Insert

Values or states may be inserted into the array through the `insert(index, item)` method.

* The `index` argument must be used to specify the index of the element.
* The `item` argument must be used to specify the value or state to insert.

An error is thrown when the index is out of bounds.

#### Length

The number of elements stored in the array may be retrieved through the `length()` method.

#### MapStates

The states of an array may be mapped into a new array through the `mapStates(mapper)` method.

* The `mapper` argument must be used to specify how an existing state should be mapped to the a new value or state.

The states of state-mapped arrays are initialized using the `mapper` but not recomputed when updates are made to the states of the original array. This is most often the desired behaviour when mapping instances such as elements.

#### MapValues

The values of an array may be mapped into a new array through the `mapValues(mapper)` method.

* The `mapper` argument must be used to specify how an existing value should be mapped to a new value.

The states of value-mapped arrays are initialized using the `mapper` and recomputed when updates are made to the states of the original array. This is most often the desired behaviour when mapping pure data.

#### Remove

Elements may be removed from the array through the `remove(index)` method.

* The `index` argument must be used to specify the index of the element.

An error is thrown when the index is out of bounds.

### ObjectState

An instance of `ObjectState` is created when an object is passed to the `stateify()` function. The `ObjectState` class extends from the `State` class.

* Instances of `ObjectState` emit an `update` event when the stored value changes.

#### Member

Members may be retrieved from the object through the `member(key, defaultValue?)` method.

* The `key` argument must be used to specify the key of the member.
* The `defaultValue` argument may be used to specify the defaultValue of the member.

### ReferenceState

An instance of `ReferenceState` is created when an instance of a class is passed to the `stateify()` function. The `ReferenceState` class extends from the `State` class.

* Instances of `ReferenceState` emit an `update` event when the stored value changes.

## Sponsorship

The continued development of this software depends on your sponsorship. Please consider sponsoring this project if you find that the software creates value for you and your organization.

The sponsor button can be used to view the different sponsoring options. Contributions of all sizes are welcome.

Thank you for your support!

### Ethereum

Ethereum contributions can be made to address `0xf1B63d95BEfEdAf70B3623B1A4Ba0D9CE7F2fE6D`.

![](./eth.png)

## Installation

Releases follow semantic versioning and release packages are published using the GitHub platform. Use the following command to install the latest release.

```
npm install joelek/bonsai#semver:^0.4
```

Use the following command to install the very latest build. The very latest build may include breaking changes and should not be used in production environments.

```
npm install joelek/bonsai#master
```

NB: This project targets TypeScript 4 in strict mode.

## Roadmap

* Write unit tests.
* Consider implementing OptionalState to handle values that may be undefined.
* Consider adding support for array of arrays as argument to nodes().
* Serialize classes as "class".
* Ensure that the proper state type is inferred in update event messages.
* Consider implementing TupleState that changes once irregardless of number of members.
* Add support for class and style overrides.
* Fix issue with type elision for bi-directionally bound state.
