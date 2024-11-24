import YSONSyntaxError from "./YSONSyntaxError.js"
import { unescape } from "./escape.js"
import { ParseOptions, ReturnValue, Trace, YSONValue, keyCharRegex } from "./types.js"

export function parseValue(raw: string, types: any[], options: ParseOptions, startI: number, trace: Trace, allowEnd: boolean = false): ReturnValue<YSONValue> {
	let value = ""

	let i = startI
	for (; i < raw.length; i++) {
		const c = raw[i]

		//console.log(raw, i, c)
		if (c == "[") {
			const result = parseArray(raw, types, options, i + 1, trace)

			if (value.trim()) throw "a types not implemented"
			return result
		}

		if (c == "{") {
			const result = parseObject(raw, types, options, i + 1, trace)

			if (value.trim()) throw "o types not implemented"
			return result
		}

		if (c == "\"") {
			const result = parseString(raw, types, options, i + 1, trace)

			if (value.trim()) throw "s types not implemented"
			return result
		}

		if (c == "," || c == "]" || c == "}") return { value: parseLiteral(value, startI, trace), i }

		value += c
	}

	// error
	if (allowEnd) return { value: parseLiteral(value, startI, trace), i }
	throw new YSONSyntaxError(`Unexpected end of YSON input`, i, trace)
}

function parseString(raw: string, types: any[], options: ParseOptions, i: number, trace: Trace): ReturnValue<string> {
	let value = ""

	for (; i < raw.length; i++) {
		const c = raw[i]

		if (c == "\"") { // TODO: ignore when backslash
			try {
				value = unescape(value)
			} catch (e) {
				throw new YSONSyntaxError(`Bad control character in string literal in YSON`, i, trace)
			}
			return { value, i: i + 1 }
		}

		value += c
	}

	// error
	throw new YSONSyntaxError(`Unexpected end of YSON input`, i, trace)
}

function parseArray(raw: string, types: any[], options: ParseOptions, i: number, trace: Trace): ReturnValue<unknown[]> {
	const value: unknown[] = []

	for (; i < raw.length; i++) {
		const c = raw[i]

		//console.log(raw, i, c)
		if (c == "]") return { value, i: i + 1 }

		const result = parseValue(raw, types, options, i, { path: trace.path.length > 0 ? `${trace.path}[${value.length}]` : (value.length + "") })
		//console.log(value, result, raw)

		value.push(result.value)
		i = result.i

		while (/\s/.test(raw[i])) i++

		if (raw[i] == "]") return { value, i: i + 1 }
		if (raw[i] != ",") throw new YSONSyntaxError(`Unexpected token '${raw[i]}' in YSON`, i, trace)
	}

	// error
	throw new YSONSyntaxError(`Unexpected end of YSON input`, i, trace)
}

function parseObject(raw: string, types: any[], options: ParseOptions, i: number, trace: Trace): ReturnValue<Record<string, unknown>> {
	const value: Record<string, unknown> = {}

	for (; i < raw.length; i++) {
		const c = raw[i]

		if (c == "}") return { value, i: i + 1 }
		if (/\s/.test(c)) continue

		const keyResult = parseKey(raw, types, options, i, trace)
		i = keyResult.i

		//console.log(keyResult, i, raw[i])
		if (raw[i] != ":") throw new YSONSyntaxError(`Unexpected token '${raw[i]}' in YSON`, i, trace)

		const valueResult = parseValue(raw, types, options, i + 1, { path: trace.path.length > 0 ? `${trace.path}.${keyResult.value}` : keyResult.value })
		i = valueResult.i

		value[keyResult.value] = valueResult.value

		while (/\s/.test(raw[i])) i++

		if (raw[i] == "}") return { value, i: i + 1 }
		if (raw[i] != ",") throw new YSONSyntaxError(`Unexpected token '${raw[i]}' in YSON`, i, trace)
	}

	// error
	throw new YSONSyntaxError(`Unexpected end of YSON input`, i, trace)
}

function parseKey(raw: string, types: any[], options: ParseOptions, i: number, trace: Trace): ReturnValue<string> {

	const c = raw[i]
	if (c == "\"") {
		const result = parseString(raw, types, options, i + 1, trace)

		return { value: result.value, i: result.i }
	}

	let value = ""

	for (; i < raw.length; i++) {
		const c = raw[i]

		//console.log(raw, i, c)
		if (c == ":") return { value, i }
		if (!keyCharRegex.test(raw[i])) throw new YSONSyntaxError(`Unexpected token '${raw[i]}' in YSON`, i, trace)

		value += c
	}

	// error
	throw new YSONSyntaxError(`Unexpected end of YSON input`, i, trace)
}

function parseLiteral(value: string, i: number, trace: Trace): number | boolean | null {
	value = value.trim()
	//console.log(`literal: >${value}<`)

	if (value == "null") return null
	if (value == "true") return true
	if (value == "false") return false

	if (value.startsWith("#")) { // hex
		const hex = parseInt(value.substring(1), 16)
		if (!isNaN(hex)) return hex
	}

	const num = Number(value) // temp (allows 0x123 and 0b10)
	if (!isNaN(num)) return num

	throw new YSONSyntaxError(`Invalid literal ${value} in YSON`, i, trace)
}