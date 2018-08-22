// This file is not in `./server` because it's being `import`ed
// in `./redux/preload/hook` which is used on client side.
// (this way `babel-runtime` is not included on client side)

// Constructs a special "Error" used for
// aborting and redirecting on server side.
// A hacky way but it should work
// for calling `redirect()` from anywhere
// inside `@preload()` function argument.
//
// `location` does not include `basename`.
// `basename` will be prepended when this error is caught
// as part of server-side rendering.
//
export default function throwRedirectError(location)
{
	// Construct a special "Error" used for aborting and redirecting
	const error = new Error(`Redirecting to ${location.pathname} (this is not an error)`)
	error._redirect = location
	throw error
}