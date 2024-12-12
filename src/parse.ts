import YSONError from "./YSONError.js"
import YSONSyntaxError from "./YSONSyntaxError.js"
import { defaultRevivers } from "./defaultRevivers.js"
import { escapeBare, unescape } from "./escape.js"
import { ParseOptions, ReturnValue, Trace, YSONParsable, YSONParseType, YSONReviver, YSONValue, keyCharRegex } from "./types.js"

export function parseValue(raw: string, types: Record<string, YSONParseType>, options: ParseOptions, startI: number, trace: Trace, allowEnd: boolean = false): ReturnValue<YSONValue> {
	let value = ""

	let i = startI
	for (; i < raw.length; i++) {
		const c = raw[i]

		//console.log(raw, i, c)
		if (c == "[") {
			const result = parseArray(raw, types, options, i + 1, trace)

			return parseType(value, result.value, types, result.i, trace)
		}

		if (c == "{") {
			const result = parseObject(raw, types, options, i + 1, trace)

			return parseType(value, result.value, types, result.i, trace)
		}

		if (c == "\"") {
			const result = parseString(raw, types, options, i + 1, trace)

			return parseType(value, result.value, types, result.i, trace)
		}

		if (c == "," || c == "]" || c == "}") return { value: parseLiteral(value, startI, trace), i }

		value += c
	}

	// error
	if (allowEnd) return { value: parseLiteral(value, startI, trace), i }
	throw new YSONSyntaxError(`Unexpected end of YSON input`, i, trace)
}

function parseString(raw: string, types: Record<string, YSONParseType>, options: ParseOptions, i: number, trace: Trace): ReturnValue<string> {
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

function parseArray(raw: string, types: Record<string, YSONParseType>, options: ParseOptions, i: number, trace: Trace): ReturnValue<unknown[]> {
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
		if (raw[i] != ",") throw new YSONSyntaxError(`Unexpected token '${escapeBare(raw[i])}' in YSON`, i, trace)
	}

	// error
	throw new YSONSyntaxError(`Unexpected end of YSON input`, i, trace)
}

function parseObject(raw: string, types: Record<string, YSONParseType>, options: ParseOptions, i: number, trace: Trace): ReturnValue<Record<string, unknown>> {
	const value: Record<string, unknown> = {}

	for (; i < raw.length; i++) {
		const c = raw[i]

		if (c == "}") return { value, i: i + 1 }
		if (/\s/.test(c)) continue

		const keyResult = parseKey(raw, types, options, i, trace)
		i = keyResult.i

		if (keyResult.value.length == 0) throw new YSONSyntaxError(`Expected property name or '}' in YSON`, i, trace)

		//console.log(keyResult, i, raw[i])
		if (raw[i] != ":") throw new YSONSyntaxError(`Unexpected token '${escapeBare(raw[i])}' in YSON`, i, trace)

		const valueResult = parseValue(raw, types, options, i + 1, { path: trace.path.length > 0 ? `${trace.path}.${keyResult.value}` : keyResult.value })
		i = valueResult.i

		value[keyResult.value] = valueResult.value

		while (/\s/.test(raw[i])) i++

		if (raw[i] == "}") return { value, i: i + 1 }
		if (raw[i] != ",") throw new YSONSyntaxError(`Unexpected token '${escapeBare(raw[i])}' in YSON`, i, trace)
	}

	// error
	throw new YSONSyntaxError(`Unexpected end of YSON input`, i, trace)
}

function parseKey(raw: string, types: Record<string, YSONParseType>, options: ParseOptions, i: number, trace: Trace): ReturnValue<string> {

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
		if (!keyCharRegex.test(raw[i])) throw new YSONSyntaxError(`Unexpected token '${escapeBare(raw[i])}' in YSON`, i, trace)

		value += c
	}

	// error
	throw new YSONSyntaxError(`Unexpected end of YSON input`, i, trace)
}

function parseLiteral(value: string, i: number, trace: Trace): number | bigint | boolean | null {
	value = value.trim()
	//console.log(`literal: >${value}<`)

	if (value == "null") return null
	if (value == "true") return true
	if (value == "false") return false

	if (value.startsWith("#")) { // hex
		const hex = parseInt(value.substring(1), 16)
		if (!isNaN(hex)) return BigInt(hex)

		throw new YSONSyntaxError(`Invalid literal ${value} in YSON`, i, trace)
	}

	const num = parseFloat(value) // temp (allows 0x123 and 0b10)
	if (!isNaN(num)) return num

	throw new YSONSyntaxError(`Invalid literal ${value} in YSON`, i, trace)
}

function parseType(typeName: string, value: any, types: Record<string, YSONParseType>, i: number, trace: Trace): ReturnValue<any> {
	typeName = typeName.trim()
	if (!typeName || !(typeName in types)) return { value, i }
	const type = types[typeName]

	let reviver: YSONReviver<any>
	if (typeof type == "function" && "fromYSON" in type && typeof type.fromYSON == "function") {
		reviver = (x, info) => {
			const value = (type.fromYSON as YSONReviver<any>)(x, info)
			if (!(value instanceof type)) return undefined
			return value
		}
	} else if (typeof type == "function") {
		reviver = type
	} else throw new YSONError(`Invalid parse type ${typeName}`, i, trace)

	let newValue
	try {
		newValue = reviver(value, { name: typeName })
	} catch (e) {
		if (Object.values(defaultRevivers).includes(reviver)) {
			throw new YSONError((e as Error).message, i, trace)
		}
		throw new YSONError(`Parsing of type ${typeName} failed`, i, trace, e)
	}

	if (!newValue) throw new YSONError(`Parsing of type ${typeName} failed`, i, trace)

	return { value: newValue, i}
}
