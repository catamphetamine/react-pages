export default class PathMatcher<PathDescriptorShape extends PathDescriptor> {
	compiledPathDescriptors: CompiledPathDescriptor<PathDescriptorShape>[]

	constructor(pathDescriptors: PathDescriptorShape[]) {
		this.compiledPathDescriptors = compilePathDescriptors(pathDescriptors)
	}

	match(path: string) {
		for (const pathDescriptor of this.compiledPathDescriptors) {
			const result = matchPathAgainstPathDescriptor(path, pathDescriptor)
			if (result) {
				return result
			}
		}
	}

	matchAll(path: string) {
		return this.compiledPathDescriptors.map(
			(pathDescriptor) => matchPathAgainstPathDescriptor(path, pathDescriptor)
		)
			.filter((resolvedHandler): resolvedHandler is MatchedPath<PathDescriptorShape> => {
				return Boolean(resolvedHandler)
			})
	}
}

function matchPathAgainstPathDescriptor<Handler>(
	pathToMatch: string,
	pathDescriptor: CompiledPathDescriptor<Handler>
): MatchedPath<Handler> | undefined {
	if (isCompiledPathDescriptorWithoutParameters(pathDescriptor)) {
		if (pathDescriptor.path === pathToMatch) {
			return {
				match: pathDescriptor.pathDescriptor
			}
		}
	} else {
		const match = pathToMatch.match(pathDescriptor.pathRegExp)
		if (match) {
			const params: Record<string, string> = {}
			//
			// "Named groups" have been implemented in all major browser engines since July 2020.
			// But older browsers don't support "named groups", which could easily be worked around
			// by using regular numeric group IDs.
			//
			// if (!match.groups) {
			// 	throw new Error('Named groups not found in path match')
			// }
			// for (const [groupName, groupValue] of Object.entries(match.groups)) {
			// 	params[groupName] = groupValue
			// }
			//
			let i = 0
			while (i < pathDescriptor.parameterNames.length) {
				params[pathDescriptor.parameterNames[i]] = match[i + 1]
				i++
			}
			return {
				match: pathDescriptor.pathDescriptor,
				params
			}
		}
	}
}

function compilePathDescriptors<PathDescriptorShape extends PathDescriptor>(
	pathDescriptors: PathDescriptorShape[]
): CompiledPathDescriptor<PathDescriptorShape>[] {
	return pathDescriptors.map((pathDescriptor) => {
		// If the `path` includes a `:` character then it means that it contains parameters.
		if (pathDescriptor.path.includes(':')) {
			// "Named groups" have been implemented in all major browser engines since July 2020.
			// But older browsers don't support "named groups", which could easily be worked around
			// by using regular numeric group IDs.
			//
			const parameterNames: string[] = []

			// Compile the path into a regular expression with "named groups" in place of parameters.
			return {
				pathRegExp: new RegExp(
					'^' +
					escapeRegExpSpecialCharacters(pathDescriptor.path)
						// "Named groups" have been implemented in all major browser engines since July 2020.
						// But older browsers don't support "named groups", which could easily be worked around
						// by using regular numeric group IDs.
						//
						// .replace(/:([^/?]+)/g, '(?<$1>[^/?]+)') +
						//
						.replace(/:([^/?]+)/g, (match, parameterName) => {
							parameterNames.push(parameterName)
							return '([^/?]+)'
						}) +
					'$'
				),
				parameterNames,
				pathDescriptor
			}
		} else {
			return {
				path: pathDescriptor.path,
				pathDescriptor
			}
		}
	})
	// I dunno what would be the most performant order of sorting for the compiled routes.
	// I just randomly guess that matching strings first would somehow be faster than
	// matching regular expressions.
	.sort((a, b) => {
		if (a.path && !b.path) {
			return -1
		} else if (!a.path && b.path) {
			return 1
		} else {
			return 0
		}
	})
}

// Escapes any regular-expression-specific special characters.
// There's a "native" function to do that — `RegExp.escape()` —
// but it is only supported in web browsers released after May 2025.
function escapeRegExpSpecialCharacters(string: string) {
	// "Property 'escape' does not exist on type 'RegExpConstructor'.
	//  Do you need to change your target library? Try changing the
	//  'lib' compiler option to 'es2025' or later."
	//
	// if (RegExp.escape) {
	// 	return RegExp.escape(string)
	// }
	const specialCharactersRegExp = new RegExp('[.*+?|()\\[\\]{}\\\\]', 'g')
	return string.replace(specialCharactersRegExp, '\\$&')
}

interface PathDescriptor {
	path: string;
}

interface MatchedPath<PathDescriptor> {
	match: PathDescriptor;
	params?: Record<string, string>;
}

function isCompiledPathDescriptorWithoutParameters<PathDescriptor>(
	pathDescriptor: CompiledPathDescriptor<PathDescriptor>
): pathDescriptor is CompiledPathDescriptorWithoutParameters<PathDescriptor> {
	return typeof (pathDescriptor as CompiledPathDescriptorWithoutParameters<PathDescriptor>).path === 'string'
}

type CompiledPathDescriptor<PathDescriptor> =
	| CompiledPathDescriptorWithParameters<PathDescriptor>
	| CompiledPathDescriptorWithoutParameters<PathDescriptor>

interface CompiledPathDescriptorWithParameters<Handler> extends CompiledPathDescriptorOtherProperties<Handler> {
	pathRegExp: RegExp;
	parameterNames: string[];
}

interface CompiledPathDescriptorWithoutParameters<Handler> extends CompiledPathDescriptorOtherProperties<Handler> {
	path: string;
}

interface CompiledPathDescriptorOtherProperties<PathDescriptor> {
	pathDescriptor: PathDescriptor;
}