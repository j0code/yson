import { escape } from "./escape.js";
import { StringifyOptions, TypedArray, isYSONStringifiable, keyRegex } from "./types.js";

export function stringifyValue(value: unknown, options: StringifyOptions, depth: number): string | undefined {
	switch (typeof value) {
		case "boolean":
			return value ? "true" : "false"

		case "number":
			return value.toString(10)

		case "string":
			return escape(value + "")
			
		case "bigint":
			return `#${value.toString(16)}`

		case "object":
			//console.log(value, "is obj")
			if (value == null) return "null"

			if (isYSONStringifiable(value)) {
				const newValue = value.toYSON()
				const type = value.constructor.name
				if (["string", "object"].includes(typeof newValue)) {
					const raw = stringifyValue(newValue, options, depth)
					if (type && type != "Object" && type != "Array") {
						return `${type}${options.spaceAfterPunctuation ? " " : ""}${raw}`
					}
					return raw // perhaps throw an Error? maybe configurable to ignore?
				}
			}

			if (Array.isArray(value)) return stringifyArray(value, options, depth)

			let stringified = stringifyBuiltin(value, options, depth)
			if (stringified == null) {
				stringified = stringifyObject(value as Record<string, unknown>, options, depth)
			}

			return stringified
	}

	return undefined
}

function stringifyArray(arr: unknown[], options: StringifyOptions, depth: number): string {
	return joinValues(arr.map(v => stringifyValue(v, options, depth + 1) ?? "null"), "[", "]", options, depth)
}

function stringifyObject(obj: Record<string, unknown>, options: StringifyOptions, depth: number): string {
	const colon = options.spaceAfterPunctuation ? ": " : ":"
	const type = obj.constructor.name
	const kvpairs = []
	
	for (let key in obj) {
		const value = obj[key]
		if (value == undefined || typeof value == "function") continue // do not emit undefined properties and functions

		if (!keyRegex.test(key)) key = escape(key)

		kvpairs.push(`${key}${colon}${stringifyValue(value, options, depth + 1)}`)
	}

	const objectLiteral = joinValues(kvpairs, "{", "}", options, depth)

	if (type && type != "Object") {
		return `${type}${options.spaceAfterPunctuation ? " " : ""}${objectLiteral}`
	}
	return objectLiteral
}

function joinValues(arr: unknown[], open: string, close: string, options: StringifyOptions, depth: number): string {
	if (arr.length == 0) return `${open}${close}`

	let separator = options.spaceAfterPunctuation ? ", " : ","

	if (options.space && arr.length > options.inlineChildren) {
		const indent = options.space.repeat(depth)
		const childIndent = indent + options.space
		return `${open}\n${childIndent}${arr.join(",\n" + childIndent)}\n${indent}${close}`
	} else {
		if (options.insetSpace) return `${open} ${arr.join(separator)} ${close}`
		return `${open}${arr.join(separator)}${close}`
	}
}

function stringifyBuiltin(value: object, options: StringifyOptions, depth: number): string | null {
	let result: { raw: string, type: string } | null = null

	if (value instanceof Map)  result = stringifyMap(value, options, depth)
	if (value instanceof Set)  result = stringifySet(value, options, depth)
	if (value instanceof Date) result = stringifyDate(value)
	if (value instanceof URL)  result = stringifyURL(value)
	if (ArrayBuffer.isView(value) || value instanceof ArrayBuffer) {
		result = stringifyArrayBufferLike(value, options, depth)
	}

	if (result) {
		return `${result.type}${options.spaceAfterPunctuation ? " " : ""}${result.raw}`
	}

	return null
}

function stringifyMap(map: Map<string, unknown>, options: StringifyOptions, depth: number) {
	const obj = Object.fromEntries(map.entries())
	const raw = stringifyObject(obj, options, depth)

	return { raw, type: "Map" }
}

function stringifySet(set: Set<unknown>, options: StringifyOptions, depth: number) {
	const arr = Array.from(set.values())
	const raw = stringifyArray(arr, options, depth)

	return { raw, type: "Set" }
}

function stringifyDate(date: Date) {
	const raw = escape(date.toISOString())

	return { raw, type: "Date" }
}

function stringifyURL(url: URL) {
	const raw = escape(url.href)

	return { raw, type: "URL" }
}

function stringifyArrayBufferLike(buffer: ArrayBuffer | ArrayBufferView<ArrayBufferLike>, options: StringifyOptions, depth: number) {
	const type = buffer.constructor.name
	let arr: (number | bigint)[]

	if      (buffer instanceof DataView)    arr = Array.from(new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength))
	else if (buffer instanceof ArrayBuffer) arr = Array.from(new Uint8Array(buffer))
	else arr = Array.from(buffer as unknown as Iterable<number | bigint>)

	const raw = stringifyArray(arr, options, depth)

	return { raw, type }
}