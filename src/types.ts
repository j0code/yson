/**
 * types for dealing with the YSON API
 * @module
 */

/**
 * a generic return value for parsed YSON strings
 */
export type YSONValue = string | number | bigint | boolean | unknown[] | Record<string, unknown> | null | undefined


/**
 * internal return value used in Parser; of no use otherwise
 */
export type ReturnValue<T> = { value: T, i: number }


/**
 * options for parsing
 * @see YSON.parse()
 */
export type ParseOptions = {}


/**
 * options for stringifying
 * @see YSON.stringify()
 * @property {string}  space                  - character(s) used for indentation
 * @property {boolean} spaceAfterPunctuation  - whether a space should be inserted after `:`, `,` and type names
 * @property {boolean} insetSpace             - whether a space should be inserted after `[` and `}` and before `]` and `}`
 * @property {number}  inlineChildren         - amount of children to output inline (example 2: `[1, 2]` but `[\n\t1,\n\t2\n\t3\n]`)
 */
export type StringifyOptions = {
	space?: string,
	spaceAfterPunctuation: boolean,
	insetSpace: boolean,
	inlineChildren: number
}

/**
 * Trace object used for YSONError
 * @see YSONError
 */
export type Trace = {
	path: string
}

/**
 * interface for classes that specify custom stringify behavior
 */
export interface YSONStringifiable {
	toYSON: () => string | any[] | Record<string, any> | Set<any> | Map<any, any>
}

/**
 * context for YSONReviver execution
 */
export type YSONReviverInfo = {
	/** `name` - name identifying the type found in raw YSON string */
	name: string
}

/**
 * function that 'revives' data, performing typechecks, adding default values, ...
 * 
 * Return undefined or throw an Error if x is not revivable for type T
 */
export type YSONReviver<T> = (x: string | unknown[] | Record<string, unknown>, info: YSONReviverInfo) => T | undefined

/**
 * interface for class definitions that can revive data
 * 
 * Note: do not 'implement' this interface, `fromYSON` needs to be a static method
 */
export interface YSONParsable<T> {
	fromYSON: YSONReviver<T>
}


/**
 * Union of parsable types
 * @see YSONParsable
 * @see YSONReviver
 */
export type YSONParseType = YSONParsable<any> | YSONReviver<any>

/**
 * regex for single chars of an object key
 */
export const keyCharRegex = /[a-zA-Z\-_]/
/**
 * regex for object keys
 */
export const keyRegex = /^[a-zA-Z\-_]+$/

/**
 * type predicate for YSONStringifiable
 * @param x unknown
 * @returns x is YSONStringifiable
 * @see YSONStringifiable
 */
export function isYSONStringifiable(x: unknown): x is YSONStringifiable {
	if (typeof x != "object" || x == null) return false
	if (!("toYSON" in x)) return false
	if (!(typeof x.toYSON == "function")) return false

	return true // return type of x.toYSON is not detectable
}
