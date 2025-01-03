import { YSONReviver } from "./types.js"
import YSON from "./YSON.js"

const tests = {
	raw:    ["null", "true", "false", "0", "1.5", "#abc123", `"hello world"`, "[]", "[1, 2, true]", "{}", `{key: "value", "u\\n": -3e4, w: [false, [], {}]}`],
	parsed: [ null,   true,   false,   0,   1.5,  0xabc123n,  "hello world",   [],   [1, 2, true],   {},   {key: "value", "u\n":  -3e4, w: [false, [], {}]}]
}

console.clear()

for (let i = 0; i < tests.raw.length; i++) {
	const raw = tests.raw[i]
	const expected = tests.parsed[i]

	let parsed
	try {
		parsed = YSON.parse(raw)
	} catch (e) {
		console.log(`parse (${i}) failed:`, e)
		continue
	}

	if (!equals(expected, parsed)) {
		console.log(`parse (${i}) failed:`, parsed, "!=", expected)
		continue
	}

	let stringified
	try {
		stringified = YSON.stringify(parsed, { spaceAfterPunctuation: true, insetSpace: true, space: "\t", inlineChildren: 3 })
	} catch (e) {
		console.log(`stringify (${i}) failed:`, e)
		continue
	}

	console.log(`test (${i}) success:`, parsed, stringified)
}

function equals(a: unknown, b: unknown) {
	if (typeof a != typeof b) return false
	if (typeof a != "object" || typeof b != "object") return a == b

	if (a == null) return b == null
	if (a instanceof Array != b instanceof Array) return false
	if (a instanceof Array && b instanceof Array) {
		if (a.length != b.length) return false
	}
	for (let key in a) {
		if (!(key in b!)) return false
		// @ts-ignore
		if (!equals(a[key], b[key])) return false
	}

	return true
}

// test types

class TestClass {

	static fromYSON: YSONReviver<TestClass> = x => {
		if (typeof x != "object") return
		const a = "a" in x ? x.a as string : ""
		const b = "b" in x ? x.b as number : 3
		return new TestClass(a, b)
	}

	constructor(public readonly a: string, private b: number) {}

	get u() {
		return this.b + 6
	}

	toYSON() {
		return { a: this.a, b: this.b }
	}

}

class StringClass {

	static fromYSON: YSONReviver<StringClass> = x => {
		if (typeof x != "string") return
		return new StringClass(x)
	}

	constructor(readonly source: string) {}

	toYSON() {
		return this.source
	}

}

class Tuple<T> {

	static fromYSON: YSONReviver<Tuple<any>> = x => {
		if (!(x instanceof Array)) return
		return new Tuple(...x)
	}

	private readonly elems: T[]

	constructor(...elems: T[]) {
		this.elems = elems
	}

	get(i: number) {
		return this.elems[i]
	}

	toYSON() {
		return this.elems
	}

}

const testInstance = new TestClass("hello world", 4)
const stringInstance = new StringClass("foo bar")
const tupleInstance = new Tuple(4, 12, -3)
const obj = { testInstance, stringInstance, tupleInstance,
	map: new Map([["a", 5], ["b", 7]]),
	set: new Set([1, 2, 3]),
	date: new Date(),
	url: new URL("https://www.example.com/"),
	/*buffer: new ArrayBuffer(4),
	view: new DataView(new Uint16Array([1, 2, 3, 4]).buffer),
	int8: new Int8Array([25, -4]),
	uint8: new Uint8Array([16, 2]),
	uint8clamp: new Uint8ClampedArray([9, 144]),
	int16: new Int16Array([1]),
	uint16: new Uint16Array([2]),
	int32: new Int32Array([-109, 8, 31]),
	uint32: new Uint32Array([4, 3]),
	bigint64: new BigInt64Array([292872392n, -39999999n, BigInt(Number.MAX_SAFE_INTEGER)]),
	biguint64: new BigUint64Array([3n, 1n, 4n, 1n, 5n]),
	float32: new Float32Array([2.4, Math.E]),
	float64: new Float64Array([Math.SQRT2, 3e4])*/
}
const raw = YSON.stringify(obj, /*{ space: "  " }*/)!
const parsed = YSON.parse(raw, { TestClass, StringClass, Tuple })

console.dir(obj, { depth: Infinity })
console.log(raw)
console.dir(parsed, { depth: Infinity })
console.log("type test", equals(obj, parsed) ? "success" : "failed")
