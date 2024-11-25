import { escape } from "./escape.js";
import { StringifyOptions, isYSONStringifiable, keyRegex } from "./types.js";

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

			if (value instanceof Array) return stringifyArray(value, options, depth)
			if (value instanceof Map) {
				const newValue = Object.fromEntries(value.entries())
				const raw = stringifyObject(newValue, options, depth)
				return `Map${options.spaceAfterPunctuation ? " " : ""}${raw}`
			}
			if (value instanceof Set) {
				const newValue = Array.from(value.values())
				const raw = stringifyArray(newValue, options, depth)
				return `Set${options.spaceAfterPunctuation ? " " : ""}${raw}`
			}
			if (value instanceof Date) {
				const newValue = value.toISOString()
				const raw = escape(newValue)
				return `Date${options.spaceAfterPunctuation ? " " : ""}${raw}`
			}
			if (value instanceof URL) {
				const newValue = value.href
				const raw = escape(newValue)
				return `URL${options.spaceAfterPunctuation ? " " : ""}${raw}`
			}
			if (ArrayBuffer.isView(value) || value instanceof ArrayBuffer) {
				const type = value.constructor.name
				if (value instanceof DataView) value = value.buffer
				if (value instanceof ArrayBuffer) value = new Uint8Array(value)
				const raw = stringifyArray(Array.from(value as []), options, depth)
				return `${type}${options.spaceAfterPunctuation ? " " : ""}${raw}`
			}

			return stringifyObject(value as Record<string, unknown>, options, depth)
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