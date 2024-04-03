# YScript Object Notation
YSON implementation for JavaScript

YSON is similar to JSON.
Main benefits:
- smaller filesize
- no "" around keys
- Types (coming soon)

## Install
##### Coming soon!
### JSR
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
let t = YSON.parse(s, [YourClass1, YourClass2]) // allows parsing your own classes (see Types) (coming soon!)
```

### Web
```js
import YSON from "https://j0code.github.io/yson/dist/main.js"
```
or host it yourself!

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

### Object
The difference to JSON is that you don't need double quotes (`""`) around keys in most cases.<br>If your keys include any characters other than `a-zA-Z0-9_-`, you will need to use a string.
```js
{
  a: 3,
  s: "a string",
  b: false
  this works: true
}
```

### Array
```js
[1, 2, 3, 4, "Hello World", false, 42]
```

### Types
Note: this is in development in therefore is subject to change
```js
{
  a: Date {
    date: "2022-06-06T11:59:41.108Z"
  },
  b: URL {
    href: 'https://github.com/j0code/node-yson/'
  },
  c: Map {
    key1: value1,
    key2: value2
  },
  d: Set [value1, value2],
  e: YourClass {
    x: 5
    y: 3
  },
	f: YourClass [ // Note: if you don't want this to work, return null on static .fromYSON()
		1, 2, 3
	]
}
```

### Custom Types
Note: this is in development in therefore is subject to change

## API
### parse
```ts
YSON.parse(raw, types)
```
Parameters:
- raw: raw yson string
- types: list of classes that should be parsed

The YSON parser takes the first class with the name specified before `{}`, `[]`, or `""` (e.g. `YourClass1 {}`).

If your class declares a static function fromYSON(),<br>
the parser will feed the object into the first parameter and will go on with the return value.<br>
Otherwise, it will use the constructor instead.

Example:
```ts
const data = YSON.parse(`{ message: "ok", status: 200 }`, [YourClass1, YourClass2])
```

### stringify
```ts
const raw = YSON.stringify(data, options)
```
Parameters:
- data: any value
- options:
  - space: string (adds indentation, white space, and line break characters to the output YSON to make it easier to read)
  - spaceAfterPunctuation: boolean (adds spaces after `,` and `:`)
  - insetSpace: boolean (adds spaces in arrays and objects (`[1, 2]` -> `[ 1, 2 ]`))
  - inlineChilden: number (max. amount array/object children before inserting line breaks (only applicable when space is speified), default: 3)

YSON will automatically include the class name derived from `obj.constructor.name`.

If you want to customize the behavior of stringify, you can define either `toYSON()` or `toJSON()`.
(`toYSON()` is prioritized)

This is useful if you have private fields that you want to save.

**Note:** Native Types (like Map) take priority, so any classes named Map, Set, Date,... are ignored.

Example:
```ts
const raw = YSON.stringify({ message: "ok", status: 200 }, { space: "\t" })
```

### load
```ts
const raw = YSON.stringify(source, types)
```
Parameters:
- source: URL | string (source url or local path)
- types: see parse