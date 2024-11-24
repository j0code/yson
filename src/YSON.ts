import { parseValue } from "./parse.js"
import { stringifyValue } from "./stringify.js"
import type * as types from "./types.js"
import _YSONSyntaxError from "./YSONSyntaxError.js"

export default class YSON {

	/**
	 * Parses raw YSON strings
	 * @param raw raw YSON string
	 * @param types types to recognise and parse
	 * @param options (reserved for future use)
	 * @returns parsed YSON value
	 */
	static parse(raw: string, types: Record<string, types.YSONParseType> = {}, options: ParseOptions = {}): YSONValue {
		let { value, i } = parseValue(raw, types, options, 0, { path: "" }, true)
	
		while (/\s/.test(raw[i])) i++
	
		if (i < raw.length) { // error
			console.log(raw, value, i, raw.length)
			return
		}
	
		return value
	}

	/**
	 * Stringifies YSON values
	 * @param value value to stringify
	 * @param options StringifyOptions
	 * @returns stringified value or undefined if `value` is undefined
	 * @throws YSONSyntaxError
	 */
	static stringify(value: unknown, options: Partial<StringifyOptions> = {}): string | undefined {
		options.insetSpace ??= Boolean(options.space)
		options.spaceAfterPunctuation ??= Boolean(options.space)
		options.inlineChildren ??= 0
	
		return stringifyValue(value, options as StringifyOptions, 0)
	}

	/**
	 * Loads and parses raw YSON strings from an URL
	 * @param source URL to source .yson file
	 * @param types types to recognise and parse
	 * @param options (reserved for future use)
	 * @returns Promise of parsed YSON value
	 * @throws YSONSyntaxError
	 */
	static async load(source: URL | string, types: Record<string, types.YSONParseType> = {}, options: ParseOptions = {}): Promise<YSONValue> {
		if (typeof source == "string") {
			let baseUrl
			if ("location" in globalThis) {
				baseUrl = location.href
				if (!baseUrl.endsWith("/")) baseUrl += "/"
			} else {
				baseUrl = `file://${process.cwd()}/`
			}
	
			if (source.startsWith("./")) {
				source = `${baseUrl}${source.substring(2)}`
			} else if (source.startsWith("../")) {
				source = `${baseUrl}${source}`
			} else {
				source = new URL(source)
			}
		}
	
		const res = await fetch(source)
		const raw = await res.text()
		return YSON.parse(raw, types, options)
	}

}

export type YSONValue = types.YSONValue
export type ParseOptions = types.ParseOptions
export type StringifyOptions = types.StringifyOptions
export type Trace = types.Trace
export type YSONStringifiable = types.YSONStringifiable
export type YSONReviver<T> = types.YSONReviver<T>
export type YSONParseType = types.YSONParseType
export const YSONSyntaxError = _YSONSyntaxError