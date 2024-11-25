# YScript Object Notation
YSON implementation for JavaScript

YSON is similar to JSON.
Main benefits:
- no "" around keys
- Types
- support for built-in JS classes
- smaller filesize

## Install
### JSR
```
$ npx jsr add @j0code/yson
```
### NPM
```
$ npm i @j0code/yson
```

## Usage

### node.js
```js
import YSON from "@j0code/yson"

// same as JSON
let s = YSON.stringify(someObject)
let o = YSON.parse(s)

// additional
let f = await YSON.load("./file.yson") // load file with fetch and YSON.parse() it
let t = YSON.parse(s, [YourClass1, YourClass2]) // allows parsing your own classes (see Types)
```

### Web
```js
import YSON from "https://j0code.github.io/yson/main.js"
```
or host it yourself!

**Note:** for proper type-checking, include the following in your `tsconfig.json`:
```json
"paths": {
	"https://j0code.github.io/yson/*": ["./node_modules/@j0code/yson/src/*"]
}
```

## Specification

### Number, Boolean, Null, String, Hexadecimal Integer
```js
5
6.5
.33
1.5e-2
true
false
null
"Hello World"
#abcdef
```
In JavaScript, hexadecimal integers are represented as [BigInts](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt).
Strings only allow double quotes (`""`). Single quotes (`''`) are not supported.

### Object
The difference to JSON is that you don't need double quotes (`""`) around keys in most cases.<br>If your keys include any characters other than `a-zA-Z0-9_-`, you will need to use a string.
```js
{
	a: 3,
	s: "a string",
	b: false
	"this works": true
}
```

### Array
```js
[1, 2, 3, 4, "Hello World", false, 42]
```

### Types
```js
{
	a: Date "2022-06-06T11:59:41.108Z",
	b: URL "https://github.com/j0code/node-yson/",
	c: Map {
		key1: value1,
		key2: value2
	},
	d: Set [value1, value2],
	e: YourClass {
		x: 5
		y: 3
	},
	f: YourClass [
		1, 2, 3
	]
}
```

See also: [Custom Types]("#custom-types")

## API
### parse
```ts
YSON.parse(raw, types, options)
```
#### Parameters:
- raw: raw YSON string
- types: types to recognise and parse (optional)
- options: `ParseOptions`, currently nothing (optional)

Parses your raw YSON string and returns a `YSONValue`.

See more on the `types` parameter: [Custom Types]("#custom-types")

#### Example:
```ts
const data = YSON.parse(`{ message: "ok", status: 200 }`)
```

### stringify
```ts
const raw = YSON.stringify(data, options)
```
#### Parameters:
- data: any value
- options:
	- space: string (adds indentation, white space, and line break characters to the output YSON to make it easier to read)
	- spaceAfterPunctuation: boolean (adds spaces after `,`, `:` and type names)
	- insetSpace: boolean (adds spaces in arrays and objects (`[1, 2]` -> `[ 1, 2 ]`))
	- inlineChildren: number (max. amount array/object children before inserting line breaks (only applicable when space is specified), default: 0)

Stringifies data by representing it in YSON format.

#### Example:
```ts
const raw = YSON.stringify({ message: "ok", status: 200 }, { space: "\t" })
```

### load
```ts
const raw = YSON.stringify(source, types)
```
#### Parameters:
- source: URL | string (url or local path to source .yson file)
- types: see [parse](#parse)

Uses `fetch()` to load the UTF-8 encoded file specified in `source` and then parses its contents.

#### Example:
```ts
const data = YSON.load("./data.yson")
```


## Custom Types
By default, types are automatically emitted.
They are taken from `instance.constructor.name` where `instance` is an Instance of some arbitrary class.

For parsing, the YSON Parser actually needs some more information.
You need to provide an Object that maps type names to `YSONReviver` functions or the constructor of your class if it has a static method `.fromYSON()` which is a `YSONReviver`. Their purpose is to validate the input and/or turn the raw data into a more useful object (e.g. your class).


### Examples
##### Rectangle.ts
```ts
import { YSONReviver } from "@j0code/yson"

export default class Rectangle {

	// the type annotation is technically not necessary but helps to avoid mistakes and enables code completion
	static fromYSON: YSONReviver<Rectangle> = x => {
		if (typeof x != "object" || x instanceof Array) return // reject String and Array types

		if (!("width"  in x)) throw new Error("Rectangles need to have a width")
		if (!("height" in x)) throw new Error("Rectangles need to have a height")

		return new Rectangle(x.width, x.height)
	}

	readonly width: number
	readonly height: number

	constructor(width: number, height: number) {
		this.width = width
		this.height = height
	}

	get area() {
		return this.width = this.height
	}

	toYSON() {
		return { width: this.width, height: this.height }
	}

}

const square1 = new Rectangle(20, 20)
const square2 = new Rectangle(10, 10)

const data = YSON.stringify([ square1, square2 ]) // [Rectangle{width:20,height:20},Rectangle{width:10,height:10}]
```
##### Vector.ts
```ts
export function parseVector(vec: unknown) {
	if (!(vec instanceof Array)) return // reject String and Object types

	if (typeof vec[0] != "number") return
	if (typeof vec[1] != "number") return

	return { ...vec, x: vec[0], y: vec[0], toYSON: () => [vec[0], vec[1]] }
}

const vec = YSON.parse("Vector [3, 4]", { Vector: parseVector } ) // => { '0': 3, '1': 4, x: 3, y: 4, toYSON: [Function: toYSON] }
```
This example shows how you could both validate inputs and provide a more user-friendly interface (vec.x instead of vec[0]).

**Caution:** stringifying will lose type information since this is not a class

##### config.yson
```json
{
	window: {
		position: Vector [0, 500],
		dimensions: Rectangle { width: 300, height: 200 }
	}
}
```

##### main.ts
```ts
import { YSON } from "@j0code/yson"
import Rectangle from "./Rectangle.js"
import { parseVector } from "./Vector.js"

const brokenConfig = YSON.load("./config.yson")
// { window: { position: [ 0, 500 ], dimensions: { width: 300, height: 200 } } }

const config = YSON.load("./config.yson", { Rectangle, Vector: parseVector })
// { window: { position: { '0': 1, '1': 4, x: 1, y: 1, toYSON: [Function: toYSON] }, dimensions: Rectangle { width: 300, height: 200 } } }