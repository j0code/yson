export function escape(s: string) {

	return JSON.stringify(s)

	/*s = s.replaceAll("\f", "\\f")
	s = s.replaceAll("\n", "\\n")
	s = s.replaceAll("\r", "\\r")
	s = s.replaceAll("\t", "\\t")
	s = s.replaceAll("\v", "\\v")*/

}

export function escapeBare(s: string) {
	s = escape(s)
	return s.substring(1, s.length - 1)
}

export function unescape(s: string) {
	return JSON.parse(`"${s}"`)
}