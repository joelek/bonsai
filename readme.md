# @joelek/bonsai

Lightweight, functional and robust library for creating reactive web components. Written completely in TypeScript.

```ts
import { html } from "@joelek/bonsai";

let ul = html.ul({
	class: ["my-list"],
	onclick: (event, element) => {}
},
	html.li({}, "One"),
	html.li({}, "Two")
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

let ul = html.ul({
	class: ["my-list"],
	onclick: (event, element) => {}
},
	html.li({}, "One"),
	html.li({}, "Two")
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

let ul = html.ul({
	class: state // State is implicitly bound to the class attribute.
},
	html.li({}, "One"),
	html.li({}, "Two")
);

state.update(["my-new-list"]); // State instantly updates the class attribute.
```

State may be bound to the child nodes of an element as shown in the example below.

```ts
import { html, stateify } from "@joelek/bonsai";

let state = stateify(["One", "Two"]); // State with type Array<string> is created.

let ul = html.ul({
	class: ["my-list"]
}, state.mapStates((state) => // State is mapped for each element in the array.
	html.li({}, state) // State is implicitly bound to the child nodes.
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
import { html, stateify, Attributes, Children } from "@joelek/bonsai";

const CLASS_NAME = "my-list";

document.head.appendChild(html.style({}, `
	.${CLASS_NAME} {

	}
`));

export type MyList = {
	items: Array<string>;
};

export function MyList(attributes: Attributes<MyList>, /* ...children: Children */) {
	let items = stateify(attributes.items); // Convert items to state if not already state.
	return (
		html.ul({
			class: [CLASS_NAME]
		}, items.mapStates((item) =>
			html.li({}, item)
		))
	);
};
```

```ts
import { stateify } from "@joelek/bonsai";
import { MyList } from "./MyList";

let items = stateify<Array<string>>([]);
document.body.appendChild(
	MyList({ items })
);
items.append("One");
items.append("Two");
```

Custom classes and styles may be added to the root element of each component.

```ts
import { stateify } from "@joelek/bonsai";
import { MyList } from "./MyList";

let items = stateify<Array<string>>([]);
document.body.appendChild(
	MyList({ items })
		.attribute("class", (classes) => ([
			...classes,
			"my-custom-list"
		])))
		.attribute("style", (styles) => ({
			...styles,
			["background-color"]: "green"
		})))
);
items.append("One");
items.append("Two");
```

### Client-side routing

Bonsai features a router that may be used for client-side routing. The router adds support for deep-linked pages and automatically maintains and restores history state.

Each routable page is composed from a route codec and from a factory function generating instances of the page in question. The router caches the generated page instances and re-uses them when restoring history state.

```ts
import { route, html, State, Router } from "@joelek/bonsai";

export type StartPageOptions = {};

export const StartPage = {
	codec: route("start"),
	factory(model: State<StartPageOptions>, title: State<string>, router: Router<any>) {
		return html.h1({}, "Start Page");
	}
};
```

A page displaying an `h1` element with text content `Start Page` is combined with the `start` route in the example shown above.

```ts
import { route, html, State, Router } from "@joelek/bonsai";

export type ContactPageOptions = {};

export const ContactPage = {
	codec: route("contact"),
	factory(model: State<ContactPageOptions>, title: State<string>, router: Router<any>) {
		return html.h1({}, "Contact Page");
	}
};
```

A page displaying an `h1` element with text content `Contact Page` is combined with the `contact` route in the example shown above.

#### Route codecs

Route codecs are used to define how to decode and encode URIs into and from a set of options. The complete type of the options object is automatically inferred from the route URI.

A route may define any number of static or dynamic path components separated by a single `/`. Static path components are defined without a specific format and should be properly percent encoded. Dynamic components are defined using the `<key>` format. The keys should only contain characters that do not require percent encoding.

```ts
import { route } from "@joelek/bonsai";

let codec = route("static%20component/<dynamic-component>");
```

Dynamic components may specify a type using the `<key:type>` format. The type will be used to encode and decode the corresponding value and is reflected in the type of the option in question.

Bonsai includes support for parsing options as `plain` (unquoted string), `boolean` and `integer`.

```ts
import { route } from "@joelek/bonsai";

let codec = route("<my-plain:plain>/<my-boolean:boolean>/<my-integer:integer>");
```

A route may define any number of optional and required query parameters after a single `?` and separated by a single `&`. Required parameters are defined using the `<key>` format and optional parameters are defined using the `[key]` format. Both parameter kinds support types being specified using the `<key:type>` or `[key:type]` formats, respectively. The keys should only contain characters that do not require percent encoding.

```ts
import { route } from "@joelek/bonsai";

let codec = route("?<required>&[optional]");
```

Please note that the keys of routes being specified through `route()` should only contain characters that do not require percent encoding. This is because of the lack of support for percent decoding in the TypeScript type system. The underlying `codec` helper can be used directly to specify the route when keys contain characters that do require percent encoding.

```ts
import { codec, Plain, Boolean, Integer } from "@joelek/bonsai";

codec
	.static("static component")
	.dynamic("dynamic component key", Plain)
	.required("required parameter key", Boolean)
	.optional("optional parameter key", Integer);
```

#### Router

A router is created from all routes possible and supports a default page being specified. The default page can not require any options.

```ts
import { html, Router } from "@joelek/bonsai";
import { StartPage } from "./StartPage";
import { ContactPage } from "./ContactPage";

const ROUTER = new Router({
	start: StartPage,
	contact: ContactPage
}, "start");
```

The router may be used to show the active element and can be used to create instances of new pages through `navigate(page, options)`.

```ts
document.body.appendChild(
	html.div({},
		html.p({},
			html.a({
				onclick: (event, element) => ROUTER.navigate("start", {})
			}, "Start")
			html.a({
				onclick: (event, element) => ROUTER.navigate("contact", {})
			}, "Contact")
		),
		html.p({}, "Current route:", ROUTER.url),
		ROUTER.element
	)
);
```

* The router exposes the current url through the `url` state.
* The router exposes the current element through the `element` state.

Routes may be added and removed dynamically through the `add(page, factory)` and `remove(page)` methods, respectively. The default route may be set dynamically using the `default(page)` method.

## API

### Functional Element

Functional elements are created through the factory functions defined in the `html` and `svg` modules.

```ts
import { html, svg } from "@joelek/bonsai";

let div = html.div();
let circle = svg.circle();
```

Attributes and listeners may be specified for an element through the factory function.

```ts
let p = html.p({
	class: ["my-class"],
	style: {
		"padding": "20px"
	},
	onclick: (event, element) => {}
});
```

Child nodes may be set for an element through the factory function.

```ts
let p = html.p({}, "One", "Two");
```

#### Attribute

An attribute value or state may be retrieved for the element through the `attribute(key)` method.

* The `key` argument must be used to specify the key of the attribute.

An attribute value or state may be set for the element through the `attribute(key, attribute)` method.

* The `key` argument must be used to specify the key of the attribute.
* The `attribute` argument must be used to specify the attribute value or state.

The attribute with the given `key` may be removed from the element by explicitly specifying the `attribute` as undefined.

The `class` attribute must be specified as, and will be retrieved as, an array of attribute values or states. The attribute may also be specified using a mapper.
The `style` attribute must be specified as, and will be retrieved as, a record of attribute values or states. The attribute may also be specified using a mapper.

#### Augment

An element may be augmented with attributes and listeners using the `augment(augmentations)` method. The method is a compact short-hand for simultaneously specifying both attributes and listeners.

* The `augmentations` argument must be used to specify a record of attributes and listeners. Attributes are specified through attribute keys. Listeners are specified through keys using the `on*` format.

The `class` attribute must be specified as an array of attribute values or states. The attribute may also be specified using a mapper.
The `style` attribute must be specified as a record of attribute values or states. The attribute may also be specified using a mapper.

```ts
let div = html.div().augment({
	class: ["my-class"],
	style: {
		"padding": "20px"
	},
	onclick: (event, element) => {}
});
```

All attributes and listeners previously set for the element will be retained unless explicitly specified.

#### Listener

A listener may be added to the element through the `listener(type, listener)` method.

* The `type` argument must be used to specify the event type using the `on*` format.
* The `listener` argument must be used to specify the listener.

There may only be a single listener added to each element for each unique event type. The listener added for the given `type` may be removed by explicitly specifying the `listener` argument as undefined. Default behaviour may be prevented through the listener returning false.

#### Nodes

Child nodes may be set for the element through the `nodes(...children)` method.

* The `children` argument may be used to specify the child nodes. State is bound to the element and may be used to update the child nodes dynamically.

All child nodes previously set for the element will be replaced by the new children.

#### Process

An element may be processed in a processing block through the `process(callback)` method.

* The `callback` argument must be used to specify the callback.

#### Serialization

Values set as attributes will be serialized into the document using a simple algorithm. The algorithm serializes primitive values into plain strings and uses JSON-serialization for composite values.

Please note that the `class` and `style` attributes use custom serialization rules and also support deserialization in contrast to regular attributes.

### Interactive State

State should be created through the `stateify()` function. The function adapts to its input and creates an instance of the appropriate class.

```ts
import { stateify } from "@joelek/bonsai";

let one = stateify(1);
let two = stateify(2);
```

New state may be created from existing state using the `fallback()` function. The function returns a new state that is updated whenever the original state is updated. The new state also updates the original state whenever it is updated. The new state may never assume the undefined value making it useful in logic handling optional data.

```ts
import { stateify, fallback } from "@joelek/bonsai";

let state = stateify(undefined as number | undefined);
let fallbacked = fallback(state, 0); // The resulting type is State<number>.
fallbacked.update(1); // Both states are instantly updated to the value 1.
```

Multiple states may be combined into a single state using the `computed()` function.

```ts
import { stateify, computed } from "@joelek/bonsai";

let one = stateify(1);
let two = stateify(2);
let sum = computed([one, two], (one, two) => one + two);
```

Nested array states may be flattened into a single array state using the `flatten()` function. The function retains the original states and is updated whenever either of the nested states update.

```ts
import { stateify, flatten } from "@joelek/bonsai";

let array = stateify([
	[
		"one",
		[
			"two"
		],
		"three",
	],
	[
		"four"
	]
]);
let flattened = flatten(array); // The resulting type is State<Array<string>>.
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

Values or states may be appended to the array through the `append(items)` method.

* The `items` argument must be used to specify the values or states to append.

#### Element

Elements may be retrieved from the array through the `element(index)` method.

* The `index` argument must be used to specify the index value or state of the element.

An error is thrown when the index is out of bounds.

#### Filter

The states of an array may be filtered into a new array through the `filter(predicate)` method.

* The `predicate` argument must be used to specify the predicate deciding which elements to keep and which to discard.

#### First

The first element may be retrieved through the `first()` method.

#### Insert

Values or states may be inserted into the array through the `insert(index, item)` method.

* The `index` argument must be used to specify the index of the element.
* The `item` argument must be used to specify the value or state to insert.

An error is thrown when the index is out of bounds.

#### Last

The last element may be retrieved through the `last()` method.

#### Length

The number of elements stored in the array may be retrieved through the `length()` method.

#### MapStates

The states of an array may be mapped into a new array through the `mapStates(mapper)` method.

* The `mapper` argument must be used to specify how an existing state should be mapped to the a new value or state.

The states of state-mapped arrays are initialized using the `mapper` but not recomputed when updates are made to the states of the original array. This is most often the desired behaviour when mapping data objects to HTML elements.

```ts
import { html, stateify } from "@joelek/bonsai";

let state = stateify([{ name: "Joel Ek" }]);

state.mapStates((state) => html.p({}, state.name)));

state[0].update({ name: "Someone Else" }); // State instantly updates the paragraph element.
```

#### MapValues

The values of an array may be mapped into a new array through the `mapValues(mapper)` method.

* The `mapper` argument must be used to specify how an existing value should be mapped to a new value.

The states of value-mapped arrays are initialized using the `mapper` and recomputed when updates are made to the states of the original array. This is most often the desired behaviour when mapping pure data.

```ts
import { html, stateify } from "@joelek/bonsai";

let state = stateify([{ name: "Joel Ek" }]);

state.mapValues((value) => html.p({}, value.name));

state[0].update({ name: "Someone Else" }); // State instantly creates a new paragraph element.
```

#### Remove

Elements may be removed from the array through the `remove(index)` method.

* The `index` argument must be used to specify the index of the element.

An error is thrown when the index is out of bounds.

#### Vacate

All elements may be removed from the array through the `vacate()` method.

### ObjectState

An instance of `ObjectState` is created when an object is passed to the `stateify()` function. The `ObjectState` class extends from the `State` class.

* Instances of `ObjectState` emit an `update` event when the stored value changes.
* Instances of `ObjectState` emit an `insert` event when a member is inserted.
* Instances of `ObjectState` emit an `remove` event when a member is removed.

#### Member

Members may be retrieved from the object through the `member(key)` method.

* The `key` argument must be used to specify the key of the member.

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
npm install joelek/bonsai#semver:^0.8
```

Use the following command to install the very latest build. The very latest build may include breaking changes and should not be used in production environments.

```
npm install joelek/bonsai#master
```

NB: This project targets TypeScript 4 in strict mode.

## Roadmap

* Write more unit tests.
* Serialize classes as "class".
* Consider adding support for Promise<State<Value>>.
* Improve life-cycle management of elements.
* Implement getter and mapped setter for `augment()`.
* Investigate usability of a promise to state shim.
* Investigate value caching.
* Rename `value()` to `serialize()` if not implementing value caching.
* Decide on behaviour for `merge()` regarding nulls.
* Document `squash()`.
