import { defaultRevivers } from "./defaultRevivers.js"
import { parseValue } from "./parse.js"
import { stringifyValue } from "./stringify.js"
import { ParseOptions, StringifyOptions, YSONParseType, YSONValue } from "./types.js"
import YSONSyntaxError from "./YSONSyntaxError.js"

let fs: any = null

if (typeof window === "undefined") {
	fs = (await import("node:fs/promises")).default
}

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
	 * 
	 * In browser contexts,
	 *   - http(s):// urls are fetched over the network,
	 *   - paths are resolved relative to the current page and fetched over the network.
	 * 
	 * In node (deno, ...) contexts,
	 *   - http(s):// urls are fetched over the network,
	 *   - paths are resolved relative to the current working directory and read from the filesystem,
	 *   - and file:// urls are read from the filesystem.
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
			} else {
				baseUrl = `file://${process.cwd()}/`
			}
	
			source = new URL(source, baseUrl)
		}
	
		const raw = await fetchFile(source)
		return YSON.parse(raw, types, options)
	}

}

async function fetchFile(url: URL): Promise<string> {
	if (url.protocol == "file:" && !("location" in globalThis)) {
		return await fs.readFile(url.pathname, "utf-8")
	}

	const res = await fetch(url)
	return await res.text()
}
