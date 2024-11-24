import { escape } from "./escape.js";
import { Trace } from "./types.js";

export default class YSONSyntaxError extends SyntaxError {

	rawMessage: string
	index: number
	trace: Trace

	constructor(message: string, i: number, trace: Trace) {
		super()
		this.rawMessage = message
		this.index = i
		this.trace = trace
	}

	get message(): string {
		const { path } = this.trace
		return `${this.rawMessage} at ${escape(path)} (${this.index})`
	}

}