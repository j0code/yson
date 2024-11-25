import { YSONReviver } from "./types.js"

const parseMap: YSONReviver<Map<any, any>> = x => {
	if (typeof x != "object") throw new Error("Map must be an object or entry array")

	if (x instanceof Array) { // Map entries
		return new Map(x as [any, any][])
	}

	return new Map(Object.entries(x))
}

const parseSet: YSONReviver<Set<any>> = x => {
	if (!(x instanceof Array)) throw new Error("Set must be an array")

	return new Set(x)
}

const parseDate: YSONReviver<Date> = x => {
	if (typeof x != "string") throw new Error("Date must be a string")
	
	return new Date(x)
}

const parseURL: YSONReviver<URL> = x => {
	if (typeof x != "string") throw new Error("URL must be a string")

	return new URL(x)
}

const parseArrayBuffer: YSONReviver<ArrayBuffer> = x => {
	if (!(x instanceof Array)) throw new Error("ArrayBuffer must be an array")

	return new Uint8Array(x as []).buffer
}

const parseDataView: YSONReviver<DataView> = x => {
	if (!(x instanceof Array)) throw new Error("DataView must be an array")
	
	return new DataView(new Uint8Array(x as []).buffer)
}

const typedArrays = [Int8Array, Uint8Array, Uint8ClampedArray, Int16Array, Uint16Array, Int32Array, Uint32Array, BigInt64Array, BigUint64Array, Float32Array, Float64Array]
type  TypedArray  =  Int8Array| Uint8Array| Uint8ClampedArray| Int16Array| Uint16Array| Int32Array| Uint32Array| BigInt64Array| BigUint64Array| Float32Array| Float64Array

const parseTypedArray: YSONReviver<TypedArray> = (x, { name }) => {
	if (!(x instanceof Array)) throw new Error("TypedArray must be an array")

	const typedArray = typedArrays.find(typedArray => typedArray.name == name)
	if (!typedArray) throw new Error("Unknown TypedArray")

	return new typedArray(x as [])
}

export const defaultRevivers = {
	Map: parseMap,
	Set: parseSet,
	Date: parseDate,
	URL: parseURL,
	ArrayBuffer: parseArrayBuffer,
	DataView: parseDataView,
	Int8Array: parseTypedArray,
	Uint8Array: parseTypedArray,
	Uint8ClampedArray: parseTypedArray,
	Int16Array: parseTypedArray,
	Uint16Array: parseTypedArray,
	Int32Array: parseTypedArray,
	Uint32Array: parseTypedArray,
	BigInt64Array: parseTypedArray,
	BigUint64Array: parseTypedArray,
	Float32Array: parseTypedArray,
	Float64Array: parseTypedArray
}