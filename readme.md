# @joelek/bonsai

Lightweight, functional and robust library for creating reactive web components. Written completely in TypeScript.

```ts
import { html } from "@joelek/bonsai";

let ul = html.ul("my-list")
	.listener("onclick", (event, element) => {})
	.nodes([
		html.li().nodes(["One"]),
		html.li().nodes(["Two"])
	]);
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

let ul = html.ul("my-list")
	.listener("onclick", (event, element) => {})
	.nodes([
		html.li().nodes(["One"]),
		html.li().nodes(["Two"])
	]);
```

Bonsai provides functional subclasses for all HTML and SVG element classes in the DOM. The subclasses are safe, scalable and have great interoperability with other libraries or existing code.

### Interactive State

Bonsai can be used to build reactive web components without the additional overhead and drawbacks of performing document updates using virtual fragments and through diffing algorithms.

The interactive state API provides functionality for creating data models as well as the way in which the models are transformed into and presented as web components. When the data model is updated, so are the affected parts of the component.

State may be bound to an attribute of an element as shown in the example below.

```ts
import { html, state } from "@joelek/bonsai";

let model = state("my-list"); // State with type string is created.

let ul = html.ul(model) // State is implicitly bound to the class attribute.
	.nodes([
		html.li().nodes(["One"]),
		html.li().nodes(["Two"])
	]);

model.update("my-new-list"); // State instantly updates the class attribute.
```

State may be bound to the child nodes of an element as shown in the example below.

```ts
import { html, state } from "@joelek/bonsai";

let model = state(["One", "Two"]); // State with type Array<string> is created.

let ul = html.ul("my-list")
	.nodes(model.map((state) => // State is mapped for each element in the array.
		html.li().nodes([state]) // State is implicitly bound to the child nodes.
	));

model.append("Three"); // State instantly updates the child nodes.
```

A correct set of mutations is applied to the fragment when the state is updated as the state is bound directly to the fragment. This in contrast to diffing algorithms where a certain amount of guesswork has to be done regarding which set of mutations to apply.

Consider the two examples below. One algorithm may consider the list as having been updated with an insert in between the two list items. Another algorithm may consider the second list item as having been removed and two new items as having been inserted. A third algorithm may consider the entire list as having been recreated.

All three algoritms produce mutation sets that when applied update the fragment correctly. Although choosing the incorrect mutation set may have unintended side-effects that at best irritate the programmer and at worst break the end user experience.

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


## API

### Functional Element

Functional elements are created through the factory functions defined in the `html` and `svg` modules.

```ts
import { html, svg } from "@joelek/bonsai";

let div = html.div();
let circle = svg.circle();
```

#### Attribute

An attribute may be set for the element through the `attribute(key, value?)` method.

* The `key` argument must be used to specify the attribute key.
* The `value` argument may be used to specify the attribute value.

The attribute with the given `key` may be removed by omitting the `value` argument.

#### Listener

A listener may be added to the element through the `listener(type, listener?)` method.

* The `type` argument must be used to specify the event type using the `on*` format.
* The `listener` argument may be used to specify the listener.

There may only be a single listener added to each element for each unique event type. The listener added for the given `type` may be removed by omitting the `listener` argument.

#### Nodes

Child nodes may be set for the element through the `nodes(items)` method.

* The `items` argument must be used to specify the child nodes. State is bound to the element and may be used to update the child nodes dynamically.

#### Process

An element may be processed in a processing block through the `process(callback)` method.

* The `callback` argument must be used to specify the callback.

### Interactive State

State should be created through the `state()` function. The function adapts to its input and creates an instance of the appropriate class.

```ts
import { state } from "@joelek/bonsai";

let one = state(1);
let two = state(2);
```

Multiple states may be combined into a single state using the `computed()` function.

```ts
import { state, computed } from "@joelek/bonsai";

let one = state(1);
let two = state(2);
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

An instance of `PrimitiveState` is created when a primitive is passed to the `state()` function. The `PrimitiveState` class extends from the `State` class.

* Instances of `PrimitiveState` emit an `update` event when the stored value changes.

Primitive values are bigint, boolean, number, string, null and undefined.

### ArrayState

An instance of `ArrayState` is created when an array is passed to the `state()` function. The `ArrayState` class extends from the `State` class.

* Instances of `ArrayState` emit an `update` event when the stored value changes.
* Instances of `ArrayState` emit an `insert` event when an element is inserted.
* Instances of `ArrayState` emit an `remove` event when an element is removed.

#### Append

Values or states may be appended to the array through the `append(item)` method.

* The `item` argument must be used to specify the value or state to append.

#### Element

Elements may be retrieved from the array through the `element(index)` method.

* The `index` argument must be used to specify the index of the element.

An error is thrown when the index is out of bounds.

#### Insert

Values or states may be inserted into the array through the `insert(index, item)` method.

* The `index` argument must be used to specify the index of the element.
* The `item` argument must be used to specify the value or state to insert.

An error is thrown when the index is out of bounds.

#### Length

The number of elements stored in the array may be retrieved through the `length()` method.

#### MapValues

The values of an array may be mapped into a new array through the `mapValues(mapper)` method.

* The `mapper` argument must be used to specify how an existing value should be mapped to a new value.

The states of value-mapped arrays are initialized using the `mapper` and recomputed when updates are made to the states of the original array. This is most often the desired behaviour.

#### MapStates

The states of an array may be mapped into a new array through the `mapStates(mapper)` method.

* The `mapper` argument must be used to specify how an existing state should be mapped to the a new value or state.

The states of state-mapped arrays are initialized using the `mapper` but not recomputed when updates are made to the states of the original array.

#### Remove

Elements may be removed from the array through the `remove(index)` method.

* The `index` argument must be used to specify the index of the element.

An error is thrown when the index is out of bounds.

### ObjectState

An instance of `ObjectState` is created when an object is passed to the `state()` function. The `ObjectState` class extends from the `State` class.

* Instances of `ObjectState` emit an `update` event when the stored value changes.

#### Member

Members may be retrieved from the object through the `member(key)` method.

* The `key` argument must be used to specify the key of the member.

### ReferenceState

An instance of `ReferenceState` is created when an instance of a class is passed to the `state()` function. The `ReferenceState` class extends from the `State` class.

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
npm install joelek/bonsai#semver:^0.1
```

Use the following command to install the very latest build. The very latest build may include breaking changes and should not be used in production environments.

```
npm install joelek/bonsai#master
```

NB: This project targets TypeScript 4 in strict mode.

## Roadmap

* Write unit tests.
* Document suggested structure for web components.
