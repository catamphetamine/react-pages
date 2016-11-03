export default function timer()
{
	let started_at

	if (typeof process.hrtime === 'function')
	{
		started_at = process.hrtime()
	}
	else
	{
		started_at = Date.now()
	}

	return function stop()
	{
		if (typeof process.hrtime === 'function')
		{
			const stopped_at = process.hrtime()

			const seconds = stopped_at[0] - started_at[0]
			const nanos   = stopped_at[1] - started_at[1]

			return seconds * 1000 + nanos / 1000000
		}

		return Date.now() - started_at
	}
}