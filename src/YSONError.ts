import { escapeBare } from "./escape.js";
import { Trace } from "./types.js";

export default class YSONError extends Error {

	rawMessage: string
	index: number
	trace: Trace

	constructor(message: string, i: number, trace: Trace, cause?: any) {
		super()
		this.rawMessage = message
		this.index = i
		this.trace = trace
		this.cause = cause
	}

	get message(): string {
		const { path } = this.trace
		const cause = this.cause instanceof Error ? this.cause.message : this.cause
		const causeStr = `${this.cause ? `: ${cause}` : ""}`

		if (!path) return `${this.rawMessage} at ${this.index}${causeStr}`

		return `${this.rawMessage} at ${escapeBare(path)} (${this.index})${causeStr}`
	}

}