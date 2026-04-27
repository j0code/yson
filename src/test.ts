import { Temporal } from "@js-temporal/polyfill"
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
	if (Array.isArray(a) != Array.isArray(b)) return false
	if (Array.isArray(a) && Array.isArray(b)) {
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
		if (!Array.isArray(x)) return
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

// Temporal type stringify tests with hardcoded expectations
console.log("\n--- Temporal Type Stringify Tests ---\n")

const temporalStringifyTests = [
	// Instant
	{ value: Temporal.Instant.from("2024-06-15T10:30:00Z"), expected: `Instant"2024-06-15T10:30:00Z"` },
	{ value: Temporal.Instant.from("2020-01-01T00:00:00Z"), expected: `Instant"2020-01-01T00:00:00Z"` },
	
	// Duration
	{ value: Temporal.Duration.from({ days: 5 }), expected: `Duration"P5D"` },
	{ value: Temporal.Duration.from({ years: 1, months: 2, days: 3 }), expected: `Duration"P1Y2M3D"` },
	
	// PlainDate
	{ value: Temporal.PlainDate.from("2024-06-15"), expected: `PlainDate"2024-06-15"` },
	{ value: Temporal.PlainDate.from("2000-01-01"), expected: `PlainDate"2000-01-01"` },
	
	// PlainTime
	{ value: Temporal.PlainTime.from("14:30:00"), expected: `PlainTime"14:30:00"` },
	{ value: Temporal.PlainTime.from("23:59:59.999"), expected: `PlainTime"23:59:59.999"` },
	
	// PlainDateTime
	{ value: Temporal.PlainDateTime.from("2024-06-15T14:30:00"), expected: `PlainDateTime"2024-06-15T14:30:00"` },
	{ value: Temporal.PlainDateTime.from("2000-01-01T00:00:00"), expected: `PlainDateTime"2000-01-01T00:00:00"` },
	
	// PlainMonthDay
	{ value: Temporal.PlainMonthDay.from("06-15"), expected: `PlainMonthDay"06-15"` },
	{ value: Temporal.PlainMonthDay.from("12-25"), expected: `PlainMonthDay"12-25"` },
	
	// PlainYearMonth
	{ value: Temporal.PlainYearMonth.from("2024-06"), expected: `PlainYearMonth"2024-06"` },
	{ value: Temporal.PlainYearMonth.from("2000-01"), expected: `PlainYearMonth"2000-01"` },
	
	// ZonedDateTime
	{ value: Temporal.ZonedDateTime.from("2024-06-15T14:30:00[UTC]"), expected: `ZonedDateTime"2024-06-15T14:30:00+00:00[UTC]"` },
	{ value: Temporal.ZonedDateTime.from("2010-01-01T00:00:00[UTC]"), expected: `ZonedDateTime"2000-01-01T00:00:00+00:00[UTC]"` },
]

let passCount = 0
let failCount = 0

for (const test of temporalStringifyTests) {
	try {
		const stringified = YSON.stringify(test.value)
		if (stringified === test.expected) {
			console.log(`  ✓ ${stringified}`)
			passCount++
		} else {
			console.log(`  ✗ got:      ${stringified}`)
			console.log(`    expected: ${test.expected}`)
			failCount++
		}
	} catch (e) {
		console.log(`  ✗ error: ${(e as Error).message}`)
		failCount++
	}
}

console.log(`\n${passCount} passed, ${failCount} failed`)