import { defaultRevivers } from "./defaultRevivers.js"
import fs from "fs/promises"
import { parseValue } from "./parse.js"
import { stringifyValue } from "./stringify.js"
import { ParseOptions, StringifyOptions, YSONParseType, YSONValue } from "./types.js"
import YSONSyntaxError from "./YSONSyntaxError.js"

/**
 * YSON - Parse, Stringify, Load
 * @module
 */

export default class YSON {

	/**
	 * Parses raw YSON strings
	 * @param raw raw YSON string
	 * @param types types to recognise and parse (optional)
	 * @param options (reserved for future use) (optional)
	 * @returns parsed YSON value
	 */
	static parse(raw: string, types: Record<string, YSONParseType> = {}, options: ParseOptions = {}): YSONValue {
		let { value, i } = parseValue(raw, { ...defaultRevivers, ...types }, options, 0, { path: "" }, true)
	
		while (/\s/.test(raw[i])) i++
	
		if (i < raw.length) {
			throw new YSONSyntaxError("Unexpected non-whitespace character after YSON", i, { path: "" })
		}
	
		return value
	}

	/**
	 * Stringifies YSON values
	 * @param value value to stringify
	 * @param options StringifyOptions (optional)
	 * @returns stringified value or undefined if `value` is undefined
	 * @throws YSONSyntaxError
	 */
	static stringify<T extends unknown = unknown>(value: T, options: Partial<StringifyOptions> = {}): T extends undefined ? undefined : string {
		options.insetSpace ??= Boolean(options.space)
		options.spaceAfterPunctuation ??= Boolean(options.space)
		options.inlineChildren ??= 0
	
		// @ts-expect-error this should work
		return typeof value == "undefined" ? undefined : stringifyValue(value, options as StringifyOptions, 0)!
	}

	/**
	 * Loads and parses raw YSON strings from an URL
	 * @param source URL or local path to source .yson file
	 * @param types types to recognise and parse (optional)
	 * @param options (reserved for future use) (optional)
	 * @returns Promise of parsed YSON value
	 * @throws YSONSyntaxError
	 */
	static async load(source: URL | string, types: Record<string, YSONParseType> = {}, options: ParseOptions = {}): Promise<YSONValue> {
		if (typeof source == "string") {
			let baseUrl
			if ("location" in globalThis) {
				baseUrl = location.href
				if (!baseUrl.endsWith("/")) baseUrl += "/"
			} else if (source.startsWith("./") || source.startsWith("../")) {
				const raw = await fs.readFile(source, { encoding: "utf-8" })
				return YSON.parse(raw, types, options)
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
