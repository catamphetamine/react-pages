// This file is not in `./server` because it's being `import`ed
// in `./redux/preload/middleware` which is used on client-side.
// (this way `babel-runtime` is not included on client-side)

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
export default function redirect(location)
{
	// Sanity check
	if (!location)
	{
		throw new Error(`"location" parameter is required for "redirect()" or "goto()"`)
	}

	// Just in case, make sure that `location` does not include `basename`.
	// (though I don't know if it is even possible,
	//  I didn't check <Redirect/> pseudo route case)
	if (location.basename)
	{
		// `location` is a read-only object
		location =
		{
			...location,
			basename: undefined
		}
	}

	// Construct a special "Error" used for aborting and redirecting
	const error = new Error(`Redirecting to ${location.pathname} (this is not an error)`)
	error._redirect = location
	throw error
}