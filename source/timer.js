// Measures time taken in milliseconds
export default function timer()
{
	let started_at

	// System nanosecond high-precision time
	if (typeof process !== 'undefined' && typeof process.hrtime === 'function')
	{
		started_at = process.hrtime()
	}
	// Usual millisecond time
	else
	{
		started_at = Date.now()
	}

	// Stops the timer
	return function stop()
	{
		// System nanosecond high-precision time
		if (typeof process !== 'undefined' && typeof process.hrtime === 'function')
		{
			const stopped_at = process.hrtime()

			const seconds = stopped_at[0] - started_at[0]
			const nanos   = stopped_at[1] - started_at[1]

			// Convert time to milliseconds
			return seconds * 1000 + nanos / 1000000
		}

		// Usual millisecond time
		return Date.now() - started_at
	}
}