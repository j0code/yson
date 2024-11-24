import YSON from "./YSON.js"

const tests = {
	raw:    ["null", "true", "false", "0", "1.5", "#abc123", `"hello world"`, "[]", "[1, 2, true]", "{}", `{key: "value", "u\\n": -3e4, w: [false, [], {}]}`],
	parsed: [ null,   true,   false,   0,   1.5,  0xabc123,   "hello world",   [],   [1, 2, true],   {},   {key: "value", "u\n":  -3e4, w: [false, [], {}]}]
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
		stringified = YSON.stringify(parsed, { spaceAfterPunctuation: true, insetSpace: true, space: "\t" })
	} catch (e) {
		console.log(`stringify (${i}) failed:`, e)
		continue
	}

	console.log(`test (${i}) success:`, parsed, stringified)
}

function equals(a: unknown, b: unknown) {
	if (typeof a != typeof b) return false

	if (typeof a == "object" && typeof b == "object") {
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
	} else {
		return a == b
	}
}