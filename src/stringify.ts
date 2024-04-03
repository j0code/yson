import { escape } from "./escape.js";
import { StringifyOptions, keyRegex } from "./types.js";

export function stringify(value: unknown, options: Partial<StringifyOptions> = {}): string | undefined {
	options.insetSpace ??= Boolean(options.space)
	options.spaceAfterPunctuation ??= Boolean(options.space)
	options.inlineChilden ??= 3

	return stringifyValue(value, options as StringifyOptions, 0)
}

function stringifyValue(value: unknown, options: StringifyOptions, depth: number): string | undefined {
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
			if (value instanceof Array) return stringifyArray(value, options, depth)
			return stringifyObject(value as Record<string, unknown>, options, depth)
	}

	return undefined
}

function stringifyArray(arr: unknown[], options: StringifyOptions, depth: number): string {
	return joinValues(arr.map(v => stringifyValue(v, options, depth + 1) ?? "null"), "[", "]", options, depth)
}

function stringifyObject(obj: Record<string, unknown>, options: StringifyOptions, depth: number): string {
	let colon = options.spaceAfterPunctuation ? ": " : ":"
	const kvpairs = []

	for (let key in obj) {
		const value = obj[key]
		if (!keyRegex.test(key)) key = escape(key)

		kvpairs.push(`${key}${colon}${stringifyValue(value, options, depth + 1)}`)
	}

	return joinValues(kvpairs, "{", "}", options, depth)
}

function joinValues(arr: unknown[], open: string, close: string, options: StringifyOptions, depth: number): string {
	if (arr.length == 0) return `${open}${close}`

	let separator = options.spaceAfterPunctuation ? ", " : ","

	if (options.space && arr.length > options.inlineChilden) {
		const indent = options.space?.repeat(depth) as string
		const childIndent = indent + options.space
		return `${open}\n${childIndent}${arr.join(",\n" + childIndent)}\n${indent}${close}`
	} else {
		if (options.insetSpace) return `${open} ${arr.join(separator)} ${close}`
		return `${open}${arr.join(separator)}${close}`
	}
}