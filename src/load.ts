import YSON from "./main.js"

export async function load(source: URL | string, types?: unknown[]) {
	console.log(source)

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

	console.log(source)

	const res = await fetch(source)
	const raw = await res.text()
	return YSON.parse(raw, types)
}