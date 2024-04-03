export type YSONValue = string | number | boolean | unknown[] | Record<string, unknown> | null | undefined

export type ReturnValue<T> = { value: T, i: number }

export type ParseOptions = {}

export type StringifyOptions = {
	space?: string,
	spaceAfterPunctuation: boolean,
	insetSpace: boolean,
	inlineChilden: number
}

export type Trace = {
	path: string
}

export const keyCharRegex = /[a-zA-Z\-_]/
export const keyRegex = /^[a-zA-Z\-_]+$/