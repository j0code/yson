/**
 * types for dealing with the YSON API
 * @module
 */

export type YSONValue = string | number | bigint | boolean | unknown[] | Record<string, unknown> | null | undefined

export type ReturnValue<T> = { value: T, i: number }

export type ParseOptions = {}

export type StringifyOptions = {
	space?: string,
	spaceAfterPunctuation: boolean,
	insetSpace: boolean,
	inlineChildren: number
}

export type Trace = {
	path: string
}

export interface YSONStringifiable {
	toYSON: () => string | any[] | Record<string, any> | Set<any> | Map<any, any>
}

export type YSONReviverInfo = {
	/**
	 * `name` - name identifying the type found in raw YSON string
	 */
	name: string
}

/**
 * Return undefined or throw an Error if x is not revivable for type T
 */
export type YSONReviver<T> = (x: string | unknown[] | Record<string, unknown>, info: YSONReviverInfo) => T | undefined

export interface YSONParsable<T> {
	fromYSON: YSONReviver<T>
}

export type YSONParseType = YSONParsable<any> | YSONReviver<any>

export const keyCharRegex = /[a-zA-Z\-_]/
export const keyRegex = /^[a-zA-Z\-_]+$/

export function isYSONStringifiable(x: unknown): x is YSONStringifiable {
	if (typeof x != "object" || x == null) return false
	if (!("toYSON" in x)) return false
	if (!(typeof x.toYSON == "function")) return false

	return true // return type of x.toYSON is not detectable
}